"use client";

import React, { useState } from "react";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useApplyPromo } from "@/services/promo";
import { usePriceConverter } from "@/hooks/usePriceConverter";

interface AppliedPromo {
  code: string;
  discount: number;
}

interface PromoCodeInputProps {
  cartTotal: number;
  onApply?: (promo: AppliedPromo) => void;
  onRemove?: () => void;
  className?: string;
}

export function PromoCodeInput({
  cartTotal,
  onApply,
  onRemove,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const applyPromo = useApplyPromo();
  const { format } = usePriceConverter();

  const handleApply = () => {
    if (!code.trim()) return;
    applyPromo.mutate(
      { code: code.trim().toUpperCase(), cartTotal },
      {
        onSuccess: (data: any) => {
          const promo: AppliedPromo = {
            code: code.trim().toUpperCase(),
            discount: data.data?.discount ?? data.discount ?? 0,
          };
          setApplied(promo);
          onApply?.(promo);
        },
      }
    );
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    onRemove?.();
  };

  if (applied) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-dashed border-[var(--accent-success)] bg-[var(--accent-success)]/5 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[var(--accent-success)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--accent-success)]">
              {applied.code}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              You save {format(applied.discount)}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
          aria-label="Remove promo code"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] py-2.5 pl-9 pr-3 text-sm uppercase text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:normal-case outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
        />
      </div>
      <Button
        size="md"
        variant="outline"
        onClick={handleApply}
        loading={applyPromo.isPending}
        disabled={!code.trim() || applyPromo.isPending}
      >
        Apply
      </Button>
    </div>
  );
}

export default PromoCodeInput;
