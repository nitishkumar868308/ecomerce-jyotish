"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { api, ENDPOINTS } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";

// QuickGo Contact page — identical form flow as the wizard Contact page, but
// lives under /hecate-quickgo so the QuickGo layout (teal theme tokens)
// applies. Platform is hard-coded to "quickgo" since any visitor on this
// route is already in QuickGo.

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_VALUES: ContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const CONTACT_INFO = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["123 Commerce Street", "New Delhi, India 110001"],
    color: "text-teal-600 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/30",
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+91 98765 43210", "+91 11 4567 8901"],
    color: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["support@hecatequickgo.com", "info@hecatequickgo.com"],
    color: "text-cyan-600 dark:text-cyan-300",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    icon: Clock,
    title: "Delivery Hours",
    lines: ["Mon - Sat: 8:00 AM - 10:00 PM", "Sunday: 9:00 AM - 8:00 PM"],
    color: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

export default function QuickGoContactPage() {
  const [form, setForm] = useState<ContactForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [isLoggedIn, user?.email, user?.name]);

  function validate(): boolean {
    const e: Partial<ContactForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.CONTACT.SEND, { ...form, platform: "quickgo" });
      toast.success("Message sent successfully!");
      setForm({
        ...INITIAL_VALUES,
        name: isLoggedIn ? user?.name ?? "" : "",
        email: isLoggedIn ? user?.email ?? "" : "",
      });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof ContactForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-primary)] via-[var(--accent-primary)] to-[var(--accent-secondary)] py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Get in Touch
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
              Questions about a delivery, feedback, or need support? Our QuickGo
              team is here to help.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_INFO.map((info, idx) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${info.bg}`}
              >
                <info.icon className={`h-5 w-5 ${info.color}`} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {info.title}
              </h3>
              {info.lines.map((line, i) => (
                <p
                  key={i}
                  className="mt-1 text-sm text-[var(--text-secondary)]"
                >
                  {line}
                </p>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary-light)] px-4 py-1.5 text-sm font-medium text-[var(--accent-primary)]">
                <Sparkles className="h-4 w-4" />
                We&apos;re here for you
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                Send us a Message
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                Fill the form and our QuickGo team will get back to you within
                24 hours. Order queries are usually answered in under an hour.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  Average response time: Under 1 hour for orders
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/40">
                    <Mail className="h-3.5 w-3.5 text-teal-500" />
                  </div>
                  All messages are encrypted and secure
                </div>
              </div>
            </motion.div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8 lg:col-span-3"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                placeholder="Your full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
                placeholder="you@example.com"
              />
            </div>
            <div className="mt-5">
              <Input
                label="Subject"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                error={errors.subject}
                placeholder="What is this about?"
              />
            </div>
            <div className="mt-5">
              <Textarea
                label="Message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                error={errors.message}
                placeholder="Write your message here..."
                rows={6}
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--accent-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-primary-hover)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : null}
                Send Message
                <Send className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </>
  );
}
