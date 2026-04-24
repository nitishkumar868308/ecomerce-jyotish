"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Sparkles,
  User,
  Mail,
  Phone,
  BadgeCheck,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  Plus,
} from "lucide-react";
import { useJyotishRegister } from "@/services/jyotish/auth";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { APP_NAME } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  useCountries,
  useStatesByCountry,
  useCitiesByState,
} from "@/services/admin/location";
import { useConsultantServices } from "@/services/consultant";
import { FileText } from "lucide-react";

// Photo / document upload guardrails. The storefront rejects > 5 MB and
// only images / PDFs reach the backend.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES = 5 * 1024 * 1024;
const DOC_ACCEPT = "application/pdf,image/*";

type Gender = "MALE" | "FEMALE" | "OTHER";
type IdProofType = "AADHAAR" | "PAN" | "PASSPORT" | "DRIVING_LICENSE";

interface FormState {
  fullName: string;
  displayName: string;
  email: string;
  // Country dial code is derived from the Country master once the shopper
  // picks a country in step 3 — no more static dropdown in step 1.
  countryCode: string;
  phoneLocal: string;
  gender: Gender | "";
  bio: string;
  experience: string;
  profilePhoto: string;
  languages: string[];
  // Services the astrologer offers — IDs come from the admin "Consultant
  // services" console. A single `servicePrice` applies to every selected
  // service (per-service price tiers aren't supported by design).
  serviceIds: number[];
  servicePrice: string;
  address: string;
  // city/state/country are the stored strings sent to the backend; the
  // *_Id fields back the searchable dropdowns so we can cascade the
  // location queries correctly.
  city: string;
  cityId: number | null;
  state: string;
  stateId: number | null;
  country: string;
  countryId: number | null;
  countryIso2: string;
  postalCode: string;
  idProofType: IdProofType | "";
  idProofValue: string;
  idProofFile: string;
  certificateFile: string;
}

const EMPTY: FormState = {
  fullName: "",
  displayName: "",
  email: "",
  countryCode: "",
  phoneLocal: "",
  gender: "",
  bio: "",
  experience: "",
  profilePhoto: "",
  languages: [],
  serviceIds: [],
  servicePrice: "",
  address: "",
  city: "",
  cityId: null,
  state: "",
  stateId: null,
  country: "",
  countryId: null,
  countryIso2: "",
  postalCode: "",
  idProofType: "",
  idProofValue: "",
  idProofFile: "",
  certificateFile: "",
};

const STEPS = [
  { n: 1, label: "Basics", Icon: User },
  { n: 2, label: "Profile", Icon: Sparkles },
  { n: 3, label: "Services", Icon: Sparkles },
  { n: 4, label: "Address", Icon: MapPin },
  { n: 5, label: "Verify", Icon: BadgeCheck },
];

const TOTAL_STEPS = 5;

const LANGUAGE_SUGGESTIONS = [
  "Hindi",
  "English",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Punjabi",
];

// SPECIALIZATION_SUGGESTIONS was removed — services now come from the
// admin "Consultant services" console via useConsultantServices().

const _COUNTRY_CODES_DEPRECATED = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
  { code: "+65", country: "Singapore" },
];

