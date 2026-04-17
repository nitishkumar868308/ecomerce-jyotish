"use client";

import { useState } from "react";
import { useJyotishRegister } from "@/services/jyotish/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { APP_NAME } from "@/config/constants";
import { User, Mail, Phone, Star, Globe } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

export default function RegisterJyotishPage() {
  const register = useJyotishRegister();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    bio: "", specializations: "", languages: "", experience: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({
      ...form,
      specializations: form.specializations.split(",").map((s) => s.trim()),
      languages: form.languages.split(",").map((s) => s.trim()),
      experience: parseInt(form.experience) || 0,
    } as any);
  };

  const updateField = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0618] to-[#1a1040] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href={ROUTES.JYOTISH.HOME} className="text-2xl font-bold text-white">
            ✨ {APP_NAME} Jyotish
          </Link>
          <p className="mt-2 text-white/60">Join as an Astrologer</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? "w-12 bg-[#FFD700]" : "w-8 bg-white/20"}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
                <Input label="Full Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} leftIcon={<User className="h-4 w-4" />} required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Input label="Email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} leftIcon={<Mail className="h-4 w-4" />} required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Input label="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} leftIcon={<Phone className="h-4 w-4" />} required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Input label="Password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Button type="button" fullWidth onClick={() => setStep(2)} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">Next Step</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Professional Details</h2>
                <Textarea label="Bio" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} fullWidth className="[&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_label]:text-white/70" />
                <Input label="Specializations (comma separated)" value={form.specializations} onChange={(e) => updateField("specializations", e.target.value)} leftIcon={<Star className="h-4 w-4" />} placeholder="Vedic, Numerology, Tarot" required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Input label="Languages (comma separated)" value={form.languages} onChange={(e) => updateField("languages", e.target.value)} leftIcon={<Globe className="h-4 w-4" />} placeholder="Hindi, English" required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <Input label="Years of Experience" type="number" value={form.experience} onChange={(e) => updateField("experience", e.target.value)} required fullWidth className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_label]:text-white/70" />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-white/20 text-white">Back</Button>
                  <Button type="submit" fullWidth loading={register.isPending} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">Register</Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
