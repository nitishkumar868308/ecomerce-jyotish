"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  useSendToWarehouse,
  useCreateSendToWarehouse,
  useWarehouseLocations,
} from "@/services/admin/warehouse";
import { useProducts } from "@/services/products";
import {
  Search,
  Package,
  Truck,
  Printer,
  Plus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "search" | "queue" | "dispatch" | "labels";

interface QueuedItem {
  key: string;
  productId: number | string;
  productName: string;
  sku: string;
  variationId?: number | string;
  variationLabel?: string;
  quantity: number;
  warehouseId: number | null;
  mrp?: number | string;
  fnsku?: string;
}

/**
 * Send-to-warehouse console with four tabs:
 *   1. Search    — find products / variations to queue
 *   2. Queue     — configure quantity + destination warehouse per row
 *   3. Dispatch  — submit the queue; rows move to the Dispatched list
 *   4. Labels    — browser-print view showing FNSKU barcode + MRP + name
 *
 * Dispatched transfers come back from the backend via useSendToWarehouse().
 * Labels on the print surface use CSS-based barcode font fallback + a simple
 * layout suitable for a thermal printer (4x2 inch).
 */
export default function SendToWarehousePage() {
  const [tab, setTab] = useState<Tab>("search");
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<QueuedItem[]>([]);

  const { data: warehouses } = useWarehouseLocations();
  const { data: productsResp } = useProducts(search ? { search } : undefined);
  const { data: dispatched } = useSendToWarehouse();
  const createTransfer = useCreateSendToWarehouse();

  const products = useMemo<any[]>(() => {
    const payload: any = productsResp;
    if (Array.isArray(payload?.data?.products)) return payload.data.products;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [productsResp]);

  const addToQueue = (
    product: any,
    variation?: any,
  ) => {
    const key = `${product.id}-${variation?.id ?? "base"}`;
    if (queue.some((q) => q.key === key)) {
      toast("Already in queue", { icon: "ℹ️" });
      return;
    }
    setQueue((prev) => [
      ...prev,
      {
        key,
        productId: product.id,
        productName: product.name,
        sku: variation?.sku || product.sku || "",
        variationId: variation?.id,
        variationLabel: variation?.variationName,
        quantity: 1,
        warehouseId: warehouses?.[0]?.id ?? null,
        mrp: product.MRP || product.price,
        fnsku: product.barCode || variation?.barCode || "",
      },
    ]);
    toast.success("Added to queue");
  };

  const updateQueueItem = (key: string, patch: Partial<QueuedItem>) => {
    setQueue((prev) =>
      prev.map((q) => (q.key === key ? { ...q, ...patch } : q)),
    );
  };

  const removeFromQueue = (key: string) => {
    setQueue((prev) => prev.filter((q) => q.key !== key));
  };

  const handleDispatch = async () => {
    if (queue.length === 0) {
      toast.error("Queue is empty");
      return;
    }
    for (const item of queue) {
      if (!item.warehouseId || item.quantity <= 0) {
        toast.error(`Row "${item.productName}" is missing warehouse/quantity`);
        return;
      }
    }
    try {
      for (const item of queue) {
        await createTransfer.mutateAsync({
          productId: item.productId,
          variationId: item.variationId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          // Fulfilment bucket is saved so city-bucket quickgo inventory can
          // read it back (item 34 in the brief): delhiwarehouse, etc.
          fulfilmentBucket: (() => {
            const wh = warehouses?.find((w) => w.id === item.warehouseId);
            return `${(wh?.city || "unknown").toLowerCase().replace(/\s+/g, "")}warehouse`;
          })(),
        });
      }
      setQueue([]);
      setTab("dispatch");
      toast.success("Queue dispatched!");
    } catch {
      /* toast handled by mutation */
    }
  };

  const handlePrintLabels = () => {
    const html = buildLabelHtml(queue.length > 0 ? queue : dispatchedAsLabels);
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const dispatchedAsLabels: QueuedItem[] = useMemo(() => {
    const list = Array.isArray(dispatched) ? dispatched : [];
    return list.map((row: any) => ({
      key: String(row.id),
      productId: row.productId,
      productName: row.product?.name ?? row.productName ?? "",
      sku: row.product?.sku ?? row.sku ?? "",
      variationId: row.variationId,
      variationLabel: row.variation?.variationName,
      quantity: row.quantity ?? 1,
      warehouseId: row.warehouseId ?? null,
      mrp: row.product?.MRP ?? row.product?.price ?? "",
      fnsku: row.fnsku || row.product?.barCode || "",
    }));
  }, [dispatched]);

  return (
    <div>
      <PageHeader
        title="Send to Warehouse"
        description="Queue stock transfers, dispatch and print labels"
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-1">
        <TabButton
          active={tab === "search"}
          onClick={() => setTab("search")}
          Icon={Search}
          label="1. Search"
        />
        <TabButton
          active={tab === "queue"}
          onClick={() => setTab("queue")}
          Icon={Package}
          label={`2. Queue${queue.length ? ` (${queue.length})` : ""}`}
        />
        <TabButton
          active={tab === "dispatch"}
          onClick={() => setTab("dispatch")}
          Icon={Truck}
          label="3. Dispatch"
        />
        <TabButton
          active={tab === "labels"}
          onClick={() => setTab("labels")}
          Icon={Printer}
          label="4. Labels"
        />
      </div>

      {tab === "search" && (
        <section className="space-y-4">
          <SearchInput
            onSearch={setSearch}
            placeholder="Search products by name, SKU, barcode..."
            className="max-w-md"
          />
          {products.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              {search
                ? "No products match your search."
                : "Type a name or SKU to start."}
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-primary)] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
              {products.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">
                        {p.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        SKU {p.sku || "—"}
                        {p.barCode ? ` · ${p.barCode}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => addToQueue(p)}
                    >
                      Queue
                    </Button>
                  </div>
                  {p.variations && p.variations.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {p.variations.map((v: any) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2"
                        >
                          <div className="min-w-0 text-xs">
                            <p className="truncate text-[var(--text-primary)]">
                              {v.variationName || v.name || v.sku}
                            </p>
                            <p className="text-[var(--text-muted)]">
                              Stock {v.stock ?? 0}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToQueue(p, v)}
                            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                          >
                            Queue
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "queue" && (
        <section className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Your queue is empty — use Search to add products.
            </p>
          ) : (
            queue.map((item) => (
              <div
                key={item.key}
                className="grid gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:grid-cols-[1.5fr_0.8fr_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">
                    {item.productName}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    SKU {item.sku || "—"}
                    {item.variationLabel ? ` · ${item.variationLabel}` : ""}
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={String(item.quantity)}
                  onChange={(e) =>
                    updateQueueItem(item.key, {
                      quantity: Math.max(0, Number(e.target.value)),
                    })
                  }
                  label="Qty"
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                    Warehouse
                  </label>
                  <select
                    value={item.warehouseId ?? ""}
                    onChange={(e) =>
                      updateQueueItem(item.key, {
                        warehouseId: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Pick destination</option>
                    {(warehouses ?? []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {w.city}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromQueue(item.key)}
                  className="self-end rounded-lg p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
          {queue.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleDispatch}
                loading={createTransfer.isPending}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Dispatch {queue.length} transfer
                {queue.length === 1 ? "" : "s"}
              </Button>
            </div>
          )}
        </section>
      )}

      {tab === "dispatch" && (
        <section className="space-y-3">
          {!Array.isArray(dispatched) || dispatched.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No dispatched transfers yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-primary)] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
              {(dispatched as any[]).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {row.product?.name ?? row.productName ?? "(product)"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Qty {row.quantity} · {row.warehouse?.name || "—"} ·{" "}
                      {new Date(row.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      row.status === "DELIVERED"
                        ? "success"
                        : row.status === "IN_TRANSIT"
                          ? "info"
                          : "warning"
                    }
                  >
                    {row.status || "QUEUED"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => setTab("labels")}
            >
              Go to labels
            </Button>
          </div>
        </section>
      )}

      {tab === "labels" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {queue.length > 0
                ? `Previewing labels for the ${queue.length} queued item(s). Dispatch first to persist them.`
                : "Previewing labels for your recent dispatched transfers."}
            </p>
            <Button
              onClick={handlePrintLabels}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Print all labels
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(queue.length > 0 ? queue : dispatchedAsLabels).map((item) => (
              <LabelPreview key={item.key} item={item} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 text-xs text-[var(--text-muted)]">
        Need new warehouses? See{" "}
        <Link
          href="/admin/warehouse-location"
          className="text-[var(--accent-primary)] hover:underline"
        >
          Warehouse Locations
        </Link>
        .
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--accent-primary)] text-white shadow-sm"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function LabelPreview({ item }: { item: QueuedItem }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--border-primary)] bg-white p-4 text-black">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">
        HECATE WIZARD MALL
      </p>
      <p className="mt-1 text-sm font-bold leading-tight">
        {item.productName}
      </p>
      {item.variationLabel && (
        <p className="text-xs text-gray-700">{item.variationLabel}</p>
      )}
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-gray-500">MRP</p>
          <p className="text-base font-bold">₹{item.mrp ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">FNSKU</p>
          <p className="font-mono text-sm font-semibold">
            {item.fnsku || item.sku || "—"}
          </p>
        </div>
      </div>
      <div className="mt-3 font-mono text-[10px] tracking-[0.25em] text-gray-800">
        {(item.fnsku || item.sku || "")
          .padEnd(12, "0")
          .slice(0, 12)
          .split("")
          .map((c, i) => (
            <span key={i}>{c}</span>
          ))}
      </div>
    </div>
  );
}

function buildLabelHtml(items: QueuedItem[]): string {
  const labels = items
    .map(
      (item) => `
    <div class="label">
      <div class="brand">HECATE WIZARD MALL</div>
      <div class="name">${escapeHtml(item.productName)}</div>
      ${item.variationLabel ? `<div class="variation">${escapeHtml(item.variationLabel)}</div>` : ""}
      <div class="row">
        <div><small>MRP</small><strong>₹${item.mrp ?? "—"}</strong></div>
        <div class="right"><small>FNSKU</small><strong>${escapeHtml(item.fnsku || item.sku || "—")}</strong></div>
      </div>
      <div class="barcode">*${escapeHtml(item.fnsku || item.sku || "000000")}*</div>
    </div>`,
    )
    .join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Labels</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 8mm; color: #000; }
  .label { box-sizing: border-box; width: 100mm; height: 50mm; border: 2px dashed #333; padding: 4mm 6mm; page-break-inside: avoid; margin-bottom: 4mm; }
  .brand { font-size: 9px; letter-spacing: 1px; color: #666; }
  .name { font-size: 13px; font-weight: 700; line-height: 1.1; margin-top: 2px; }
  .variation { font-size: 10px; color: #444; }
  .row { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; }
  .row small { display:block; font-size: 8px; color: #888; text-transform: uppercase; }
  .row strong { font-size: 13px; }
  .right { text-align: right; }
  .barcode { margin-top: 6px; font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 34px; letter-spacing: 2px; text-align: center; }
  @media print { .label { border-style: solid; } }
</style>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet" />
</head><body>${labels}</body></html>`;
}

function escapeHtml(v: string | number | undefined): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