export default function RegisterJyotishPage() {
  const router = useRouter();
  const register = useJyotishRegister();
  const uploadMut = useUpload();
  const { data: services = [] } = useConsultantServices();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleChip = (key: "languages", value: string) => {
    setForm((f) => {
      const list = f[key];
      return {
        ...f,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  };

  const addCustomChip = (key: "languages", raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setForm((f) => {
      if (f[key].includes(value)) return f;
      return { ...f, [key]: [...f[key], value] };
    });
  };

  const toggleService = (id: number) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((x) => x !== id)
        : [...f.serviceIds, id],
    }));
  };

  // Trim before testing so stray whitespace the shopper didn't notice
  // doesn't silently keep the Continue button disabled.
  const phoneOk = /^\d{6,15}$/.test(form.phoneLocal.trim());
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const stepValid = useMemo(() => {
    if (step === 1) {
      // Basics — every field mandatory so admin review has the full
      // picture before approving credentials.
      return (
        form.fullName.trim().length >= 2 &&
        form.displayName.trim().length >= 2 &&
        emailOk &&
        !!form.gender
      );
    }
    if (step === 2) {
      // Profile — photo + experience + bio + at least one language.
      return (
        !!form.profilePhoto &&
        Number(form.experience) > 0 &&
        form.bio.trim().length >= 10 &&
        form.languages.length > 0
      );
    }
    if (step === 3) {
      // Services: at least one service ticked + a positive price.
      return form.serviceIds.length > 0 && Number(form.servicePrice) > 0;
    }
    if (step === 4) {
      // Full address + phone — everything the admin needs to dispatch
      // credentials and the shopper sees on the profile.
      return (
        !!form.countryId &&
        !!form.stateId &&
        !!form.cityId &&
        form.address.trim().length >= 4 &&
        form.postalCode.trim().length >= 3 &&
        phoneOk &&
        !!form.countryCode
      );
    }
    // Step 5 — identity verification: type + number + both files required.
    return (
      !!form.idProofType &&
      form.idProofValue.trim().length >= 4 &&
      !!form.idProofFile &&
      !!form.certificateFile
    );
  }, [step, form, emailOk, phoneOk]);

  const handlePhotoPick = async (file: File) => {
    // Hard-cap photo uploads at 5 MB so admins don't end up dragging
    // multi-megabyte DSLR shots into the profile surface.
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be 5 MB or smaller.");
      return;
    }
    try {
      const { url } = await uploadMut.mutateAsync({
        file,
        folder: "astrologer-photos",
      });
      update("profilePhoto", url);
    } catch {
      // toast handled inside useUpload
    }
  };

  const handleDocPick = async (
    file: File,
    target: "idProofFile" | "certificateFile",
  ) => {
    if (file.size > MAX_DOC_BYTES) {
      toast.error("Document must be 5 MB or smaller.");
      return;
    }
    const mime = file.type.toLowerCase();
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImg = mime.startsWith("image/");
    if (!isPdf && !isImg) {
      toast.error("Only PDF or image files are accepted.");
      return;
    }
    try {
      const { url } = await uploadMut.mutateAsync({
        file,
        folder: "astrologer-documents",
      });
      update(target, url);
    } catch {
      /* toast handled by useUpload */
    }
  };

  const handleSubmit = () => {
    if (!stepValid) return;
    // Attach uploaded files as DocumentItemDto entries the backend
    // accepts. The `DocumentType` enum in Prisma only has `ID_PROOF` and
    // `CERTIFICATE` — the specific AADHAAR/PAN/PASSPORT kind is carried
    // separately on profile.idProofType, not as the document `type`.
    const documents: Array<{ type: string; fileUrl: string }> = [];
    if (form.idProofFile) {
      documents.push({ type: "ID_PROOF", fileUrl: form.idProofFile });
    }
    if (form.certificateFile) {
      documents.push({ type: "CERTIFICATE", fileUrl: form.certificateFile });
    }
    // Backend `ServiceItemDto` expects `{ serviceName, price?, currency,
    // currencySymbol }`. We carry one shared `servicePrice` across every
    // picked service, and default currency to INR (admin can tweak later
    // in the astrologer's dashboard).
    const price = Number(form.servicePrice) || 0;
    const pickedServices = (services as Array<{ id: number; title: string }>)
      .filter((s) => form.serviceIds.includes(s.id))
      .map((s) => ({
        serviceName: s.title,
        price,
        currency: "INR",
        currencySymbol: "\u20b9",
      }));
    const payload = {
      fullName: form.fullName.trim(),
      displayName: form.displayName.trim() || undefined,
      email: form.email.trim(),
      countryCode: form.countryCode,
      phoneLocal: form.phoneLocal,
      phone: `${form.countryCode}${form.phoneLocal}`,
      gender: form.gender || undefined,
      bio: form.bio.trim() || undefined,
      experience: form.experience ? Number(form.experience) : undefined,
      profilePhoto: form.profilePhoto || undefined,
      languages: form.languages,
      specializations: pickedServices.map((s) => s.serviceName),
      services: pickedServices.length ? pickedServices : undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      idProofType: form.idProofType || undefined,
      idProofValue: form.idProofValue.trim() || undefined,
      documents: documents.length ? documents : undefined,
    };
    register.mutate(payload as any, {
      onSuccess: () => {
        toast.success(
          "Registration received — admin will review and email you credentials.",
        );
        router.push("/login-jyotish");
      },
    });
  };

  const next = () => {
    if (!stepValid) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else handleSubmit();
  };

  return (
    // Explicit dark gradient underneath the celestial overlay — the
    // overlay can fail to load before the JS hydrates, which is what made
    // this page flash plain white. The wrapper guarantees the space
    // theme (and white-on-dark text) even in that frame.
    <div className="min-h-screen bg-gradient-to-b from-[#06040f] via-[#0b0a1f] to-[#120a24] text-white [&_[class*='text-[var(--jy-text-primary)]']]:text-white [&_[class*='text-[var(--jy-text-secondary)]']]:text-white/80 [&_[class*='text-[var(--jy-text-muted)]']]:text-white/55 [&_input]:text-white [&_input::placeholder]:text-white/40 [&_textarea]:text-white [&_textarea::placeholder]:text-white/40 [&_select]:text-white">
    <CelestialBackground className="min-h-screen">
      <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-6 text-center sm:mb-8">
            <Link
              href={ROUTES.JYOTISH.HOME}
              className="inline-flex items-center gap-2 text-[var(--jy-accent-gold)]"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-lg font-bold uppercase tracking-widest">
                {APP_NAME} Jyotish
              </span>
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-[var(--jy-text-primary)] sm:text-3xl">
              Join as an Astrologer
            </h1>
            <p className="mt-1 text-sm text-[var(--jy-text-muted)]">
              Takes ~3 minutes. Credentials are emailed after admin approval.
            </p>
          </div>

          <StepIndicator current={step} />

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:mt-6 sm:p-7">
            {step === 1 && (
              <StepSection
                title="Basic information"
                description="How astrologer-seekers will find and recognise you."
              >
                <Field label="Full name" required>
                  <InputWithIcon
                    icon={<User className="h-4 w-4" />}
                    value={form.fullName}
                    onChange={(v) => update("fullName", v)}
                    placeholder="Pandit Ravi Sharma"
                  />
                </Field>
                <Field
                  label="Display name"
                  required
                  hint="Shown to users in listings."
                >
                  <InputBase
                    value={form.displayName}
                    onChange={(v) => update("displayName", v)}
                    placeholder="Pandit Ravi"
                  />
                </Field>
                <Field label="Email" required>
                  <InputWithIcon
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    placeholder="you@example.com"
                  />
                </Field>
                {/* Phone moved to step 3 — the Country picker there
                    provides the dial code so we don't ask for it twice. */}
                <Field label="Gender" required>
                  <div className="grid grid-cols-3 gap-2">
                    {(["MALE", "FEMALE", "OTHER"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => update("gender", g)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                          form.gender === g
                            ? "border-[var(--jy-accent-gold)] bg-gradient-to-br from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/30 ring-2 ring-[var(--jy-accent-gold)]/40 scale-[1.02]"
                            : "border-white/10 bg-white/[0.03] text-[var(--jy-text-secondary)] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                      >
                        {g[0] + g.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </Field>
              </StepSection>
            )}

            {step === 2 && (
              <StepSection
                title="Your profile"
                description="Shoppers see this on your public profile. All fields are required."
              >
                <Field label="Profile photo" required>
                  <PhotoPicker
                    url={form.profilePhoto}
                    onPick={handlePhotoPick}
                    onClear={() => update("profilePhoto", "")}
                    uploading={uploadMut.isPending}
                  />
                </Field>

                <Field label="Years of experience" required>
                  <InputBase
                    type="number"
                    value={form.experience}
                    onChange={(v) => update("experience", v)}
                    placeholder="e.g. 7"
                    min={0}
                  />
                </Field>

                <Field label="Bio" required hint="At least 10 characters.">
                  <TextareaBase
                    value={form.bio}
                    onChange={(v) => update("bio", v)}
                    placeholder="Experienced Vedic astrologer specialising in\u2026"
                    rows={4}
                  />
                </Field>

                <Field label="Languages" required>
                  <ChipPicker
                    selected={form.languages}
                    suggestions={LANGUAGE_SUGGESTIONS}
                    onToggle={(v) => toggleChip("languages", v)}
                    onAdd={(v) => addCustomChip("languages", v)}
                    addPlaceholder="Add another language"
                  />
                </Field>
              </StepSection>
            )}

            {step === 3 && (
              <StepSection
                title="Services you offer"
                description="Pick every service you'll take bookings for. A single price below applies to every one you've ticked."
              >
                <Field label="Services" required>
                  {services.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/60">
                      No services are published yet. Please check back once
                      admin has configured the services list.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(services as Array<{
                        id: number;
                        title: string;
                        active?: boolean;
                      }>).filter((s) => s.active !== false).map((s) => {
                        const picked = form.serviceIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleService(s.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.97] sm:text-sm",
                              picked
                                ? "border-[var(--jy-accent-gold)] bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/30 ring-2 ring-[var(--jy-accent-gold)]/40 scale-[1.02]"
                                : "border-white/15 bg-white/[0.03] text-white/80 hover:border-white/30 hover:bg-white/[0.08]",
                            )}
                          >
                            {picked && <Check className="h-3.5 w-3.5" />}
                            {s.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Field>

                <Field
                  label="Price per session (INR)"
                  required
                  hint="Applies to every service ticked above."
                >
                  <InputBase
                    type="number"
                    value={form.servicePrice}
                    onChange={(v) =>
                      update("servicePrice", v.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="e.g. 499"
                    min={0}
                  />
                </Field>
              </StepSection>
            )}

            {step === 4 && (
              <StepSection
                title="Address & contact"
                description="Country picks your phone dial code automatically."
              >
                <LocationFields form={form} setForm={setForm} />

                <Field
                  label="Phone"
                  required
                  hint={
                    form.countryCode
                      ? `Dial code ${form.countryCode} detected from country.`
                      : "Pick a country above to auto-fill the dial code."
                  }
                >
                  <div className="flex gap-2">
                    <div className="flex min-w-[76px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2.5 text-sm font-medium text-white">
                      {form.countryCode || "\u2014"}
                    </div>
                    <InputWithIcon
                      icon={<Phone className="h-4 w-4" />}
                      value={form.phoneLocal}
                      onChange={(v) =>
                        update("phoneLocal", v.replace(/\D/g, ""))
                      }
                      placeholder="9876543210"
                      inputMode="numeric"
                    />
                  </div>
                </Field>

                <Field label="Street address" required>
                  <TextareaBase
                    value={form.address}
                    onChange={(v) => update("address", v)}
                    placeholder="Flat, building, street\u2026"
                    rows={2}
                  />
                </Field>
                <Field label="Postal code" required>
                  <InputBase
                    value={form.postalCode}
                    onChange={(v) =>
                      update("postalCode", v.replace(/[^0-9A-Za-z\s-]/g, ""))
                    }
                    placeholder="400001"
                  />
                </Field>
              </StepSection>
            )}

            {step === 5 && (
              <StepSection
                title="Identity verification"
                description="Pick a document type and enter the ID number. We use this only for admin review."
              >
                <Field label="Document type" required>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        "AADHAAR",
                        "PAN",
                        "PASSPORT",
                        "DRIVING_LICENSE",
                      ] as IdProofType[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("idProofType", t)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] sm:text-sm",
                          form.idProofType === t
                            ? "border-[var(--jy-accent-gold)] bg-gradient-to-br from-[var(--jy-accent-gold)] to-amber-500 text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/30 ring-2 ring-[var(--jy-accent-gold)]/40 scale-[1.02]"
                            : "border-white/10 bg-white/[0.03] text-[var(--jy-text-secondary)] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                      >
                        {t.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field
                  label="Document number"
                  required
                  hint="Upload a scanned copy (PDF or image) below."
                >
                  <InputBase
                    value={form.idProofValue}
                    onChange={(v) => update("idProofValue", v)}
                    placeholder={
                      form.idProofType === "AADHAAR"
                        ? "1234-5678-9012"
                        : form.idProofType === "PAN"
                          ? "ABCDE1234F"
                          : "Document number"
                    }
                  />
                  <DocUploader
                    label="ID proof file"
                    url={form.idProofFile}
                    uploading={uploadMut.isPending}
                    onPick={(f) => handleDocPick(f, "idProofFile")}
                    onClear={() => update("idProofFile", "")}
                  />
                </Field>

                <Field
                  label="Certificate"
                  required
                  hint="Astrology / Vedic / Jyotish certification (PDF preferred)."
                >
                  <DocUploader
                    label="Certificate"
                    url={form.certificateFile}
                    uploading={uploadMut.isPending}
                    onPick={(f) => handleDocPick(f, "certificateFile")}
                    onClear={() => update("certificateFile", "")}
                  />
                </Field>

                <div className="mt-4 rounded-xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/10 p-4 text-xs text-[var(--jy-text-secondary)]">
                  After you submit, an admin reviews your registration. Once
                  approved, we&apos;ll email you a password so you can sign in
                  at <strong>Login Jyotish</strong>.
                </div>
              </StepSection>
            )}

            {/* Step nav */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5 sm:mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--jy-text-secondary)] hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={next}
                disabled={!stepValid || register.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 px-5 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)] shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {step === TOTAL_STEPS
                  ? register.isPending
                    ? "Submitting\u2026"
                    : "Submit registration"
                  : "Continue"}
                {step < TOTAL_STEPS && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--jy-text-muted)]">
            Already registered?{" "}
            <Link
              href="/login-jyotish"
              className="font-semibold text-[var(--jy-accent-gold)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </CelestialBackground>
    </div>
  );
}

/* ───── Sub-components ───── */

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map(({ n, label, Icon }, i) => {
        const done = n < current;
        const active = n === current;
        return (
          <li key={n} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                  done &&
                    "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)]",
                  active &&
                    "border-[var(--jy-accent-gold)] bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]",
                  !done &&
                    !active &&
                    "border-white/15 bg-white/[0.03] text-[var(--jy-text-muted)]",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  active
                    ? "text-[var(--jy-accent-gold)]"
                    : "text-[var(--jy-text-muted)]",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  n < current ? "bg-[var(--jy-accent-gold)]" : "bg-white/10",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Wraps three cascading searchable selects (country → state → city) that
// hit the same location masters the checkout form uses. Writes both the
// display name (sent to the backend) and the numeric ID (drives the
// cascade) back onto the parent form state.
function LocationFields({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const { data: countries, isLoading: loadingCountries } = useCountries();
  const { data: states, isLoading: loadingStates } = useStatesByCountry(
    form.countryId ?? undefined,
  );
  const { data: cities, isLoading: loadingCities } = useCitiesByState(
    form.stateId ?? undefined,
  );

  const countryOptions = React.useMemo(
    () =>
      (countries ?? []).map((c) => ({
        value: c.id,
        label: `${c.emoji ?? ""} ${c.name}`.trim(),
      })),
    [countries],
  );
  const stateOptions = React.useMemo(
    () => (states ?? []).map((s) => ({ value: s.id, label: s.name })),
    [states],
  );
  const cityOptions = React.useMemo(
    () => (cities ?? []).map((c) => ({ value: c.id, label: c.name })),
    [cities],
  );

  const pickCountry = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({
        ...f,
        countryId: null,
        country: "",
        countryIso2: "",
        countryCode: "",
        stateId: null,
        state: "",
        cityId: null,
        city: "",
      }));
      return;
    }
    const hit = countries?.find((c) => c.id === Number(value));
    if (!hit) return;
    const dial = hit.phonecode
      ? `+${String(hit.phonecode).replace(/^\+/, "")}`
      : "";
    setForm((f) => ({
      ...f,
      countryId: hit.id,
      country: hit.name,
      countryIso2: (hit.iso2 || hit.code || "").toUpperCase(),
      // Picking a country also sets the phone dial code — step 3's phone
      // field surfaces it as a read-only prefix.
      countryCode: dial,
      stateId: null,
      state: "",
      cityId: null,
      city: "",
    }));
  };
  const pickState = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({
        ...f,
        stateId: null,
        state: "",
        cityId: null,
        city: "",
      }));
      return;
    }
    const hit = states?.find((s) => s.id === Number(value));
    if (!hit) return;
    setForm((f) => ({
      ...f,
      stateId: hit.id,
      state: hit.name,
      cityId: null,
      city: "",
    }));
  };
  const pickCity = (value: number | string | "") => {
    if (value === "") {
      setForm((f) => ({ ...f, cityId: null, city: "" }));
      return;
    }
    const hit = cities?.find((c) => c.id === Number(value));
    if (!hit) return;
    setForm((f) => ({ ...f, cityId: hit.id, city: hit.name }));
  };

  return (
    <div className="space-y-4">
      <Field label="Country" required>
        <SearchableSelect
          placeholder={loadingCountries ? "Loading\u2026" : "Select country"}
          searchPlaceholder="Search countries..."
          options={countryOptions}
          value={form.countryId ?? ""}
          onChange={pickCountry}
          loading={loadingCountries}
          emptyMessage="No countries found"
          clearable
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State" required>
          <SearchableSelect
            placeholder={
              !form.countryId
                ? "Pick a country first"
                : loadingStates
                  ? "Loading\u2026"
                  : "Select state"
            }
            searchPlaceholder="Search states..."
            options={stateOptions}
            value={form.stateId ?? ""}
            onChange={pickState}
            disabled={!form.countryId}
            loading={loadingStates}
            emptyMessage="No states configured"
            clearable
          />
        </Field>
        <Field label="City" required>
          <SearchableSelect
            placeholder={
              !form.stateId
                ? "Pick a state first"
                : loadingCities
                  ? "Loading\u2026"
                  : "Select city"
            }
            searchPlaceholder="Search cities..."
            options={cityOptions}
            value={form.cityId ?? ""}
            onChange={pickCity}
            disabled={!form.stateId}
            loading={loadingCities}
            emptyMessage="No cities configured"
            clearable
          />
        </Field>
      </div>
    </div>
  );
}

function DocUploader({
  label,
  url,
  uploading,
  onPick,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const resolved = url ? resolveAssetUrl(url) || url : "";
  const isPdf = /\.pdf(\?|$)/i.test(url);
  return (
    <div className="mt-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3">
      {resolved ? (
        <div className="flex items-center justify-between gap-3">
          <a
            href={resolved}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm text-[var(--jy-accent-gold)] underline-offset-2 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isPdf ? "Uploaded PDF" : "Uploaded file"}
              {" \u2014 preview"}
            </span>
          </a>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-[var(--jy-text-secondary)] hover:bg-white/[0.06]"
          >
            Replace
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-[var(--jy-text-secondary)]">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading\u2026" : `Upload ${label.toLowerCase()}`}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-[var(--jy-text-muted)]">
            PDF or image, max 5 MB
          </span>
          <input
            type="file"
            accept={DOC_ACCEPT}
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--jy-text-primary)]">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs text-[var(--jy-text-muted)] sm:text-sm">
          {description}
        </p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[var(--jy-text-secondary)]">
          {label}
          {required && (
            <span className="ml-1 text-[var(--jy-accent-gold)]">*</span>
          )}
        </span>
        {hint && (
          <span className="hidden text-[11px] text-[var(--jy-text-muted)] sm:inline">
            {hint}
          </span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function InputBase({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric";
  min?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      min={min}
      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none transition-colors focus:border-[var(--jy-accent-gold)]/50 focus:bg-white/[0.08]"
    />
  );
}

function InputWithIcon({
  icon,
  value,
  onChange,
  placeholder,
  type,
  inputMode,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric";
}) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--jy-text-muted)]">
        {icon}
      </span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-9 pr-3.5 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none transition-colors focus:border-[var(--jy-accent-gold)]/50 focus:bg-white/[0.08]"
      />
    </div>
  );
}

function TextareaBase({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none transition-colors focus:border-[var(--jy-accent-gold)]/50 focus:bg-white/[0.08]"
    />
  );
}

function PhotoPicker({
  url,
  onPick,
  onClear,
  uploading,
}: {
  url: string;
  onPick: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const src = url ? resolveAssetUrl(url) || url : "";
  return (
    <div className="flex items-center gap-3">
      {src ? (
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--jy-accent-gold)]/40">
          <Image src={src} alt="Profile" fill className="object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-0 top-0 rounded-full bg-black/70 p-1 text-white"
            aria-label="Remove photo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.03] text-[var(--jy-text-muted)]">
          <User className="h-6 w-6" />
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm font-medium text-[var(--jy-text-primary)] hover:bg-white/[0.08]">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : url ? "Replace photo" : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function ChipPicker({
  selected,
  suggestions,
  onToggle,
  onAdd,
  addPlaceholder,
}: {
  selected: string[];
  suggestions: string[];
  onToggle: (v: string) => void;
  onAdd: (v: string) => void;
  addPlaceholder: string;
}) {
  const [draft, setDraft] = useState("");
  const mergedSuggestions = useMemo(() => {
    const set = new Set([...suggestions, ...selected]);
    return Array.from(set);
  }, [suggestions, selected]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mergedSuggestions.map((s) => {
          const active = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-[var(--jy-accent-gold)]/60 bg-[var(--jy-accent-gold)]/15 text-[var(--jy-accent-gold)]"
                  : "border-white/10 bg-white/[0.03] text-[var(--jy-text-secondary)] hover:bg-white/[0.06]",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(draft);
              setDraft("");
            }
          }}
          placeholder={addPlaceholder}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50"
        />
        <button
          type="button"
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-[var(--jy-text-primary)] hover:bg-white/[0.08]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
