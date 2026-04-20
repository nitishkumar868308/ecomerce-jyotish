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
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  type Offer,
  type OfferDiscountType,
} from "@/services/admin/offers";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  Percent,
  Gift,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type OfferForm = {
  name: string;
  description: string;
  active: boolean;
  discountType: OfferDiscountType;
  from: string;
  to: string;
  freeCount: string;
  minQty: string;
  percent: string;
};

const emptyForm: OfferForm = {
  name: "",
  description: "",
  active: true,
  discountType: "RANGE_FREE",
  from: "12",
  to: "19",
  freeCount: "2",
  minQty: "10",
  percent: "10",
};

function describeOffer(o: Offer): string {
  const v = o.discountValue as Record<string, number>;
  if (o.discountType === "RANGE_FREE") {
    return `Buy ${v.from ?? "?"}–${v.to ?? "?"} → ${v.freeCount ?? 0} free`;
  }
  if (o.discountType === "PERCENTAGE") {
    return `${v.percent ?? 0}% off when qty ≥ ${v.minQty ?? 0}`;
  }
  return String(o.discountType);
}

export default function OfferPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [viewing, setViewing] = useState<Offer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading, error } = useOffers();
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };

  const openEdit = (item: Offer) => {
    setEditing(item);
    const v = item.discountValue as Record<string, number>;
    const type = (
      item.discountType === "PERCENTAGE" ? "PERCENTAGE" : "RANGE_FREE"
    ) as OfferDiscountType;
    setForm({
      name: item.name,
      description: item.description ?? "",
      active: item.active,
      discountType: type,
      from: type === "RANGE_FREE" ? String(v.from ?? 12) : "12",
      to: type === "RANGE_FREE" ? String(v.to ?? 19) : "19",
      freeCount: type === "RANGE_FREE" ? String(v.freeCount ?? 2) : "2",
      minQty: type === "PERCENTAGE" ? String(v.minQty ?? 10) : "10",
      percent: type === "PERCENTAGE" ? String(v.percent ?? 10) : "10",
    });
    setDialogMode("edit");
  };

  const openView = (item: Offer) => {
    setViewing(item);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setViewing(null);
    setForm(emptyForm);
  };

  const buildDiscountValue = () => {
    if (form.discountType === "RANGE_FREE") {
      return {
        from: Number(form.from) || 0,
        to: Number(form.to) || 0,
        freeCount: Number(form.freeCount) || 0,
      };
    }
    return {
      minQty: Number(form.minQty) || 0,
      percent: Number(form.percent) || 0,
    };
  };

  const validationError = useMemo(() => {
    if (!form.name.trim()) return "Name is required";
    if (form.discountType === "RANGE_FREE") {
      const from = Number(form.from);
      const to = Number(form.to);
      const free = Number(form.freeCount);
      if (!from || !to || from < 1 || to < from)
        return "Range must have from ≥ 1 and to ≥ from";
      if (free < 1) return "Free count must be ≥ 1";
    } else {
      const minQty = Number(form.minQty);
      const pct = Number(form.percent);
      if (minQty < 1) return "Minimum quantity must be ≥ 1";
      if (pct <= 0 || pct > 100) return "Percent must be between 1 and 100";
    }
    return null;
  }, [form]);

  const handleSubmit = async () => {
    if (validationError) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      active: form.active,
      discountType: form.discountType,
      discountValue: buildDiscountValue(),
      type: { scope: "PRODUCT" },
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: Offer, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
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
    { key: "name", label: "Name", sortable: true },
    {
      key: "discountType",
      label: "Type",
      render: (val) => {
        const t = val as string;
        return (
          <Badge variant={t === "PERCENTAGE" ? "info" : "warning"}>
            {t === "PERCENTAGE" ? "% off" : "Buy X get free"}
          </Badge>
        );
      },
    },
    {
      key: "discountValue",
      label: "Rule",
      render: (_v, row) => {
        const o = row as unknown as Offer;
        return (
          <span className="text-xs text-[var(--text-secondary)]">
            {describeOffer(o)}
          </span>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as Offer;
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
        const item = row as unknown as Offer;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View offer"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit offer"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete offer"
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
        title="Offers"
        description="Promotional rules attached to products. One offer per product; bulk tiers take over above the range."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Offer
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search name or description..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} offer{rows.length === 1 ? "" : "s"}
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
              search ? "No offers match your search" : "No offers yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Offer" : "Add Offer"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Diwali Combo"
          />

          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short note for admins"
            rows={2}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Discount type
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <TypeCard
                selected={form.discountType === "RANGE_FREE"}
                onClick={() => setForm({ ...form, discountType: "RANGE_FREE" })}
                icon={<Gift className="h-4 w-4" />}
                title="Buy in range → free items"
                subtitle="Qty from–to, user gets N free"
              />
              <TypeCard
                selected={form.discountType === "PERCENTAGE"}
                onClick={() => setForm({ ...form, discountType: "PERCENTAGE" })}
                icon={<Percent className="h-4 w-4" />}
                title="Percentage off"
                subtitle="N% off when qty ≥ minimum"
              />
            </div>
          </div>

          {form.discountType === "RANGE_FREE" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="From qty"
                type="number"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                placeholder="12"
              />
              <Input
                label="To qty"
                type="number"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                placeholder="19"
              />
              <Input
                label="Free count"
                type="number"
                value={form.freeCount}
                onChange={(e) =>
                  setForm({ ...form, freeCount: e.target.value })
                }
                placeholder="2"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Min qty"
                type="number"
                value={form.minQty}
                onChange={(e) => setForm({ ...form, minQty: e.target.value })}
                placeholder="10"
              />
              <Input
                label="Percent off"
                type="number"
                value={form.percent}
                onChange={(e) => setForm({ ...form, percent: e.target.value })}
                placeholder="10"
              />
            </div>
          )}

          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-primary)]">Preview:</strong>{" "}
            {form.discountType === "RANGE_FREE"
              ? `Buy ${form.from || "?"}\u2013${form.to || "?"} \u2192 ${form.freeCount || 0} free items`
              : `${form.percent || 0}% off when qty \u2265 ${form.minQty || 0}`}
          </div>

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

          {validationError && (
            <div className="text-xs text-[var(--accent-danger)]">
              {validationError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !!validationError}
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
        title="Offer Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {viewing.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {describeOffer(viewing)}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={viewing.active ? "success" : "danger"}>
                  {viewing.active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={
                    viewing.discountType === "PERCENTAGE" ? "info" : "warning"
                  }
                >
                  {viewing.discountType}
                </Badge>
              </div>
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
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function TypeCard({
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
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load offers
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
