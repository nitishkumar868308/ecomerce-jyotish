"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useBangaloreInventory, useSyncBangaloreInventory } from "@/services/admin/warehouse";
import { RefreshCw } from "lucide-react";

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
      key: "product",
      label: "Product",
      render: (val) => {
        const product = val as { name: string } | undefined;
        return product?.name ?? "-";
      },
    },
    { key: "sku", label: "SKU" },
    { key: "stock", label: "Stock", sortable: true },
    {
      key: "lastSynced",
      label: "Last Synced",
      render: (val) => val ? new Date(val as string).toLocaleString() : "Never",
    },
    {
      key: "stock",
      label: "Status",
      render: (val) => {
        const stock = val as number;
        return <Badge variant={stock === 0 ? "danger" : stock < 10 ? "warning" : "success"}>{stock === 0 ? "Out of Stock" : stock < 10 ? "Low Stock" : "In Stock"}</Badge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Bangalore Inventory" description="View and sync Bangalore warehouse inventory">
        <Button
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? "Syncing..." : "Sync Inventory"}
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search inventory..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No inventory found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
