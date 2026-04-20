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
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  useCountryTaxes,
  useCreateCountryTax,
  useUpdateCountryTax,
  useDeleteCountryTax,
} from "@/services/admin/tax";
import { useCountries } from "@/services/admin/location";
import { useCategories } from "@/services/categories";
import type { CountryTax } from "@/types/shipping";
import { Plus, Edit, Eye, Trash2, Receipt } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

interface FormState {
  countryCode: string;
  categoryId: string;
  taxPercent: string;
  gstPercent: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  countryCode: "",
  categoryId: "",
  taxPercent: "",
  gstPercent: "",
  isActive: true,
};

export default function CountryTaxesPage() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<CountryTax | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: list = [], isLoading } = useCountryTaxes();
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const createMutation = useCreateCountryTax();
  const updateMutation = useUpdateCountryTax();
  const deleteMutation = useDeleteCountryTax();

  const countryOptions = useMemo(
    () =>
      (countries ?? []).map((c) => ({
        value: c.iso2 || c.iso3 || c.code || String(c.id),
        label: c.name,
        hint: c.iso2 || c.iso3,
      })),
    [countries],
  );

  const categoryOptions = useMemo(
    () =>
      (categories ?? []).map((c: any) => ({
        value: String(c.id),
        label: c.name,
      })),
    [categories],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r: any) =>
        (r.country ?? r.countryName ?? "").toLowerCase().includes(q) ||
        (r.category?.name ?? r.categoryName ?? "").toLowerCase().includes(q) ||
        (r.countryCode ?? "").toLowerCase().includes(q),
    );
  }, [list, search]);

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode("create");
  };

  const openEdit = (row: CountryTax) => {
    setSelected(row);
    const r = row as any;
    setForm({
      countryCode: (r.countryCode ?? r.country ?? "") as string,
      categoryId: r.categoryId ? String(r.categoryId) : "",
      taxPercent: String(r.generalTax ?? r.taxPercent ?? r.taxRate ?? ""),
      gstPercent: String(r.gstTax ?? r.gstPercent ?? ""),
      isActive: r.active ?? r.isActive ?? true,
    });
    setMode("edit");
  };

  const openView = (row: CountryTax) => {
    setSelected(row);
    setMode("view");
  };

  const handleSubmit = async () => {
    const country = countries?.find((c) => (c.iso2 || c.iso3 || c.code) === form.countryCode);
    // Backend DTO uses `country` (name string), `categoryId`, `generalTax`,
    // `gstTax`, `active`, `countryCode`. Anything else is rejected by the
    // strict ValidationPipe (forbidNonWhitelisted: true).
    const payload = {
      country: country?.name || form.countryCode,
      countryCode: form.countryCode,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      generalTax: form.taxPercent ? Number(form.taxPercent) : 0,
      gstTax: form.gstPercent ? Number(form.gstPercent) : 0,
      active: form.isActive,
    } as Partial<CountryTax>;
    if (mode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    {
      key: "country",
      label: "Country",
      sortable: true,
      render: (_val, row) => {
        const r = row as any;
        const name = r.country || r.countryName || r.countryCode;
        return (
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--text-muted)]" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">{name || "--"}</p>
              {r.countryCode && (
                <p className="text-xs text-[var(--text-muted)]">{r.countryCode}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (_val, row) => {
        const r = row as any;
        const name = r.category?.name ?? r.categoryName;
        return name ? (
          <span className="text-sm text-[var(--text-primary)]">{name}</span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">All categories</span>
        );
      },
    },
    {
      key: "generalTax",
      label: "Tax",
      render: (_val, row) => {
        const r = row as any;
        const val = r.generalTax ?? r.taxPercent ?? r.taxRate ?? 0;
        return <Badge variant="info">{val}%</Badge>;
      },
    },
    {
      key: "gstTax",
      label: "GST",
      render: (_val, row) => {
        const r = row as any;
        const val = r.gstTax ?? r.gstPercent ?? 0;
        return val ? <Badge variant="warning">{val}%</Badge> : <span className="text-xs text-[var(--text-muted)]">--</span>;
      },
    },
    {
      key: "active",
      label: "Status",
      render: (_val, row) => {
        const r = row as any;
        const active = r.active ?? r.isActive ?? true;
        return <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const r = row as unknown as CountryTax;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(r)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Country Taxes" description="Configure GST and category-wise tax rules per country">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Tax Rule
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tax</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Applies to the selected category and cascades to all its subcategories and products.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">GST</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Charged when a customer provides a GST number and requests a GST invoice.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search by country or category..."
          className="max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage={search ? "No tax rules match your search" : "No tax rules yet"}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Tax Rule" : "Add Tax Rule"}
        size="lg"
      >
        <div className="space-y-4">
          <SearchableSelect
            label="Country"
            placeholder="Select country"
            options={countryOptions}
            value={form.countryCode}
            onChange={(v) => setForm({ ...form, countryCode: v as string })}
            loading={loadingCountries}
            clearable
          />
          <SearchableSelect
            label="Category"
            placeholder="Select category (applies to its subcategories + products)"
            options={categoryOptions}
            value={form.categoryId}
            onChange={(v) => setForm({ ...form, categoryId: v as string })}
            loading={loadingCats}
            clearable
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tax %"
              type="number"
              value={form.taxPercent}
              onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
              placeholder="e.g. 18"
              helperText="Applied to products in this category"
            />
            <Input
              label="GST %"
              type="number"
              value={form.gstPercent}
              onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
              placeholder="e.g. 18"
              helperText="For GST-invoice buyers only"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
              <p className="text-xs text-[var(--text-muted)]">Enable this tax rule</p>
            </div>
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.countryCode || !form.categoryId}
              loading={submitting}
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Tax Rule" size="lg">
        {selected && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Country
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                {(selected as any).country || (selected as any).countryName || (selected as any).countryCode}
              </p>
              {((selected as any).category?.name || (selected as any).categoryName) && (
                <>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Category
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {(selected as any).category?.name ?? (selected as any).categoryName}
                  </p>
                </>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tax %">
                <Badge variant="info">{(selected as any).generalTax ?? (selected as any).taxPercent ?? 0}%</Badge>
              </Field>
              <Field label="GST %">
                <Badge variant="warning">{(selected as any).gstTax ?? (selected as any).gstPercent ?? 0}%</Badge>
              </Field>
              <Field label="Status">
                <Badge variant={(selected as any).active ?? (selected as any).isActive ? "success" : "default"}>
                  {(selected as any).active ?? (selected as any).isActive ? "Active" : "Inactive"}
                </Badge>
              </Field>
              <Field label="Created">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "--"}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>
                Edit
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
        title="Delete Tax Rule"
        message="Are you sure you want to delete this tax rule? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <div className="mt-0.5 text-sm text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
