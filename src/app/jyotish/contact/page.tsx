"use client";

import React, { useEffect, useState } from "react";
import { CelestialBackground } from "@/components/jyotish/ui/CelestialBackground";
import { api, ENDPOINTS } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";

export default function JyotishContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  // Same prefill behaviour as the main /contact page — logged-in users
  // get name + email filled in automatically.
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [isLoggedIn, user?.email, user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.CONTACT.SEND, { ...form, platform: "jyotish" });
      setSubmitted(true);
    } catch {
      toast.error("Couldn't send your message — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CelestialBackground className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">
              Contact{" "}
              <span className="text-[var(--jy-accent-gold)]">Us</span>
            </h1>
            <p className="text-[var(--jy-text-secondary)]">
              Have a question or feedback? We would love to hear from you.
            </p>
          </div>
        </div>
      </CelestialBackground>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Contact form */}
            <div className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-2xl text-green-400">
                    &#10003;
                  </div>
                  <h2 className="text-xl font-bold">Message Sent!</h2>
                  <p className="text-sm text-[var(--jy-text-secondary)]">
                    Thank you for reaching out. We will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="mt-2 rounded-lg bg-[var(--jy-accent-gold)]/10 px-5 py-2 text-sm font-medium text-[var(--jy-accent-gold)] hover:bg-[var(--jy-accent-gold)]/20"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--jy-text-primary)]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--jy-text-primary)]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--jy-text-primary)]">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--jy-text-primary)]">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/50"
                      placeholder="Tell us more..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-gradient-to-r from-[var(--jy-accent-gold)] to-amber-500 py-3 text-sm font-semibold text-[var(--jy-bg-primary)] transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* Info cards */}
            <div className="flex flex-col gap-6">
              {[
                {
                  title: "Email Us",
                  detail: "support@jyotish.com",
                  sub: "We reply within 24 hours",
                  icon: "\u2709",
                },
                {
                  title: "Call Us",
                  detail: "+91 98765 43210",
                  sub: "Mon-Sat, 9 AM - 9 PM IST",
                  icon: "\u260E",
                },
                {
                  title: "Visit Us",
                  detail: "123 Celestial Lane, Mumbai",
                  sub: "Maharashtra, India - 400001",
                  icon: "\u2302",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-[var(--jy-bg-card-border)] bg-[var(--jy-bg-card)] p-6"
                >
                  <div className="mb-2 text-xl">{c.icon}</div>
                  <h3 className="text-base font-semibold">{c.title}</h3>
                  <p className="text-sm text-[var(--jy-accent-gold)]">
                    {c.detail}
                  </p>
                  <p className="text-xs text-[var(--jy-text-muted)]">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
