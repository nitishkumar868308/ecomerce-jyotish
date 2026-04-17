"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAstrologerProfile, useUpdateAstrologerProfile } from "@/services/jyotish/profile";

export function ProfileEdit() {
  const { user } = useAuthStore();
  const userId = user?.id || user?._id || "";
  const { data: profile, isLoading } = useAstrologerProfile(userId);
  const updateProfile = useUpdateAstrologerProfile();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    experience: "",
    pricePerMin: "",
    specializations: "",
    languages: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        bio: profile.bio || "",
        experience: String(profile.experience || ""),
        pricePerMin: String(profile.pricePerMin || ""),
        specializations: (profile.specializations ?? []).join(", "),
        languages: (profile.languages ?? []).join(", "),
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      id: userId,
      name: form.name,
      bio: form.bio,
      experience: Number(form.experience),
      pricePerMin: Number(form.pricePerMin),
      specializations: form.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      languages: form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      phone: form.phone,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg shimmer" />
        ))}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20";
  const labelCls = "mb-1.5 block text-sm font-medium text-[var(--text-primary)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
      <div>
        <label className={labelCls}>Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className={labelCls}>Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className={`${inputCls} resize-y`}
          placeholder="Tell clients about yourself..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Experience (years)</label>
          <input
            type="number"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            className={inputCls}
            min={0}
          />
        </div>
        <div>
          <label className={labelCls}>Price per minute (&#8377;)</label>
          <input
            type="number"
            value={form.pricePerMin}
            onChange={(e) => setForm({ ...form, pricePerMin: e.target.value })}
            className={inputCls}
            min={0}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Specializations (comma-separated)</label>
        <input
          type="text"
          value={form.specializations}
          onChange={(e) => setForm({ ...form, specializations: e.target.value })}
          className={inputCls}
          placeholder="Vedic Astrology, Numerology, Tarot"
        />
      </div>

      <div>
        <label className={labelCls}>Languages (comma-separated)</label>
        <input
          type="text"
          value={form.languages}
          onChange={(e) => setForm({ ...form, languages: e.target.value })}
          className={inputCls}
          placeholder="Hindi, English, Telugu"
        />
      </div>

      <div>
        <label className={labelCls}>Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputCls}
          placeholder="+91 98765 43210"
        />
      </div>

      <button
        type="submit"
        disabled={updateProfile.isPending}
        className="w-full rounded-lg bg-[var(--accent-primary)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {updateProfile.isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

export default ProfileEdit;
