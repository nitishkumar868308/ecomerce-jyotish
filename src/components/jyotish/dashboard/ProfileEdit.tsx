"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerProfile,
  useCreateProfileEditRequest,
  useMyProfileEditRequests,
} from "@/services/jyotish/profile";
import type { ProfileEditRequest } from "@/types/jyotish";

interface Section<T> {
  title: string;
  description?: string;
  initial: T;
  render: (
    state: T,
    setState: React.Dispatch<React.SetStateAction<T>>,
    inputCls: string,
    labelCls: string,
  ) => React.ReactNode;
  buildPayload: (state: T) => Record<string, unknown>;
}

interface BasicInfoState { name: string; phone: string }
interface AboutState { bio: string; experience: string }
interface SpecLangState { specializations: string; languages: string }
interface PricingState { pricePerMin: string }

const inputCls =
  "w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20";
const labelCls = "mb-1.5 block text-sm font-medium text-[var(--text-primary)]";

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-[var(--accent-success)]/10 text-[var(--accent-success)]"
      : s === "REJECTED"
        ? "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]"
        : "bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {s}
    </span>
  );
}

function SectionCard<T>({
  title,
  description,
  initial,
  render,
  buildPayload,
  astrologerId,
}: Section<T> & { astrologerId: string | number }) {
  const [state, setState] = useState<T>(initial);
  const [initialSnapshot, setInitialSnapshot] = useState<T>(initial);
  const createRequest = useCreateProfileEditRequest();

  useEffect(() => {
    setState(initial);
    setInitialSnapshot(initial);
  }, [initial]);

  const dirty = JSON.stringify(state) !== JSON.stringify(initialSnapshot);

  const handleSubmit = () => {
    if (!dirty) return;
    const changes = buildPayload(state);
    createRequest.mutate(
      { astrologerId, changes },
      {
        onSuccess: () => {
          setInitialSnapshot(state);
        },
      },
    );
  };

  return (
    <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </header>

      <div className="space-y-4">{render(state, setState, inputCls, labelCls)}</div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">
          {dirty ? "Unsaved changes" : "Up to date"}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!dirty || createRequest.isPending}
          className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {createRequest.isPending ? "Submitting\u2026" : "Submit for review"}
        </button>
      </div>
    </section>
  );
}

export function ProfileEdit() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";
  const { data: profile, isLoading } = useAstrologerProfile(userId);
  const astrologerId = profile?.id ?? userId;
  const { data: requests } = useMyProfileEditRequests(astrologerId);

  const basicInit: BasicInfoState = useMemo(
    () => ({
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
    }),
    [profile?.name, profile?.phone],
  );

  const aboutInit: AboutState = useMemo(
    () => ({
      bio: profile?.bio ?? "",
      experience: String(profile?.experience ?? ""),
    }),
    [profile?.bio, profile?.experience],
  );

  const specLangInit: SpecLangState = useMemo(
    () => ({
      specializations: (profile?.specializations ?? []).join(", "),
      languages: (profile?.languages ?? []).join(", "),
    }),
    [profile?.specializations, profile?.languages],
  );

  const pricingInit: PricingState = useMemo(
    () => ({
      pricePerMin: String(profile?.pricePerMin ?? profile?.pricePerMinute ?? ""),
    }),
    [profile?.pricePerMin, profile?.pricePerMinute],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
        <p className="text-sm text-[var(--text-muted)]">Profile not found.</p>
      </div>
    );
  }

  const pendingList: ProfileEditRequest[] = (requests ?? []).slice(0, 8);

  return (
    <div className="space-y-5">
      {pendingList.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            My edit requests
          </h3>
          <ul className="space-y-2 text-sm">
            {pendingList.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[var(--text-primary)]">
                    {Object.keys(r.changes ?? {}).join(", ") || "Update"}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : ""}
                    {r.reviewNote ? ` \u00b7 ${r.reviewNote}` : ""}
                  </div>
                </div>
                <StatusPill status={String(r.status ?? "PENDING")} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <SectionCard<BasicInfoState>
        astrologerId={astrologerId}
        title="Basic Info"
        description="Your public name and contact phone."
        initial={basicInit}
        buildPayload={(s) => ({ name: s.name, phone: s.phone })}
        render={(s, set, i, l) => (
          <>
            <div>
              <label className={l}>Full Name</label>
              <input
                type="text"
                value={s.name}
                onChange={(e) => set({ ...s, name: e.target.value })}
                className={i}
                required
              />
            </div>
            <div>
              <label className={l}>Phone</label>
              <input
                type="tel"
                value={s.phone}
                onChange={(e) => set({ ...s, phone: e.target.value })}
                className={i}
                placeholder="+91 98765 43210"
              />
            </div>
          </>
        )}
      />

      <SectionCard<AboutState>
        astrologerId={astrologerId}
        title="About"
        description="Your bio and years of experience."
        initial={aboutInit}
        buildPayload={(s) => ({
          bio: s.bio,
          experience: Number(s.experience) || 0,
        })}
        render={(s, set, i, l) => (
          <>
            <div>
              <label className={l}>Bio</label>
              <textarea
                value={s.bio}
                onChange={(e) => set({ ...s, bio: e.target.value })}
                rows={4}
                className={`${i} resize-y`}
                placeholder="Tell clients about yourself\u2026"
              />
            </div>
            <div>
              <label className={l}>Experience (years)</label>
              <input
                type="number"
                min={0}
                value={s.experience}
                onChange={(e) => set({ ...s, experience: e.target.value })}
                className={i}
              />
            </div>
          </>
        )}
      />

      <SectionCard<SpecLangState>
        astrologerId={astrologerId}
        title="Specializations & Languages"
        description="Comma-separated lists."
        initial={specLangInit}
        buildPayload={(s) => ({
          specializations: s.specializations
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          languages: s.languages
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        })}
        render={(s, set, i, l) => (
          <>
            <div>
              <label className={l}>Specializations</label>
              <input
                type="text"
                value={s.specializations}
                onChange={(e) => set({ ...s, specializations: e.target.value })}
                className={i}
                placeholder="Vedic Astrology, Numerology, Tarot"
              />
            </div>
            <div>
              <label className={l}>Languages</label>
              <input
                type="text"
                value={s.languages}
                onChange={(e) => set({ ...s, languages: e.target.value })}
                className={i}
                placeholder="Hindi, English, Telugu"
              />
            </div>
          </>
        )}
      />

      <SectionCard<PricingState>
        astrologerId={astrologerId}
        title="Pricing"
        description="Your per-minute rate. Subject to admin approval."
        initial={pricingInit}
        buildPayload={(s) => ({
          pricePerMin: Number(s.pricePerMin) || 0,
          pricePerMinute: Number(s.pricePerMin) || 0,
        })}
        render={(s, set, i, l) => (
          <div>
            <label className={l}>Price per minute (\u20b9)</label>
            <input
              type="number"
              min={0}
              value={s.pricePerMin}
              onChange={(e) => set({ ...s, pricePerMin: e.target.value })}
              className={i}
            />
          </div>
        )}
      />
    </div>
  );
}

export default ProfileEdit;
