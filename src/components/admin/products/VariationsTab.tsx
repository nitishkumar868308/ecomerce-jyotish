"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { VariationRowCard } from "./VariationRowCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  BulkPricingTiers,
  type BulkTier,
} from "@/components/admin/form/BulkPricingTiers";
import {
  ImageUploadMultiple,
  type ImageSlot,
} from "@/components/admin/form/ImageUploadMultiple";
import { TagCombobox } from "@/components/admin/form/TagCombobox";
import type { AttributeComboEntry } from "@/lib/variations";

export interface VariationRow {
  _key: string;
  id?: string;
  sortOrder?: number;
  attributeCombo: AttributeComboEntry[];
  variationName: string;
  sku: string;
  name: string;
  price: string;
  stock: string;
  MRP: string;
  short: string;
  description: string;
  active: boolean;
  offerId: number | "";
  barCode: string;
  bulkPricingTiers: BulkTier[];
  images: ImageSlot[];
  tagIds: number[];
}

interface VariationsTabProps {
  variations: VariationRow[];
  onVariationsChange: (next: VariationRow[]) => void;
  offerOptions: Array<{ value: number; label: string; hint?: string }>;
  onFillFromDefaults: () => void;
  onDeleteRequest: (key: string) => void;
}

export function VariationsTab({
  variations,
  onVariationsChange,
  offerOptions,
  onFillFromDefaults,
  onDeleteRequest,
}: VariationsTabProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = variations.findIndex((v) => v._key === active.id);
    const newIndex = variations.findIndex((v) => v._key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onVariationsChange(arrayMove(variations, oldIndex, newIndex));
  };

  const updateRow = (key: string, patch: Partial<VariationRow>) => {
    onVariationsChange(
      variations.map((v) => (v._key === key ? { ...v, ...patch } : v)),
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Variations ({variations.length})
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Each row has the same fields as the main product. Defaults are
            carried over; tweak per row as needed.
          </p>
        </div>
        {variations.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFillFromDefaults}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
          >
            Fill blanks from Details
          </Button>
        )}
      </div>

      {variations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
          No variations yet. Pick attributes on the Attributes tab first.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={variations.map((v) => v._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {variations.map((row) => {
                const isOpen = expandedKey === row._key;
                return (
                  <VariationRowCard key={row._key} id={row._key}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedKey(isOpen ? null : row._key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedKey(isOpen ? null : row._key);
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-[var(--bg-secondary)] sm:px-4"
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)]"
                        aria-hidden
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {row.variationName || "Untitled variation"}
                          </span>
                          {row.attributeCombo.map((c) => (
                            <Badge key={`${c.name}=${c.value}`} variant="info">
                              {c.name}: {c.value}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          SKU <span className="font-mono">{row.sku || "—"}</span>{" "}
                          · ₹{row.price || "0"} · stock {row.stock || "0"}
                        </p>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={row.active}
                          onChange={(next) =>
                            updateRow(row._key, { active: next })
                          }
                          size="sm"
                          label="Active"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequest(row._key);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-danger)]"
                        aria-label="Remove variation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 border-t border-[var(--border-primary)] p-3 sm:p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="Variation name"
                            value={row.variationName}
                            onChange={(e) =>
                              updateRow(row._key, {
                                variationName: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="SKU"
                            value={row.sku}
                            onChange={(e) =>
                              updateRow(row._key, { sku: e.target.value })
                            }
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                          <Input
                            label="Price (INR)"
                            type="number"
                            value={row.price}
                            onChange={(e) =>
                              updateRow(row._key, { price: e.target.value })
                            }
                          />
                          <Input
                            label="MRP"
                            type="number"
                            value={row.MRP}
                            onChange={(e) =>
                              updateRow(row._key, { MRP: e.target.value })
                            }
                          />
                          <Input
                            label="Stock"
                            type="number"
                            value={row.stock}
                            onChange={(e) =>
                              updateRow(row._key, { stock: e.target.value })
                            }
                          />
                          <Input
                            label="Barcode"
                            value={row.barCode}
                            onChange={(e) =>
                              updateRow(row._key, { barCode: e.target.value })
                            }
                          />
                        </div>

                        <SearchableSelect
                          label="Offer (optional)"
                          placeholder="No offer"
                          searchPlaceholder="Search offers..."
                          options={offerOptions}
                          value={row.offerId}
                          onChange={(v) =>
                            updateRow(row._key, {
                              offerId: v === "" ? "" : (v as number),
                            })
                          }
                          clearable
                        />

                        <Textarea
                          label="Short description"
                          value={row.short}
                          onChange={(e) =>
                            updateRow(row._key, { short: e.target.value })
                          }
                          rows={2}
                        />

                        <Textarea
                          label="Long description"
                          value={row.description}
                          onChange={(e) =>
                            updateRow(row._key, { description: e.target.value })
                          }
                          rows={3}
                        />

                        <BulkPricingTiers
                          value={row.bulkPricingTiers}
                          onChange={(next) =>
                            updateRow(row._key, { bulkPricingTiers: next })
                          }
                          basePrice={row.price || null}
                        />

                        <TagCombobox
                          value={row.tagIds}
                          onChange={(next) =>
                            updateRow(row._key, { tagIds: next })
                          }
                        />

                        <ImageUploadMultiple
                          value={row.images}
                          onChange={(next) =>
                            updateRow(row._key, { images: next })
                          }
                          hint="Uploaded after save"
                        />
                      </div>
                    )}
                  </VariationRowCard>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
