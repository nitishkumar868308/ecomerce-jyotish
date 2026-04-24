"use client";

import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "Shipping Policy",
    items: [
      {
        subtitle: "Local Delivery",
        content:
          "QuickGo offers same-day / 1-day local delivery in serviceable pincodes. Delivery windows are shown at checkout based on your selected city and pincode. Timelines are estimates and may vary due to weather, traffic, or carrier availability.",
      },
      {
        subtitle: "Tracking",
        content:
          "Once your order is dispatched you'll receive an SMS and email with a live tracking link. You can also track from the Orders section of your account dashboard.",
      },
      {
        subtitle: "Areas Not Yet Serviced",
        content:
          "If your pincode is outside our current QuickGo footprint, please switch to the main store for standard shipping.",
      },
    ],
  },
  {
    title: "Return Policy",
    items: [
      {
        subtitle: "Eligibility",
        content:
          "Products may be returned within 7 days of delivery, provided they are unused, in original packaging, and accompanied by the invoice. Perishable or personalized items are not eligible.",
      },
      {
        subtitle: "How to Initiate a Return",
        content:
          "Contact QuickGo support via email or phone with your order number. Our team will guide you through the process and arrange for pickup.",
      },
      {
        subtitle: "Damaged / Defective",
        content:
          "If you received a damaged or defective product, please report it within 48 hours of delivery — we'll replace or fully refund at no extra cost.",
      },
      {
        subtitle: "Return Shipping",
        content:
          "Return shipping is free for damaged or incorrect orders. Otherwise, return courier charges are borne by the customer.",
      },
    ],
  },
];

export default function QuickGoShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Shipping and Return Policy" />
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        Last updated: January 2026
      </p>

      <div className="mt-8 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {section.title}
            </h2>
            <div className="mt-4 space-y-6">
              {section.items.map((item) => (
                <div key={item.subtitle}>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {item.subtitle}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
