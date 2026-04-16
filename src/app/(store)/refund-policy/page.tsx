"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "Refund Eligibility",
    content:
      "Refunds are applicable for orders cancelled before shipment, products returned in unused and original condition within 7 days of delivery, and defective or damaged products reported within 48 hours of delivery. Refunds are not available for personalized items, perishable goods, or digital products.",
  },
  {
    title: "Refund Process",
    content:
      "Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days to your original payment method. Please allow additional time for your bank or card issuer to reflect the refund in your account.",
  },
  {
    title: "Partial Refunds",
    content:
      "Partial refunds may be issued for products that are not in their original condition, are returned with missing parts, or are returned after the 7-day window but within 14 days at our discretion.",
  },
  {
    title: "Refund for Cancelled Orders",
    content:
      "If you cancel an order before it has been shipped, you will receive a full refund. If the order has already been dispatched, you will need to follow our return process and the refund will be issued after we receive the product.",
  },
  {
    title: "Non-Refundable Items",
    content:
      "The following items are non-refundable: gift cards, downloadable products, personalized or custom-made products, and items marked as final sale. Shipping charges are non-refundable unless the return is due to our error.",
  },
  {
    title: "Contact Us",
    content:
      "If you have questions about your refund, please contact our customer support team at support@example.com or call +91 98765 43210 (Mon-Sat, 10 AM - 7 PM).",
  },
];

export default function RefundPolicyPage() {
  return (
    <DefaultPage>
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
    </DefaultPage>
  );
}
