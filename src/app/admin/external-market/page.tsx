"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Badge } from "@/components/ui/Badge";
import {
  useMarketLinks,
  useCreateMarketLink,
  useUpdateMarketLink,
  useDeleteMarketLink,
} from "@/services/admin/external-market";
import { useLocationStates } from "@/services/admin/location";
import { useAdminProducts } from "@/services/admin/products";
import type { MarketLink } from "@/types/product";
import { Plus, Edit, Eye, Trash2, AlertCircle, ExternalLink } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type MarketLinkForm = {
  name: string;
  url: string;
  countryName: string;
  countryCode: string;
  productId: string;
};

const emptyForm: MarketLinkForm = {
  name: "",
  url: "",
  countryName: "",
  countryCode: "",
  productId: "",
};

export default function ExternalMarketPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<MarketLink | null>(null);
  const [viewing, setViewing] = useState<MarketLink | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<MarketLinkForm>(emptyForm);

  const { data, isLoading, error } = useMarketLinks();
  const { data: locations } = useLocationStates();
  const { data: products } = useAdminProducts();
  const createMutation = useCreateMarketLink();
  const updateMutation = useUpdateMarketLink();
  const deleteMutation = useDeleteMarketLink();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q) ||
        m.countryName.toLowerCase().includes(q),
    );
  }, [data, search]);

  // Options for the product picker — searchable dropdown backed by the admin
  // product list. Hint shows the SKU so admins can disambiguate same-name
  // products.
  const productOptions = useMemo(
    () =>
      (products ?? []).map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.sku,
      })),
    [products],
  );

  const productById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sku?: string }>();
    for (const p of products ?? []) {
      map.set(p.id, { id: p.id, name: p.name, sku: p.sku });
    }
    return map;
  }, [products]);

  // Dedupe country names from the Location master so the dropdown only offers
  // countries the admin has actually set up.
  const countryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of locations ?? []) {
      if (l.countryName) names.add(l.countryName);
    }
    return Array.from(names).map((name) => ({
      value: name,
      label: name,
      hint: name.slice(0, 2).toUpperCase(),
    }));
  }, [locations]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };
  const openEdit = (item: MarketLink) => {
    setEditing(item);
    setForm({
      name: item.name,
      url: item.url,
      countryName: item.countryName,
      countryCode: item.countryCode,
      productId: item.productId ?? "",
    });
    setDialogMode("edit");
  };
  const openView = (item: MarketLink) => {
    setViewing(item);
    setDialogMode("view");
  };
  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setViewing(null);
    setForm(emptyForm);
  };

  const pickCountry = (name: string | "") => {
    if (!name) {
      setForm((f) => ({ ...f, countryName: "", countryCode: "" }));
      return;
    }
    // Derive a 2-letter code from the country name. Admin can still override.
    const code = name.slice(0, 2).toUpperCase();
    setForm((f) => ({ ...f, countryName: name, countryCode: code }));
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      countryName: form.countryName,
      countryCode: form.countryCode.toUpperCase(),
      productId: form.productId.trim() || null,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    !!form.name.trim() &&
    !!form.url.trim() &&
    !!form.countryName &&
    !!form.countryCode;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "countryName",
      label: "Country",
      render: (val, row) => {
        const item = row as unknown as MarketLink;
        return (
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {item.countryCode}
            </span>
            <span className="text-sm">{val as string}</span>
          </span>
        );
      },
    },
    {
      key: "url",
      label: "URL",
      render: (val) => (
        <a
          href={val as string}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      ),
    },
    {
      key: "productId",
      label: "Product",
      render: (val) => {
        if (!val) return <Badge variant="default">Global</Badge>;
        const prod = productById.get(val as string);
        return prod ? (
          <span className="text-sm text-[var(--text-primary)]">
            {prod.name}
            {prod.sku && (
              <span className="ml-1 font-mono text-xs text-[var(--text-muted)]">
                · {prod.sku}
              </span>
            )}
          </span>
        ) : (
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            {String(val).slice(0, 10)}…
          </span>
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const item = row as unknown as MarketLink;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  const showForm = dialogMode === "create" || dialogMode === "edit";

  return (
    <div>
      <PageHeader
        title="Market Links"
        description="External marketplace URLs (Amazon, Flipkart, etc.) per country. Can be scoped to a product or left global."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Link
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search name, URL or country..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} link{rows.length === 1 ? "" : "s"}
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
              search ? "No links match your search" : "No market links yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Market Link" : "Add Market Link"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Amazon"
          />

          <Input
            label="URL"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />

          <SearchableSelect
            label="Country (from Locations master)"
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            options={countryOptions}
            value={form.countryName}
            onChange={(v) => pickCountry(v === "" ? "" : (v as string))}
            emptyMessage="No countries configured — add Locations first"
            clearable
          />

          <Input
            label="Country code"
            value={form.countryCode}
            onChange={(e) =>
              setForm({ ...form, countryCode: e.target.value.toUpperCase() })
            }
            placeholder="e.g. US"
          />

          <SearchableSelect
            label="Product (optional)"
            placeholder="Leave blank for a global link"
            searchPlaceholder="Search product name or SKU..."
            options={productOptions}
            value={form.productId}
            onChange={(v) =>
              setForm({ ...form, productId: v === "" ? "" : (v as string) })
            }
            emptyMessage="No products yet"
            clearable
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              loading={submitting}
            >
              {dialogMode === "edit" ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialogMode === "view"}
        onClose={closeDialog}
        title="Market Link Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {viewing.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                  {viewing.countryCode}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {viewing.countryName}
                </span>
              </div>
              <a
                href={viewing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {viewing.url}
              </a>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Product scope
              </p>
              {viewing.productId ? (
                (() => {
                  const prod = productById.get(viewing.productId);
                  return prod ? (
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">
                        {prod.name}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {prod.sku ?? viewing.productId}
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-sm text-[var(--text-primary)]">
                      {viewing.productId}
                    </p>
                  );
                })()
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Global (not attached to a specific product).
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Market Link"
        message="Are you sure you want to delete this market link? This action cannot be undone."
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
        Failed to load market links
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
