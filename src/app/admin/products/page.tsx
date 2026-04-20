"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  useAdminProducts,
  useAdminDeleteProduct,
  useAdminToggleProduct,
} from "@/services/admin/products";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Product } from "@/types/product";
import { Plus, Trash2, Edit, Eye, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminProducts();
  const deleteMutation = useAdminDeleteProduct();
  const toggleMutation = useAdminToggleProduct();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const toggleActive = async (item: Product, next: boolean) => {
    setTogglingId(item.id);
    try {
      await toggleMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const firstImage = (p: Product) =>
    Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : null;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (_v, row) => {
        const item = row as unknown as Product;
        const src = resolveAssetUrl(firstImage(item) ?? undefined);
        return src ? (
          <img
            src={src}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
            --
          </div>
        );
      },
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "sku",
      label: "SKU",
      render: (val) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {val as string}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (val) =>
        val ? (
          <span className="font-semibold text-[var(--text-primary)]">
            ₹{Number(val).toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        ),
    },
    {
      key: "stock",
      label: "Stock",
      sortable: true,
      render: (val) =>
        val ? (val as string) : <span className="text-[var(--text-muted)]">--</span>,
    },
    {
      key: "category",
      label: "Category",
      render: (val) => {
        const cat = val as { name?: string } | undefined;
        return cat?.name ?? (
          <span className="text-[var(--text-muted)]">--</span>
        );
      },
    },
    {
      key: "platform",
      label: "Platforms",
      render: (val) => {
        const list = (val as string[] | undefined) ?? [];
        if (list.length === 0)
          return <span className="text-[var(--text-muted)]">--</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((p) => (
              <Badge key={p} variant="info">
                {p}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Product;
        return (
          <Switch
            checked={!!val}
            onChange={(next) => toggleActive(item, next)}
            loading={togglingId === item.id}
            label={`Toggle ${item.name}`}
          />
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const item = row as unknown as Product;
        return (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/products/${item.id}/view`}
              aria-label="View product"
            >
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href={`/admin/products/${item.id}/edit`}
              aria-label="Edit product"
            >
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete product"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog — attributes, variations, offers, market links."
      >
        <Link href="/admin/products/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search by name, SKU or description..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} product{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <Table
            columns={columns}
            data={rows as unknown as Record<string, unknown>[]}
            loading={isLoading}
            emptyMessage={
              search
                ? "No products match your search"
                : "No products yet. Add the first one."
            }
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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load products
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
