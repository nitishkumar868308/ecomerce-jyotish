"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAdminProducts, useAdminDeleteProduct } from "@/services/admin/products";
import { Plus, Trash2, Edit, Eye } from "lucide-react";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useAdminProducts({ page, limit: 20, search });
  const deleteMutation = useAdminDeleteProduct();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "thumbnail",
      label: "Image",
      render: (val) =>
        val ? (
          <img
            src={val as string}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            --
          </div>
        ),
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (val) => `₹${Number(val).toLocaleString()}`,
    },
    { key: "stock", label: "Stock", sortable: true },
    {
      key: "category",
      label: "Category",
      render: (val) => {
        const cat = val as { name: string } | undefined;
        return cat?.name ?? "-";
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => (
        <Badge variant={val ? "success" : "danger"}>
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/create?id=${row.id}`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.id as number)}
          >
            <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Products" description="Manage your product catalog">
        <Link href="/admin/products/create">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
        </Link>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search products..."
          className="max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        data={(data?.data as Record<string, unknown>[]) ?? []}
        loading={isLoading}
        emptyMessage="No products found"
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

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
