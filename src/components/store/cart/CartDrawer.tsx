"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useCartStore } from "@/stores/useCartStore";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/services/cart";
import { useAuthStore } from "@/stores/useAuthStore";
import { ROUTES } from "@/config/routes";
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import type { CartItem } from "@/types/cart";

type StorefrontTab = "wizard" | "quickgo";

export function CartDrawer({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isOpen, setCartOpen, clearCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const { data: serverItems, isLoading } = useCart();

  const defaultTab: StorefrontTab = pathname?.startsWith("/hecate-quickgo")
    ? "quickgo"
    : "wizard";
  const [activeTab, setActiveTab] = useState<StorefrontTab>(defaultTab);

  useEffect(() => {
    setActiveTab(pathname?.startsWith("/hecate-quickgo") ? "quickgo" : "wizard");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const items = isLoggedIn ? (serverItems ?? []) : [];
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.length;
  const currencySymbol = items[0]?.currencySymbol || "₹";

  const showLoading = isLoggedIn && isLoading;
  const showEmpty = !showLoading && items.length === 0;
  const showItems = !showLoading && items.length > 0;

  const checkoutRoute =
    activeTab === "quickgo" ? ROUTES.QUICKGO.CHECKOUT : ROUTES.CHECKOUT;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[var(--bg-primary)] shadow-2xl sm:w-[400px]",
              className
            )}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-[var(--border-primary)] px-5 pt-5 pb-0">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10">
                    <ShoppingBag className="h-[18px] w-[18px] text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">Shopping Cart</h2>
                    <p className="text-xs text-[var(--text-muted)]">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
                <TabBtn active={activeTab === "wizard"} onClick={() => setActiveTab("wizard")} icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Wizard Mall" />
                <TabBtn active={activeTab === "quickgo"} onClick={() => setActiveTab("quickgo")} icon={<Zap className="h-3.5 w-3.5" />} label="QuickGo" />
              </div>
            </div>

            {/* Remove All */}
            {showItems && (
              <div className="flex items-center justify-end border-b border-[var(--border-primary)] px-5 py-2">
                <button onClick={() => clearCart()} className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-danger)] hover:opacity-80 transition-opacity">
                  <Trash2 className="h-3 w-3" /> Remove All
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-3 scrollbar-none">
              {showLoading && (
                <div className="space-y-4 pt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton width={72} height={72} className="rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton height={14} width="75%" />
                        <Skeleton height={12} width="45%" />
                        <Skeleton height={28} width="60%" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showEmpty && (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                    <ShoppingBag className="h-9 w-9 text-[var(--text-muted)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Your cart is empty</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {isLoggedIn ? "Browse products and add items" : "Sign in to view your cart"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCartOpen(false)}>
                    Continue Shopping
                  </Button>
                </div>
              )}

              {showItems && (
                <div className="divide-y divide-[var(--border-primary)]">
                  {groupCartItems(items).map((group) => (
                    <CartGroupRow key={group.key} group={group} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {showItems && (
              <div className="shrink-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-5 pb-5 pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Subtotal</span>
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {currencySymbol}{subtotal.toLocaleString()}
                  </span>
                </div>
                <p className="mb-4 text-[11px] text-[var(--text-muted)]">Shipping & taxes calculated at checkout</p>
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => setCartOpen(false)}>
                    Continue Shopping
                  </Button>
                  <Link href={checkoutRoute} className="flex-1">
                    <Button fullWidth onClick={() => setCartOpen(false)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface CartGroup {
  key: string;
  productName: string;
  items: CartItem[];
  totalQty: number;
  paidQty: number;
  freeQty: number;
  totalPrice: number;
  originalPrice: number;
  offerSummary: CartItem["offerSummary"];
  bulkApplied: boolean;
  currencySymbol: string;
}

function groupCartItems(items: CartItem[]): CartGroup[] {
  const map = new Map<string, CartItem[]>();
  for (const item of items) {
    const attrs = (item.attributes || {}) as Record<string, string>;
    const nonColorKey = Object.entries(attrs)
      .filter(([k]) => k.toLowerCase() !== "color")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("|");
    const key = `${item.productId}::${nonColorKey}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return Array.from(map.entries()).map(([key, groupItems]) => {
    const freeQty = groupItems.reduce((s, i) => s + (i.freeQtyInThisItem ?? 0), 0);
    const totalQty = groupItems.reduce((s, i) => s + i.quantity, 0);
    return {
      key,
      productName: groupItems[0].productName,
      items: groupItems,
      totalQty,
      paidQty: totalQty - freeQty,
      freeQty,
      totalPrice: groupItems.reduce((s, i) => s + i.totalPrice, 0),
      originalPrice: groupItems.reduce((s, i) => s + i.pricePerItem * i.quantity, 0),
      offerSummary: groupItems[0].offerSummary,
      bulkApplied: groupItems.some((i) => i.bulkApplied),
      currencySymbol: groupItems[0].currencySymbol || "₹",
    };
  });
}

function CartGroupRow({ group }: { group: CartGroup }) {
  const { currencySymbol: sym } = group;
  // Non-color attributes (shared across group)
  const sharedAttrs = Object.entries(
    (group.items[0].attributes || {}) as Record<string, string>
  ).filter(([k]) => k.toLowerCase() !== "color");

  return (
    <div className="py-4 space-y-2">
      {/* Product name */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">{group.productName}</h4>
        {sharedAttrs.length > 0 && (
          <p className="text-[11px] text-[var(--text-muted)]">
            {sharedAttrs.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </p>
        )}
      </div>

      {/* Offer / Bulk badges for group */}
      {group.offerSummary && (
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
          group.offerSummary.claimed
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        )}>
          {group.offerSummary.claimed ? "✓ " : ""}{group.offerSummary.offerName}
          {group.offerSummary.claimed
            ? " — Claimed"
            : ` — Need ${Math.max(0, group.offerSummary.start - group.offerSummary.totalQty)} more`}
        </span>
      )}
      {group.bulkApplied && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Bulk Price Applied
        </span>
      )}

      {/* Each variation sub-row */}
      <div className="space-y-2">
        {group.items.map((item) => (
          <CartSubRow key={item.id} item={item} />
        ))}
      </div>

      {/* Group total breakdown */}
      <div className="pt-2 border-t border-dashed border-[var(--border-primary)] space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            {group.totalQty} items
            {group.freeQty > 0 && (
              <> ({group.paidQty} paid + <span className="text-green-600 font-medium">{group.freeQty} FREE</span>)</>
            )}
          </span>
        </div>
        {(group.freeQty > 0 || group.bulkApplied) && group.originalPrice !== group.totalPrice && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Original price</span>
            <span className="text-xs text-[var(--text-muted)] line-through">{sym}{group.originalPrice.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">You pay</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{sym}{group.totalPrice.toLocaleString()}</span>
        </div>
        {(group.freeQty > 0 || group.bulkApplied) && group.originalPrice > group.totalPrice && (
          <div className="flex items-center justify-end">
            <span className="text-[10px] font-semibold text-green-600">
              You save {sym}{(group.originalPrice - group.totalPrice).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CartSubRow({ item }: { item: CartItem }) {
  const updateCart = useUpdateCartItem();
  const removeCart = useRemoveCartItem();
  const isPending = updateCart.isPending || removeCart.isPending;

  const attrs = (item.attributes || {}) as Record<string, string>;
  const colorVal = Object.entries(attrs).find(([k]) => k.toLowerCase() === "color")?.[1];
  const sym = item.currencySymbol || "₹";

  return (
    <div className={cn("flex gap-2.5 rounded-lg bg-[var(--bg-secondary)] p-2", isPending && "opacity-50 pointer-events-none")}>
      {/* Image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
        {item.image ? (
          <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
        )}
        {item.isFreeItem && (
          <div className="absolute left-0.5 top-0.5 rounded bg-green-500 px-1 py-0.5 text-[8px] font-bold text-white">FREE</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {colorVal && (
            <span className="text-xs font-medium text-[var(--text-primary)]">{colorVal}</span>
          )}
          {item.bulkApplied ? (
            <span className="text-[11px] text-[var(--accent-primary)] font-semibold">{sym}{item.effectivePrice} each</span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">{sym}{item.pricePerItem} each</span>
          )}
        </div>

        {/* Paid/Free */}
        {item.freeQtyInThisItem != null && item.freeQtyInThisItem > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">{item.paidQty ?? (item.quantity - item.freeQtyInThisItem)} paid</span>
            <span className="text-[9px] font-medium text-green-600">{item.freeQtyInThisItem} FREE</span>
          </div>
        )}

        {/* Qty + price */}
        <div className="mt-1 flex items-center justify-between">
          <QuantityControl
            quantity={item.quantity}
            onIncrement={() => updateCart.mutate({ id: item.id, quantity: item.quantity + 1 })}
            onDecrement={() => updateCart.mutate({ id: item.id, quantity: item.quantity - 1 })}
            onDelete={() => removeCart.mutate(item.id)}
            disabled={isPending}
            itemName={item.productName}
            deleteLoading={removeCart.isPending}
            size="sm"
          />
          <span className="text-xs font-bold text-[var(--text-primary)]">{sym}{item.totalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all",
        active ? "bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      )}
    >
      {icon}{label}
    </button>
  );
}

export default CartDrawer;
