"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Badge } from "@/components/ui/Badge";
import {
  useSkuInventory,
  useInternalSkus,
  useCreateSkuMapping,
  useDeleteSkuMapping,
  type GroupedInventoryRow,
  type InventoryLocationRow,
} from "@/services/admin/sku-mapping";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Link2,
  Package2,
  Trash2,
} from "lucide-react";

// SKU mapping console, grouped view.
//
// Each row is ONE `channelSkuCode` plus the list of Increff locations that
// carry it. Admin picks an internal SKU once → the mapping applies to every
// location. Expanding a row exposes a per-location override so the same
// channel SKU can route to different internal SKUs if needed (rare but
// supported).

type MapScope =
  | { kind: "global"; channelSku: string; currentOurSku: string | null }
  | {
      kind: "location";
      channelSku: string;
      locationCode: string;
      currentOurSku: string | null;
    };

export default function SkuMappingPage() {
  const { data: grouped = [], isLoading } = useSkuInventory();
  const { data: internalSkus = [], isLoading: loadingSkus } = useInternalSkus();
  const createMut = useCreateSkuMapping();
  const deleteMut = useDeleteSkuMapping();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unmapped" | "mapped"
  >("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mapTarget, setMapTarget] = useState<MapScope | null>(null);
  const [pickedSku, setPickedSku] = useState<string>("");
  const [deleteMappingId, setDeleteMappingId] = useState<number | null>(null);

  // Backends that haven't been upgraded yet return the old ungrouped
  // shape (one row per location with no `locations` array). Normalise so
  // the page doesn't crash on `row.locations.length` — one logical group
  // per raw row keeps the UI at parity until the backend rolls out.
  const normalisedGrouped = useMemo<GroupedInventoryRow[]>(() => {
    return (grouped ?? []).map((row: any) => {
      if (Array.isArray(row.locations)) return row as GroupedInventoryRow;
      return {
        channelSkuCode: row.channelSkuCode ?? "",
        totalQuantity: Number(row.quantity ?? 0),
        locations: [
          {
            locationCode: row.locationCode ?? "",
            quantity: Number(row.quantity ?? 0),
            minExpiry: row.minExpiry ?? null,
            updatedAt: row.updatedAt ?? new Date().toISOString(),
            ourSku: row.ourSku ?? null,
            mappingId: row.mappingId ?? null,
            isOverride: false,
          },
        ],
        globalMapping:
          row.mapped && row.mappingId != null
            ? { id: row.mappingId, ourSku: row.ourSku ?? "" }
            : null,
        hasPerLocationOverride: false,
        fullyMapped: !!row.mapped,
      } as GroupedInventoryRow;
    });
  }, [grouped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalisedGrouped.filter((row) => {
      if (statusFilter === "unmapped" && row.fullyMapped) return false;
      if (statusFilter === "mapped" && !row.fullyMapped) return false;
      if (!q) return true;
      return (
        row.channelSkuCode.toLowerCase().includes(q) ||
        (row.globalMapping?.ourSku ?? "").toLowerCase().includes(q) ||
        (row.locations ?? []).some(
          (l) =>
            l.locationCode.toLowerCase().includes(q) ||
            (l.ourSku ?? "").toLowerCase().includes(q),
        )
      );
    });
  }, [normalisedGrouped, search, statusFilter]);

  const unmappedCount = normalisedGrouped.filter((r) => !r.fullyMapped).length;

  const toggleExpand = (channelSku: string) => {
    setExpanded((prev) => ({ ...prev, [channelSku]: !prev[channelSku] }));
  };

  const openMapGlobal = (row: GroupedInventoryRow) => {
    setMapTarget({
      kind: "global",
      channelSku: row.channelSkuCode,
      currentOurSku: row.globalMapping?.ourSku ?? null,
    });
    setPickedSku(row.globalMapping?.ourSku ?? "");
  };

  const openMapLocation = (
    row: GroupedInventoryRow,
    loc: InventoryLocationRow,
  ) => {
    setMapTarget({
      kind: "location",
      channelSku: row.channelSkuCode,
      locationCode: loc.locationCode,
      currentOurSku: loc.ourSku,
    });
    setPickedSku(loc.ourSku ?? "");
  };

  const closeMap = () => {
    setMapTarget(null);
    setPickedSku("");
  };

  const submitMap = async () => {
    if (!mapTarget || !pickedSku) return;
    await createMut.mutateAsync({
      channelSku: mapTarget.channelSku,
      ourSku: pickedSku,
      locationCode:
        mapTarget.kind === "location" ? mapTarget.locationCode : null,
    });
    closeMap();
  };

  const skuOptions = useMemo(
    () =>
      internalSkus.map((s) => ({
        value: s.sku,
        label: s.sku,
        hint: `${s.kind === "VARIATION" ? "Variation" : "Product"} · ${s.label}`,
      })),
    [internalSkus],
  );

  return (
    <div>
      <PageHeader
        title="SKU Mapping"
        description="Map incoming Bangalore channel SKUs to your internal product / variation SKUs. One mapping per channel SKU applies to every location by default — expand a row to override for a single warehouse."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search channel SKU, internal SKU, or location..."
          className="max-w-sm flex-1"
        />
        <div className="inline-flex rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-1 text-xs font-medium">
          {(
            [
              { k: "all", label: `All (${normalisedGrouped.length})` },
              { k: "unmapped", label: `Needs mapping (${unmappedCount})` },
              {
                k: "mapped",
                label: `Mapped (${normalisedGrouped.length - unmappedCount})`,
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.k}
              type="button"
              onClick={() => setStatusFilter(opt.k)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                statusFilter === opt.k
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            Loading inventory…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            {search || statusFilter !== "all"
              ? "No inventory matches these filters."
              : "No Bangalore inventory synced yet. Run the Bangalore sync to pull data."}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-primary)]">
            {filtered.map((row) => (
              <GroupedRow
                key={row.channelSkuCode}
                row={row}
                expanded={!!expanded[row.channelSkuCode]}
                onToggle={() => toggleExpand(row.channelSkuCode)}
                onMapGlobal={() => openMapGlobal(row)}
                onMapLocation={(loc) => openMapLocation(row, loc)}
                onRemoveMapping={(id) => setDeleteMappingId(id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Map / override modal */}
      <Modal
        isOpen={!!mapTarget}
        onClose={closeMap}
        title={
          mapTarget?.kind === "location"
            ? `Override for ${mapTarget.locationCode}`
            : mapTarget?.currentOurSku
              ? "Change mapping"
              : mapTarget
                ? `Map channel SKU ${mapTarget.channelSku}`
                : ""
        }
      >
        {mapTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                {mapTarget.kind === "location"
                  ? `Per-location override — ${mapTarget.locationCode}`
                  : "Applies to every location carrying this channel SKU"}
              </p>
              <p className="mt-1 font-mono text-base font-semibold text-[var(--text-primary)]">
                {mapTarget.channelSku}
              </p>
              {mapTarget.currentOurSku && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Currently mapped to{" "}
                  <span className="font-mono font-semibold text-[var(--accent-primary)]">
                    {mapTarget.currentOurSku}
                  </span>
                </p>
              )}
            </div>

            <SearchableSelect
              label="Pick an internal SKU"
              placeholder={
                loadingSkus
                  ? "Loading your SKUs…"
                  : "Search product or variation SKU"
              }
              searchPlaceholder="Search by SKU or product name..."
              options={skuOptions}
              value={pickedSku}
              onChange={(v) => setPickedSku(v === "" ? "" : (v as string))}
              loading={loadingSkus}
              emptyMessage="No internal SKUs found"
              clearable
            />

            {mapTarget.kind === "global" && (
              <p className="text-[11px] text-[var(--text-muted)]">
                Want a different mapping in a specific warehouse? Close this,
                expand the row, and use the per-location action on that row.
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
              <Button
                variant="ghost"
                onClick={closeMap}
                disabled={createMut.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={submitMap}
                disabled={!pickedSku || createMut.isPending}
                loading={createMut.isPending}
              >
                {mapTarget.currentOurSku ? "Update mapping" : "Save mapping"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteMappingId !== null}
        onClose={() => setDeleteMappingId(null)}
        onConfirm={async () => {
          if (deleteMappingId !== null) {
            await deleteMut.mutateAsync(deleteMappingId);
            setDeleteMappingId(null);
          }
        }}
        title="Remove mapping"
        message="The mapping will be removed. If this was a per-location override, the global mapping (if any) will apply instead. Otherwise the channel SKU will go back to 'needs mapping'."
        confirmText="Remove mapping"
        variant="danger"
      />
    </div>
  );
}

function GroupedRow({
  row,
  expanded,
  onToggle,
  onMapGlobal,
  onMapLocation,
  onRemoveMapping,
}: {
  row: GroupedInventoryRow;
  expanded: boolean;
  onToggle: () => void;
  onMapGlobal: () => void;
  onMapLocation: (loc: InventoryLocationRow) => void;
  onRemoveMapping: (id: number) => void;
}) {
  return (
    <li className="bg-[var(--bg-card)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              {row.channelSkuCode}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {row.locations.length} location
              {row.locations.length === 1 ? "" : "s"} · total qty{" "}
              <span className="tabular-nums font-medium">
                {row.totalQuantity.toLocaleString()}
              </span>
            </span>
            {row.hasPerLocationOverride && (
              <Badge variant="info">Per-location override</Badge>
            )}
          </div>

          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {row.globalMapping ? (
              <>
                Global mapping →{" "}
                <span className="font-mono font-semibold text-[var(--accent-primary)]">
                  {row.globalMapping.ourSku}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">
                No global mapping yet
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {row.fullyMapped ? (
            <Badge variant="success">Mapped</Badge>
          ) : (
            <Badge variant="warning">Needs mapping</Badge>
          )}

          <Button
            size="sm"
            variant={row.globalMapping ? "ghost" : "primary"}
            leftIcon={<Link2 className="h-4 w-4" />}
            onClick={onMapGlobal}
          >
            {row.globalMapping ? "Change global" : "Map all"}
          </Button>
          {row.globalMapping && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveMapping(row.globalMapping!.id)}
              aria-label="Remove global mapping"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/60 px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Locations
          </p>
          <ul className="space-y-1.5">
            {row.locations.map((loc) => (
              <li
                key={`${row.channelSkuCode}::${loc.locationCode}`}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border bg-[var(--bg-card)] px-3 py-2",
                  loc.isOverride
                    ? "border-[var(--accent-primary)]/40"
                    : "border-[var(--border-primary)]",
                )}
              >
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  <Package2 className="h-3 w-3" />
                  {loc.locationCode}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Qty{" "}
                  <span className="tabular-nums font-medium text-[var(--text-primary)]">
                    {loc.quantity.toLocaleString()}
                  </span>
                </span>

                <div className="min-w-0 flex-1 text-xs">
                  {loc.ourSku ? (
                    <span>
                      Routes to{" "}
                      <span className="font-mono font-semibold text-[var(--accent-primary)]">
                        {loc.ourSku}
                      </span>{" "}
                      {loc.isOverride ? (
                        <span className="ml-1 rounded-full bg-[var(--accent-primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                          Override
                        </span>
                      ) : (
                        <span className="ml-1 rounded-full bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                          via global
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      Not mapped
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Link2 className="h-3.5 w-3.5" />}
                    onClick={() => onMapLocation(loc)}
                  >
                    {loc.isOverride ? "Change override" : "Override"}
                  </Button>
                  {loc.isOverride && loc.mappingId != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMapping(loc.mappingId!)}
                      aria-label="Remove override"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[var(--accent-danger)]" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
