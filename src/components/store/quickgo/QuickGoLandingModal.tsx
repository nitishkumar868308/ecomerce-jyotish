"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Zap, X, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useWarehousePublicCities } from "@/services/admin/warehouse";
import { useQuickGoStore } from "@/stores/useQuickGoStore";

// Landing modal for QuickGo. Asks the shopper to pick a city first (sourced
// from warehouses with an assigned pincode) then a pincode from that city's
// available options. Persists to localStorage via useQuickGoStore so the
// storefront filter hooks can scope banners/categories/etc.
//
// The modal is store-driven: either auto-opens when no location is saved
// (onboarding), or opens on demand when the topbar city picker calls
// `openModal(preselectCity)` on the store.
export function QuickGoLandingModal() {
  const {
    city,
    pincode,
    hasHydrated,
    modalOpen,
    preselectCity,
    setLocation,
    clear,
    openModal,
    closeModal,
  } = useQuickGoStore();
  const { data: cities, isLoading, error } = useWarehousePublicCities();

  const [mounted, setMounted] = useState(false);
  const [draftCity, setDraftCity] = useState<string>("");
  const [draftPincode, setDraftPincode] = useState<string>("");

  useEffect(() => setMounted(true), []);

  // Show automatically once rehydration completes if nothing is saved yet.
  const needsOnboarding = hasHydrated && (!city || !pincode);
  const open = modalOpen || needsOnboarding;

  const cityOptions = useMemo(
    () =>
      (cities ?? []).map((c) => ({
        value: `${c.city}__${c.state}`,
        label: c.city,
        hint: c.state,
      })),
    [cities],
  );

  const selectedCityBucket = useMemo(
    () =>
      (cities ?? []).find((c) => `${c.city}__${c.state}` === draftCity),
    [cities, draftCity],
  );

  const pincodeOptions = useMemo(
    () =>
      (selectedCityBucket?.pincodes ?? []).map((p) => ({
        value: p,
        label: p,
      })),
    [selectedCityBucket],
  );

  // Prime the draft fields whenever the modal opens. Priority order:
  //  1. `preselectCity` (topbar picked a city → seed that, blank pincode)
  //  2. Current store values (re-opening for change)
  useEffect(() => {
    if (!open || !cities) return;

    if (preselectCity) {
      const match = cities.find(
        (c) => c.city.toLowerCase() === preselectCity.toLowerCase(),
      );
      if (match) {
        setDraftCity(`${match.city}__${match.state}`);
        // Keep the existing pincode if it's still valid for this city,
        // otherwise the user must pick a new one.
        if (pincode && match.pincodes.includes(pincode)) {
          setDraftPincode(pincode);
        } else {
          setDraftPincode("");
        }
        return;
      }
    }

    if (city && pincode) {
      const match = cities.find((c) => c.city === city);
      if (match) setDraftCity(`${match.city}__${match.state}`);
      setDraftPincode(pincode);
    }
  }, [open, preselectCity, city, pincode, cities]);

  const handleConfirm = () => {
    if (!selectedCityBucket || !draftPincode) return;
    setLocation({
      city: selectedCityBucket.city,
      cityRefId: selectedCityBucket.cityRefId ?? null,
      state: selectedCityBucket.state,
      pincode: draftPincode,
    });
    setDraftCity("");
    setDraftPincode("");
  };

  const handleClose = () => {
    closeModal();
    setDraftCity("");
    setDraftPincode("");
  };

  const handleChangeLocation = () => openModal();

  if (!mounted) return null;

  // Compact pill the user can click to re-open / change location later.
  const pill = city && pincode && !open && (
    <button
      type="button"
      onClick={handleChangeLocation}
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] shadow-lg transition-all hover:border-[var(--accent-primary)] sm:left-4 sm:translate-x-0"
    >
      <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
      <span className="max-w-[180px] truncate">
        {city} · {pincode}
      </span>
      <span className="text-[var(--text-muted)]">Change</span>
    </button>
  );

  if (!open) return <>{pill}</>;

  const canConfirm = !!draftCity && !!draftPincode;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick your location"
      className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={needsOnboarding ? undefined : handleClose}
      />

      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-t-2xl bg-[var(--bg-card)] shadow-2xl",
          "sm:max-w-md sm:rounded-2xl",
          "animate-in slide-in-from-bottom-4 duration-200",
        )}
      >
        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 sm:px-6">
          {!needsOnboarding && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-teal-500 text-white shadow-lg shadow-[var(--accent-primary)]/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Welcome to Hecate QuickGo
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Pick your location to see what&apos;s available near you.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-primary)]" />

        {/* Body */}
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {error ? (
            <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-red-50 px-3 py-2 text-xs text-[var(--accent-danger)] dark:bg-red-950/20">
              Couldn&apos;t load cities. Check your connection and try again.
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading cities...
            </div>
          ) : (cities ?? []).length === 0 ? (
            <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
              QuickGo isn&apos;t live in any city yet. Please check back soon.
            </div>
          ) : (
            <>
              <SearchableSelect
                label="City"
                placeholder="Select your city"
                searchPlaceholder="Search cities..."
                options={cityOptions}
                value={draftCity}
                onChange={(v) => {
                  setDraftCity(v === "" ? "" : (v as string));
                  setDraftPincode("");
                }}
                emptyMessage="No cities available"
              />

              <SearchableSelect
                label="Pincode"
                placeholder={
                  !draftCity
                    ? "Pick a city first"
                    : pincodeOptions.length === 0
                      ? "No pincodes for this city"
                      : pincodeOptions.length > 1
                        ? `Select from ${pincodeOptions.length.toLocaleString()} pincodes`
                        : "Select pincode"
                }
                searchPlaceholder="Search pincodes..."
                options={pincodeOptions}
                value={draftPincode}
                onChange={(v) =>
                  setDraftPincode(v === "" ? "" : (v as string))
                }
                disabled={!draftCity}
                emptyMessage="No pincodes for this city"
              />

              {draftCity && pincodeOptions.length === 0 && (
                <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                  This city isn&apos;t serviced yet — please pick a different one.
                </p>
              )}
            </>
          )}

          {city && pincode && !needsOnboarding && (
            <button
              type="button"
              onClick={() => clear()}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
            >
              Clear current selection
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-5 py-3 sm:px-6">
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            fullWidth
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
