import type { Attribute } from "@/services/admin/attributes";

export interface AttributeSelection {
  attrId: number;
  /** Selected value strings (Attribute.values[]). */
  values: string[];
}

export interface AttributeComboEntry {
  name: string;
  value: string;
}

/** Stable key derived from a combo — used to dedupe against existing rows. */
export function comboKey(combo: AttributeComboEntry[]): string {
  return combo
    .map((c) => `${c.name.toLowerCase()}=${c.value.toLowerCase()}`)
    .sort()
    .join("|");
}

/**
 * Cartesian product: given N attribute axes, yields every combination.
 *
 *   [{Color: [Red, Blue]}, {Size: [S, M]}]
 *   → [[Red,S], [Red,M], [Blue,S], [Blue,M]]
 *
 * Empty selections are pruned so picking 0 values on an axis doesn't collapse
 * everything.
 */
export function generateAttributeCombos(
  selections: AttributeSelection[],
  attributes: Attribute[] | undefined,
): AttributeComboEntry[][] {
  const byId = new Map<number, Attribute>();
  for (const a of attributes ?? []) byId.set(a.id, a);

  const axes = selections
    .map((s) => {
      const attr = byId.get(s.attrId);
      if (!attr) return null;
      const values = s.values.filter((v) => attr.values.includes(v));
      if (values.length === 0) return null;
      return { name: attr.name, values };
    })
    .filter(
      (a): a is { name: string; values: string[] } => a !== null,
    );

  if (axes.length === 0) return [];

  let combos: AttributeComboEntry[][] = [[]];
  for (const axis of axes) {
    const next: AttributeComboEntry[][] = [];
    for (const combo of combos) {
      for (const val of axis.values) {
        next.push([...combo, { name: axis.name, value: val }]);
      }
    }
    combos = next;
  }
  return combos;
}

/**
 * Build a suggested SKU from a parent SKU + attribute combo.
 *
 * Each axis contributes up to 10 chars so values like "Pack of 2" and
 * "Pack of 4" don't both collapse to "PACK" (which was the cause of the
 * duplicate-SKU error when admins added multiple size/form variants).
 * Admins can always hand-edit the suggestion before saving.
 */
export function suggestVariationSku(
  parentSku: string,
  combo: AttributeComboEntry[],
): string {
  const suffix = combo
    .map((c) =>
      c.value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 10),
    )
    .join("-");
  const base = parentSku || "SKU";
  return suffix ? `${base}-${suffix}` : base;
}

/** Human-readable label for a combo — "Color: Red · Size: M". */
export function comboLabel(combo: AttributeComboEntry[]): string {
  return combo.map((c) => `${c.name}: ${c.value}`).join(" \u00b7 ");
}

/**
 * Rebuild `attributeSelections` from a list of existing variations. Used on
 * edit so the attribute picker remembers what the admin chose last time.
 */
export function deriveSelectionsFromVariations(
  variations: Array<{ attributeCombo?: AttributeComboEntry[] | null }>,
  attributes: Attribute[] | undefined,
): AttributeSelection[] {
  const byName = new Map<string, Attribute>();
  for (const a of attributes ?? []) byName.set(a.name.toLowerCase(), a);

  const buckets = new Map<number, Set<string>>();
  for (const v of variations) {
    for (const entry of v.attributeCombo ?? []) {
      const attr = byName.get(entry.name.toLowerCase());
      if (!attr) continue;
      if (!attr.values.includes(entry.value)) continue;
      const set = buckets.get(attr.id) ?? new Set<string>();
      set.add(entry.value);
      buckets.set(attr.id, set);
    }
  }
  return Array.from(buckets.entries()).map(([attrId, set]) => ({
    attrId,
    values: Array.from(set),
  }));
}
