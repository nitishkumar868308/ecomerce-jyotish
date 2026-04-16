"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { api, ENDPOINTS } from "@/lib/api";
import toast from "react-hot-toast";

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

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);

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
      await api.post(ENDPOINTS.CONTACT, form);
      toast.success("Message sent successfully!");
      setForm(INITIAL_VALUES);
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
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Contact Us"
          description="We would love to hear from you"
        />

        <div className="mt-8 grid gap-12 lg:grid-cols-3">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
                placeholder="you@example.com"
              />
            </div>
            <Input
              label="Subject"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              error={errors.subject}
              placeholder="What is this about?"
            />
            <Textarea
              label="Message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              error={errors.message}
              placeholder="Tell us more..."
              rows={6}
            />
            <Button type="submit" loading={submitting}>
              Send Message
            </Button>
          </form>

          {/* Contact info sidebar */}
          <aside className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Address
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                123 Commerce Street
                <br />
                New Delhi, India 110001
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Phone
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                +91 98765 43210
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Email
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                support@example.com
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Hours
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                Mon - Sat: 10:00 AM - 7:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DefaultPage>
  );
}
