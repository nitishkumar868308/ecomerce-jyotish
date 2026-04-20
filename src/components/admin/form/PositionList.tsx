"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";

export interface PositionRow<V extends string | number> {
  /** The stable option key — country code, state id, etc. */
  refValue: V;
  position: number;
}

interface PositionListProps<V extends string | number> {
  label: string;
  /** Options to pick from (dropdown + label lookup). */
  options: SearchableSelectOption<V>[];
  value: PositionRow<V>[];
  onChange: (next: PositionRow<V>[]) => void;
  /** Items that are already published for this ref — used to mark collisions. */
  existing?: PositionRow<V>[];
  /** Label for the ref column ("Country" / "City"). */
  refLabel: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Add-as-rows picker for Banner country/state targeting.
 *
 * For every ref (e.g. each country) the admin can stack multiple (ref, position)
 * pairs. We surface three live hints beneath each group:
 *  - "already used" — shows positions held by OTHER banners
 *  - "duplicate" — shows positions used twice in this form
 *  - "gaps" — lists positions missing before the highest assigned (2, 3 missing
 *    when 1 and 4 are picked)
 */
export function PositionList<V extends string | number>({
  label,
  options,
  value,
  onChange,
  existing = [],
  refLabel,
  emptyMessage = "No options",
  loading,
  className,
}: PositionListProps<V>) {
  const [draftRef, setDraftRef] = useState<V | "">("");
  const [draftPos, setDraftPos] = useState<string>("");
  // True once the user has typed into the position box — we stop auto-filling
  // after that so we don't overwrite their keystrokes.
  const manuallyEdited = useRef(false);

  const optionLabel = (ref: V) =>
    options.find((o) => o.value === ref)?.label ?? String(ref);

  // Group current rows by ref — admin picks positions one ref at a time.
  const grouped = useMemo(() => {
    const map = new Map<V, PositionRow<V>[]>();
    for (const row of value) {
      const arr = map.get(row.refValue) ?? [];
      arr.push(row);
      map.set(row.refValue, arr);
    }
    return map;
  }, [value]);

  const existingByRef = useMemo(() => {
    const map = new Map<V, number[]>();
    for (const row of existing) {
      const arr = map.get(row.refValue) ?? [];
      arr.push(row.position);
      map.set(row.refValue, arr);
    }
    return map;
  }, [existing]);

  // Next free position for the currently picked ref: max(taken) + 1, across
  // positions already added in this form AND positions taken by other banners.
  const suggestedNext = useMemo(() => {
    if (!draftRef) return null;
    const local = (grouped.get(draftRef as V) ?? []).map((r) => r.position);
    const remote = existingByRef.get(draftRef as V) ?? [];
    const taken = [...local, ...remote];
    if (taken.length === 0) return 1;
    return Math.max(...taken) + 1;
  }, [draftRef, grouped, existingByRef]);

  // When the ref changes, pre-fill the position box with the suggestion so the
  // admin doesn't have to think. Reset the "manually edited" flag so the next
  // ref change auto-fills again.
  useEffect(() => {
    manuallyEdited.current = false;
    if (draftRef && suggestedNext !== null) {
      setDraftPos(String(suggestedNext));
    } else {
      setDraftPos("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftRef]);

  const handleAdd = () => {
    const pos = parseInt(draftPos, 10);
    if (!draftRef || !Number.isFinite(pos) || pos < 1) return;
    onChange([...value, { refValue: draftRef as V, position: pos }]);
    // After adding, bump the suggestion so the admin can keep slotting rows.
    manuallyEdited.current = false;
    setDraftPos(String(pos + 1));
  };

  const handleRemove = (refValue: V, position: number) => {
    onChange(
      value.filter(
        (r) => !(r.refValue === refValue && r.position === position),
      ),
    );
  };

  const draftConflict = useMemo(() => {
    const pos = parseInt(draftPos, 10);
    if (!draftRef || !Number.isFinite(pos)) return null;
    if (
      value.some((r) => r.refValue === draftRef && r.position === pos)
    ) {
      return `Already added in this banner at position ${pos}`;
    }
    const existingPositions = existingByRef.get(draftRef as V) ?? [];
    if (existingPositions.includes(pos)) {
      return `Position ${pos} already taken by another banner`;
    }
    return null;
  }, [draftRef, draftPos, value, existingByRef]);

  const canAdd =
    !!draftRef &&
    Number.isFinite(parseInt(draftPos, 10)) &&
    parseInt(draftPos, 10) > 0 &&
    !draftConflict;

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>

      {/* Add row */}
      <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
        <SearchableSelect
          label={undefined}
          placeholder={loading ? "Loading..." : `Select ${refLabel.toLowerCase()}`}
          searchPlaceholder={`Search ${refLabel.toLowerCase()}s...`}
          options={options}
          value={draftRef}
          onChange={(v) => setDraftRef(v as V | "")}
          loading={loading}
          emptyMessage={emptyMessage}
          clearable
        />
        <input
          type="number"
          min={1}
          value={draftPos}
          onChange={(e) => {
            manuallyEdited.current = true;
            setDraftPos(e.target.value);
          }}
          placeholder="Position"
          className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add
        </Button>
      </div>

      {draftConflict && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--accent-danger)]">
          <AlertTriangle className="h-3.5 w-3.5" />
          {draftConflict}
        </div>
      )}

      {/* Groups */}
      {grouped.size === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
          No {refLabel.toLowerCase()}s assigned yet.
        </p>
      ) : (
        <div className="space-y-2">
          {Array.from(grouped.entries()).map(([ref, rows]) => {
            const positions = rows.map((r) => r.position).sort((a, b) => a - b);
            const max = positions[positions.length - 1];
            const expected = Array.from({ length: max }, (_, i) => i + 1);
            const gaps = expected.filter((p) => !positions.includes(p));
            const dup = positions.filter(
              (p, i) => positions.indexOf(p) !== i,
            );
            const extTaken = existingByRef.get(ref) ?? [];
            const conflict = positions.filter((p) => extTaken.includes(p));

            return (
              <div
                key={String(ref)}
                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {optionLabel(ref)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {rows.length} position{rows.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {positions.map((p) => {
                    const isDup = dup.includes(p);
                    const isConflict = conflict.includes(p);
                    return (
                      <span
                        key={p}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                          isDup || isConflict
                            ? "border-[var(--accent-danger)] bg-red-50 text-[var(--accent-danger)] dark:bg-red-950/20"
                            : "border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.1))] text-[var(--accent-primary)]",
                        )}
                      >
                        #{p}
                        <button
                          type="button"
                          onClick={() => handleRemove(ref, p)}
                          className="ml-0.5 text-current opacity-70 hover:opacity-100"
                          aria-label={`Remove position ${p}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {(gaps.length > 0 || dup.length > 0 || conflict.length > 0) && (
                  <div className="mt-2 space-y-0.5 text-xs">
                    {conflict.length > 0 && (
                      <p className="text-[var(--accent-danger)]">
                        Already used by another banner: {conflict.map((n) => `#${n}`).join(", ")}
                      </p>
                    )}
                    {dup.length > 0 && (
                      <p className="text-[var(--accent-danger)]">
                        Duplicate position: {dup.map((n) => `#${n}`).join(", ")}
                      </p>
                    )}
                    {gaps.length > 0 && (
                      <p className="text-[var(--text-muted)]">
                        Missing: {gaps.map((n) => `#${n}`).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
