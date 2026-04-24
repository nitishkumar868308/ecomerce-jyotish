"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Info, Calendar, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerProfile,
  useCreateProfileEditRequest,
  useMyProfileEditRequests,
} from "@/services/jyotish/profile";
import { useAstrologerFreeOfferSummary } from "@/services/jyotish/sessions";
import toast from "react-hot-toast";

/**
 * Astrologer-paid free session requests.
 *
 * Business model (refined per the latest brief):
 *   - Astrologers can offer N free sessions to bring in new users.
 *   - The astrologer earns NOTHING on these free sessions — no payout
 *     is booked during the free window; their regular earnings only
 *     resume on normal, paid sessions.
 *   - BUT the admin still needs to be paid for hosting the seat: the
 *     astrologer reimburses the admin's commission + GST on each free
 *     session. We surface that liability up-front so there are no
 *     surprises, with a "Pay now" stub that will route to the payment
 *     gateway in a follow-up.
 *   - The request itself is still submitted through the existing
 *     profile-edit-request pipeline so admin approves it from the same
 *     /admin/jyotish/profile-edit-requests screen.
 */
interface SubmittedSnapshot {
  title: string;
  usesPerUser: number;
  minutesPerSession: number;
  startDate: string;
  endDate: string;
  description: string;
  grossValuePerUser: number;
  adminPerUser: number;
  gstPerUser: number;
  payablePerUser: number;
}

