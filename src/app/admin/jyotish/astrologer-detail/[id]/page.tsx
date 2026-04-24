"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  X,
  Power,
  Plus,
  Loader2,
  FileText,
  Upload,
  Trash2,
  User,
  MapPin,
  BadgeCheck,
  Percent,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  useAdminAstrologer,
  useUpdateAstrologer,
  useCheckAstrologerDisplayName,
} from "@/services/admin/jyotish";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";

type StatusKind = "PENDING" | "APPROVED" | "REJECTED";

function deriveStatus(a: Record<string, any> | null): StatusKind {
  if (!a) return "PENDING";
  if (a.isRejected) return "REJECTED";
  if (a.isApproved) return "APPROVED";
  return "PENDING";
}

export default function AstrologerDetailByIdPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { data: astrologer, isLoading } = useAdminAstrologer(
    Number.isFinite(id) ? id : null,
  );
  const update = useUpdateAstrologer();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--text-secondary)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading astrologer…
      </div>
    );
  }
  if (!astrologer) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/jyotish/astrologer-detail"
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
        <p className="text-sm text-[var(--text-secondary)]">
          Astrologer not found.
        </p>
      </div>
    );
  }

  const status = deriveStatus(astrologer);
  const isActive = !!astrologer.isActive;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/jyotish/astrologer-detail"
            className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            title="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                {astrologer.displayName || astrologer.fullName || "(unnamed)"}
              </h1>
              <StatusBadge status={status} />
              {status === "APPROVED" && (
                <Badge variant={isActive ? "success" : "warning"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {astrologer.email}
              {astrologer.phone ? ` · ${astrologer.phone}` : ""}
            </p>
          </div>
        </div>

        <ActionsBar
          astrologer={astrologer}
          onMutate={(payload) =>
            update.mutateAsync({ id, ...payload }).then((res) => {
              toast.success("Saved.");
              return res;
            })
          }
          saving={update.isPending}
        />
      </div>

      {status === "REJECTED" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">This astrologer was rejected.</p>
            {astrologer.rejectReason && (
              <p className="mt-1 opacity-80">Reason: {astrologer.rejectReason}</p>
            )}
            <p className="mt-1 text-xs opacity-70">
              Data below is read-only. Reverse the rejection from the top-right actions to edit again.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <BasicInfoCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onSave={(payload) =>
              update.mutateAsync({ id, ...payload }).then(() => {
                toast.success("Profile updated.");
              })
            }
            saving={update.isPending}
          />

          <ProfileCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onSave={(payload) =>
              update.mutateAsync({ id, ...payload }).then(() => {
                toast.success("Profile updated.");
              })
            }
            saving={update.isPending}
          />

          <AddressCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onSave={(payload) =>
              update.mutateAsync({ id, ...payload }).then(() => {
                toast.success("Address updated.");
              })
            }
            saving={update.isPending}
          />

          <ServicesCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onSave={(services) =>
              update.mutateAsync({ id, services }).then(() => {
                toast.success("Services updated.");
              })
            }
            saving={update.isPending}
          />

          <DocumentsCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onAdd={(extraDoc) =>
              update
                .mutateAsync({ id, extraDocuments: [extraDoc] })
                .then(() => {
                  toast.success("Document added.");
                })
            }
            saving={update.isPending}
          />
        </div>

        <div className="space-y-6">
          <RevenueCard
            astrologer={astrologer}
            readOnly={status === "REJECTED"}
            onSave={(payload) =>
              update.mutateAsync({ id, ...payload }).then(() => {
                toast.success("Revenue split saved.");
              })
            }
            saving={update.isPending}
          />

          {status === "APPROVED" && isActive && (
            <PenaltyCard
              astrologer={astrologer}
              onAdd={(penalty) =>
                update.mutateAsync({ id, penalties: [penalty] }).then(() => {
                  toast.success("Penalty recorded.");
                })
              }
              saving={update.isPending}
            />
          )}

          {astrologer.createdAt && (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-secondary)]">
              <p>
                Registered:{" "}
                <span className="text-[var(--text-primary)]">
                  {new Date(astrologer.createdAt).toLocaleString()}
                </span>
              </p>
              <p className="mt-1">
                Credentials emailed:{" "}
                <span className="text-[var(--text-primary)]">
                  {astrologer.credentialsSent ? "Yes" : "No"}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/admin/jyotish/astrologer-detail"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Back to all astrologers
        </Link>
      </div>
    </div>
  );
}

/* ───────── Status chip ───────── */

function StatusBadge({ status }: { status: StatusKind }) {
  if (status === "APPROVED") return <Badge variant="success">Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

/* ───────── Top-right action buttons ───────── */

function ActionsBar({
  astrologer,
  onMutate,
  saving,
}: {
  astrologer: Record<string, any>;
  onMutate: (payload: Record<string, any>) => Promise<any>;
  saving: boolean;
}) {
  const status = deriveStatus(astrologer);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (status === "REJECTED") {
    // Only way out of reject is to revive — clear isRejected + rejectReason.
    return (
      <button
        type="button"
        disabled={saving}
        onClick={() =>
          onMutate({ isRejected: false, rejectReason: null })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium hover:bg-[var(--bg-secondary)] disabled:opacity-50"
      >
        Reopen application
      </button>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onMutate({ isApproved: true, isActive: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          Approve &amp; activate
        </button>
        <RejectButton
          open={rejectOpen}
          setOpen={setRejectOpen}
          reason={rejectReason}
          setReason={setRejectReason}
          saving={saving}
          onConfirm={() =>
            onMutate({
              isRejected: true,
              isApproved: false,
              isActive: false,
              rejectReason: rejectReason.trim() || "Not a fit at this time.",
            }).then(() => {
              setRejectOpen(false);
              setRejectReason("");
            })
          }
        />
      </div>
    );
  }

  // Approved — toggle active/inactive + reject available.
  const isActive = !!astrologer.isActive;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={() => onMutate({ isActive: !isActive })}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60",
          isActive
            ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95"
            : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95",
        )}
      >
        <Power className="h-4 w-4" />
        {isActive ? "Set inactive" : "Set active"}
      </button>
      <RejectButton
        open={rejectOpen}
        setOpen={setRejectOpen}
        reason={rejectReason}
        setReason={setRejectReason}
        saving={saving}
        onConfirm={() =>
          onMutate({
            isRejected: true,
            isApproved: false,
            isActive: false,
            rejectReason: rejectReason.trim() || "Revoked.",
          }).then(() => {
            setRejectOpen(false);
            setRejectReason("");
          })
        }
      />
    </div>
  );
}

function RejectButton({
  open,
  setOpen,
  reason,
  setReason,
  onConfirm,
  saving,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  if (!open) {
    return (
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
      >
        <X className="h-4 w-4" />
        Reject
      </button>
    );
  }
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <input
        type="text"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-red-400 sm:w-64"
      />
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setReason("");
        }}
        className="rounded-xl border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onConfirm}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        Confirm reject
      </button>
    </div>
  );
}

/* ───────── Basic info (name / displayName / contact / gender) ───────── */

function BasicInfoCard({
  astrologer,
  readOnly,
  onSave,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onSave: (payload: Record<string, any>) => Promise<any>;
  saving: boolean;
}) {
  const [fullName, setFullName] = useState(astrologer.fullName ?? "");
  const [displayName, setDisplayName] = useState(astrologer.displayName ?? "");
  const [email, setEmail] = useState(astrologer.email ?? "");
  const [phone, setPhone] = useState(astrologer.phone ?? "");
  const [gender, setGender] = useState(astrologer.gender ?? "");

  useEffect(() => {
    setFullName(astrologer.fullName ?? "");
    setDisplayName(astrologer.displayName ?? "");
    setEmail(astrologer.email ?? "");
    setPhone(astrologer.phone ?? "");
    setGender(astrologer.gender ?? "");
  }, [astrologer.id]);

  const { data: nameCheck, isFetching: nameChecking } =
    useCheckAstrologerDisplayName(displayName, astrologer.id);
  const nameClash =
    !!displayName &&
    displayName !== (astrologer.displayName ?? "") &&
    nameCheck &&
    !nameCheck.available;

  const dirty =
    fullName !== (astrologer.fullName ?? "") ||
    displayName !== (astrologer.displayName ?? "") ||
    email !== (astrologer.email ?? "") ||
    phone !== (astrologer.phone ?? "") ||
    gender !== (astrologer.gender ?? "");

  return (
    <SectionCard title="Basic information" icon={<User className="h-4 w-4" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabelledInput
          label="Full name"
          value={fullName}
          onChange={setFullName}
          disabled={readOnly}
        />
        <div>
          <LabelledInput
            label="Display name (must be unique)"
            value={displayName}
            onChange={setDisplayName}
            disabled={readOnly}
            invalid={!!nameClash}
          />
          <p
            className={cn(
              "mt-1 text-[11px]",
              nameClash
                ? "text-red-500"
                : "text-[var(--text-muted)]",
            )}
          >
            {nameChecking
              ? "Checking…"
              : nameClash
                ? "Already in use — pick another."
                : "Shown to shoppers in astrologer listings."}
          </p>
        </div>
        <LabelledInput
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          disabled={readOnly}
        />
        <LabelledInput
          label="Phone (full international)"
          value={phone}
          onChange={setPhone}
          disabled={readOnly}
        />
        <div>
          <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Gender
          </span>
          <div className="flex gap-2">
            {["MALE", "FEMALE", "OTHER"].map((g) => (
              <button
                key={g}
                type="button"
                disabled={readOnly}
                onClick={() => setGender(g)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  gender === g
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]",
                )}
              >
                {g[0] + g.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      {!readOnly && (
        <SaveRow
          dirty={dirty}
          saving={saving}
          disabled={!!nameClash}
          onSave={() =>
            onSave({ fullName, displayName, email, phone, gender: gender || null })
          }
        />
      )}
    </SectionCard>
  );
}

/* ───────── Profile (bio / experience / languages / specializations) ───────── */

function ProfileCard({
  astrologer,
  readOnly,
  onSave,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onSave: (payload: Record<string, any>) => Promise<any>;
  saving: boolean;
}) {
  const profile = astrologer.profile ?? {};
  const [bio, setBio] = useState(astrologer.bio ?? profile.bio ?? "");
  const [experience, setExperience] = useState(
    profile.experience != null ? String(profile.experience) : "",
  );
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [specializations, setSpecializations] = useState<string[]>(
    profile.specializations ?? [],
  );
  const [langInput, setLangInput] = useState("");
  const [specInput, setSpecInput] = useState("");

  useEffect(() => {
    const p = astrologer.profile ?? {};
    setBio(astrologer.bio ?? p.bio ?? "");
    setExperience(p.experience != null ? String(p.experience) : "");
    setLanguages(p.languages ?? []);
    setSpecializations(p.specializations ?? []);
  }, [astrologer.id]);

  return (
    <SectionCard
      title="Profile details"
      icon={<Sparkles className="h-4 w-4" />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LabelledInput
          label="Years of experience"
          value={experience}
          onChange={setExperience}
          type="number"
          disabled={readOnly}
        />
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Bio
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={readOnly}
            rows={4}
            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <ChipList
        label="Languages"
        values={languages}
        setValues={setLanguages}
        draft={langInput}
        setDraft={setLangInput}
        disabled={readOnly}
      />
      <ChipList
        label="Specializations"
        values={specializations}
        setValues={setSpecializations}
        draft={specInput}
        setDraft={setSpecInput}
        disabled={readOnly}
      />

      {!readOnly && (
        <SaveRow
          dirty
          saving={saving}
          onSave={() =>
            onSave({
              bio,
              experience: experience ? Number(experience) : null,
              languages,
              specializations,
            })
          }
        />
      )}
    </SectionCard>
  );
}

function ChipList({
  label,
  values,
  setValues,
  draft,
  setDraft,
  disabled,
}: {
  label: string;
  values: string[];
  setValues: (v: string[]) => void;
  draft: string;
  setDraft: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4">
      <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)]"
          >
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={() => setValues(values.filter((x) => x !== v))}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = draft.trim();
                  if (v && !values.includes(v)) setValues([...values, v]);
                  setDraft("");
                }
              }}
              placeholder="Type and press Enter"
              className="min-w-[160px] flex-1 rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── Address ───────── */

function AddressCard({
  astrologer,
  readOnly,
  onSave,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onSave: (payload: Record<string, any>) => Promise<any>;
  saving: boolean;
}) {
  const profile = astrologer.profile ?? {};
  const [address, setAddress] = useState(profile.address ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [postalCode, setPostalCode] = useState(profile.postalCode ?? "");

  useEffect(() => {
    const p = astrologer.profile ?? {};
    setAddress(p.address ?? "");
    setCity(p.city ?? "");
    setState(p.state ?? "");
    setCountry(p.country ?? "");
    setPostalCode(p.postalCode ?? "");
  }, [astrologer.id]);

  return (
    <SectionCard title="Address" icon={<MapPin className="h-4 w-4" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Street address
          </span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <LabelledInput label="City" value={city} onChange={setCity} disabled={readOnly} />
        <LabelledInput label="State" value={state} onChange={setState} disabled={readOnly} />
        <LabelledInput
          label="Country"
          value={country}
          onChange={setCountry}
          disabled={readOnly}
        />
        <LabelledInput
          label="Postal code"
          value={postalCode}
          onChange={setPostalCode}
          disabled={readOnly}
        />
      </div>
      {!readOnly && (
        <SaveRow
          dirty
          saving={saving}
          onSave={() => onSave({ address, city, state, country, postalCode })}
        />
      )}
    </SectionCard>
  );
}

/* ───────── Services ───────── */

function ServicesCard({
  astrologer,
  readOnly,
  onSave,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onSave: (
    services: Array<{
      serviceName: string;
      price: number;
      currency: string;
      currencySymbol: string;
    }>,
  ) => Promise<any>;
  saving: boolean;
}) {
  const existing = (astrologer.services ?? []) as Array<Record<string, any>>;
  const [rows, setRows] = useState<
    Array<{
      serviceName: string;
      price: string;
      currency: string;
      currencySymbol: string;
    }>
  >(() =>
    existing.map((s) => ({
      serviceName: s.serviceName ?? "",
      price: s.price != null ? String(s.price) : "",
      currency: s.currency ?? "INR",
      currencySymbol: s.currencySymbol ?? "₹",
    })),
  );

  useEffect(() => {
    const nextRows = ((astrologer.services ?? []) as Array<Record<string, any>>).map(
      (s) => ({
        serviceName: s.serviceName ?? "",
        price: s.price != null ? String(s.price) : "",
        currency: s.currency ?? "INR",
        currencySymbol: s.currencySymbol ?? "₹",
      }),
    );
    setRows(nextRows);
  }, [astrologer.id]);

  return (
    <SectionCard
      title="Services & pricing"
      icon={<BadgeCheck className="h-4 w-4" />}
    >
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
            No services configured.
          </p>
        )}
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 sm:grid-cols-[1.5fr_1fr_0.6fr_auto]"
          >
            <input
              type="text"
              value={r.serviceName}
              disabled={readOnly}
              onChange={(e) =>
                setRows(
                  rows.map((x, j) =>
                    j === i ? { ...x, serviceName: e.target.value } : x,
                  ),
                )
              }
              placeholder="Service name"
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none disabled:opacity-60"
            />
            <input
              type="number"
              value={r.price}
              disabled={readOnly}
              onChange={(e) =>
                setRows(
                  rows.map((x, j) =>
                    j === i ? { ...x, price: e.target.value } : x,
                  ),
                )
              }
              placeholder="Price"
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none disabled:opacity-60"
            />
            <span className="text-xs text-[var(--text-muted)]">
              {r.currencySymbol} {r.currency}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setRows([
                ...rows,
                { serviceName: "", price: "", currency: "INR", currencySymbol: "₹" },
              ])
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add service
          </button>
          <SaveRow
            inline
            dirty
            saving={saving}
            onSave={() =>
              onSave(
                rows
                  .filter((r) => r.serviceName.trim())
                  .map((r) => ({
                    serviceName: r.serviceName.trim(),
                    price: Number(r.price) || 0,
                    currency: r.currency,
                    currencySymbol: r.currencySymbol,
                  })),
              )
            }
          />
        </div>
      )}
    </SectionCard>
  );
}

