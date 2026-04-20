"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, Trash2, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import toast from "react-hot-toast";

interface PincodeManagerProps {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
}

const PINCODE_RE = /^\d{6}$/;

/**
 * Admin-side pincode bulk manager. Optimised for warehouses that may ship to
 * hundreds or thousands of pincodes — paste from Excel/CSV/notes to add many
 * at once, then search/remove individually.
 */
export function PincodeManager({
  label = "Pincodes",
  value,
  onChange,
  disabled,
  error,
}: PincodeManagerProps) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const existingSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return value;
    return value.filter((p) => p.includes(q));
  }, [value, query]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    // Split on any non-digit so comma, space, newline, tab all work.
    const tokens = draft
      .split(/[^0-9]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    let added = 0;
    let duplicates = 0;
    let invalid = 0;
    const next = [...value];
    const seen = new Set(existingSet);

    for (const t of tokens) {
      if (!PINCODE_RE.test(t)) {
        invalid++;
        continue;
      }
      if (seen.has(t)) {
        duplicates++;
        continue;
      }
      seen.add(t);
      next.push(t);
      added++;
    }

    if (added > 0) {
      onChange(next);
      setDraft("");
    }

    const parts: string[] = [];
    if (added) parts.push(`Added ${added}`);
    if (duplicates) parts.push(`${duplicates} duplicate${duplicates > 1 ? "s" : ""}`);
    if (invalid) parts.push(`${invalid} invalid`);
    const msg = parts.join(" · ") || "Nothing to add";

    if (added > 0) {
      toast.success(msg);
    } else if (invalid > 0 || duplicates > 0) {
      toast.error(msg);
    }
  };

  const handleRemove = (pin: string) => {
    onChange(value.filter((p) => p !== pin));
  };

  const handleClearAll = () => {
    if (value.length === 0) return;
    onChange([]);
    setQuery("");
    toast.success(`Cleared ${value.length} pincode${value.length > 1 ? "s" : ""}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      setDraft((d) => (d ? `${d}\n${text}` : text));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <MapPin className="h-4 w-4 text-[var(--accent-primary)]" />
          {label}
          <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
            {value.length.toLocaleString()}
          </span>
        </label>
        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent-danger)]"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Bulk input */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste pincodes — comma, space, newline or tab separated (e.g. 110001, 110002, 400001 ...)"
          rows={3}
          disabled={disabled}
          className="font-mono text-xs"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--text-muted)]">
            Only 6-digit numeric pincodes are accepted. Duplicates and invalid entries are skipped.
          </p>
          <div className="flex items-center gap-2">
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border-primary)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload .csv / .txt
              <input
                type="file"
                accept=".csv,.txt,text/plain,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
            </label>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={disabled || !draft.trim()}
            >
              Add to list
            </Button>
          </div>
        </div>
      </div>

      {/* Managed list */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]">
        {/* Search bar */}
        <div className="relative border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              value.length === 0
                ? "No pincodes added yet"
                : `Search ${value.length.toLocaleString()} pincodes...`
            }
            disabled={disabled || value.length === 0}
            className="w-full bg-transparent py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:cursor-not-allowed"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Chip grid */}
        <div
          className={cn(
            "max-h-64 overflow-y-auto p-2",
            value.length === 0 && "flex items-center justify-center py-8",
          )}
        >
          {value.length === 0 ? (
            <p className="text-center text-xs text-[var(--text-muted)]">
              Paste pincodes above to begin.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No pincodes match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filtered.map((pin) => (
                <span
                  key={pin}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-xs text-[var(--text-primary)]"
                >
                  {pin}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(pin)}
                      className="rounded-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-danger)]"
                      aria-label={`Remove ${pin}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {query && filtered.length > 0 && (
          <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
            Showing {filtered.length.toLocaleString()} of{" "}
            {value.length.toLocaleString()}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--accent-danger)]">{error}</p>
      )}
    </div>
  );
}
