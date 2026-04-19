"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Attribute } from "@/services/admin/attributes";
import {
  generateAttributeCombos,
  comboKey,
  type AttributeSelection,
} from "@/lib/variations";

interface AttributesTabProps {
  attributes: Attribute[];
  selections: AttributeSelection[];
  onSelectionsChange: (next: AttributeSelection[]) => void;
  existingComboKeys: Set<string>;
  onGenerate: () => void;
  onAddBlank: () => void;
  onSwitchToVariations: () => void;
}

export function AttributesTab({
  attributes,
  selections,
  onSelectionsChange,
  existingComboKeys,
  onGenerate,
  onAddBlank,
  onSwitchToVariations,
}: AttributesTabProps) {
  const activeAttributes = attributes.filter((a) => a.active !== false);

  const toggleValue = (attrId: number, value: string) => {
    const existing = selections.find((s) => s.attrId === attrId);
    if (!existing) {
      onSelectionsChange([...selections, { attrId, values: [value] }]);
      return;
    }
    const has = existing.values.includes(value);
    const nextValues = has
      ? existing.values.filter((v) => v !== value)
      : [...existing.values, value];
    if (nextValues.length === 0) {
      onSelectionsChange(selections.filter((s) => s.attrId !== attrId));
    } else {
      onSelectionsChange(
        selections.map((s) =>
          s.attrId === attrId ? { ...s, values: nextValues } : s,
        ),
      );
    }
  };

  const toggleAll = (attr: Attribute) => {
    const existing = selections.find((s) => s.attrId === attr.id);
    const allSelected =
      !!existing && existing.values.length === attr.values.length;
    if (allSelected) {
      onSelectionsChange(selections.filter((s) => s.attrId !== attr.id));
    } else {
      const others = selections.filter((s) => s.attrId !== attr.id);
      onSelectionsChange([
        ...others,
        { attrId: attr.id, values: [...attr.values] },
      ]);
    }
  };

  const preview = useMemo(
    () => generateAttributeCombos(selections, attributes),
    [selections, attributes],
  );
  const missingFromPreview = preview.filter(
    (c) => !existingComboKeys.has(comboKey(c)),
  );

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Pick attributes
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Tick the values that apply to this product. Every combination turns
            into a variation row on the Variations tab.
          </p>
        </div>

        {activeAttributes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
            No attributes configured yet. Create them in Admin → Attributes.
          </div>
        ) : (
          <div className="space-y-2">
            {activeAttributes.map((attr) => {
              const sel = selections.find((s) => s.attrId === attr.id);
              const picked = new Set(sel?.values ?? []);
              const allSelected =
                picked.size > 0 && picked.size === attr.values.length;
              return (
                <div
                  key={attr.id}
                  className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {attr.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleAll(attr)}
                      className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                    >
                      {allSelected ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values.map((v) => {
                      const isOn = picked.has(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleValue(attr.id, v)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                            isOn
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                              : "border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
                          )}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-[var(--text-muted)]">
          {preview.length > 0
            ? `${preview.length} combination${preview.length === 1 ? "" : "s"} possible · ${missingFromPreview.length} not yet added`
            : "No combinations yet — pick at least one value from each attribute"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onAddBlank();
              onSwitchToVariations();
            }}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add blank
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onGenerate();
              onSwitchToVariations();
            }}
            disabled={missingFromPreview.length === 0}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Generate {missingFromPreview.length || ""} variation
            {missingFromPreview.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </div>
  );
}
