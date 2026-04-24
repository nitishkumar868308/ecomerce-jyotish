"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { api, ENDPOINTS } from "@/lib/api";
import type { Address } from "@/types/user";
import toast from "react-hot-toast";
import {
  AddressFormModal,
  type AddressFormValue,
} from "@/components/shared/AddressFormModal";

// Saved addresses page. The add/edit form is the shared shipping modal so
// the fields, validation and country/state/city pickers match the checkout
// flow exactly.
export function AddressManager() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.ADDRESS.LIST);
      return data.data as Address[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editAddress) {
        return api.put(ENDPOINTS.ADDRESS.UPDATE(editAddress.id), payload);
      }
      return api.post(ENDPOINTS.ADDRESS.CREATE, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setModalOpen(false);
      setEditAddress(null);
      toast.success(editAddress ? "Address updated!" : "Address added!");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to save address"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(ENDPOINTS.ADDRESS.DELETE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setDeleteId(null);
      toast.success("Address deleted!");
    },
  });

  const modalInitial = useMemo<Partial<AddressFormValue>>(() => {
    if (!editAddress) return { addressType: "HOME", isDefault: false };
    // Backend Address row stores the street as `address` (legacy column);
    // our form uses `addressLine1`. Tolerate either so prefill never shows
    // the literal string "undefined" when the legacy column wins.
    const raw = editAddress as unknown as {
      address?: string;
      addressLine1?: string;
    };
    const streetAddress = raw.addressLine1 ?? raw.address ?? "";
    // Prefer the saved `countryCode` to peel the dialling prefix off the
    // stored phone. Falls back to stripping the leading "+" so a phone
    // without a dial code still renders cleanly. (A generic `\d{1,4}`
    // strip is greedy and eats real digits off longer numbers.)
    const storedPhone = String(editAddress.phone ?? "");
    const dial = String(editAddress.countryCode ?? "");
    const stripped = dial && storedPhone.startsWith(dial)
      ? storedPhone.slice(dial.length)
      : storedPhone.replace(/^\+/, "");
    return {
      name: editAddress.name ?? "",
      email: editAddress.email ?? "",
      phone: stripped,
      countryPhoneCode: editAddress.countryCode ?? "",
      countryName: editAddress.country ?? "",
      stateName: editAddress.state ?? "",
      cityName: editAddress.city ?? "",
      postalCode: editAddress.pincode ?? "",
      addressLine1: streetAddress,
      addressType: editAddress.addressType ?? "HOME",
      addressLabel: editAddress.addressLabel ?? "",
      isDefault: !!editAddress.isDefault,
    };
  }, [editAddress]);

  const openCreate = () => {
    setEditAddress(null);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditAddress(addr);
    setModalOpen(true);
  };

  const handleSubmit = async (value: AddressFormValue) => {
    await saveMutation.mutateAsync({
      name: value.name.trim(),
      phone: `${value.countryPhoneCode}${value.phone}`.replace(/^\+?/, "+"),
      email: value.email.trim(),
      addressLine1: value.addressLine1.trim(),
      city: value.cityName,
      state: value.stateName,
      pincode: value.postalCode.trim(),
      country: value.countryName,
      countryCode: value.countryPhoneCode,
      addressType: value.addressType ?? "HOME",
      addressLabel:
        value.addressType === "OTHER"
          ? value.addressLabel?.trim() || undefined
          : undefined,
      isDefault: !!value.isDefault,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Saved addresses{" "}
          <span className="text-sm font-normal text-[var(--text-muted)]">
            ({addresses?.length ?? 0})
          </span>
        </h2>
        <Button
          size="sm"
          onClick={openCreate}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New
        </Button>
      </div>

      {!addresses?.length ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add a delivery address to speed up checkout."
          action={{ label: "Add Address", onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} padding="md" className="relative">
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                {addr.addressType && (
                  <span className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    {addr.addressType === "OTHER" && addr.addressLabel
                      ? addr.addressLabel
                      : addr.addressType}
                  </span>
                )}
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-success-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-success)]">
                    <Check className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              <p className="font-semibold text-[var(--text-primary)] pr-20">
                {addr.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {addr.addressLine1 ??
                  (addr as unknown as { address?: string }).address ??
                  ""}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              {addr.country && (
                <p className="text-xs text-[var(--text-muted)]">
                  {addr.country}
                </p>
              )}
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {addr.phone}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(addr)}
                  leftIcon={<Edit className="h-3 w-3" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(addr.id)}
                  leftIcon={<Trash2 className="h-3 w-3" />}
                  className="text-[var(--accent-danger)]"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditAddress(null);
        }}
        mode="shipping"
        title={editAddress ? "Edit shipping address" : "Add shipping address"}
        initial={modalInitial}
        saving={saveMutation.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        variant="danger"
      />
    </div>
  );
}

export default AddressManager;
