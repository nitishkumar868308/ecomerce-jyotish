"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "Shipping Policy",
    items: [
      {
        subtitle: "Domestic Shipping",
        content:
          "We offer standard shipping (5-7 business days) and express shipping (2-3 business days) across India. Free shipping is available on orders above a minimum order value. Delivery timelines are estimates and may vary due to holidays, weather, or carrier delays.",
      },
      {
        subtitle: "International Shipping",
        content:
          "We ship to select countries internationally. International shipping typically takes 10-15 business days. Customs duties and import taxes, if applicable, are the responsibility of the buyer.",
      },
      {
        subtitle: "Order Tracking",
        content:
          "Once your order is shipped, you will receive an email and SMS notification with a tracking link. You can also track your order from the Orders section in your account dashboard.",
      },
    ],
  },
  {
    title: "Return Policy",
    items: [
      {
        subtitle: "Eligibility",
        content:
          "Products may be returned within 7 days of delivery, provided they are unused, in original packaging, and accompanied by the invoice. Certain products such as personalized or perishable items are not eligible for return.",
      },
      {
        subtitle: "How to Initiate a Return",
        content:
          "To initiate a return, contact our customer support team via email or phone with your order number. Our team will guide you through the process and arrange for a pickup or provide a return shipping label.",
      },
      {
        subtitle: "Exchanges",
        content:
          "If you received a damaged or defective product, we will replace it at no additional cost. For size or variant exchanges, the product must be in original condition. Please contact us within 48 hours of delivery for damaged items.",
      },
      {
        subtitle: "Return Shipping",
        content:
          "Return shipping costs are borne by the customer unless the return is due to a defective or incorrect product. In such cases, we will cover the return shipping cost.",
      },
    ],
  },
];

export default function ShippingAndReturnPolicyPage() {
  return (
    <DefaultPage>
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
    </DefaultPage>
  );
}
