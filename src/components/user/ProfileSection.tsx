"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMe } from "@/services/auth";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

export function ProfileSection() {
  const { user, setUser } = useAuthStore();
  useMe();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        name: form.name,
        phone: form.phone,
      });
      setUser(data.data || data.user || data);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6"
    >
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary-light)] text-xl font-bold text-[var(--accent-primary)]">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          Full Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-secondary)] opacity-60 outline-none"
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Email cannot be changed
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
          placeholder="+91 98765 43210"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--accent-primary)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

export default ProfileSection;
