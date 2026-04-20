"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Info } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCreateProfileEditRequest } from "@/services/jyotish/profile";
import toast from "react-hot-toast";

/**
 * Astrologer-paid free session requests.
 *
 * Contract (per brief item 20):
 *   - Astrologer submits the request with session count + per-session payout
 *     they are willing to absorb.
 *   - Request flows to admin via the existing profile-edit-request pipeline
 *     (changes.freeOffer = {...}) so we reuse the approval UI already in
 *     place without adding a new backend table.
 *   - Astrologer sees an explicit note that the payout comes out of THEIR
 *     balance, not the platform's — to avoid surprise.
 */
export default function AstrologerFreeSessionsRequestPage() {
  const { user } = useAuthStore();
  const astrologerId = user?.id ?? "";
  const createRequest = useCreateProfileEditRequest();

  const [form, setForm] = useState({
    title: "Free 5-minute intro",
    description: "",
    sessionsCap: "10",
    minutesPerSession: "5",
    astrologerPayoutPerSession: "100",
    startDate: "",
    endDate: "",
  });

  const invalid =
    !form.title.trim() ||
    !Number.isFinite(Number(form.sessionsCap)) ||
    Number(form.sessionsCap) <= 0 ||
    Number(form.astrologerPayoutPerSession) < 0;

  const handleSubmit = () => {
    if (invalid) {
      toast.error("Fill in required fields with valid numbers.");
      return;
    }
    createRequest.mutate(
      {
        astrologerId,
        changes: {
          freeOffer: {
            source: "ASTROLOGER",
            title: form.title,
            description: form.description,
            sessionsCap: Number(form.sessionsCap),
            minutesPerSession: Number(form.minutesPerSession),
            astrologerPayoutPerSession: Number(form.astrologerPayoutPerSession),
            adminPayoutPerSession: 0,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Request submitted for admin approval.");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--jy-text-secondary)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="rounded-2xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--jy-text-primary)]">
              Request a Free Session Offer
            </h1>
            <p className="text-xs text-[var(--jy-text-muted)]">
              Offer new users a few free minutes to experience your guidance.
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <span>
            Heads up: the payout for these sessions comes out of{" "}
            <strong>your</strong> earnings, not the platform&apos;s. Only the
            admin&apos;s commission on each session is waived by the platform.
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Offer title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Free 5-minute intro"
              className="input"
            />
          </Field>
          <Field label="Sessions cap">
            <input
              type="number"
              min={1}
              value={form.sessionsCap}
              onChange={(e) => setForm({ ...form, sessionsCap: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Minutes per session">
            <input
              type="number"
              min={1}
              value={form.minutesPerSession}
              onChange={(e) =>
                setForm({ ...form, minutesPerSession: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Your payout per session (₹)">
            <input
              type="number"
              min={0}
              value={form.astrologerPayoutPerSession}
              onChange={(e) =>
                setForm({ ...form, astrologerPayoutPerSession: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="input"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description (optional)">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="input resize-y"
                placeholder="Tell users why they should try your free session"
              />
            </Field>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={invalid || createRequest.isPending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-5 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createRequest.isPending
            ? "Submitting..."
            : "Submit for admin approval"}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--jy-text-primary);
          outline: none;
        }
        :global(.input:focus) {
          border-color: rgba(245, 211, 127, 0.6);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--jy-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
