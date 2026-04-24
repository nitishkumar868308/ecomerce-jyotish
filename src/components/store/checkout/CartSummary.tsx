"use client";

import React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/services/cart";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { ROUTES } from "@/config/routes";
import type { CartItem } from "@/types/cart";

interface CartSummaryProps {
  className?: string;
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const isPending = updateItem.isPending || removeItem.isPending;

  return (
    <div className={cn("flex gap-3 border-b border-[var(--border-primary)] py-4 last:border-b-0 sm:gap-4", isPending && "opacity-50 pointer-events-none")}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] sm:h-24 sm:w-24">
        {item.image ? (
          <Image src={resolveAssetUrl(item.image)} alt={item.productName} fill sizes="96px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{item.productName}</h4>
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
            </p>
          )}
          {item.offerApplied && item.savedAmount > 0 && (
            <span className="mt-1 inline-flex text-[10px] font-medium text-green-600">
              {item.offerName ?? "Offer"}: -{item.currencySymbol}
              {item.savedAmount.toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-primary)]">
            <button
              onClick={() => item.quantity <= 1 ? removeItem.mutate(item.id) : updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
              className="flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5 text-[var(--accent-danger)]" /> : <Minus className="h-3.5 w-3.5" />}
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-[var(--text-primary)]">{item.quantity}</span>
            <button
              onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
              className="flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {item.currencySymbol}{item.lineTotal.toLocaleString()}
            </span>
            <button
              onClick={() => removeItem.mutate(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--accent-danger)]/10 hover:text-[var(--accent-danger)]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSummary({ className }: CartSummaryProps) {
  const { data: cart, isLoading } = useCart();
  const items = cart?.items ?? [];

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5", className)}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4">
              <Skeleton width={96} height={96} className="rounded-lg" />
              <div className="flex-1 space-y-2"><Skeleton height={16} width="70%" /><Skeleton height={12} width="40%" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5", className)}>
        <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Add some products to get started."
          action={{ label: "Continue Shopping", onClick: () => { window.location.href = ROUTES.CATEGORIES; } }} />
      </div>
    );
  }

  const currSymbol = cart?.summary.currencySymbol || items[0]?.currencySymbol || "₹";
  const subtotal = cart?.summary.total ?? items.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <div className={cn("rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5", className)}>
      <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
        Cart ({items.length} item{items.length !== 1 ? "s" : ""})
      </h3>
      <div>
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-[var(--border-primary)] pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal</span>
          <span className="font-medium text-[var(--text-primary)]">{currSymbol}{subtotal.toLocaleString()}</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Shipping & taxes calculated at checkout</p>
      </div>
    </div>
  );
}

export default CartSummary;
