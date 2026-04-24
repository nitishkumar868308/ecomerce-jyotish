"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  FileText,
  Percent,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Clock,
  ExternalLink,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAstrologerProfile,
  useCreateProfileEditRequest,
  useMyProfileEditRequests,
} from "@/services/jyotish/profile";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Astrologer-facing profile page. Two goals:
 *   1. Surface everything the astrologer ever submitted during register
 *      + everything admin has since configured (GST/revenue split,
 *      services, penalties, uploaded docs) in one scannable view.
 *   2. Enforce the request-based edit workflow — the astrologer never
 *      edits live fields. They pick a section, describe what needs to
 *      change and why, and submit for admin review. Each request is
 *      shown with its lifecycle state (pending / approved / rejected)
 *      so the astrologer can see where their last ask landed.
 *
 * Everything is read-only — actual edits land via a modal form that
 * creates a ProfileEditRequest row; the admin side owns approving it
 * and writing the change to the DB. This keeps the astrologer self-
 * serve without letting them change revenue terms or identity docs
 * unilaterally.
 */
export default function AstrologerProfilePage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";
  const { data: astrologer, isLoading } = useAstrologerProfile(userId);
  const astrologerId = (astrologer?.id as number | undefined) ?? userId;
  const { data: requests } = useMyProfileEditRequests(astrologerId);

  const [openSection, setOpenSection] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--jy-text-muted)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }
  if (!astrologer) {
    return (
      <div className="text-sm text-[var(--jy-text-muted)]">
        Profile not available.
      </div>
    );
  }

  const profile = astrologer.profile ?? {};
  const services = (astrologer.services ?? []) as Array<Record<string, any>>;
  const documents = (astrologer.documents ?? []) as Array<Record<string, any>>;
  const extraDocs = (astrologer.extraDocuments ?? []) as Array<
    Record<string, any>
  >;
  const penalties = (astrologer.penalties ?? []) as Array<Record<string, any>>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="inline-flex items-center gap-1 text-sm text-[var(--jy-text-muted)] hover:text-[var(--jy-accent-gold)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Hero card */}
      <HeroCard astrologer={astrologer} />

      {/* Active requests summary — pending/approved/rejected with
          which field + admin's note. Approved ones spell out what the
          astrologer can now edit (still through admin, but tells them
          the path is open). */}
      <RequestsSummary requests={requests ?? []} />

      {/* Editable info: basic + profile + address. All read-only here,
          request-to-edit button per section. */}
      <SectionBlock
        id="basic"
        title="Basic information"
        icon={<User className="h-4 w-4" />}
        requests={requests ?? []}
        onRequestEdit={() => setOpenSection("basic")}
        rows={[
          { label: "Full name", value: astrologer.fullName },
          { label: "Display name", value: astrologer.displayName },
          { label: "Email", value: astrologer.email },
          {
            label: "Phone",
            value: astrologer.phone,
          },
          { label: "Gender", value: astrologer.gender },
        ]}
      />

      <SectionBlock
        id="profile"
        title="Profile"
        icon={<Sparkles className="h-4 w-4" />}
        requests={requests ?? []}
        onRequestEdit={() => setOpenSection("profile")}
        rows={[
          {
            label: "Years of experience",
            value:
              profile.experience != null ? String(profile.experience) : null,
          },
          { label: "Bio", value: profile.bio ?? astrologer.bio, long: true },
          {
            label: "Languages",
            value: (profile.languages ?? []).join(", "),
          },
          {
            label: "Specializations",
            value: (profile.specializations ?? []).join(", "),
          },
        ]}
      />

      <SectionBlock
        id="address"
        title="Address"
        icon={<MapPin className="h-4 w-4" />}
        requests={requests ?? []}
        onRequestEdit={() => setOpenSection("address")}
        rows={[
          { label: "Street", value: profile.address, long: true },
          { label: "City", value: profile.city },
          { label: "State", value: profile.state },
          { label: "Country", value: profile.country },
          { label: "Postal code", value: profile.postalCode },
        ]}
      />

      {/* Admin-managed: services + revenue + penalties + docs. These
          sections don't carry a "Request edit" CTA because the
          astrologer can't change revenue terms or penalties — they can
          only raise it with admin via a new edit request from the top-
          right "Ask admin" button. */}
      <ReadOnlySection
        title="Services & pricing"
        icon={<Sparkles className="h-4 w-4" />}
        requests={requests ?? []}
        sectionId="services"
        onRequestEdit={() => setOpenSection("services")}
      >
        {services.length === 0 ? (
          <EmptyHint>No services configured yet.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <span className="text-[var(--jy-text-primary)]">
                  {s.serviceName}
                </span>
                <span className="text-[var(--jy-accent-gold)] font-semibold">
                  {s.currencySymbol ?? "₹"}
                  {s.price != null ? Number(s.price).toLocaleString() : "-"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ReadOnlySection>

      <ReadOnlySection
        title="Revenue & tax"
        icon={<Percent className="h-4 w-4" />}
        requests={requests ?? []}
        sectionId="revenue"
        onRequestEdit={() => setOpenSection("revenue")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <RevenueChip label="GST cut" value={astrologer.gst} />
          <RevenueChip
            label="Your share"
            value={astrologer.revenueAstrologer}
            accent
          />
          <RevenueChip
            label="Platform share"
            value={astrologer.revenueAdmin}
          />
        </div>
        <p className="mt-3 text-[11px] text-[var(--jy-text-muted)]">
          GST is deducted first from each session price. The remaining amount
          is split between you and the platform per the shares above. Changes
          here go through admin.
        </p>
      </ReadOnlySection>

      <ReadOnlySection
        title="Documents"
        icon={<FileText className="h-4 w-4" />}
        requests={requests ?? []}
        sectionId="documents"
        onRequestEdit={() => setOpenSection("documents")}
      >
        {documents.length === 0 && extraDocs.length === 0 ? (
          <EmptyHint>No documents uploaded yet.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <DocRow
                key={d.id}
                label={String(d.type ?? "Document")}
                url={d.fileUrl}
              />
            ))}
            {extraDocs.map((d) => (
              <DocRow key={d.id} label={d.title ?? "Document"} url={d.fileUrl} />
            ))}
          </div>
        )}
      </ReadOnlySection>

      {penalties.length > 0 && (
        <ReadOnlySection
          title="Penalties on record"
          icon={<AlertTriangle className="h-4 w-4" />}
          requests={requests ?? []}
          sectionId="penalty"
          onRequestEdit={() => setOpenSection("penalty")}
        >
          <ul className="space-y-2">
            {penalties.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-red-300">
                    ₹{Number(p.amount ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[var(--jy-text-muted)]">
                    {p.paid && Number(p.paid) > 0
                      ? `Paid ₹${Number(p.paid).toLocaleString()}`
                      : "Unpaid"}
                  </span>
                </div>
                {p.reason && (
                  <p className="mt-1 text-[var(--jy-text-secondary)]">
                    {p.reason}
                  </p>
                )}
                {p.settlement && (
                  <p className="mt-1 text-[11px] text-[var(--jy-text-muted)]">
                    Settlement: {p.settlement}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ReadOnlySection>
      )}

      {openSection && (
        <EditRequestModal
          section={openSection}
          astrologerId={astrologerId}
          onClose={() => setOpenSection(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────── Hero ─────────────────── */

function HeroCard({ astrologer }: { astrologer: Record<string, any> }) {
  const img = astrologer.profile?.image;
  const src = img ? resolveAssetUrl(img) || img : "";
  const initials = (astrologer.fullName ?? "A")
    .split(/\s+/)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const status = astrologer.isRejected
    ? "REJECTED"
    : astrologer.isApproved
      ? "APPROVED"
      : "PENDING";
  const statusClass =
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "REJECTED"
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : "bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)] border-[var(--jy-accent-gold)]/30";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--jy-accent-purple)]/20 via-white/[0.02] to-[var(--jy-accent-gold)]/10 p-5 sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--jy-accent-gold)]/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--jy-accent-purple)]/30 blur-3xl" />
      </div>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={astrologer.fullName}
            className="h-20 w-20 rounded-full border-2 border-[var(--jy-accent-gold)]/60 object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-gold)]/10 text-xl font-bold text-[var(--jy-accent-gold)] sm:h-24 sm:w-24 sm:text-2xl">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--jy-text-primary)] sm:text-2xl">
              {astrologer.displayName || astrologer.fullName}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                statusClass,
              )}
            >
              {status}
            </span>
            {status === "APPROVED" && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  astrologer.isActive
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-yellow-500/30 bg-yellow-500/15 text-yellow-300",
                )}
              >
                {astrologer.isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--jy-text-secondary)]">
            {astrologer.email}
            {astrologer.phone ? ` · ${astrologer.phone}` : ""}
          </p>
          {astrologer.isRejected && astrologer.rejectReason && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <strong>Rejection note:</strong> {astrologer.rejectReason}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Requests summary at top ───────────── */

// Status → chip styles. FULFILLED = applied live (loud green).
// APPROVED = admin clicked approve but not yet applied (softer emerald).
// REJECTED = red. PARTIALLY_APPROVED = amber. PENDING = gold.
function statusChipClass(status: string) {
  return status === "FULFILLED"
    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-300"
    : status === "APPROVED"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "REJECTED"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : status === "PARTIALLY_APPROVED"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]";
}

