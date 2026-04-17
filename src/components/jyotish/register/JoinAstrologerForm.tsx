"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useJyotishRegister } from "@/services/jyotish/auth";

const steps = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Professional" },
  { id: 3, label: "Account" },
];

export function JoinAstrologerForm() {
  const router = useRouter();
  const register = useJyotishRegister();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    experience: "",
    specializations: "",
    languages: "",
    bio: "",
    pricePerMin: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.email.trim()) e.email = "Email is required";
      if (!form.phone.trim()) e.phone = "Phone is required";
    } else if (step === 2) {
      if (!form.experience.trim()) e.experience = "Experience is required";
      if (!form.specializations.trim()) e.specializations = "Add at least one specialization";
    } else if (step === 3) {
      if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    register.mutate(
      {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        experience: Number(form.experience),
        specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        bio: form.bio,
        pricePerMin: Number(form.pricePerMin),
      },
      {
        onSuccess: () => {
          router.push("/jyotish/astrologer-dashboard");
        },
      },
    );
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50";
  const labelCls = "mb-1.5 block text-sm font-medium text-[var(--jy-text-primary)]";
  const errorCls = "mt-1 text-xs text-red-400";

  return (
    <div className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6 sm:p-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step >= s.id
                    ? "bg-[var(--jy-accent-gold)] text-[var(--jy-bg-primary)]"
                    : "border border-white/10 text-[var(--jy-text-muted)]"
                }`}
              >
                {s.id}
              </div>
              <span
                className={`hidden text-xs sm:inline ${
                  step >= s.id ? "text-[var(--jy-text-primary)]" : "text-[var(--jy-text-muted)]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 ${
                  step > s.id ? "bg-[var(--jy-accent-gold)]" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} placeholder="Your full name" />
              {errors.name && <p className={errorCls}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="you@example.com" />
              {errors.email && <p className={errorCls}>{errors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
              {errors.phone && <p className={errorCls}>{errors.phone}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className={labelCls}>Experience (years)</label>
              <input type="number" value={form.experience} onChange={(e) => update("experience", e.target.value)} className={inputCls} min={0} />
              {errors.experience && <p className={errorCls}>{errors.experience}</p>}
            </div>
            <div>
              <label className={labelCls}>Specializations (comma-separated)</label>
              <input type="text" value={form.specializations} onChange={(e) => update("specializations", e.target.value)} className={inputCls} placeholder="Vedic Astrology, Numerology" />
              {errors.specializations && <p className={errorCls}>{errors.specializations}</p>}
            </div>
            <div>
              <label className={labelCls}>Languages (comma-separated)</label>
              <input type="text" value={form.languages} onChange={(e) => update("languages", e.target.value)} className={inputCls} placeholder="Hindi, English" />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} className={`${inputCls} resize-y`} placeholder="Tell us about yourself..." />
            </div>
            <div>
              <label className={labelCls}>Price per minute (&#8377;)</label>
              <input type="number" value={form.pricePerMin} onChange={(e) => update("pricePerMin", e.target.value)} className={inputCls} min={0} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className={labelCls}>Password</label>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className={inputCls} placeholder="Min 6 characters" />
              {errors.password && <p className={errorCls}>{errors.password}</p>}
            </div>
            <div>
              <label className={labelCls}>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={inputCls} placeholder="Re-enter password" />
              {errors.confirmPassword && <p className={errorCls}>{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium hover:bg-white/5"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)]"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={register.isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-2.5 text-sm font-semibold text-[var(--jy-bg-primary)] disabled:opacity-50"
            >
              {register.isPending ? "Registering..." : "Register"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default JoinAstrologerForm;
