"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "How do I place an order?",
    answer:
      "Browse our categories, select the product you like, choose the quantity and options, then click Add to Cart. When you are ready, proceed to Checkout, fill in your shipping address and payment details, and confirm your order.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards, UPI, net banking, and popular wallets. Cash on Delivery is also available for select pin codes.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 5-7 business days. Express delivery (available in select cities) takes 2-3 business days. You will receive a tracking link once your order ships.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "Yes, we offer a 7-day return or exchange policy for most products. The item must be unused and in its original packaging. Please visit our Shipping and Return Policy page for details.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order is shipped, you will receive an email and SMS with a tracking link. You can also track your order from the Orders section in your dashboard.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to select countries. International shipping rates and delivery times vary by destination. Check our Shipping Policy page for supported countries.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach us via the Contact Us page, email us at support@example.com, or call us at +91 98765 43210 during business hours (Mon-Sat, 10 AM - 7 PM).",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Absolutely. All transactions are processed through secure, PCI-compliant payment gateways. We never store your card details on our servers.",
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--border-primary)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-base font-medium text-[var(--text-primary)]">
          {item.question}
        </span>
        <svg
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <DefaultPage>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Frequently Asked Questions"
          description="Find answers to common questions about our store"
        />

        <div className="mt-8">
          {FAQ_DATA.map((item, idx) => (
            <AccordionItem
              key={idx}
              item={item}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </DefaultPage>
  );
}
