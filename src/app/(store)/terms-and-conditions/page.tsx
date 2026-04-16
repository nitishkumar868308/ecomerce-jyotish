"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using this website, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you should not use this website.",
  },
  {
    title: "2. Use of the Website",
    content:
      "You agree to use this website only for lawful purposes and in a manner that does not infringe upon the rights of others. You must not misuse this site by knowingly introducing viruses, trojans, worms, or other malicious material.",
  },
  {
    title: "3. Account Registration",
    content:
      "To make a purchase, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.",
  },
  {
    title: "4. Product Information",
    content:
      "We strive to display product images and descriptions as accurately as possible. However, we do not warrant that product descriptions or other content are error-free. Actual colors may vary depending on your device screen settings.",
  },
  {
    title: "5. Pricing and Payment",
    content:
      "All prices are listed in the applicable currency and are inclusive of taxes unless otherwise stated. We reserve the right to change prices at any time without notice. Payment must be completed at the time of order placement.",
  },
  {
    title: "6. Order Cancellation",
    content:
      "We reserve the right to cancel any order at our discretion. If your order is cancelled, you will receive a full refund. You may also cancel your order before it has been shipped by contacting our customer support.",
  },
  {
    title: "7. Intellectual Property",
    content:
      "All content on this website, including text, images, logos, and graphics, is our property or that of our licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or modify any content without our prior written consent.",
  },
  {
    title: "8. Limitation of Liability",
    content:
      "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of this website or the purchase of products.",
  },
  {
    title: "9. Governing Law",
    content:
      "These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi.",
  },
  {
    title: "10. Changes to Terms",
    content:
      "We reserve the right to update these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Your continued use of the website constitutes acceptance of the modified terms.",
  },
];

export default function TermsPage() {
  return (
    <DefaultPage>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Terms and Conditions" />

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
    </DefaultPage>
  );
}
