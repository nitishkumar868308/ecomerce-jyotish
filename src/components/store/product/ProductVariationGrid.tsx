"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";
import type { ProductVariation } from "@/types/product";

interface ProductVariationGridProps {
  variations: ProductVariation[];
  selectedId: string | null;
  onSelect: (variation: ProductVariation) => void;
  cartCountByVariationId?: Record<string, number>;
}

type Attrs = Record<string, string>;

function parseVariationAttributes(variation: ProductVariation): Attrs {
  if (variation.attributes && typeof variation.attributes === "object") {
    return variation.attributes as Attrs;
  }
  const name = variation.variationName ?? "";
  if (!name) return {};
  return name.split("/").reduce<Attrs>((acc, chunk) => {
    const colonIdx = chunk.indexOf(":");
    if (colonIdx <= 0) return acc;
    const k = chunk.slice(0, colonIdx).trim();
    const v = chunk.slice(colonIdx + 1).trim();
    if (k && v) acc[k] = v;
    return acc;
  }, {});
}

/**
 * Variation selector grouped by attribute (Color, Type of wax, …).
 *
 * Rules:
 * - Attribute groups appear in the order they first appear across the
 *   variation list (API order, not alphabetical).
 * - Inside each group, values also appear in API order — we walk the
 *   variations array and push each new value in the order we hit it.
 * - Clicking a value updates that attribute on the current selection and
 *   we resolve to the best-matching variation (exact match first, else
 *   fall back to a variation matching just the clicked attribute).
 */
export function ProductVariationGrid({
  variations,
  selectedId,
  onSelect,
  cartCountByVariationId = {},
}: ProductVariationGridProps) {
  const { format } = usePrice();

  const parsed = useMemo(() => {
    return variations.map((v) => ({
      variation: v,
      attrs: parseVariationAttributes(v),
    }));
  }, [variations]);

  // Build ordered groups: [{ key, values: [{value, variation}, ...] }, …]
  const groups = useMemo(() => {
    const groupOrder: string[] = [];
    const byKey = new Map<
      string,
      { key: string; values: Array<{ value: string; variation: ProductVariation }> }
    >();
    for (const { variation, attrs } of parsed) {
      for (const [k, v] of Object.entries(attrs)) {
        if (!byKey.has(k)) {
          byKey.set(k, { key: k, values: [] });
          groupOrder.push(k);
        }
        const group = byKey.get(k)!;
        if (!group.values.some((row) => row.value === v)) {
          group.values.push({ value: v, variation });
        }
      }
    }
    return groupOrder.map((k) => byKey.get(k)!);
  }, [parsed]);

  const selectedAttrs = useMemo<Attrs>(() => {
    if (!selectedId) return {};
    const row = parsed.find((p) => p.variation.id === selectedId);
    return row ? row.attrs : {};
  }, [parsed, selectedId]);

  const handlePick = (attrKey: string, value: string) => {
    // Build the target combination from current selection, overriding the one
    // attribute the user just picked.
    const target: Attrs = { ...selectedAttrs, [attrKey]: value };
    const targetKeys = Object.keys(target);

    // 1. Prefer an exact full-match for the target combination.
    const exact = parsed.find(
      (p) =>
        targetKeys.every((k) => p.attrs[k] === target[k]) &&
        Object.keys(p.attrs).length >= targetKeys.length,
    );
    if (exact) {
      onSelect(exact.variation);
      return;
    }

    // 2. Fall back: any variation matching the picked attribute, preferring
    //    one that matches the most other currently selected attrs too.
    const scored = parsed
      .filter((p) => p.attrs[attrKey] === value)
      .map((p) => {
        let score = 0;
        for (const k of targetKeys) if (p.attrs[k] === target[k]) score++;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) onSelect(scored[0].p.variation);
  };

  if (variations.length === 0) return null;

  // Edge case: no structured attributes parsed at all → fall back to a flat
  // grid keyed on variationName so we never hide the picker entirely.
  if (groups.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {variations.map((v) => {
          const stock = parseInt(v.stock ?? "0", 10);
          const disabled = stock <= 0;
          const selected = selectedId === v.id;
          const label = v.variationName || v.name || `#${v.id}`;
          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(v)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {group.key}
            </div>
            {selectedAttrs[group.key] && (
              <div className="text-xs text-[var(--text-muted)]">
                · {selectedAttrs[group.key]}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.values.map(({ value, variation }) => {
              const isSelected = selectedAttrs[group.key] === value;

              // Representative variation for this value — prefer one that
              // also matches the current selection on other attrs, so stock
              // and price shown feel consistent with the rest of the UI.
              const rep = (() => {
                const candidates = parsed.filter(
                  (p) => p.attrs[group.key] === value,
                );
                const otherKeys = Object.keys(selectedAttrs).filter(
                  (k) => k !== group.key,
                );
                const match = candidates.find((p) =>
                  otherKeys.every((k) => p.attrs[k] === selectedAttrs[k]),
                );
                return (match ?? candidates[0])?.variation ?? variation;
              })();

              const stock = parseInt(rep.stock ?? "0", 10);
              const disabled = stock <= 0;
              const cartCount = cartCountByVariationId[rep.id] ?? 0;

              return (
                <button
                  key={`${group.key}:${value}`}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePick(group.key, value);
                  }}
                  className={cn(
                    "relative flex min-w-[5rem] flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="text-sm font-semibold">{value}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {format(rep.price)}
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                  {disabled && (
                    <span className="text-[10px] uppercase text-[var(--accent-danger)]">
                      Out of stock
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