// camelCase / snake_case key → "Sentence case" label so requested
// values from nested objects (e.g. Free sessions offer payload) read
// like form fields instead of raw JSON keys.
function humanizeKey(key: string): string {
  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

// Keys that should render as currency. Anything obviously monetary in
// the free-offer payload. Leaves non-matching keys alone.
const MONEY_KEYS = new Set([
  "price",
  "amount",
  "ratePerMinute",
  "grossValuePerUser",
  "adminPayoutPerUser",
  "astrologerPayoutPerSession",
  "gstPerUser",
  "payablePerUser",
]);

function formatScalar(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "number") {
    if (MONEY_KEYS.has(key)) return `₹${value.toLocaleString()}`;
    return String(value);
  }
  if (typeof value === "string") {
    // ISO-ish date → local short date. Leave everything else as-is.
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
    if (MONEY_KEYS.has(key) && /^\d+(\.\d+)?$/.test(value)) {
      return `₹${Number(value).toLocaleString()}`;
    }
    return value;
  }
  return String(value);
}

// Renders the `rawValue` from a request's `fields` payload. Strings /
// numbers / arrays get a single line. Objects (like the free-sessions
// offer blob) get a compact label→value list — that's the whole reason
// this component exists, so admin-style JSON never leaks to the UI.
function RequestedValue({ value }: { value: unknown }) {
  if (value == null || value === "") return null;

  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v != null && v !== "",
    );
    if (entries.length === 0) return null;
    return (
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-md border border-white/5 bg-black/20 px-2.5 py-2 text-[11px] sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-[9px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
              {humanizeKey(k)}
            </dt>
            <dd className="break-words text-[var(--jy-text-primary)]">
              {typeof v === "object" && v !== null
                ? JSON.stringify(v)
                : formatScalar(k, v)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  const text = Array.isArray(value) ? value.join(", ") : String(value);
  return (
    <p className="whitespace-pre-wrap break-words rounded-md border border-white/5 bg-black/20 px-2 py-1 text-[11px] text-[var(--jy-text-primary)]">
      {text}
    </p>
  );
}

function RequestCard({ r }: { r: any }) {
  const [open, setOpen] = useState(false);
  const status = String(r.overallStatus ?? r.status ?? "PENDING");
  const chipCls = statusChipClass(status);
  const fields = (r.fields ?? {}) as Record<string, any>;
  // Pull the "primary value" out of fields. `_fieldLabel` is the
  // friendly label we store alongside the key — not the value itself.
  // Fall back to the first non-label key.
  const primaryKey = Object.keys(fields).find((k) => k !== "_fieldLabel");
  const rawValue = primaryKey ? fields[primaryKey] : null;
  const fieldLabel =
    (fields._fieldLabel as string | undefined) ??
    (primaryKey ? humanizeKey(primaryKey) : undefined);

  return (
    <li className="rounded-lg border border-white/5 bg-white/[0.02] text-xs transition-colors hover:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--jy-text-primary)]">
            {r.section ?? "Profile change"}
            {fieldLabel && (
              <span className="ml-1 font-normal text-[var(--jy-text-muted)]">
                · {fieldLabel}
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            chipCls,
          )}
        >
          {status}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--jy-text-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-2 border-t border-white/5 px-3 py-2.5">
          {rawValue != null && rawValue !== "" && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
                Requested value
              </span>
              <div className="mt-1">
                <RequestedValue value={rawValue} />
              </div>
            </div>
          )}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
              Your reason
            </span>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[var(--jy-text-secondary)]">
              {r.reason ?? "(no reason)"}
            </p>
          </div>
          {r.adminNote && status !== "PENDING" && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--jy-text-faint)]">
                Admin note
              </span>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[var(--jy-text-secondary)]">
                {r.adminNote}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function RequestsSummary({ requests }: { requests: any[] }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-[var(--jy-text-muted)]">
        No edit requests on record. Tap the pencil next to any section below to ask admin for a change.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
        <Clock className="h-3.5 w-3.5" /> Your edit requests
      </h2>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {requests.slice(0, 6).map((r: any) => (
          <RequestCard key={r.id} r={r} />
        ))}
      </ul>
    </div>
  );
}

/* ───────────── Editable section (read-only + request CTA) ───────────── */

function SectionBlock({
  id,
  title,
  icon,
  rows,
  onRequestEdit,
  requests,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; value: string | null | undefined; long?: boolean }>;
  onRequestEdit: () => void;
  requests: any[];
}) {
  // If a pending request exists for this section, disable the pencil
  // so the astrologer doesn't spam admin with duplicates.
  const pending = (requests ?? []).some(
    (r: any) =>
      String(r.section ?? "").toLowerCase() === id.toLowerCase() &&
      (r.overallStatus ?? r.status) === "PENDING",
  );
  const approvedButUnfulfilled = (requests ?? []).some(
    (r: any) =>
      String(r.section ?? "").toLowerCase() === id.toLowerCase() &&
      (r.overallStatus ?? r.status) === "APPROVED",
  );
  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/15">
            {icon}
          </span>
          {title}
        </h2>
        <button
          type="button"
          disabled={pending}
          onClick={onRequestEdit}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
            pending
              ? "border-white/10 bg-white/5 text-[var(--jy-text-muted)] opacity-60 cursor-not-allowed"
              : approvedButUnfulfilled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:bg-white/10 hover:text-[var(--jy-accent-gold)]",
          )}
          title={
            pending
              ? "You already have a pending request for this section."
              : approvedButUnfulfilled
                ? "Admin approved your last change. Submit another if needed."
                : "Submit an edit request to admin."
          }
        >
          <Pencil className="h-3.5 w-3.5" />
          {pending ? "Request pending" : "Request edit"}
        </button>
      </header>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={cn(r.long && "sm:col-span-2")}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
              {r.label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 text-sm text-[var(--jy-text-primary)]",
                r.long && "whitespace-pre-wrap",
              )}
            >
              {r.value || (
                <span className="text-[var(--jy-text-faint)]">Not set</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ReadOnlySection({
  title,
  icon,
  children,
  requests,
  sectionId,
  onRequestEdit,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  requests?: any[];
  sectionId?: string;
  onRequestEdit?: () => void;
}) {
  // Match by the human label the create-request payload uses so we can
  // reliably tell which section already has a pending or admin-approved
  // ask in flight. Falls back to the sectionId so older rows still resolve.
  const sectionLabel = sectionId ? SECTION_META[sectionId]?.label : "";
  const pending = (requests ?? []).some(
    (r: any) =>
      (String(r.section ?? "").toLowerCase() === sectionLabel.toLowerCase() ||
        String(r.section ?? "").toLowerCase() === String(sectionId).toLowerCase()) &&
      (r.overallStatus ?? r.status) === "PENDING",
  );
  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--jy-bg-card)] p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--jy-accent-gold)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--jy-accent-gold)]/15">
            {icon}
          </span>
          {title}
        </h2>
        {onRequestEdit && (
          <button
            type="button"
            disabled={pending}
            onClick={onRequestEdit}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
              pending
                ? "border-white/10 bg-white/5 text-[var(--jy-text-muted)] opacity-60 cursor-not-allowed"
                : "border-white/10 bg-white/5 text-[var(--jy-text-secondary)] hover:bg-white/10 hover:text-[var(--jy-accent-gold)]",
            )}
            title={
              pending
                ? "You already have a pending request for this section."
                : "Submit a change request to admin."
            }
          >
            <Pencil className="h-3.5 w-3.5" />
            {pending ? "Request pending" : "Request edit"}
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

function RevenueChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null | undefined;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        accent
          ? "border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold",
          accent
            ? "text-[var(--jy-accent-gold)]"
            : "text-[var(--jy-text-primary)]",
        )}
      >
        {value != null ? `${value}%` : "-"}
      </p>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url?: string }) {
  const href = url ? resolveAssetUrl(url) || url : "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2 truncate text-[var(--jy-text-primary)]">
        <FileText className="h-4 w-4 text-[var(--jy-text-muted)]" />
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--jy-accent-gold)] hover:underline"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-[11px] text-[var(--jy-text-muted)]">No file</span>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-5 text-center text-xs text-[var(--jy-text-muted)]">
      {children}
    </p>
  );
}

/* ───────────── Edit request modal ───────────── */

interface FieldOption {
  /** Internal key stored in the request's `fields` JSON. */
  key: string;
  /** Human-readable label surfaced in the dropdown. */
  label: string;
  /** Whether the "New value" input should be a short single line or a
   *  longer textarea — penalties/revenue justifications are always long. */
  long?: boolean;
  /** Free-form helper text under the value textarea. */
  placeholder?: string;
}

/**
 * Section metadata consumed by the edit-request modal. Each entry lists
 * the fields the astrologer is allowed to propose a change for, using
 * friendly labels so the dropdown isn't `fullName / displayName / ...`
 * gibberish. Sections that don't map to a concrete DB column (services,
 * documents, penalties, revenue) use a free-form "describe" field that
 * reaches admin via the reason box — admin then interprets and applies
 * manually from their side.
 */
