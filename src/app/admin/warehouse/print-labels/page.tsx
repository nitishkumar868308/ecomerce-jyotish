"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Barcode from "react-barcode";
import { api, ENDPOINTS } from "@/lib/api";
import type { Product, ProductVariation } from "@/types/product";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Printer,
  Trash2,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Row queued for printing. One row = N identical labels. Admins can stack
 * rows for a single warehouse dispatch (e.g. 20 labels of variant A +
 * 10 of variant B) and hit Print once at the end.
 */
interface LabelRow {
  key: string; // local id (client-generated)
  productId: string;
  productName: string;
  variationId: string | null;
  variationName: string | null;
  sku: string;
  barCode: string | null;
  mrp: string | null;
  attributes: Record<string, string>;
  image: string | null;
  qty: number;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function useProductSearch(search: string) {
  const debounced = useDebouncedValue(search.trim(), 250);
  return useQuery<Product[]>({
    queryKey: ["label-print-search", debounced],
    enabled: debounced.length >= 2, // avoid pinging the API on every keystroke
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.get<any>(ENDPOINTS.PRODUCTS.LIST, {
        params: { search: debounced, page: 1, limit: 15 },
      });
      // Backend returns {success, data: {products, total, page, ...}}
      const inner = data?.data;
      if (Array.isArray(inner?.products)) return inner.products;
      if (Array.isArray(inner)) return inner;
      return [];
    },
  });
}

function parseAttrs(
  variation: ProductVariation | undefined | null,
): Record<string, string> {
  const combo = (variation as { attributeCombo?: unknown } | null)
    ?.attributeCombo;
  const out: Record<string, string> = {};
  if (Array.isArray(combo)) {
    for (const e of combo) {
      if (e && typeof e === "object" && "name" in e && "value" in e) {
        const k = String((e as any).name ?? "").trim();
        const v = String((e as any).value ?? "").trim();
        if (k && v) out[k] = v;
      }
    }
  }
  return out;
}

