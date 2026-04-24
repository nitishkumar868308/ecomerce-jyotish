"use client";

import { PageHeader } from "@/components/shared/PageHeader";

// Same content as the wizard Privacy Policy — rendered inside the QuickGo
// layout so CSS tokens remap to the teal theme automatically. When policy
// content changes, update both files.

const SECTIONS = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide directly, such as your name, email address, phone number, shipping address, and payment information when you create an account or make a purchase. We also automatically collect certain information about your device and usage patterns through cookies and similar technologies.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to process orders, manage your account, communicate with you about products and services, improve our website and customer experience, comply with legal obligations, and prevent fraud. We may also use your information to send promotional communications, which you can opt out of at any time.",
  },
  {
    title: "Information Sharing",
    content:
      "We do not sell your personal information. We may share your information with trusted service providers who assist us in operating our website, conducting business, or servicing you (e.g., payment processors, shipping partners). These parties are obligated to keep your information confidential.",
  },
  {
    title: "Data Security",
    content:
      "We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "Cookies",
    content:
      "Our website uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can manage your cookie preferences through your browser settings. Disabling cookies may affect certain features of our website.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal information. You may also request a copy of the data we hold about you. To exercise these rights, please contact us at support@example.com.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this page periodically.",
  },
];

export default function QuickGoPrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Privacy Policy" />
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        Last updated: January 2026
      </p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
