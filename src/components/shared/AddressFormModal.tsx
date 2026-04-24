"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { Upload, X, User as UserIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { useUpload } from "@/services/admin/upload";
import {
  useCountries,
  useStatesByCountry,
  useCitiesByState,
} from "@/services/admin/location";
import type { AddressType } from "@/types/user";

// One form, two modes:
//   - "billing":  profile photo + name + email + gender + address (no type).
//   - "shipping": no profile photo, adds address type + default toggle.
//
// Country / State / City come from the Country, StateCountry and CityCountry
// tables — the same master data the admin maintains. Phone validation is
// driven by libphonenumber-js using the selected country's ISO code, so it
// adapts per country instead of a static 10-digit rule.

export type AddressMode = "billing" | "shipping";

export interface AddressFormValue {
  name: string;
  email: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "";
  profileImage?: string;
  countryId: number | null;
  countryName: string;
  countryIso2: string;
  countryPhoneCode: string;
  stateId: number | null;
  stateName: string;
  cityId: number | null;
  cityName: string;
  postalCode: string;
  phone: string;
  addressLine1: string;
  addressType?: AddressType;
  addressLabel?: string;
  isDefault?: boolean;
}

const EMPTY: AddressFormValue = {
  name: "",
  email: "",
  gender: "",
  profileImage: "",
  countryId: null,
  countryName: "",
  countryIso2: "",
  countryPhoneCode: "",
  stateId: null,
  stateName: "",
  cityId: null,
  cityName: "",
  postalCode: "",
  phone: "",
  addressLine1: "",
  addressType: "HOME",
  addressLabel: "",
  isDefault: false,
};

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AddressMode;
  title?: string;
  initial?: Partial<AddressFormValue>;
  saving?: boolean;
  onSubmit: (value: AddressFormValue) => Promise<void> | void;
  /** Optional: shown below the default toggle in shipping mode. */
  defaultToggleLabel?: string;
}

/**
 * Page-embeddable version of the address form — same field set as the modal
 * but no dialog chrome. The profile dashboard renders this inline so the
 * account settings look and behave like the checkout billing form.
 */
export interface AddressFormBodyProps {
  mode: AddressMode;
  initial?: Partial<AddressFormValue>;
  saving?: boolean;
  onSubmit: (value: AddressFormValue) => Promise<void> | void;
  onCancel?: () => void;
  defaultToggleLabel?: string;
  /** Submit-button copy. Defaults to "Save address". */
  submitLabel?: string;
  /** When true, cancel button is hidden (useful for a standalone page). */
  hideCancel?: boolean;
  /** Re-seed the form whenever this changes (e.g. when `initial` updates). */
  resetKey?: string | number;
}

