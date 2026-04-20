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
  useCountryPricing,
  useCreateCountryPrice,
  useUpdateCountryPrice,
  useDeleteCountryPrice,
} from "@/services/admin/shipping";
import {
  useCountries,
  useLocationStates,
  type Country,
} from "@/services/admin/location";
import type { CountryPrice } from "@/types/shipping";
import { resolveProductPrice } from "@/lib/productPricing";
import { Plus, Edit, Eye, Trash2, AlertCircle, Globe } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

type PricingForm = {
  country: string;
  code: string;
  currency: string;
  currencySymbol: string;
  conversionRate: string;
  multiplier: string;
  active: boolean;
};

const emptyForm: PricingForm = {
  country: "",
  code: "",
  currency: "",
  currencySymbol: "",
  conversionRate: "1",
  multiplier: "1",
  active: true,
};

// Reference amount used for the live "what will an Indian ₹100 product cost?"
// preview — helps admins sanity-check conversionRate × multiplier visually.
const SAMPLE_INR = 100;

export default function CountryPricingPage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<CountryPrice | null>(null);
  const [viewing, setViewing] = useState<CountryPrice | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<PricingForm>(emptyForm);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading, error } = useCountryPricing();
  const { data: locations } = useLocationStates();
  const { data: countries } = useCountries();
  const createMutation = useCreateCountryPrice();
  const updateMutation = useUpdateCountryPrice();
  const deleteMutation = useDeleteCountryPrice();

  // Country dropdown is sourced from the State master so admins only see
  // countries they've already set up. For each name we look up the full
  // Country row to auto-fill code / currency / symbol on pick.
  const countryByName = useMemo(() => {
    const map = new Map<string, Country>();
    for (const c of countries ?? []) {
      map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [countries]);

  const locationCountryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; hint?: string }> = [];
    for (const l of locations ?? []) {
      if (!l.countryName) continue;
      if (seen.has(l.countryName)) continue;
      seen.add(l.countryName);
      const c = countryByName.get(l.countryName.toLowerCase());
      options.push({
        value: l.countryName,
        label: l.countryName,
        hint: c?.iso3 ?? c?.iso2 ?? undefined,
      });
    }
    return options;
  }, [locations, countryByName]);

  const handleCountryPick = (name: string) => {
    if (!name) {
      setForm((f) => ({
        ...f,
        country: "",
        code: "",
        currency: "",
        currencySymbol: "",
      }));
      return;
    }
    const c = countryByName.get(name.toLowerCase());
    setForm((f) => ({
      ...f,
      country: name,
      // Fall back to a sane default (first 3 letters) if the Country master
      // didn't return a row — admin can still edit the field.
      code: (c?.iso3 ?? c?.iso2 ?? name.slice(0, 3)).toUpperCase(),
      currency: (c?.currency ?? "").toUpperCase(),
      currencySymbol: c?.currency_symbol ?? "",
    }));
  };

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setDialogMode("create");
  };

  const openEdit = (item: CountryPrice) => {
    setEditing(item);
    setForm({
      country: item.country,
      code: item.code,
      currency: item.currency,
      currencySymbol: item.currencySymbol,
      conversionRate: String(item.conversionRate ?? 1),
      multiplier: String(item.multiplier ?? 1),
      active: item.active,
    });
    setDialogMode("edit");
  };

  const openView = (item: CountryPrice) => {
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
    const payload: Partial<CountryPrice> = {
      country: form.country.trim(),
      code: form.code.trim().toUpperCase(),
      currency: form.currency.trim().toUpperCase(),
      currencySymbol: form.currencySymbol.trim(),
      conversionRate: Number(form.conversionRate) || 1,
      multiplier: Number(form.multiplier) || 1,
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const toggleActive = async (item: CountryPrice, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    form.country.trim() &&
    form.code.trim() &&
    form.currency.trim() &&
    form.currencySymbol.trim() &&
    Number(form.conversionRate) > 0 &&
    Number(form.multiplier) > 0;

  // Live preview of the pricing rule for a ₹100 INR product.
  const previewForm = useMemo(
    () =>
      resolveProductPrice(SAMPLE_INR, {
        id: 0,
        country: form.country,
        code: form.code,
        currency: form.currency || "INR",
        currencySymbol: form.currencySymbol || "₹",
        conversionRate: Number(form.conversionRate) || 1,
        multiplier: Number(form.multiplier) || 1,
        active: form.active,
      }),
    [form],
  );

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, i) => (
        <span className="font-medium text-[var(--text-secondary)]">{i + 1}</span>
      ),
    },
    { key: "country", label: "Country", sortable: true },
    {
      key: "code",
      label: "Code",
      render: (val) => (
        <span className="font-mono text-xs">{val as string}</span>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      render: (val, row) => {
        const item = row as unknown as CountryPrice;
        return (
          <span className="text-sm">
            <span className="font-semibold text-[var(--text-primary)]">
              {item.currencySymbol}
            </span>{" "}
            <span className="text-[var(--text-muted)]">{val as string}</span>
          </span>
        );
      },
    },
    {
      key: "conversionRate",
      label: "Rate × Mul",
      render: (_v, row) => {
        const item = row as unknown as CountryPrice;
        const rate = item.conversionRate ?? 1;
        return (
          <span className="text-xs text-[var(--text-secondary)]">
            {rate.toFixed(4)} × {item.multiplier}
          </span>
        );
      },
    },
    {
      key: "__preview",
      label: `₹${SAMPLE_INR} →`,
      render: (_v, row) => {
        const item = row as unknown as CountryPrice;
        const r = resolveProductPrice(SAMPLE_INR, item);
        return (
          <span className="text-sm font-semibold text-[var(--accent-primary)]">
            {r.symbol}
            {r.formatted}
          </span>
        );
      },
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as CountryPrice;
        return (
          <Switch
            checked={!!val}
            onChange={(next) => toggleActive(item, next)}
            loading={togglingId === item.id}
            label={`Toggle ${item.country}`}
          />
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const item = row as unknown as CountryPrice;
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
        title="Country Pricing"
        description="Per-country currency conversion + markup. Storefront applies: INR × conversionRate × multiplier."
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Country
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search country, code or currency..."
          className="w-full sm:max-w-sm"
        />
        <span className="text-xs text-[var(--text-muted)]">
          {rows.length} countr{rows.length === 1 ? "y" : "ies"}
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
              search ? "No countries match your search" : "No countries yet."
            }
          />
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={
          dialogMode === "edit" ? "Edit Country Pricing" : "Add Country Pricing"
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Country comes from the Location master — picking one auto-fills
              code, currency, and symbol from the global Country table.
              All fields remain editable so admins can override. */}
          <SearchableSelect
            label="Country"
            placeholder="Select country from Locations master"
            searchPlaceholder="Search countries..."
            options={locationCountryOptions}
            value={form.country}
            onChange={(v) =>
              handleCountryPick(v === "" ? "" : (v as string))
            }
            emptyMessage="Add a country in Locations first"
            clearable
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Code"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. USA"
            />
            <Input
              label="Currency"
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value.toUpperCase() })
              }
              placeholder="e.g. USD"
            />
            <Input
              label="Currency symbol"
              value={form.currencySymbol}
              onChange={(e) =>
                setForm({ ...form, currencySymbol: e.target.value })
              }
              placeholder="e.g. $"
            />
          </div>

          {form.country && (
            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
              Auto-filled from Country master:{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {form.country}
              </span>{" "}
              · {form.code || "--"} · {form.currencySymbol || "₹"}{" "}
              {form.currency || "INR"}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Conversion rate (INR → target)"
              type="number"
              step="0.0001"
              value={form.conversionRate}
              onChange={(e) =>
                setForm({ ...form, conversionRate: e.target.value })
              }
              placeholder="e.g. 0.012 for INR→USD"
            />
            <Input
              label="Multiplier (markup)"
              type="number"
              step="0.01"
              value={form.multiplier}
              onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
              placeholder="e.g. 2 to double"
            />
          </div>

          {/* Live preview so admin can sanity-check the math. */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-3 text-xs">
            <p className="mb-1 font-semibold text-[var(--text-primary)]">
              Price preview
            </p>
            <p className="text-[var(--text-muted)]">
              A ₹{SAMPLE_INR} product would show as{" "}
              <span className="font-bold text-[var(--accent-primary)]">
                {previewForm.symbol}
                {previewForm.formatted}
              </span>{" "}
              — math: ₹{SAMPLE_INR} × {form.conversionRate || "1"} ×{" "}
              {form.multiplier || "1"}.
            </p>
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
        title="Country Pricing Details"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary-light,rgba(99,102,241,0.15))] text-[var(--accent-primary)]">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {viewing.country}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={viewing.active ? "success" : "danger"}>
                    {viewing.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                    {viewing.code}
                  </span>
                  <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {viewing.currencySymbol} {viewing.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Conversion rate"
                value={(viewing.conversionRate ?? 1).toFixed(4)}
              />
              <Field label="Multiplier" value={viewing.multiplier} />
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Sample conversion
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                ₹{SAMPLE_INR} →{" "}
                <span className="font-semibold text-[var(--accent-primary)]">
                  {resolveProductPrice(SAMPLE_INR, viewing).symbol}
                  {resolveProductPrice(SAMPLE_INR, viewing).formatted}
                </span>
              </p>
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
        title="Delete Country Pricing"
        message="Are you sure you want to delete this country pricing? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
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
        Failed to load country pricing
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