export default function AstrologerFreeSessionsRequestPage() {
  const { user } = useAuthStore();
  const astrologerId = (user?.id as number | string | undefined) ?? "";
  const { data: astrologer } = useAstrologerProfile(astrologerId);
  const createRequest = useCreateProfileEditRequest();

  // Single-campaign guard. Two in-flight conditions block a new
  // submission: a PENDING admin review, or a live + active offer that
  // hasn't hit its end date yet. We show a banner + disable submit so
  // the astrologer doesn't hit the backend's 400 cold.
  const { data: offerSummary } = useAstrologerFreeOfferSummary(astrologerId);
  const { data: myRequests } = useMyProfileEditRequests(astrologerId);
  const pendingRequest = useMemo(() => {
    const list = (myRequests ?? []) as Array<Record<string, any>>;
    return list.find(
      (r) =>
        String(r.section ?? "").toLowerCase() === "free sessions offer" &&
        String(r.overallStatus ?? r.status ?? "PENDING").toUpperCase() ===
          "PENDING",
    );
  }, [myRequests]);
  const activeOffer = offerSummary?.activeOffer ?? null;
  const blockedReason: string | null = pendingRequest
    ? "You already have a free-offer request awaiting admin review. Wait for them to approve or reject it before submitting a new one."
    : activeOffer
      ? "You already have an active free-offer campaign running. Ask admin to deactivate it (or wait for its end date) before submitting a new one."
      : null;

  // Snapshot of the last submitted request so the astrologer can see
  // exactly what reached admin even after we've cleared the form. When
  // non-null we render the "Request submitted" summary card + a
  // "Submit another" button that clears it.
  const [submitted, setSubmitted] = useState<SubmittedSnapshot | null>(null);

  // Admin's commission % is stored on the astrologer row (revenueAdmin
  // is the admin's share of a paid session). GST is the tax cut that
  // sits on top. Both default to sensible numbers if admin hasn't set
  // them yet — the astrologer still gets a reasonable preview.
  const adminSharePercent = Number(astrologer?.revenueAdmin ?? 30);
  const gstPercent = Number(astrologer?.gst ?? 18);

  // Astrologer's usual per-minute rate. We pull from the first service
  // if one's on file — else default to a sensible 10/min — so the
  // admin-commission preview has something to multiply against. The
  // astrologer doesn't set a session price any more; we price every
  // free minute at the astrologer's own rate, which is the "opportunity
  // cost" the platform would have earned commission on.
  const ratePerMinute = useMemo(() => {
    const services = (astrologer?.services ?? []) as Array<{ price?: number }>;
    const rate = services.find((s) => Number(s.price) > 0)?.price;
    return Number(rate ?? 10);
  }, [astrologer]);

  const EMPTY_FORM = {
    title: "Free 5-minute intro",
    description: "",
    /** How many times ONE user can redeem this offer. Most campaigns
     *  run "1 per user" so new shoppers don't keep burning free
     *  minutes on the same astrologer. */
    usesPerUser: "1",
    minutesPerSession: "5",
    startDate: "",
    endDate: "",
  };
  const [form, setForm] = useState(EMPTY_FORM);

  const invalid =
    !form.title.trim() ||
    !Number.isFinite(Number(form.usesPerUser)) ||
    Number(form.usesPerUser) <= 0 ||
    !Number.isFinite(Number(form.minutesPerSession)) ||
    Number(form.minutesPerSession) <= 0;

  // Admin + GST liability PER USER who redeems the offer. We can't
  // forecast a total across all users (admin sets no hard cap here —
  // the offer is "per user, not per campaign"), so we surface the
  // cost-per-user figure and remind the astrologer it compounds as
  // more users redeem.
  const money = useMemo(() => {
    const minutes =
      Number(form.minutesPerSession) * Number(form.usesPerUser) || 0;
    const gross = minutes * ratePerMinute;
    const adminShare = (gross * adminSharePercent) / 100;
    const gst = (adminShare * gstPercent) / 100;
    return {
      ratePerMinute,
      minutesPerUser: minutes,
      grossValuePerUser: round2(gross),
      adminPerUser: round2(adminShare),
      gstPerUser: round2(gst),
      payablePerUser: round2(adminShare + gst),
    };
  }, [
    form.minutesPerSession,
    form.usesPerUser,
    ratePerMinute,
    adminSharePercent,
    gstPercent,
  ]);

  const handleSubmit = () => {
    if (blockedReason) {
      toast.error(blockedReason);
      return;
    }
    if (invalid) {
      toast.error("Fill in required fields with valid numbers.");
      return;
    }
    // Snapshot everything the admin will actually see so the confirm
    // screen can mirror the exact ask even after we clear the form.
    const snapshot: SubmittedSnapshot = {
      title: form.title,
      usesPerUser: Number(form.usesPerUser),
      minutesPerSession: Number(form.minutesPerSession),
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      grossValuePerUser: money.grossValuePerUser,
      adminPerUser: money.adminPerUser,
      gstPerUser: money.gstPerUser,
      payablePerUser: money.payablePerUser,
    };
    createRequest.mutate(
      {
        astrologerId,
        section: "Free sessions offer",
        reason:
          form.description ||
          `${form.usesPerUser}× ${form.minutesPerSession}-min free session per user`,
        fields: {
          _fieldLabel: "Free sessions offer",
          freeOffer: {
            source: "ASTROLOGER",
            title: form.title,
            description: form.description,
            usesPerUser: Number(form.usesPerUser),
            minutesPerSession: Number(form.minutesPerSession),
            ratePerMinute,
            astrologerPayoutPerSession: 0,
            grossValuePerUser: money.grossValuePerUser,
            adminPayoutPerUser: money.adminPerUser,
            gstPerUser: money.gstPerUser,
            payablePerUser: money.payablePerUser,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Request submitted for admin approval.");
          setSubmitted(snapshot);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--jy-text-secondary)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Confirmation card — appears above the form after a submit.
          Mirrors exactly what admin will see so the astrologer has a
          receipt. "Submit another" clears the snapshot so they can
          launch a different campaign. */}
      {submitted && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                Request submitted
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-[var(--jy-text-primary)]">
                {submitted.title}
              </h2>
              <p className="mt-1 text-xs text-[var(--jy-text-secondary)]">
                Admin will review and approve from the profile-edit-requests
                queue. You&rsquo;ll get a notification once they act on it.
              </p>

              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <Snap label="Times per user" value={`${submitted.usesPerUser}`} />
                <Snap
                  label="Minutes per session"
                  value={`${submitted.minutesPerSession} min`}
                />
                <Snap
                  label="Admin commission / user"
                  value={`₹${submitted.adminPerUser.toLocaleString("en-IN")}`}
                />
                <Snap
                  label="GST / user"
                  value={`₹${submitted.gstPerUser.toLocaleString("en-IN")}`}
                />
                <Snap
                  label="You pay admin / user"
                  value={`₹${submitted.payablePerUser.toLocaleString("en-IN")}`}
                />
                {submitted.startDate && (
                  <Snap
                    label="Window"
                    value={`${submitted.startDate} → ${submitted.endDate || "∞"}`}
                  />
                )}
              </dl>
              {submitted.description && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
                    Your note to admin
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-[var(--jy-text-secondary)]">
                    {submitted.description}
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--jy-text-primary)] hover:bg-white/10"
                >
                  Submit another
                </button>
                <Link
                  href="/jyotish/astrologer-dashboard/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--jy-text-secondary)] hover:bg-white/10"
                >
                  View all requests →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ── Form ── */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--jy-accent-gold)]/15 text-white">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--jy-text-primary)]">
                  Offer a free session campaign
                </h1>
                <p className="text-xs text-[var(--jy-text-muted)]">
                  Bring new users in for a taste of your readings.
                </p>
              </div>
            </div>

            {blockedReason && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{blockedReason}</span>
              </div>
            )}

            <div className="mb-5 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200/90">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <span>
                Free sessions earn you nothing — your payout stays at ₹0 for
                these. You resume normal earnings on paid sessions once the
                campaign ends. However the platform&apos;s commission +{" "}
                {gstPercent}% GST on each free session is still due and payable
                by you to admin (preview on the right).
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Offer title">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Free 5-minute intro"
                  className="fs-input"
                />
              </Field>
              <Field
                label="Times per user"
                hint="How many times each shopper can redeem this offer (usually 1)"
              >
                <input
                  type="number"
                  min={1}
                  value={form.usesPerUser}
                  onChange={(e) =>
                    setForm({ ...form, usesPerUser: e.target.value })
                  }
                  className="fs-input"
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
                  className="fs-input"
                />
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="fs-input"
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="fs-input"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description (optional)">
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="fs-input resize-y"
                    placeholder="Tell users why they should try your free session"
                  />
                </Field>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                invalid || createRequest.isPending || !!blockedReason
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-5 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createRequest.isPending
                ? "Submitting…"
                : blockedReason
                  ? "Campaign already in progress"
                  : "Submit for admin approval"}
            </button>
          </section>
        </div>

        {/* ── Summary / payable ── */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/20 via-white/[0.02] to-[var(--jy-accent-gold)]/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                <Calendar className="h-4 w-4" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                Payable to admin
              </h2>
            </div>

            <SummaryRow
              label="Your rate"
              value={`₹${money.ratePerMinute.toLocaleString("en-IN")} / min`}
            />
            <SummaryRow
              label="Free minutes / user"
              value={`${money.minutesPerUser} min`}
            />
            <SummaryRow
              label="Gross value / user"
              value={`₹${money.grossValuePerUser.toLocaleString("en-IN")}`}
            />
            <SummaryRow
              label={`Admin commission (${adminSharePercent}%)`}
              value={`₹${money.adminPerUser.toLocaleString("en-IN")}`}
            />
            <SummaryRow
              label={`GST (${gstPercent}%)`}
              value={`₹${money.gstPerUser.toLocaleString("en-IN")}`}
            />

            <div className="mt-4 rounded-xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
                You pay admin per user
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--jy-text-primary)]">
                ₹{money.payablePerUser.toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--jy-text-muted)]">
                Admin commission + GST on the free minutes each shopper uses.
                Total grows as more users redeem — billed after each session
                completes.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs text-[var(--jy-text-secondary)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
              How it works
            </h3>
            <ol className="mt-2 space-y-1.5 pl-4 [&>li]:list-decimal">
              <li>You submit the offer + description.</li>
              <li>Admin reviews and approves from their panel.</li>
              <li>
                A shopper opens a chat/call with you and redeems their free
                minutes — you earn ₹0 during this window.
              </li>
              <li>
                Once the free minutes are used up, the session converts to
                paid and your regular earnings kick in (tracked separately in
                the transactions page).
              </li>
              <li>
                Admin commission + GST for the free window is billed to you
                per redeemed session.
              </li>
            </ol>
          </section>
        </aside>
      </div>

      <style jsx>{`
        :global(.fs-input) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--jy-text-primary);
          outline: none;
        }
        :global(.fs-input:focus) {
          border-color: rgba(245, 211, 127, 0.6);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--jy-text-muted)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10px] text-[var(--jy-text-faint)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--jy-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-[var(--jy-text-primary)]">
        {value}
      </dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-xs">
      <span className="text-[var(--jy-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--jy-text-primary)]">
        {value}
      </span>
    </div>
  );
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
