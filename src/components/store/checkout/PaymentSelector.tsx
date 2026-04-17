"use client";

import React from "react";
import { Banknote, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSelectorProps {
  selected: string;
  onSelect: (method: string) => void;
  className?: string;
}

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Banknote,
  },
  {
    id: "online",
    label: "Online Payment",
    description: "UPI, Cards, Net Banking",
    icon: CreditCard,
  },
];

export function PaymentSelector({
  selected,
  onSelect,
  className,
}: PaymentSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selected === method.id;
        const Icon = method.icon;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              "relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/30 shadow-sm"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-focus)]"
            )}
          >
            {/* Radio indicator */}
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                  : "border-[var(--border-primary)]"
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>

            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isSelected
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {method.label}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {method.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default PaymentSelector;
