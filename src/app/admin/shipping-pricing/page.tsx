"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchInput } from "@/components/ui/SearchInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  useShippingPricing,
  useCreateShippingPrice,
  useUpdateShippingPrice,
  useDeleteShippingPrice,
} from "@/services/admin/shipping";
import { useLocationStates } from "@/services/admin/location";
import type { ShippingPrice, ShippingMode } from "@/types/shipping";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  Plane,
  Truck,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type ShippingForm = {
  name: string;
  code: string;
  country: string;
  currency: string;
  currencySymbol: string;
  price: string;
  type: ShippingMode;
  description: string;
  active: boolean;
};

const emptyForm: ShippingForm = {
  name: "",
  code: "",
  country: "",
  currency: "INR",
  currencySymbol: "₹",
  price: "",
  type: "ROAD",
  description: "",
  active: true,
};

export default function ShippingPricingPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<ShippingPrice | null>(null);
  const [viewing, setViewing] = useState<ShippingPrice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, error } = useShippingPricing();
  const { data: locations } = useLocationStates();
  const createMutation = useCreateShippingPrice();
  const updateMutation = useUpdateShippingPrice();
  const deleteMutation = useDeleteShippingPrice();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q),
    );
  }, [data, search]);

  // Dedupe countries from the Location master so the dropdown only offers
  // countries the admin has actually stood up.
  const countryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of locations ?? []) {
      if (l.countryName) names.add(l.countryName);
    }
    return Array.from(names).map((name) => ({ value: name, label: name }));
  }, [locations]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };

  const openEdit = (item: ShippingPrice) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      country: item.country,
      currency: item.currency,
      currencySymbol: item.currencySymbol,
      price: String(item.price),
      type: (item.type === "AIR" ? "AIR" : "ROAD") as ShippingMode,
      description: item.description ?? "",
      active: item.active,
    });
    setDialogMode("edit");
  };

  const openView = (item: ShippingPrice) => {
    setViewing(item);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setViewing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const payload: Partial<ShippingPrice> = {
      name: form.name.trim(),
      code: form.code.trim(),
      country: form.country,
      currency: form.currency.toUpperCase(),
      currencySymbol: form.currencySymbol,
      price: Number(form.price) || 0,
      type: form.type,
      description: form.description.trim() || undefined,
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: ShippingPrice, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    !!form.name.trim() &&
    !!form.code.trim() &&
    !!form.country &&
    Number(form.price) > 0;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    { key: "name", label: "Name", sortable: true },
    { key: "code", label: "Code" },
    { key: "country", label: "Country", sortable: true },
    {
      key: "type",
      label: "Mode",
      render: (val) => {
        const t = (val as string) ?? "ROAD";
        return (
          <Badge variant={t === "AIR" ? "info" : "default"}>
            {t === "AIR" ? (
              <span className="inline-flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Air
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Road
              </span>
            )}
          </Badge>
        );
      },
    },
    {
      key: "price",
      label: "Price (INR)",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-[var(--text-primary)]">
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as ShippingPrice;
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
        const item = row as unknown as ShippingPrice;
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
        title="Shipping Pricing"
        description="Per-country shipping rates split by mode (Air / Road). Prices are in INR \u2014 converted at checkout via country pricing."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Shipping Rate
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search name, code or country..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} rate{rows.length === 1 ? "" : "s"}
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
              search ? "No rates match your search" : "No shipping rates yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={
          dialogMode === "edit" ? "Edit Shipping Rate" : "Add Shipping Rate"
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Mode
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <ModeCard
                selected={form.type === "AIR"}
                onClick={() => setForm({ ...form, type: "AIR" })}
                icon={<Plane className="h-4 w-4" />}
                title="Air"
                subtitle="Fast \u00b7 usually higher cost"
              />
              <ModeCard
                selected={form.type === "ROAD"}
                onClick={() => setForm({ ...form, type: "ROAD" })}
                icon={<Truck className="h-4 w-4" />}
                title="Road"
                subtitle="Standard \u00b7 everyday delivery"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard Road - India"
            />
            <Input
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. IN-ROAD-STD"
            />
          </div>

          <SearchableSelect
            label="Country"
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            options={countryOptions}
            value={form.country}
            onChange={(v) =>
              setForm({ ...form, country: v === "" ? "" : (v as string) })
            }
            emptyMessage="Add a country in Locations first"
            clearable
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Price (INR)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 150"
            />
            <Input
              label="Currency"
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value.toUpperCase() })
              }
              placeholder="INR"
            />
            <Input
              label="Symbol"
              value={form.currencySymbol}
              onChange={(e) =>
                setForm({ ...form, currencySymbol: e.target.value })
              }
              placeholder="₹"
            />
          </div>

          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Notes for admins"
            rows={2}
          />

          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm({ ...form, active: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--border-primary)] accent-[var(--accent-primary)]"
            />
            Active
          </label>

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
        title="Shipping Rate Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary-light,rgba(99,102,241,0.15))] text-[var(--accent-primary)]">
                  {viewing.type === "AIR" ? (
                    <Plane className="h-5 w-5" />
                  ) : (
                    <Truck className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {viewing.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={viewing.active ? "success" : "danger"}>
                      {viewing.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={viewing.type === "AIR" ? "info" : "default"}>
                      {viewing.type}
                    </Badge>
                    <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                      {viewing.code}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--accent-primary)]">
                    ₹{Number(viewing.price).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">INR base</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Country" value={viewing.country} />
              <Field label="Currency" value={`${viewing.currencySymbol} ${viewing.currency}`} />
            </div>

            {viewing.description && (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Description
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  {viewing.description}
                </p>
              </div>
            )}

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
        title="Delete Shipping Rate"
        message="Are you sure you want to delete this shipping rate? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        selected
          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.08))] shadow-sm"
          : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          selected
            ? "bg-[var(--accent-primary)] text-white"
            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-[var(--text-primary)]">
          {title}
        </span>
        <span className="block text-xs text-[var(--text-muted)]">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load shipping rates
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
