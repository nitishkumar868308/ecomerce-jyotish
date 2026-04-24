"use client";

import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "Refund Eligibility",
    content:
      "Refunds are applicable for orders cancelled before dispatch, products returned unused within 7 days of delivery, and defective or damaged products reported within 48 hours. Perishable, personalized, and digital items are not refundable.",
  },
  {
    title: "Refund Process",
    content:
      "Once we receive and inspect the returned item we'll notify you of the approval or rejection of your refund. Approved refunds are processed within 5-7 business days to your original payment method. Your bank may take additional time to reflect the credit.",
  },
  {
    title: "Partial Refunds",
    content:
      "Partial refunds may apply to products that are not in their original condition, returned with missing parts, or returned after the 7-day window but within 14 days — at our discretion.",
  },
  {
    title: "Refund for Cancelled Orders",
    content:
      "If you cancel before dispatch you'll receive a full refund. Once dispatched, you'll need to follow our return process; the refund is issued after we receive the product.",
  },
  {
    title: "Non-Refundable Items",
    content:
      "Gift cards, perishable groceries, and items marked final sale are non-refundable. Delivery charges are non-refundable unless the return is due to our error.",
  },
  {
    title: "Contact Us",
    content:
      "If you have questions about your refund, please reach QuickGo support at support@hecatequickgo.com or call +91 98765 43210 (Mon-Sat, 8 AM - 10 PM).",
  },
];

export default function QuickGoRefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Refund Policy" />
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
