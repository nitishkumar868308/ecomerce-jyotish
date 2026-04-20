"use client";

import React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateCartItem, useRemoveCartItem } from "@/services/cart";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  className?: string;
}

export function CartItemCard({ item, className }: CartItemProps) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const handleIncrease = () => {
    updateItem.mutate({ id: item.id, quantity: item.quantity + 1 });
  };

  const handleDecrease = () => {
    if (item.quantity <= 1) {
      removeItem.mutate(item.id);
      return;
    }
    updateItem.mutate({ id: item.id, quantity: item.quantity - 1 });
  };

  const isLastItem = item.quantity === 1;
  const isPending = updateItem.isPending || removeItem.isPending;

  return (
    <div
      className={cn(
        "flex gap-3 py-3.5 transition-opacity",
        isPending && "pointer-events-none opacity-60",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
        {item.image ? (
          <Image src={item.image} alt={item.productName} fill sizes="72px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="truncate text-sm font-semibold leading-snug text-[var(--text-primary)]">
            {item.productName}
          </h4>

          {/* Attributes */}
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {Object.entries(item.attributes)
                .map(([key, val]) => `${key}: ${val}`)
                .join(" / ")}
            </p>
          )}

          {/* Price line */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {item.currencySymbol}{item.pricePerItem}
            </span>
          </div>

          {/* Offer badge */}
          {item.productOfferApplied && item.productOfferDiscount && (
            <span className="mt-1 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
              Offer: -{item.currencySymbol}{item.productOfferDiscount}
            </span>
          )}
        </div>

        {/* Bottom row: quantity + total */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <button
              onClick={handleDecrease}
              disabled={isPending}
              className={cn(
                "flex h-9 w-10 items-center justify-center rounded-l-lg transition-colors select-none touch-manipulation active:scale-95",
                isLastItem
                  ? "text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]",
              )}
              aria-label={isLastItem ? "Remove item" : "Decrease quantity"}
            >
              {isLastItem ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </button>
            <span className="flex h-9 w-9 items-center justify-center text-sm font-semibold text-[var(--text-primary)]">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={isPending}
              className="flex h-9 w-10 items-center justify-center rounded-r-lg text-[var(--text-muted)] transition-colors select-none touch-manipulation active:scale-95 hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-[var(--text-primary)]">
            {item.currencySymbol}{item.totalPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartItemCard;