const SECTION_META: Record<
  string,
  { label: string; fields: FieldOption[] }
> = {
  basic: {
    label: "Basic information",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "displayName", label: "Display name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "gender", label: "Gender" },
    ],
  },
  profile: {
    label: "Profile",
    fields: [
      { key: "experience", label: "Years of experience" },
      { key: "bio", label: "Bio", long: true, placeholder: "Updated bio text…" },
      {
        key: "languages",
        label: "Languages",
        placeholder: "Comma-separated — e.g. Hindi, English, Bengali",
      },
      {
        key: "specializations",
        label: "Specializations",
        placeholder: "Comma-separated — e.g. Vedic, Tarot, Numerology",
      },
    ],
  },
  address: {
    label: "Address",
    fields: [
      { key: "address", label: "Street address", long: true },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
      { key: "postalCode", label: "Postal code" },
    ],
  },
  services: {
    label: "Services & pricing",
    fields: [
      {
        key: "add_service",
        label: "Add a new service",
        long: true,
        placeholder:
          "Service name + price + currency, e.g. 'Kundli review — ₹999 per session'",
      },
      {
        key: "update_service_price",
        label: "Update an existing service price",
        long: true,
        placeholder:
          "Which service + new price, e.g. 'Tarot reading → ₹1500 per session'",
      },
      {
        key: "remove_service",
        label: "Remove a service",
        long: true,
        placeholder: "Which service to remove and why",
      },
    ],
  },
  documents: {
    label: "Documents",
    fields: [
      {
        key: "add_certificate",
        label: "Upload a new certificate",
        long: true,
        placeholder:
          "Certificate name + paste a link to the file (Drive/Dropbox). Admin will attach it on your behalf.",
      },
      {
        key: "replace_document",
        label: "Replace an existing document",
        long: true,
        placeholder: "Which document + what to replace it with",
      },
    ],
  },
  revenue: {
    label: "Revenue & tax",
    fields: [
      {
        key: "change_astrologer_share",
        label: "Change your revenue share",
        long: true,
        placeholder:
          "Requested % and the reason, e.g. 'Increase to 70% — 3-year top performer'",
      },
      {
        key: "change_gst",
        label: "GST cut adjustment",
        long: true,
        placeholder:
          "Proposed GST % + supporting info (tax certificate, category change etc.)",
      },
    ],
  },
  penalty: {
    label: "Dispute a penalty",
    fields: [
      {
        key: "dispute_penalty",
        label: "Dispute an existing penalty",
        long: true,
        placeholder:
          "Which penalty (amount/date) + why you think it should be waived or reduced",
      },
    ],
  },
};