export function AddressFormBody({
  mode,
  initial,
  saving = false,
  onSubmit,
  onCancel,
  defaultToggleLabel = "Always use this address for future orders",
  submitLabel = "Save address",
  hideCancel = false,
  resetKey,
}: AddressFormBodyProps) {
  const [form, setForm] = useState<AddressFormValue>({ ...EMPTY, ...initial });
  const uploadMut = useUpload();

  // Re-seed whenever the caller hands us fresh `initial` data (the modal
  // case: on open; the inline case: whenever the server user refreshes).
  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const { data: countries, isLoading: loadingCountries } = useCountries();
  const { data: states, isLoading: loadingStates } = useStatesByCountry(
    form.countryId ?? undefined,
  );
  const { data: cities, isLoading: loadingCities } = useCitiesByState(
    form.stateId ?? undefined,
  );

  // Prefill is fed by name (the API returns `country`, `state`, `city` as
  // strings). Once the location master loads, resolve those names to IDs
  // so the dropdowns show the saved value selected. The cascade fires
  // country → state → city naturally because each resolution triggers the
  // downstream query.
  useEffect(() => {
    if (form.countryId || !countries?.length) return;
    const byName = form.countryName?.trim().toLowerCase();
    const byIso = form.countryIso2?.trim().toUpperCase();
    const match = countries.find((c) => {
      const nameMatch =
        byName && c.name.trim().toLowerCase() === byName;
      const isoMatch =
        byIso &&
        ((c.iso2 || c.code || "").toUpperCase() === byIso);
      return nameMatch || isoMatch;
    });
    if (match) {
      setForm((f) => ({
        ...f,
        countryId: match.id,
        countryName: match.name,
        countryIso2: (match.iso2 || match.code || "").toUpperCase(),
        countryPhoneCode:
          f.countryPhoneCode ||
          (match.phonecode
            ? `+${String(match.phonecode).replace(/^\+/, "")}`
            : ""),
      }));
    }
  }, [countries, form.countryId, form.countryName, form.countryIso2]);

  useEffect(() => {
    if (form.stateId || !states?.length) return;
    const byName = form.stateName?.trim().toLowerCase();
    if (!byName) return;
    const match = states.find(
      (s) => s.name.trim().toLowerCase() === byName,
    );
    if (match) {
      setForm((f) => ({ ...f, stateId: match.id, stateName: match.name }));
    }
  }, [states, form.stateId, form.stateName]);

  useEffect(() => {
    if (form.cityId || !cities?.length) return;
    const byName = form.cityName?.trim().toLowerCase();
    if (!byName) return;
    const match = cities.find(
      (c) => c.name.trim().toLowerCase() === byName,
    );
    if (match) {
      setForm((f) => ({ ...f, cityId: match.id, cityName: match.name }));
    }
  }, [cities, form.cityId, form.cityName]);

  const countryOptions = useMemo(
    () =>
      (countries ?? []).map((c) => ({
        value: c.id,
        label: `${c.emoji ?? ""} ${c.name}`.trim(),
        hint: c.phonecode ? `+${String(c.phonecode).replace(/^\+/, "")}` : undefined,
      })),
    [countries],
  );
  const stateOptions = useMemo(
    () => (states ?? []).map((s) => ({ value: s.id, label: s.name })),
    [states],
  );
  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: c.id, label: c.name })),
    [cities],
  );

  const handleCountry = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({
        ...f,
        countryId: null,
        countryName: "",
        countryIso2: "",
        countryPhoneCode: "",
        stateId: null,
        stateName: "",
        cityId: null,
        cityName: "",
      }));
      return;
    }
    const country = countries?.find((c) => c.id === Number(value));
    if (!country) return;
    setForm((f) => ({
      ...f,
      countryId: country.id,
      countryName: country.name,
      countryIso2: (country.iso2 || country.code || "").toUpperCase(),
      countryPhoneCode: country.phonecode
        ? `+${String(country.phonecode).replace(/^\+/, "")}`
        : "",
      // Reset downstream selections — different country means different
      // state/city lists.
      stateId: null,
      stateName: "",
      cityId: null,
      cityName: "",
    }));
  };

  const handleState = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({ ...f, stateId: null, stateName: "", cityId: null, cityName: "" }));
      return;
    }
    const state = states?.find((s) => s.id === Number(value));
    if (!state) return;
    setForm((f) => ({
      ...f,
      stateId: state.id,
      stateName: state.name,
      cityId: null,
      cityName: "",
    }));
  };

  const handleCity = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({ ...f, cityId: null, cityName: "" }));
      return;
    }
    const city = cities?.find((c) => c.id === Number(value));
    if (!city) return;
    setForm((f) => ({ ...f, cityId: city.id, cityName: city.name }));
  };

  const handlePhotoPick = async (file: File) => {
    try {
      const { url } = await uploadMut.mutateAsync({
        file,
        folder: "user-profile",
      });
      setForm((f) => ({ ...f, profileImage: url }));
    } catch {
      /* toast handled by useUpload */
    }
  };

  // Per-country phone validation via libphonenumber-js. Falls back to "any
  // 6+ digits" when we don't have an ISO code yet so the form isn't blocked
  // before country is picked.
  const phoneValidation = useMemo(() => {
    const raw = form.phone.trim();
    if (!raw) return { ok: false, message: "" };
    const iso = (form.countryIso2 || "").toUpperCase() as CountryCode;
    try {
      if (iso) {
        const parsed = parsePhoneNumberFromString(raw, iso);
        if (parsed && parsed.isValid()) return { ok: true, message: "" };
        if (isPossiblePhoneNumber(raw, iso)) {
          return isValidPhoneNumber(raw, iso)
            ? { ok: true, message: "" }
            : { ok: false, message: "Please enter a valid phone number." };
        }
        return {
          ok: false,
          message: `Enter a valid ${form.countryName || iso} phone number.`,
        };
      }
    } catch {
      // fall through
    }
    return /^\d{6,15}$/.test(raw.replace(/\D/g, ""))
      ? { ok: true, message: "" }
      : { ok: false, message: "Enter at least 6 digits." };
  }, [form.phone, form.countryIso2, form.countryName]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (!form.name.trim() || !form.email.trim()) return false;
    if (!form.countryId || !form.stateId || !form.cityId) return false;
    if (!form.addressLine1.trim()) return false;
    if (!phoneValidation.ok) return false;
    if (mode === "shipping") {
      if (form.addressType === "OTHER" && !form.addressLabel?.trim()) {
        return false;
      }
    }
    return true;
  }, [form, phoneValidation, saving, mode]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(form);
  };

  const resolvedPhoto = form.profileImage
    ? resolveAssetUrl(form.profileImage) || form.profileImage
    : "";

  return (
    <div className="space-y-5">
        {mode === "billing" && (
          <FieldRow label="Profile photo">
            <div className="flex items-center gap-3">
              {resolvedPhoto ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[var(--border-primary)]">
                  <Image
                    src={resolvedPhoto}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, profileImage: "" })}
                    className="absolute right-0 top-0 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  <UserIcon className="h-6 w-6" />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                <Upload className="h-4 w-4" />
                {uploadMut.isPending
                  ? "Uploading…"
                  : form.profileImage
                    ? "Replace"
                    : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadMut.isPending}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoPick(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </FieldRow>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Full name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="As it appears on ID"
            />
          </FieldRow>
          <FieldRow label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </FieldRow>
        </div>

        <FieldRow label="Country" required>
          <SearchableSelect
            placeholder={loadingCountries ? "Loading…" : "Select country"}
            searchPlaceholder="Search countries..."
            options={countryOptions}
            value={form.countryId ?? ""}
            onChange={handleCountry}
            loading={loadingCountries}
            emptyMessage="No countries found"
            clearable
          />
        </FieldRow>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="State" required>
            <SearchableSelect
              placeholder={
                !form.countryId
                  ? "Pick a country first"
                  : loadingStates
                    ? "Loading…"
                    : "Select state"
              }
              searchPlaceholder="Search states..."
              options={stateOptions}
              value={form.stateId ?? ""}
              onChange={handleState}
              disabled={!form.countryId}
              loading={loadingStates}
              emptyMessage="No states configured for this country"
              clearable
            />
          </FieldRow>
          <FieldRow label="City" required>
            <SearchableSelect
              placeholder={
                !form.stateId
                  ? "Pick a state first"
                  : loadingCities
                    ? "Loading…"
                    : "Select city"
              }
              searchPlaceholder="Search cities..."
              options={cityOptions}
              value={form.cityId ?? ""}
              onChange={handleCity}
              disabled={!form.stateId}
              loading={loadingCities}
              emptyMessage="No cities configured for this state"
              clearable
            />
          </FieldRow>
        </div>

        <FieldRow
          label="Postal / ZIP code"
          hint="Optional for countries where it doesn't apply."
        >
          <Input
            value={form.postalCode}
            onChange={(e) =>
              setForm({
                ...form,
                postalCode: e.target.value.replace(/[^0-9A-Za-z\s-]/g, ""),
              })
            }
            placeholder={form.countryIso2 === "IN" ? "e.g. 400001" : "Optional"}
          />
        </FieldRow>

        <FieldRow label="Phone" required hint={phoneValidation.message || undefined}>
          <div className="flex gap-2">
            <div className="flex min-w-[84px] items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 text-sm font-medium text-[var(--text-primary)]">
              {form.countryPhoneCode || "—"}
            </div>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, "") })
              }
              placeholder="Phone number"
              inputMode="numeric"
              error={
                form.phone && !phoneValidation.ok
                  ? phoneValidation.message
                  : undefined
              }
            />
          </div>
        </FieldRow>

        <FieldRow label="Street address" required>
          <Textarea
            rows={2}
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            placeholder="Flat, street, landmark…"
          />
        </FieldRow>

        {mode === "billing" && (
          <FieldRow label="Gender">
            <div className="grid grid-cols-3 gap-2">
              {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    form.gender === g
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                  )}
                >
                  {g[0] + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </FieldRow>
        )}

        {mode === "shipping" && (
          <>
            <FieldRow label="Address type" required>
              <div className="grid grid-cols-3 gap-2">
                {(["HOME", "OFFICE", "OTHER"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        addressType: t,
                        addressLabel: t === "OTHER" ? form.addressLabel : "",
                      })
                    }
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      form.addressType === t
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                    )}
                  >
                    {t[0] + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </FieldRow>
            {form.addressType === "OTHER" && (
              <FieldRow label="Label this address" required>
                <Input
                  value={form.addressLabel ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, addressLabel: e.target.value })
                  }
                  placeholder="e.g. Parents' place"
                />
              </FieldRow>
            )}

            <label className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="h-4 w-4 rounded accent-[var(--accent-primary)]"
              />
              <span className="text-[var(--text-primary)]">
                {defaultToggleLabel}
              </span>
            </label>
          </>
        )}

      <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
        {!hideCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={saving}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function AddressFormModal({
  isOpen,
  onClose,
  mode,
  title,
  initial,
  saving = false,
  onSubmit,
  defaultToggleLabel,
}: AddressFormModalProps) {
  // Keying the inner body by `isOpen` re-seeds the form state every time
  // the modal opens, so stale edits don't leak between sessions.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? (mode === "billing" ? "Billing address" : "Shipping address")}
      size="lg"
    >
      <AddressFormBody
        mode={mode}
        initial={initial}
        saving={saving}
        onSubmit={onSubmit}
        onCancel={onClose}
        defaultToggleLabel={defaultToggleLabel}
        resetKey={isOpen ? "open" : "closed"}
      />
    </Modal>
  );
}

function FieldRow({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && (
            <span className="ml-1 text-[var(--accent-primary)]">*</span>
          )}
        </span>
        {hint && (
          <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default AddressFormModal;
