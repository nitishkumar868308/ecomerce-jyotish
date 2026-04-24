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
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useCartStore } from "@/stores/useCartStore";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useRemoveProductFromCart,
  useClearCart,
} from "@/services/cart";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePrice } from "@/hooks/usePrice";
import { useCartSummary } from "@/hooks/useCartSummary";
import { ROUTES } from "@/config/routes";
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import type { EnrichedCartItem, ProductGroupSummary } from "@/lib/cartMath";
import type { CartItem } from "@/types/cart";

type StorefrontTab = "wizard" | "quickgo";

/**
 * Confirm-dialog intent — tracks which flavour of delete the shopper asked
 * for so the single `ConfirmModal` instance can render the right copy and
 * fire the matching mutation once they confirm.
 */
type PendingConfirm =
  | { kind: "clear-all" }
  | { kind: "remove-product"; productId: string; productName: string }
  | { kind: "remove-variation"; itemId: string; label: string }
  | null;

export function CartDrawer({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isOpen, setCartOpen } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const { data: cart, isLoading } = useCart();

  const defaultTab: StorefrontTab = pathname?.startsWith("/hecate-quickgo")
    ? "quickgo"
    : "wizard";
  const [activeTab, setActiveTab] = useState<StorefrontTab>(defaultTab);
  const [confirm, setConfirm] = useState<PendingConfirm>(null);

  const clearCart = useClearCart();
  const removeProduct = useRemoveProductFromCart();
  const removeItem = useRemoveCartItem();

  useEffect(() => {
    setActiveTab(pathname?.startsWith("/hecate-quickgo") ? "quickgo" : "wizard");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { format } = usePrice();
  const allItems: CartItem[] = isLoggedIn ? (cart?.items ?? []) : [];

  const itemsForTab = (tab: StorefrontTab) =>
    allItems.filter((item) => {
      const p = String(item.purchasePlatform ?? "").toLowerCase();
      if (tab === "quickgo") return p === "quickgo" || p === "hecate-quickgo";
      return p === "" || p === "wizard" || p === "website";
    });

  const items = itemsForTab(activeTab);
  const wizardCount = itemsForTab("wizard").length;
  const quickgoCount = itemsForTab("quickgo").length;

  const { summary } = useCartSummary(items);
  const enrichedById = React.useMemo(() => {
    const map = new Map<string, EnrichedCartItem>();
    for (const row of summary.enriched) map.set(row.id, row);
    return map;
  }, [summary.enriched]);

  const subtotal = summary.subtotalFinal;
  const totalSavings = summary.totalSavings;
  const itemCount = summary.totalQty;

  const showLoading = isLoggedIn && isLoading && allItems.length === 0;
  const showEmpty = !showLoading && items.length === 0;
  const showItems = !showLoading && items.length > 0;

  const checkoutRoute =
    activeTab === "quickgo"
      ? `${ROUTES.QUICKGO.CHECKOUT}?platform=quickgo`
      : `${ROUTES.CHECKOUT}?platform=wizard`;

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "clear-all") {
        await clearCart.mutateAsync();
      } else if (confirm.kind === "remove-product") {
        await removeProduct.mutateAsync(confirm.productId);
      } else if (confirm.kind === "remove-variation") {
        await removeItem.mutateAsync(confirm.itemId);
      }
    } finally {
      setConfirm(null);
    }
  };

  /**
   * When the shopper asks to remove a variation, check whether it's the
   * LAST variation of that product in their cart. If so, route the
   * confirmation into the "Remove product?" flow instead of the
   * variation-level one — semantically clearer, same underlying row gets
   * deleted either way.
   */
  const onRequestVariationRemove = (
    item: EnrichedCartItem,
    group: ProductGroupSummary,
  ) => {
    if (group.items.length === 1) {
      setConfirm({
        kind: "remove-product",
        productId: group.productId,
        productName: group.productName,
      });
      return;
    }
    const label = Object.values(item.attributes || {}).join(" · ") ||
      item.variationName ||
      "this variation";
    setConfirm({
      kind: "remove-variation",
      itemId: item.id,
      label: `${group.productName} — ${label}`,
    });
  };

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
              className,
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
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Shopping Cart
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
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
                {defaultTab === "quickgo" ? (
                  <>
                    <TabBtn
                      active={activeTab === "quickgo"}
                      onClick={() => setActiveTab("quickgo")}
                      icon={<Zap className="h-3.5 w-3.5" />}
                      label={`QuickGo${quickgoCount ? ` (${quickgoCount})` : ""}`}
                    />
                    <TabBtn
                      active={activeTab === "wizard"}
                      onClick={() => setActiveTab("wizard")}
                      icon={<ShoppingCart className="h-3.5 w-3.5" />}
                      label={`Wizard Mall${wizardCount ? ` (${wizardCount})` : ""}`}
                    />
                  </>
                ) : (
                  <>
                    <TabBtn
                      active={activeTab === "wizard"}
                      onClick={() => setActiveTab("wizard")}
                      icon={<ShoppingCart className="h-3.5 w-3.5" />}
                      label={`Wizard Mall${wizardCount ? ` (${wizardCount})` : ""}`}
                    />
                    <TabBtn
                      active={activeTab === "quickgo"}
                      onClick={() => setActiveTab("quickgo")}
                      icon={<Zap className="h-3.5 w-3.5" />}
                      label={`QuickGo${quickgoCount ? ` (${quickgoCount})` : ""}`}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Remove All */}
            {showItems && (
              <div className="flex items-center justify-end border-b border-[var(--border-primary)] px-5 py-2">
                <button
                  onClick={() => setConfirm({ kind: "clear-all" })}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-danger)] hover:opacity-80 transition-opacity"
                >
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
                      <Skeleton
                        width={72}
                        height={72}
                        className="rounded-xl shrink-0"
                      />
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
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Your cart is empty
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {isLoggedIn
                        ? "Browse products and add items"
                        : "Sign in to view your cart"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}

              {showItems && (
                <div className="divide-y divide-[var(--border-primary)]">
                  {summary.groups.map((group) => (
                    <CartGroupRow
                      key={group.groupKey}
                      group={group}
                      enrichedById={enrichedById}
                      onRemoveProduct={() =>
                        setConfirm({
                          kind: "remove-product",
                          productId: group.productId,
                          productName: group.productName,
                        })
                      }
                      onRequestVariationRemove={(item) =>
                        onRequestVariationRemove(item, group)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {showItems && (
              <div className="shrink-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-5 pb-5 pt-4">
                {totalSavings > 0 && (
                  <div className="mb-2 flex items-center justify-between text-xs text-green-600">
                    <span>You save</span>
                    <span className="font-semibold">
                      − {format(totalSavings)}
                    </span>
                  </div>
                )}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">
                    Subtotal
                  </span>
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {format(subtotal)}
                  </span>
                </div>
                <p className="mb-4 text-[11px] text-[var(--text-muted)]">
                  Shipping & taxes calculated at checkout
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                  <Link href={checkoutRoute} className="flex-1">
                    <Button
                      fullWidth
                      onClick={() => setCartOpen(false)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>

          <ConfirmModal
            isOpen={!!confirm}
            onClose={() => setConfirm(null)}
            onConfirm={handleConfirm}
            title={
              confirm?.kind === "clear-all"
                ? "Empty your cart?"
                : confirm?.kind === "remove-product"
                  ? "Remove this product?"
                  : "Remove this item?"
            }
            message={
              confirm?.kind === "clear-all"
                ? "All items across both storefronts will be removed. This cannot be undone."
                : confirm?.kind === "remove-product"
                  ? `All variations of ${confirm.productName} in your cart will be removed.`
                  : confirm?.kind === "remove-variation"
                    ? `${confirm.label} will be removed from your cart.`
                    : ""
            }
            confirmText="Remove"
            variant="danger"
          />
        </>
      )}
    </AnimatePresence>
  );
}

function CartGroupRow({
  group,
  enrichedById,
  onRemoveProduct,
  onRequestVariationRemove,
}: {
  group: ProductGroupSummary;
  enrichedById: Map<string, EnrichedCartItem>;
  onRemoveProduct: () => void;
  onRequestVariationRemove: (item: EnrichedCartItem) => void;
}) {
  const { format } = usePrice();

  return (
    <div className="py-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
          {group.productName}
        </h4>
        <button
          onClick={onRemoveProduct}
          className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-[var(--accent-danger)] hover:opacity-80 transition-opacity"
          aria-label={`Remove ${group.productName}`}
        >
          <Trash2 className="h-3 w-3" /> Remove product
        </button>
      </div>

      {group.appliedOffer && group.freeQty > 0 && (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ✓ {group.appliedOffer.name} — {group.freeQty} FREE
        </span>
      )}
      {group.bulkApplied && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Bulk Price Applied
        </span>
      )}

      <div className="space-y-2">
        {group.items.map((item) => {
          const enriched = enrichedById.get(item.id) ?? item;
          return (
            <CartSubRow
              key={item.id}
              item={enriched}
              onRequestRemove={() => onRequestVariationRemove(enriched)}
            />
          );
        })}
      </div>

      <div className="pt-2 border-t border-dashed border-[var(--border-primary)] space-y-1">
        {(group.freeQty > 0 || group.bulkApplied) && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              {group.freeQty > 0 && (
                <>
                  {group.paidQty} pay +{" "}
                  <span className="text-green-600 font-medium">
                    {group.freeQty} FREE
                  </span>
                </>
              )}
              {group.bulkApplied && (
                <>
                  {group.freeQty > 0 ? " — " : ""}
                  <span className="text-[var(--accent-primary)] font-medium">
                    bulk tier
                  </span>
                </>
              )}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            You pay
          </span>
          <span className="flex items-baseline gap-2">
            {group.groupSavings > 0 && (
              <span className="text-[11px] text-[var(--text-muted)] line-through">
                {format(group.groupOriginal)}
              </span>
            )}
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {format(group.groupFinal)}
            </span>
          </span>
        </div>
        {group.groupSavings > 0 && (
          <div className="flex items-center justify-end">
            <span className="text-[10px] font-semibold text-green-600">
              You save {format(group.groupSavings)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CartSubRow({
  item,
  onRequestRemove,
}: {
  item: EnrichedCartItem;
  onRequestRemove: () => void;
}) {
  const updateCart = useUpdateCartItem();
  const { format } = usePrice();
  const isPending = updateCart.isPending;

  const attrs = (item.attributes || {}) as Record<string, string>;
  const attrPairs = Object.entries(attrs);

  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg bg-[var(--bg-secondary)] p-2",
        isPending && "opacity-50 pointer-events-none",
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
        {item.image ? (
          <Image
            src={resolveAssetUrl(item.image)}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
        )}
        {item.freeQty > 0 && (
          <div className="absolute left-0.5 top-0.5 rounded bg-green-500 px-1 py-0.5 text-[8px] font-bold text-white">
            {item.freeQty === item.quantity ? "FREE" : `${item.freeQty} FREE`}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {attrPairs.length > 0 && (
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {attrPairs.map(([, v]) => v).join(" · ")}
            </span>
          )}
          <span
            className={cn(
              "text-[11px]",
              item.bulkApplied
                ? "font-semibold text-[var(--accent-primary)]"
                : item.effectiveUnitPrice < item.originalUnitPrice
                  ? "font-semibold text-green-600"
                  : "text-[var(--text-muted)]",
            )}
          >
            {format(item.effectiveUnitPrice)} each
          </span>
          {item.effectiveUnitPrice < item.originalUnitPrice && (
            <span className="text-[10px] text-[var(--text-muted)] line-through">
              {format(item.originalUnitPrice)}
            </span>
          )}
        </div>

        {item.freeQty > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">
              {item.paidQty} paid
            </span>
            <span className="text-[9px] font-medium text-green-600">
              + {item.freeQty} FREE
            </span>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          <QuantityControl
            quantity={item.quantity}
            onIncrement={() =>
              updateCart.mutate({ id: item.id, quantity: item.quantity + 1 })
            }
            onDecrement={() =>
              updateCart.mutate({ id: item.id, quantity: item.quantity - 1 })
            }
            onDelete={onRequestRemove}
            disabled={isPending}
            itemName={item.productName}
            deleteLoading={false}
            size="sm"
          />
          <div className="flex flex-col items-end">
            {item.lineFinal < item.lineOriginal && (
              <span className="text-[10px] text-[var(--text-muted)] line-through">
                {format(item.lineOriginal)}
              </span>
            )}
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {format(item.lineFinal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all",
        active
          ? "bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export default CartDrawer;