/* ───────── Documents (ID proof + extra documents) ───────── */

function DocumentsCard({
  astrologer,
  readOnly,
  onAdd,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onAdd: (doc: { title: string; fileUrl: string }) => Promise<any>;
  saving: boolean;
}) {
  const documents = (astrologer.documents ?? []) as Array<Record<string, any>>;
  const extraDocuments = (astrologer.extraDocuments ?? []) as Array<
    Record<string, any>
  >;
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const uploadMut = useUpload();

  const handlePick = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }
    try {
      const { url } = await uploadMut.mutateAsync({
        file,
        folder: "astrologer-documents",
      });
      setFileUrl(url);
    } catch {
      /* toast via useUpload */
    }
  };

  return (
    <SectionCard title="Documents" icon={<FileText className="h-4 w-4" />}>
      {documents.length === 0 && extraDocuments.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
          No documents uploaded yet.
        </p>
      )}

      {documents.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Verification documents
          </p>
          <div className="space-y-2">
            {documents.map((d) => (
              <DocRow
                key={d.id}
                title={String(d.type ?? "Document")}
                url={d.fileUrl}
              />
            ))}
          </div>
        </div>
      )}

      {extraDocuments.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Additional certificates
          </p>
          <div className="space-y-2">
            {extraDocuments.map((d) => (
              <DocRow key={d.id} title={d.title || "Document"} url={d.fileUrl} />
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="mt-4">
          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add more
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
              <LabelledInput
                label="Title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Vedic Astrology Level 2"
              />
              <div>
                <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                  File (PDF or image, &lt;5 MB)
                </span>
                {fileUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={resolveAssetUrl(fileUrl) || fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Uploaded — preview
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFileUrl("")}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                    <Upload className="h-4 w-4" />
                    {uploadMut.isPending ? "Uploading…" : "Upload file"}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePick(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving || !title.trim() || !fileUrl}
                  onClick={() =>
                    onAdd({ title: title.trim(), fileUrl }).then(() => {
                      setAddOpen(false);
                      setTitle("");
                      setFileUrl("");
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setTitle("");
                    setFileUrl("");
                  }}
                  className="rounded-xl border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function DocRow({ title, url }: { title: string; url: string | null | undefined }) {
  const href = url ? resolveAssetUrl(url) || url : "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2">
      <span className="inline-flex items-center gap-2 truncate text-sm text-[var(--text-primary)]">
        <FileText className="h-4 w-4 text-[var(--text-muted)]" />
        {title}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-xs text-[var(--text-muted)]">No file</span>
      )}
    </div>
  );
}

/* ───────── Revenue split (GST + astrologer/admin) ───────── */

function RevenueCard({
  astrologer,
  readOnly,
  onSave,
  saving,
}: {
  astrologer: Record<string, any>;
  readOnly: boolean;
  onSave: (payload: Record<string, any>) => Promise<any>;
  saving: boolean;
}) {
  const [gst, setGst] = useState(
    astrologer.gst != null ? String(astrologer.gst) : "",
  );
  const [revAstro, setRevAstro] = useState(
    astrologer.revenueAstrologer != null
      ? String(astrologer.revenueAstrologer)
      : "",
  );
  const [revAdmin, setRevAdmin] = useState(
    astrologer.revenueAdmin != null ? String(astrologer.revenueAdmin) : "",
  );

  useEffect(() => {
    setGst(astrologer.gst != null ? String(astrologer.gst) : "");
    setRevAstro(
      astrologer.revenueAstrologer != null
        ? String(astrologer.revenueAstrologer)
        : "",
    );
    setRevAdmin(
      astrologer.revenueAdmin != null ? String(astrologer.revenueAdmin) : "",
    );
  }, [astrologer.id]);

  const splitWarn =
    revAstro && revAdmin && Number(revAstro) + Number(revAdmin) !== 100;

  return (
    <SectionCard title="Revenue split" icon={<Percent className="h-4 w-4" />}>
      <div className="space-y-3">
        <LabelledInput
          label="GST cut (%)"
          value={gst}
          onChange={setGst}
          type="number"
          disabled={readOnly}
          hint="Deducted first from the session price."
        />
        <LabelledInput
          label="Astrologer share (%)"
          value={revAstro}
          onChange={setRevAstro}
          type="number"
          disabled={readOnly}
          hint="After GST."
        />
        <LabelledInput
          label="Platform / admin share (%)"
          value={revAdmin}
          onChange={setRevAdmin}
          type="number"
          disabled={readOnly}
          hint="After GST."
        />
        {splitWarn && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Astrologer + platform should sum to 100%. Currently{" "}
            {Number(revAstro) + Number(revAdmin)}%.
          </p>
        )}
      </div>
      {!readOnly && (
        <SaveRow
          dirty
          saving={saving}
          onSave={() =>
            onSave({
              gst: gst ? Number(gst) : null,
              revenueAstrologer: revAstro ? Number(revAstro) : null,
              revenueAdmin: revAdmin ? Number(revAdmin) : null,
            })
          }
        />
      )}
    </SectionCard>
  );
}

/* ───────── Penalties (active astrologers only) ───────── */

function PenaltyCard({
  astrologer,
  onAdd,
  saving,
}: {
  astrologer: Record<string, any>;
  onAdd: (p: {
    amount: number;
    reason: string;
    settlement?: string;
    paid?: number;
  }) => Promise<any>;
  saving: boolean;
}) {
  const penalties = (astrologer.penalties ?? []) as Array<Record<string, any>>;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [settlement, setSettlement] = useState("");
  const [paid, setPaid] = useState("");

  return (
    <SectionCard
      title="Penalties"
      icon={<AlertTriangle className="h-4 w-4" />}
    >
      {penalties.length === 0 && !open && (
        <p className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
          No penalties logged.
        </p>
      )}

      {penalties.length > 0 && (
        <div className="space-y-2">
          {penalties.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    ₹{Number(p.amount ?? 0).toLocaleString("en-IN")}
                  </p>
                  {p.reason && (
                    <p className="mt-0.5 text-[var(--text-secondary)]">
                      {p.reason}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    p.paid && Number(p.paid) > 0 ? "success" : "warning"
                  }
                >
                  {p.paid && Number(p.paid) > 0
                    ? `Paid ₹${Number(p.paid).toLocaleString("en-IN")}`
                    : "Unpaid"}
                </Badge>
              </div>
              {p.settlement && (
                <p className="mt-1 text-[var(--text-muted)]">
                  Settlement: {p.settlement}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
          <LabelledInput label="Amount (₹)" value={amount} onChange={setAmount} type="number" />
          <LabelledInput label="Reason" value={reason} onChange={setReason} />
          <LabelledInput
            label="Settlement note"
            value={settlement}
            onChange={setSettlement}
          />
          <LabelledInput
            label="Amount paid (₹, leave blank if unpaid)"
            value={paid}
            onChange={setPaid}
            type="number"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || !amount || !reason.trim()}
              onClick={() =>
                onAdd({
                  amount: Number(amount) || 0,
                  reason: reason.trim(),
                  settlement: settlement.trim() || undefined,
                  paid: paid ? Number(paid) : undefined,
                }).then(() => {
                  setOpen(false);
                  setAmount("");
                  setReason("");
                  setSettlement("");
                  setPaid("");
                })
              }
              className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Log penalty
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setAmount("");
                setReason("");
                setSettlement("");
                setPaid("");
              }}
              className="rounded-xl border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add penalty
        </button>
      )}
    </SectionCard>
  );
}

/* ───────── Shared small bits ───────── */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function LabelledInput({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  invalid,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-60",
          invalid ? "border-red-400" : "border-[var(--border-primary)]",
        )}
      />
      {hint && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}

function SaveRow({
  dirty,
  saving,
  disabled,
  onSave,
  inline,
}: {
  dirty: boolean;
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
  inline?: boolean;
}) {
  const btn = (
    <button
      type="button"
      disabled={saving || disabled}
      onClick={onSave}
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      Save changes
    </button>
  );
  if (inline) return <div className="ml-auto">{btn}</div>;
  return <div className="mt-4 flex justify-end">{btn}</div>;
}