function EditRequestModal({
  section,
  astrologerId,
  onClose,
}: {
  section: string;
  astrologerId: string | number;
  onClose: () => void;
}) {
  const meta = SECTION_META[section] ?? {
    label: section,
    fields: [] as FieldOption[],
  };
  const createRequest = useCreateProfileEditRequest();
  const [selectedFieldKey, setSelectedFieldKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  const selectedField = meta.fields.find((f) => f.key === selectedFieldKey);
  const canSubmit =
    selectedFieldKey && newValue.trim() && reason.trim().length >= 5;

  const submit = async () => {
    if (!canSubmit || !selectedField) return;
    try {
      await createRequest.mutateAsync({
        astrologerId,
        section: meta.label,
        reason: reason.trim(),
        fields: {
          // Persist both the key and the friendly label so the admin
          // review screen reads cleanly ("Update an existing service
          // price" instead of "update_service_price").
          [selectedField.key]: newValue.trim(),
          _fieldLabel: selectedField.label,
        },
      });
      toast.success("Request submitted. Admin will review shortly.");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit request.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-[#0f0a24] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--jy-accent-gold)]">
              Request edit
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--jy-text-primary)]">
              {meta.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--jy-text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
              What do you want to change?
            </label>
            {/* Native <select> inherits the OS default list colour —
                on dark Chrome that rendered a white-on-white dropdown
                because we only themed the closed state. Inline-style
                the <option> elements too so the expanded list stays
                dark. `appearance:none` kills the native arrow; we draw
                our own chevron via a background SVG data URI so the
                field stays consistent with the rest of the form. */}
            <select
              value={selectedFieldKey}
              onChange={(e) => {
                setSelectedFieldKey(e.target.value);
                setNewValue("");
              }}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.85rem center",
                backgroundSize: "14px",
                paddingRight: "2.25rem",
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--jy-text-primary)] outline-none focus:border-[var(--jy-accent-gold)]/50"
            >
              <option
                value=""
                style={{ background: "#0f0a24", color: "#fff" }}
              >
                Select what to change…
              </option>
              {meta.fields.map((f) => (
                <option
                  key={f.key}
                  value={f.key}
                  style={{ background: "#0f0a24", color: "#fff" }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
              {selectedField?.long ? "Describe the change" : "New value"}
            </label>
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={selectedField?.long ? 4 : 2}
              placeholder={
                selectedField?.placeholder ??
                "What should this field be set to?"
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--jy-text-primary)] outline-none focus:border-[var(--jy-accent-gold)]/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--jy-text-muted)]">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why does this need to change? Admin will read this."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--jy-text-primary)] outline-none focus:border-[var(--jy-accent-gold)]/50"
            />
            <p className="mt-1 text-[11px] text-[var(--jy-text-muted)]">
              Min 5 characters.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--jy-text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || createRequest.isPending}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-4 py-2 text-xs font-semibold text-[var(--jy-bg-primary)] shadow-md disabled:opacity-50"
          >
            {createRequest.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <Check className="h-3.5 w-3.5" />
            Submit request
          </button>
        </div>
      </div>
    </div>
  );
}