export default function PrintLabelsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [queue, setQueue] = useState<LabelRow[]>([]);
  const [printing, setPrinting] = useState(false);

  const searchQuery = useProductSearch(search);

  const totalLabels = useMemo(
    () => queue.reduce((s, r) => s + (r.qty > 0 ? r.qty : 0), 0),
    [queue],
  );

  const addRow = (
    product: Product,
    variation: ProductVariation | null,
    qty = 1,
  ) => {
    const attrs = variation ? parseAttrs(variation) : {};
    const row: LabelRow = {
      key: `${product.id}:${variation?.id ?? "base"}:${Date.now()}`,
      productId: product.id,
      productName: product.name,
      variationId: variation ? String(variation.id) : null,
      variationName: variation?.variationName ?? variation?.name ?? null,
      sku: variation?.sku ?? product.sku,
      barCode: (variation as any)?.barCode ?? (product as any).barCode ?? null,
      mrp: (variation as any)?.MRP ?? product.MRP ?? null,
      attributes: attrs,
      image:
        (variation?.image && variation.image[0]) ??
        (product.image && product.image[0]) ??
        null,
      qty,
    };
    setQueue((q) => [...q, row]);
    toast.success(`${qty} label${qty === 1 ? "" : "s"} queued`);
  };

  const updateQty = (key: string, qty: number) => {
    setQueue((q) =>
      q.map((r) =>
        r.key === key ? { ...r, qty: Math.max(1, Math.min(500, qty)) } : r,
      ),
    );
  };

  const removeRow = (key: string) =>
    setQueue((q) => q.filter((r) => r.key !== key));
  const clearAll = () => setQueue([]);

  const handlePrint = () => {
    if (totalLabels === 0) {
      toast.error("Queue is empty");
      return;
    }
    setPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setTimeout(() => setPrinting(false), 300);
      });
    });
  };

  return (
    <div className={printing ? "print-mode" : ""}>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .labels-print-area,
          .labels-print-area * {
            visibility: visible !important;
          }
          .labels-print-area {
            position: absolute !important;
            left: 0;
            right: 0;
            top: 0;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print,
          [data-no-print],
          .Toastify,
          [class*="fixed"] {
            display: none !important;
          }
          .label-sheet {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4mm !important;
          }
          .label-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px dashed #888 !important;
            padding: 3mm !important;
            min-height: 38mm;
            background: white !important;
          }
          /* Barcode SVG inherits colours from the JSBarcode render; make
             sure print always comes out black-on-white even if the UI
             theme overrode anything. */
          .label-card svg {
            width: 100%;
            max-width: 55mm;
          }
          @page {
            margin: 8mm;
            size: auto;
          }
        }
      `}</style>

      {/* Screen-only admin UI. Hidden in print media via body-level rule. */}
      <div className="no-print">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Print Labels"
            description="Search a product, queue how many labels you need, then print. Nothing loads until you search — the product table stays light."
          />
          {/* Top-level Print CTA. Prominently placed so the admin can
              trigger the browser print dialog without scrolling down to
              the sidebar once a queue is built. */}
          <div className="shrink-0">
            <Button
              leftIcon={<Printer className="h-4 w-4" />}
              disabled={totalLabels === 0}
              onClick={handlePrint}
            >
              {totalLabels > 0
                ? `Print ${totalLabels} label${totalLabels === 1 ? "" : "s"}`
                : "Print"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* LEFT: search + results */}
          <div className="lg:col-span-2 space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, description..."
              leftIcon={<Search className="h-4 w-4" />}
            />

            {search.trim().length < 2 && (
              <div className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-card)] py-10 text-center text-sm text-[var(--text-muted)]">
                Type at least 2 characters to search.
              </div>
            )}

            {searchQuery.isLoading && search.trim().length >= 2 && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            )}

            {searchQuery.data &&
              searchQuery.data.length === 0 &&
              search.trim().length >= 2 &&
              !searchQuery.isLoading && (
                <EmptyState
                  icon={Package}
                  title="No matches"
                  description="Try a different keyword, product name, or SKU."
                />
              )}

            {searchQuery.data && searchQuery.data.length > 0 && (
              <div className="space-y-2">
                {searchQuery.data.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    expanded={expandedId === p.id}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === p.id ? null : p.id))
                    }
                    onAdd={addRow}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: queue */}
          <aside className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Print queue
                </h3>
                {queue.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] font-medium text-[var(--accent-danger)] hover:opacity-80"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {queue.length} row{queue.length === 1 ? "" : "s"} • {totalLabels}{" "}
                label{totalLabels === 1 ? "" : "s"} total
              </p>

              {queue.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-[var(--border-primary)] py-6 text-center text-xs text-[var(--text-muted)]">
                  Nothing queued yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {queue.map((r) => (
                    <div
                      key={r.key}
                      className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                            {r.productName}
                          </p>
                          {(r.variationName ||
                            Object.keys(r.attributes).length > 0) && (
                            <p className="truncate text-[10px] text-[var(--text-muted)]">
                              {Object.entries(r.attributes)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ") ||
                                r.variationName}
                            </p>
                          )}
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                            {r.sku}
                          </p>
                        </div>
                        <button
                          onClick={() => removeRow(r.key)}
                          className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-[10px] font-medium text-[var(--text-muted)]">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={r.qty}
                          onChange={(e) =>
                            updateQty(r.key, Number(e.target.value) || 1)
                          }
                          className="w-20 rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                fullWidth
                className="mt-3"
                leftIcon={<Printer className="h-4 w-4" />}
                disabled={totalLabels === 0}
                onClick={handlePrint}
              >
                Print {totalLabels > 0 ? `${totalLabels} label${totalLabels === 1 ? "" : "s"}` : "labels"}
              </Button>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-muted)]">
              <p className="font-semibold text-[var(--text-secondary)]">
                Tip
              </p>
              <p className="mt-1">
                In the browser print dialog turn OFF &quot;Headers and
                footers&quot; for clean labels. 3 labels print per row on
                A4 — tweak paper size or margins from the dialog if needed.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Preview + print area. On screen we render the first few labels
          per queue row so the admin can verify the barcode is readable
          before hitting Print. In print mode every copy renders (N × qty
          per row) as a 3-column grid. */}
      {queue.length > 0 && (
        <div className="no-print mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Label preview
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Showing 1 preview per row. {totalLabels} total will print.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((row) => (
              <div
                key={`preview-${row.key}`}
                className="rounded-lg border border-dashed border-[var(--border-primary)] bg-white p-3 text-black"
              >
                <LabelCard row={row} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="labels-print-area hidden print:block">
        <div className="label-sheet">
          {queue.flatMap((row) =>
            Array.from({ length: row.qty }).map((_, i) => (
              <LabelCard key={`${row.key}-${i}`} row={row} />
            )),
          )}
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  expanded,
  onToggle,
  onAdd,
}: {
  product: Product;
  expanded: boolean;
  onToggle: () => void;
  onAdd: (p: Product, v: ProductVariation | null, qty?: number) => void;
}) {
  const variations = product.variations ?? [];
  const [qty, setQty] = useState(1);

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
          {product.image?.[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={resolveAssetUrl(product.image[0])}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {product.name}
          </p>
          <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
            {product.sku}
            {variations.length > 0 &&
              ` · ${variations.length} variation${variations.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {variations.length === 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
              className="w-16 rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
            />
            <Button
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onAdd(product, null, qty)}
            >
              Queue
            </Button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[var(--border-primary)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {expanded ? "Hide" : "Pick variation"}
          </button>
        )}
      </div>

      {expanded && variations.length > 0 && (
        <div className="border-t border-[var(--border-primary)] p-2">
          <div className="space-y-1.5">
            {variations.map((v) => (
              <VariationPickerRow
                key={v.id}
                product={product}
                variation={v}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VariationPickerRow({
  product,
  variation,
  onAdd,
}: {
  product: Product;
  variation: ProductVariation;
  onAdd: (p: Product, v: ProductVariation | null, qty?: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const attrs = parseAttrs(variation);
  const attrLabel = Object.entries(attrs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] p-2",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[var(--text-primary)]">
          {attrLabel || variation.variationName || variation.name || "Variation"}
        </p>
        <p className="truncate font-mono text-[10px] text-[var(--text-muted)]">
          {variation.sku}
        </p>
      </div>
      <input
        type="number"
        min={1}
        max={500}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value) || 1)}
        className="w-16 rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
      />
      <Button
        size="sm"
        variant="outline"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => onAdd(product, variation, qty)}
      >
        Queue
      </Button>
    </div>
  );
}

/**
 * Printed label. Deliberately compact — product name, variation, SKU,
 * and a proper scannable barcode (CODE128 via react-barcode). No price
 * on the label itself (warehouse doesn't need it). The barcode falls
 * back to the SKU when no explicit barCode is stored on the variation.
 */
function LabelCard({ row }: { row: LabelRow }) {
  const attrLabel = Object.entries(row.attributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  const barcodeValue = (row.barCode || row.sku || "").trim();
  const mrpDisplay = (() => {
    const raw = (row.mrp ?? "").toString().trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return raw; // already formatted
    return `₹${n.toLocaleString("en-IN")}`;
  })();
  return (
    <div className="label-card text-[10px]">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[12px] font-bold">{row.productName}</p>
        {mrpDisplay && (
          <p className="shrink-0 text-[11px] font-bold">
            <span className="text-[8px] font-normal uppercase tracking-wider text-gray-500">
              MRP{" "}
            </span>
            {mrpDisplay}
          </p>
        )}
      </div>
      {attrLabel && (
        <p className="mt-0.5 truncate text-[10px] text-gray-700">
          {attrLabel}
        </p>
      )}
      {!attrLabel && row.variationName && (
        <p className="mt-0.5 truncate text-[10px] text-gray-700">
          {row.variationName}
        </p>
      )}
      <div className="mt-1 text-[9px] uppercase tracking-wider text-gray-500">
        SKU{" "}
        <span className="font-mono text-[10px] font-semibold normal-case tracking-normal text-black">
          {row.sku}
        </span>
      </div>
      {/* Scannable CODE128 barcode. Height is kept small so 3 labels fit
          across A4. Value falls back to SKU when barCode is missing so
          every label stays scannable. */}
      {barcodeValue && (
        <div className="mt-1 flex justify-center">
          <Barcode
            value={barcodeValue}
            format="CODE128"
            height={28}
            width={1.1}
            fontSize={9}
            margin={0}
            displayValue
            background="#ffffff"
            lineColor="#000000"
          />
        </div>
      )}
    </div>
  );
}
