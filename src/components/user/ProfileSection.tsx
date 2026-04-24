"use client";

import React, { useMemo } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMe, useUpdateMyProfile } from "@/services/auth";
import {
  AddressFormBody,
  type AddressFormValue,
} from "@/components/shared/AddressFormModal";

// Profile settings use the same field set (and validation) the checkout
// billing modal does. Users get a single, consistent form across the app
// instead of a stripped-down "name + phone" one here and a rich one over
// there.
export function ProfileSection() {
  const { user } = useAuthStore();
  useMe();
  const updateProfile = useUpdateMyProfile();

  const initial = useMemo(() => {
    const u = (user as any) ?? {};
    const storedPhone = String(u.phone ?? "");
    const dial = String(u.countryCode ?? "");
    // Strip the dial code off the stored phone using the user's own
    // countryCode so we never greedily eat real digits on longer-than-4
    // country codes or long local numbers.
    const phoneLocal = dial && storedPhone.startsWith(dial)
      ? storedPhone.slice(dial.length)
      : storedPhone.replace(/^\+/, "");
    return {
      name: u.name ?? "",
      email: u.email ?? "",
      gender: (u.gender as "MALE" | "FEMALE" | "OTHER" | undefined) ?? "",
      profileImage: u.profileImage ?? "",
      phone: phoneLocal,
      countryPhoneCode: dial,
      countryName: u.country ?? "",
      stateName: u.state ?? "",
      cityName: u.city ?? "",
      postalCode: u.pincode ?? "",
      addressLine1: u.address ?? u.addressLine1 ?? "",
    };
  }, [user]);

  const handleSubmit = async (value: AddressFormValue) => {
    try {
      await updateProfile.mutateAsync({
        name: value.name.trim(),
        email: value.email.trim(),
        phone: `${value.countryPhoneCode}${value.phone}`.replace(/^\+?/, "+"),
        countryCode: value.countryPhoneCode,
        gender: (value.gender || undefined) as
          | "MALE"
          | "FEMALE"
          | "OTHER"
          | undefined,
        profileImage: value.profileImage || undefined,
        address: value.addressLine1.trim(),
        city: value.cityName,
        state: value.stateName,
        country: value.countryName,
        pincode: value.postalCode.trim() || undefined,
      });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
      <AddressFormBody
        mode="billing"
        initial={initial}
        saving={updateProfile.isPending}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        hideCancel
        resetKey={user?.id ?? 0}
      />
    </div>
  );
}

export default ProfileSection;
