"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  useBangaloreInventory,
  useSyncBangaloreInventory,
  type BangaloreInventoryRow,
} from "@/services/admin/warehouse";
import { Package2, RefreshCw } from "lucide-react";

// Admin view on the Increff-pushed inventory for the Bangalore warehouse.
// The backend joins each row with its SKU mapping (when present) so admins
// can see at a glance which incoming SKUs already route to an internal
// product and which still need mapping from the SKU Mapping console.
export default function BangaloreInventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useBangaloreInventory({ page, limit: 20, search });
  const syncMutation = useSyncBangaloreInventory();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "channelSkuCode",
      label: "Channel SKU",
      render: (val) => (
        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
          {val as string}
        </span>
      ),
    },
    {
      key: "locationCode",
      label: "Location",
      render: (val) => (
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          <Package2 className="h-3 w-3" />
          {val as string}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Qty",
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-medium">
          {(val as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "product",
      label: "Mapped product",
      render: (_val, row) => {
        const r = row as unknown as BangaloreInventoryRow;
        if (!r.product) {
          return (
            <span className="text-xs text-[var(--text-muted)]">Not mapped</span>
          );
        }
        return (
          <div className="min-w-0">
            <p className="truncate text-sm text-[var(--text-primary)]">
              {r.product.name}
            </p>
            <p className="truncate text-[11px] text-[var(--text-muted)]">
              SKU {r.product.sku}
            </p>
          </div>
        );
      },
    },
    {
      key: "lastSynced",
      label: "Last Synced",
      render: (val) => (val ? new Date(val as string).toLocaleString() : "Never"),
    },
    {
      key: "stock",
      label: "Status",
      render: (val) => {
        const stock = Number(val) || 0;
        return (
          <Badge
            variant={
              stock === 0 ? "danger" : stock < 10 ? "warning" : "success"
            }
          >
            {stock === 0 ? "Out of Stock" : stock < 10 ? "Low Stock" : "In Stock"}
          </Badge>
        );
      },
    },
  ];

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];

  return (
    <div>
      <PageHeader
        title="Bangalore Inventory"
        description="Live inventory pushed by Increff for the Bangalore warehouses."
      >
        <Button
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? "Syncing..." : "Sync Inventory"}
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search channel SKU, location, client SKU..."
          className="max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        data={rows}
        loading={isLoading}
        emptyMessage="No Bangalore inventory synced yet. Increff will push rows once configured."
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
