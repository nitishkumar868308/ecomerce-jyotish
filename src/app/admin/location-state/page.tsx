"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  useLocationStates,
  useCountries,
  useStatesByCountry,
  useCitiesByState,
  useCreateState,
  useUpdateState,
  useDeleteState,
  type LocationState,
} from "@/services/admin/location";
import { Plus, Trash2, Edit, Eye, AlertCircle, MapPin } from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

export default function LocationStatePage() {
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<LocationState | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 3-step picker state (used for create/edit).
  const [countryId, setCountryId] = useState<number | "">("");
  const [stateCountryId, setStateCountryId] = useState<number | "">("");
  const [cityCountryId, setCityCountryId] = useState<number | "">("");
  const [active, setActive] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: states, isLoading, error } = useLocationStates();
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: countryStates, isLoading: countryStatesLoading } =
    useStatesByCountry(typeof countryId === "number" ? countryId : undefined);
  const { data: cityList, isLoading: citiesLoading } = useCitiesByState(
    typeof stateCountryId === "number" ? stateCountryId : undefined,
  );

  const createMutation = useCreateState();
  const updateMutation = useUpdateState();
  const deleteMutation = useDeleteState();

  const rows = useMemo(() => {
    const list = states ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.city ?? "").toLowerCase().includes(q) ||
        (s.countryName ?? "").toLowerCase().includes(q),
    );
  }, [states, search]);

  const countryOptions = useMemo(
    () => (countries ?? []).map((c) => ({ value: c.id, label: c.name })),
    [countries],
  );

  const stateOptions = useMemo(
    () => (countryStates ?? []).map((s) => ({ value: s.id, label: s.name })),
    [countryStates],
  );

  const cityOptions = useMemo(
    () => (cityList ?? []).map((c) => ({ value: c.id, label: c.name })),
    [cityList],
  );

  const selectedCountry = useMemo(
    () => (countries ?? []).find((c) => c.id === countryId),
    [countries, countryId],
  );
  const selectedState = useMemo(
    () => (countryStates ?? []).find((s) => s.id === stateCountryId),
    [countryStates, stateCountryId],
  );
  const selectedCity = useMemo(
    () => (cityList ?? []).find((c) => c.id === cityCountryId),
    [cityList, cityCountryId],
  );

  const resetForm = () => {
    setCountryId("");
    setStateCountryId("");
    setCityCountryId("");
    setActive(true);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogMode("create");
  };

  const openEdit = (item: LocationState) => {
    setEditing(item);
    setCountryId(item.countryId ?? "");
    setStateCountryId(item.stateRefId ?? "");
    setCityCountryId(item.cityRefId ?? "");
    setActive(item.active);
    setDialogMode("edit");
  };

  const openView = (item: LocationState) => {
    setEditing(item);
    setDialogMode("view");
  };

  const closeDialog = () => {
    setDialogMode(null);
    resetForm();
  };

  const canSubmit = !!selectedState && !!selectedCity;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payload = {
      countryId: selectedCountry?.id,
      countryName: selectedCountry?.name,
      stateRefId: selectedState!.id,
      name: selectedState!.name,
      cityRefId: selectedCity!.id,
      city: selectedCity!.name,
      active,
    };

    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const toggleActive = async (item: LocationState, next: boolean) => {
    setTogglingId(item.id);
    try {
      await updateMutation.mutateAsync({ id: item.id, active: next });
    } finally {
      setTogglingId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_val, _row, index) => (
        <span className="font-medium text-[var(--text-secondary)]">
          {index + 1}
        </span>
      ),
    },
    {
      key: "countryName",
      label: "Country",
      render: (val) =>
        val ? (
          (val as string)
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        ),
    },
    { key: "name", label: "State", sortable: true },
    {
      key: "city",
      label: "City",
      render: (val) =>
        val ? (
          (val as string)
        ) : (
          <span className="text-[var(--text-muted)]">--</span>
        ),
    },
    {
      key: "active",
      label: "Active",
      render: (val, row) => {
        const item = row as unknown as LocationState;
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
      key: "createdAt",
      label: "Created",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "--",
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const item = row as unknown as LocationState;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(item)}
              aria-label="View location"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              aria-label="Edit location"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
              aria-label="Delete location"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  const viewing = dialogMode === "view" ? editing : null;

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Country · State · City master for banners, categories and subcategories"
      >
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Location
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search country, state or city..."
          className="max-w-sm"
        />
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <Table
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
          loading={isLoading}
          emptyMessage={
            search
              ? "Nothing matches your search"
              : "No locations yet. Pick one to get started."
          }
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={dialogMode === "create" || dialogMode === "edit"}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Location" : "Add Location"}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
            <span>
              Pick a country, then its state, then a city — all three are
              required. Same state across different cities become separate
              entries.
            </span>
          </div>

          <SearchableSelect
            label="Country"
            placeholder={
              countriesLoading ? "Loading countries..." : "Select country"
            }
            searchPlaceholder="Search countries..."
            options={countryOptions}
            value={countryId}
            onChange={(v) => {
              setCountryId(v === "" ? "" : (v as number));
              setStateCountryId("");
              setCityCountryId("");
            }}
            loading={countriesLoading}
            emptyMessage="No countries configured"
            clearable
          />

          <SearchableSelect
            label="State"
            placeholder={
              !countryId
                ? "Pick a country first"
                : countryStatesLoading
                  ? "Loading states..."
                  : (countryStates ?? []).length === 0
                    ? "No states found for this country"
                    : "Select state"
            }
            searchPlaceholder="Search states..."
            options={stateOptions}
            value={stateCountryId}
            onChange={(v) => {
              setStateCountryId(v === "" ? "" : (v as number));
              setCityCountryId("");
            }}
            disabled={!countryId || countryStatesLoading}
            loading={countryStatesLoading}
            emptyMessage="No states found for this country"
            clearable
          />

          <SearchableSelect
            label="City"
            placeholder={
              !stateCountryId
                ? "Pick a state first"
                : citiesLoading
                  ? "Loading cities..."
                  : (cityList ?? []).length === 0
                    ? "No cities found for this state"
                    : "Select city"
            }
            searchPlaceholder="Search cities..."
            options={cityOptions}
            value={cityCountryId}
            onChange={(v) => setCityCountryId(v === "" ? "" : (v as number))}
            disabled={!stateCountryId || citiesLoading}
            loading={citiesLoading}
            emptyMessage="No cities found for this state"
            clearable
          />

          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
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
              {dialogMode === "edit" ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal
        isOpen={dialogMode === "view"}
        onClose={closeDialog}
        title="Location Details"
      >
        {viewing && (
          <div className="space-y-3">
            <Field label="Country" value={viewing.countryName} />
            <Field label="State" value={viewing.name} />
            <Field label="City" value={viewing.city} />
            <Field
              label="Status"
              value={
                <Badge variant={viewing.active ? "success" : "danger"}>
                  {viewing.active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <Field
              label="Created"
              value={new Date(viewing.createdAt).toLocaleString()}
            />
            <div className="flex justify-end pt-2">
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
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
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
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <span className="col-span-2 text-sm text-[var(--text-primary)]">
        {value || <span className="text-[var(--text-muted)]">--</span>}
      </span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Failed to load locations
      </p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
