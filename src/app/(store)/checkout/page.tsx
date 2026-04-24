"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DefaultPage from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useRemoveProductFromCart,
  useClearCart,
} from "@/services/cart";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAddresses, useCreateAddress } from "@/services/address";
import { useShippingByCountry } from "@/services/shipping";
import { useCountryStore } from "@/stores/useCountryStore";
import { usePrice } from "@/hooks/usePrice";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartSummary } from "@/hooks/useCartSummary";
import { useActivePromoCodes } from "@/services/promo";
import { useDonations } from "@/services/donate";
import { useUpdateMyProfile } from "@/services/auth";
import {
  AddressFormModal,
  type AddressFormValue,
} from "@/components/shared/AddressFormModal";
import { api, ENDPOINTS } from "@/lib/api";
import { ROUTES } from "@/config/routes";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  ShoppingBag, MapPin, CreditCard,
  ChevronDown, ChevronUp, Clock, Truck, Tag, Gift, StickyNote,
  Plus, Check, FileText, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import type { EnrichedCartItem, ProductGroupSummary } from "@/lib/cartMath";
import type { Address } from "@/types/user";

const EMPTY_ADDRESS_FORM = {
  name: "", phone: "", email: "", addressLine1: "", addressLine2: "",
  city: "", state: "", pincode: "", country: "India", isDefault: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchPlatform =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("platform")?.toLowerCase()
      : undefined;
  // The URL query drives the theme + which cart subset is rendered so the
  // user checks out exactly what they saw in the drawer.
  const originPlatform: "wizard" | "quickgo" =
    searchPlatform === "quickgo" ? "quickgo" : "wizard";
  const { data: cartResponse, isLoading: cartLoading } = useCart();
  const cartItems = (cartResponse?.items ?? []).filter((item) => {
    const p = String(item.purchasePlatform ?? "").toLowerCase();
    if (originPlatform === "quickgo")
      return p === "quickgo" || p === "hecate-quickgo";
    return p === "" || p === "wizard" || p === "website";
  });
  // Items checkable on/off; all selected by default.
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const toggleItemSelected = (id: string) => {
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Cart mutation hooks used by the page-level confirmation modal.
  // Variation-level delete is still handled by QuantityControl's built-in
  // DeleteConfirmModal (trash icon at qty=1); we only surface the two
  // coarser actions ("remove the whole product" / "clear cart") here.
  const removeProductMutation = useRemoveProductFromCart();
  const clearCartMutation = useClearCart();
  const [pendingConfirm, setPendingConfirm] = useState<
    | { kind: "clear" }
    | { kind: "remove-product"; productId: string; productName: string }
    | null
  >(null);

  const handleConfirmPending = async () => {
    if (!pendingConfirm) return;
    try {
      if (pendingConfirm.kind === "clear") {
        await clearCartMutation.mutateAsync();
      } else {
        await removeProductMutation.mutateAsync(pendingConfirm.productId);
      }
    } finally {
      setPendingConfirm(null);
    }
    // Cart query invalidates in the mutations' onSuccess — the next render
    // receives fresh server-computed groups/summary, so offer + bulk tiers
    // re-evaluate against the smaller cart automatically.
  };
  const { code: countryCode } = useCountryStore();
  const { format } = usePrice();
  const { data: shippingOptions } = useShippingByCountry(countryCode);
  const { user } = useAuthStore();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const { data: activePromos } = useActivePromoCodes(user?.id);
  const { data: donationCampaignsRaw } = useDonations(countryCode);
  // `/donations/country/:code` can return either a flat array or a paginated
  // wrapper depending on the server version — normalise to an array.
  // The DonationCampaign schema exposes `amounts: Float[]` (preset suggested
  // donations) and `active: boolean`; `targetAmount`/`isActive` are kept as
  // aliases so older server builds still render.
  const donationCampaigns = Array.isArray(donationCampaignsRaw)
    ? (donationCampaignsRaw as Array<{
      id: number;
      title: string;
      description?: string;
      amounts?: number[];
      targetAmount?: number;
      currency?: string;
      countryCode?: string;
      image?: string;
      active?: boolean;
      isActive?: boolean;
    }>)
    : [];
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  // Which preset amount (from the campaign's `amounts` array) is currently
  // active — null means "custom or none". Kept separate from
  // `donationAmount` so the UI can highlight the exact preset chip the
  // shopper picked, while a custom-typed amount leaves every chip
  // unselected.
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<
    number | null
  >(null);

  // Billing address from user profile
  const billingAddress = useMemo(() => {
    if (!user) return null;
    // Check if user has address fields populated
    const u = user as any;
    if (u.addressLine1 || u.address) {
      return {
        name: u.name || "",
        phone: u.phone || "",
        address: u.addressLine1 || u.address || "",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || "",
        country: u.country || "",
      };
    }
    return null;
  }, [user]);

  // Shipping address selection
  // Address ids are cuids (strings); "billing" is a reserved marker meaning
  // "use the shopper's billing address as the shipping address".
  const [selectedShippingId, setSelectedShippingId] = useState<string | "billing" | null>(null);

  // Set default shipping = billing on first load
  useEffect(() => {
    if (selectedShippingId !== null) return;
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedShippingId(defaultAddr ? defaultAddr.id : addresses[0].id);
    } else if (billingAddress) {
      setSelectedShippingId("billing");
    }
  }, [addresses, billingAddress, selectedShippingId]);

  // Modals
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [shippingFormMode, setShippingFormMode] = useState<"list" | "form">("list");

  // Shared address-form modal (country/state/city dropdowns, phone with
  // country-specific validation, profile image on billing, address type +
  // default toggle on shipping). `addressFormMode === null` means the modal
  // is closed.
  const [addressFormMode, setAddressFormMode] = useState<
    "billing" | "shipping" | null
  >(null);
  const updateMyProfile = useUpdateMyProfile();
  const createShippingAddress = useCreateAddress();

  // Seed values for the shared modal — rebuilt each time it opens.
  // AddressFormValue uses `countryPhoneCode` (not `countryCode`) for the
  // dialling prefix, so we map the User.countryCode column onto it. We
  // strip the dialling code off the stored phone using the saved
  // `countryCode` exactly — a generic `\d{1,4}` greedy strip would eat
  // extra digits off the real number (e.g. "+919198765432" →
  // "76543210" instead of "9198765432").
  const billingInitial = useMemo<Partial<AddressFormValue>>(() => {
    const u = (user as any) ?? {};
    const storedPhone = String(u.phone ?? "");
    const dial = String(u.countryCode ?? "");
    const phoneLocal = dial && storedPhone.startsWith(dial)
      ? storedPhone.slice(dial.length)
      : storedPhone.replace(/^\+/, "");
    return {
      name: u.name ?? "",
      email: u.email ?? "",
      gender: (u.gender as "MALE" | "FEMALE" | "OTHER" | undefined) ?? "",
      profileImage: u.profileImage ?? "",
      phone: phoneLocal,
      countryPhoneCode: dial,
      countryName: u.country ?? "",
      stateName: u.state ?? "",
      cityName: u.city ?? "",
      postalCode: u.pincode ?? "",
      addressLine1: u.address ?? u.addressLine1 ?? "",
    };
  }, [user]);

  const shippingInitial = useMemo<Partial<AddressFormValue>>(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      addressType: "HOME",
      isDefault: false,
    }),
    [user],
  );

  // Legacy billing form state
  const [billingForm, setBillingForm] = useState({
    name: user?.name || "", phone: user?.phone || "", address: "", city: "", state: "", pincode: "",
  });
  const [savingBilling, setSavingBilling] = useState(false);

  // Shipping form state
  const [shippingForm, setShippingForm] = useState({ ...EMPTY_ADDRESS_FORM });

  // Other checkout state
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [note, setNote] = useState("");
  const [donationAmount, setDonationAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"PayU" | "PayGlocal">(
    countryCode === "IND" ? "PayU" : "PayGlocal",
  );
  // The brief requires payment gateway selection to follow the BILLING
  // address country, not the browsing country. India -> PayU, else PayGlocal.
  // We re-derive inside an effect so a user who changes billing country
  // doesn't get charged through the wrong rail.
  useEffect(() => {
    const billingCountry = (() => {
      const userCountry = (user as any)?.country;
      const addrCountry = (addresses ?? []).find((a) => a.isDefault)?.country;
      return String(userCountry || addrCountry || "India");
    })();
    const isIndia =
      /india/i.test(billingCountry) || billingCountry.toUpperCase() === "IND";
    setPaymentMethod(isIndia ? "PayU" : "PayGlocal");
  }, [user, addresses]);
  const [placing, setPlacing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    promo: false, note: false, donate: false,
  });

  const items = (cartItems ?? []).filter((i) => !deselectedIds.has(i.id));
  // Shared cart-math engine — same logic powers CartDrawer and ProductDetail.
  // Handles bulk pricing, RANGE_FREE offers (who gets free units), PERCENT
  // offers, and per-line savings breakdown.
  const { summary: cartSummary } = useCartSummary(items);
  // Display summary runs the same math over the FULL cart (including
  // deselected rows) so the left-hand groups show an honest paid/free/save
  // breakdown next to the "Include in this order" checkbox. The totals on
  // the right still use `cartSummary` (selected items only).
  const { summary: displaySummary } = useCartSummary(cartItems ?? []);
  const subtotal = cartSummary.subtotalFinal;

  // Resolve the shipping address first — every downstream (country code,
  // shipping-options fetch, shippingPrice) depends on it. Declaration
  // order matters because these are used inside hooks below; keeping them
  // in a single block avoids "used before initialization" errors.
  const resolvedShippingAddress = useMemo(() => {
    if (selectedShippingId === "billing" && billingAddress) {
      return billingAddress;
    }
    if (selectedShippingId && selectedShippingId !== "billing" && addresses) {
      const addr = addresses.find((a) => a.id === selectedShippingId);
      if (addr) {
        // Legacy backend rows use `address`, modern ones `addressLine1` —
        // prefer whichever is populated so the rendered card never shows
        // the literal string "undefined".
        const raw = addr as unknown as {
          address?: string;
          addressLine1?: string;
          addressLine2?: string;
        };
        const street = raw.addressLine1 ?? raw.address ?? "";
        return {
          name: addr.name,
          phone: addr.phone,
          address: raw.addressLine2
            ? `${street}, ${raw.addressLine2}`
            : street,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: addr.country,
        };
      }
    }
    return null;
  }, [selectedShippingId, billingAddress, addresses]);

  // Prefer the shipping address country so the ShippingPricing rows we show
  // actually match where the parcel is going. The backend matches on the
  // `country` name AND the `code` column (case-insensitive), so passing
  // whichever string we have — full name or ISO — resolves to the same
  // set of rows. Falls back to the topbar country when no address is
  // picked yet.
  const shippingCountryCode = useMemo(() => {
    const raw = (
      resolvedShippingAddress as { country?: string } | null
    )?.country?.trim();
    return raw || countryCode;
  }, [resolvedShippingAddress, countryCode]);
  const { data: addressShippingOptions } = useShippingByCountry(
    shippingCountryCode,
  );
  const effectiveShippingOptions =
    addressShippingOptions && addressShippingOptions.length > 0
      ? addressShippingOptions
      : shippingOptions;
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<
    number | null
  >(null);

  // Default-select the first available option whenever the country changes.
  useEffect(() => {
    if (!effectiveShippingOptions || effectiveShippingOptions.length === 0) {
      setSelectedShippingOptionId(null);
      return;
    }
    const first = effectiveShippingOptions[0];
    setSelectedShippingOptionId((prev) =>
      prev != null && effectiveShippingOptions.some((o) => o.id === prev)
        ? prev
        : first.id,
    );
  }, [effectiveShippingOptions]);

  const shippingPrice = useMemo(() => {
    const list = effectiveShippingOptions;
    if (!list || list.length === 0) return 0;
    const picked =
      list.find((o) => o.id === selectedShippingOptionId) ?? list[0];
    return Number(picked?.price) || 0;
  }, [effectiveShippingOptions, selectedShippingOptionId]);

  const total = subtotal + shippingPrice - promoDiscount + donationAmount;

  const isQuickGo =
    typeof window !== "undefined" && window.location.pathname.includes("quickgo");
  const now = new Date();
  const before3pm = now.getHours() < 15;

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    try {
      const { data } = await api.post(ENDPOINTS.PROMO_CODES.APPLY, {
        code: promoCode, userId: user?.id, subtotal,
      });
      if (data.success) {
        setPromoDiscount(data.data.discountAmount);
        setPromoApplied(true);
        toast.success("Promo code applied!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid promo code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleSaveBilling = async () => {
    if (!billingForm.name || !billingForm.address || !billingForm.city || !billingForm.state || !billingForm.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setSavingBilling(true);
    try {
      // Save billing to user profile. Backend DTO keys the row by `id` (not
      // `userId`) — sending `userId` fails validation.
      await api.put(ENDPOINTS.AUTH.UPDATE_USER, {
        id: user!.id,
        name: billingForm.name,
        phone: billingForm.phone,
        address: billingForm.address,
        city: billingForm.city,
        state: billingForm.state,
        pincode: billingForm.pincode,
      });
      // Update local auth store
      useAuthStore.getState().setUser({
        ...user!,
        name: billingForm.name,
        phone: billingForm.phone,
        ...(billingForm as any),
      });
      toast.success("Billing address saved!");
      setBillingModalOpen(false);
      // If no shipping selected yet, default to billing
      if (!selectedShippingId) {
        setSelectedShippingId("billing");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save billing address");
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!shippingForm.name || !shippingForm.addressLine1 || !shippingForm.city || !shippingForm.state || !shippingForm.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const result = await createAddress.mutateAsync(shippingForm as any);
      toast.success("Shipping address added!");
      // Select the newly created address
      if (result?.data?.id) {
        setSelectedShippingId(result.data.id);
      }
      setShippingForm({ ...EMPTY_ADDRESS_FORM });
      setShippingFormMode("list");
      setShippingModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!billingAddress) {
      toast.error("Please add billing address");
      return;
    }
    if (!resolvedShippingAddress) {
      toast.error("Please select or add a shipping address");
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post(ENDPOINTS.ORDERS.CREATE, {
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        // Account-level phone (copied from the user profile). This is
        // distinct from billing.phone / shipping.phone which could be
        // different contacts when the shopper sends a gift. Admins
        // reach out on this number first.
        userPhone: (user as { phone?: string } | null)?.phone ?? undefined,
        // Which storefront placed the order — "wizard" (Mall) vs
        // "quickgo". Powers the Source badge in dashboards and admin
        // reports.
        orderBy: originPlatform,
        shippingAddress: {
          name: resolvedShippingAddress.name, phone: resolvedShippingAddress.phone,
          address: resolvedShippingAddress.address, city: resolvedShippingAddress.city,
          state: resolvedShippingAddress.state, pincode: resolvedShippingAddress.pincode,
        },
        billingAddress: {
          name: billingAddress.name, phone: billingAddress.phone,
          address: billingAddress.address, city: billingAddress.city,
          state: billingAddress.state, pincode: billingAddress.pincode,
        },
        items: items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId ?? undefined,
          name: item.productName,
          quantity: item.quantity,
          price: item.pricePerItem,
          pricePerItem: item.pricePerItem,
          attributes: item.attributes,
          image: item.image ?? undefined,
          paidQty: item.paidQty,
          freeQty: item.freeQty,
          bulkApplied: item.bulkApplied,
          offerApplied: item.offerApplied,
          offerName: item.offerName ?? undefined,
          offerId: item.offerId ?? undefined,
          barCode: item.barCode ?? undefined,
        })),
        subtotal,
        shippingCharges: shippingPrice,
        discountAmount: promoDiscount,
        totalAmount: total,
        paymentMethod,
        promoCode: promoApplied ? promoCode : undefined,
        donationAmount: donationAmount > 0 ? donationAmount : undefined,
        note: note.trim() || undefined,
      });
      if (data.success) {
        // PayU flow — backend returned the launch params for the
        // gateway. We build a hidden form and submit it; the browser
        // navigates off to PayU and we never hit our success page
        // directly. PayU's own surl/furl webhook will redirect the
        // shopper back to /payment-success or /payment-failed.
        const launch = (data.data ?? {}) as {
          gateway?: string;
          actionUrl?: string;
          params?: Record<string, string>;
          redirectUrl?: string;
        };
        if (launch.gateway === "payu" && launch.actionUrl && launch.params) {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = launch.actionUrl;
          for (const [name, value] of Object.entries(launch.params)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = String(value ?? "");
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          return; // browser is navigating away; don't reset placing
        }
        // PayGlocal flow — backend already hit PayGlocal's initiate API
        // and got a hosted-checkout URL back. Just point the browser at
        // it and let PayGlocal handle card entry + 3DS / OTP. PayGlocal
        // will bounce the shopper back to /payment-success after.
        if (launch.gateway === "payglocal" && launch.redirectUrl) {
          window.location.href = launch.redirectUrl;
          return;
        }
        // Non-gateway methods (COD etc.) — treat as direct success.
        toast.success("Order placed!");
        router.push(ROUTES.PAYMENT_SUCCESS);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading) {
    return (
      <DefaultPage>
        <PrivateRoute>
          <Loader variant="section" message="Loading your cart..." />
        </PrivateRoute>
      </DefaultPage>
    );
  }

  return (
    <DefaultPage>
      <PrivateRoute>
        <div
          data-checkout-platform={originPlatform}
          className={cn(
            "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
            // When checkout was initiated from QuickGo, the teal accent tokens
            // layered in hecate-quickgo/layout.tsx won't apply here (we're
            // under the default store route), so tag the wrapper so targeted
            // styles + the theme toggle can key off it in future passes.
            originPlatform === "quickgo" && "checkout-theme-quickgo",
          )}
        >
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl mb-6">Checkout</h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="h-12 w-12 text-[var(--text-muted)] mb-4" />
              <p className="text-lg font-medium text-[var(--text-primary)]">Your cart is empty</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push(ROUTES.CATEGORIES)}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* LEFT: Cart items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery info */}
                {isQuickGo && (
                  <div className={cn("flex items-center gap-2 rounded-xl p-3 text-sm font-medium", before3pm ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400")}>
                    <Clock className="h-4 w-4 shrink-0" />
                    {before3pm ? "Order before 3 PM for same-day dispatch!" : `Order now — dispatches tomorrow at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </div>
                )}
                {!isQuickGo && (
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-secondary)]">
                    <Truck className="h-4 w-4 shrink-0" /> Estimated delivery: 3-4 business days
                  </div>
                )}

                {/* Cart Items (grouped by product). Checkboxes let the user
                    skip individual items for this order without removing them
                    from the cart — all items default to selected. */}
                {deselectedIds.size > 0 && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-[var(--accent-primary)]/5 px-3 py-2 text-xs text-[var(--accent-primary)]">
                    <span>
                      {deselectedIds.size} item(s) skipped — they&apos;ll stay
                      in your cart.
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeselectedIds(new Set())}
                      className="font-semibold hover:underline"
                    >
                      Select all
                    </button>
                  </div>
                )}
                {/* Cart list header with the "Remove All" shortcut. Matches
                    the cart-drawer pattern — a single click clears the
                    shopper's whole basket (behind a confirm). */}
                {displaySummary.groups.length > 0 && (
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      {displaySummary.groups.length}{" "}
                      {displaySummary.groups.length === 1
                        ? "product"
                        : "products"}{" "}
                      in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingConfirm({ kind: "clear" })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-danger)] hover:opacity-80 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" /> Remove All
                    </button>
                  </div>
                )}
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] divide-y divide-[var(--border-primary)]">
                  {displaySummary.groups.map((group) => {
                    const groupIds = group.items.map((i) => i.id);
                    const allDeselected = groupIds.every((id) =>
                      deselectedIds.has(id),
                    );
                    return (
                      <div
                        key={group.groupKey}
                        className={cn(
                          "transition-opacity",
                          allDeselected && "opacity-50",
                        )}
                      >
                        <label className="flex cursor-pointer items-center gap-3 px-4 pt-3 text-xs text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            checked={!allDeselected}
                            onChange={() => {
                              setDeselectedIds((prev) => {
                                const next = new Set(prev);
                                if (allDeselected) {
                                  for (const id of groupIds) next.delete(id);
                                } else {
                                  for (const id of groupIds) next.add(id);
                                }
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)]"
                          />
                          <span>Include in this order</span>
                        </label>
                        <CheckoutSummaryGroup
                          group={group}
                          onRemoveProduct={() =>
                            setPendingConfirm({
                              kind: "remove-product",
                              productId: group.productId,
                              productName: group.productName,
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Order summary */}
              <div className="lg:sticky lg:top-24 lg:h-fit space-y-4">
                {/* Summary card */}
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Order Summary</h3>

                  {/* Billing Address Section */}
                  <div className="mb-4 pb-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Billing Address
                      </h4>
                    </div>
                    {billingAddress ? (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)] space-y-0.5">
                          <p className="font-medium text-[var(--text-primary)]">
                            {billingAddress.name}
                          </p>
                          {billingAddress.phone && <p>{billingAddress.phone}</p>}
                          <p>{billingAddress.address}</p>
                          <p>
                            {billingAddress.city}, {billingAddress.state} -{" "}
                            {billingAddress.pincode}
                          </p>
                          {billingAddress.country && (
                            <p className="text-[var(--text-muted)]">
                              {billingAddress.country}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddressFormMode("billing")}
                          className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                        >
                          Update billing address
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddressFormMode("billing")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] p-3 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Billing Address
                      </button>
                    )}
                  </div>

                  {/* Shipping Address Section — gated on billing. Until the
                      shopper has saved a billing address we can't default
                      the shipping row, so show a stub message instead of
                      a dead "Add" button. */}
                  <div className="mb-4 pb-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Shipping Address
                      </h4>
                      {billingAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            setShippingFormMode("list");
                            setShippingModalOpen(true);
                          }}
                          className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                        >
                          Change address
                        </button>
                      )}
                    </div>
                    {!billingAddress ? (
                      <p className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-3 text-xs text-[var(--text-muted)]">
                        Please add or update your billing address first — the
                        same address is used for delivery unless you pick a
                        different one.
                      </p>
                    ) : resolvedShippingAddress ? (
                      <>
                        <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)] space-y-0.5">
                          <p className="font-medium text-[var(--text-primary)]">
                            {resolvedShippingAddress.name}
                          </p>
                          {resolvedShippingAddress.phone && (
                            <p>{resolvedShippingAddress.phone}</p>
                          )}
                          <p>{resolvedShippingAddress.address}</p>
                          <p>
                            {resolvedShippingAddress.city},{" "}
                            {resolvedShippingAddress.state} -{" "}
                            {resolvedShippingAddress.pincode}
                          </p>
                          {(resolvedShippingAddress as { country?: string })
                            .country && (
                            <p className="text-[var(--text-muted)]">
                              {(resolvedShippingAddress as { country?: string })
                                .country}
                            </p>
                          )}
                          {selectedShippingId === "billing" && (
                            <p className="text-[10px] italic text-[var(--text-muted)] mt-1">
                              Same as billing address
                            </p>
                          )}
                        </div>

                        {/* Shipping method picker — rows are admin-defined
                            per country (ShippingPricing table). Shown only
                            when there's actually a choice to make. */}
                        {effectiveShippingOptions &&
                          effectiveShippingOptions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                                Shipping method
                              </p>
                              <div className="space-y-1.5">
                                {effectiveShippingOptions.map((opt) => {
                                  const picked =
                                    selectedShippingOptionId === opt.id ||
                                    (selectedShippingOptionId == null &&
                                      opt ===
                                      effectiveShippingOptions[0]);
                                  return (
                                    <label
                                      key={opt.id}
                                      className={cn(
                                        "flex items-center gap-3 rounded-lg border p-2.5 text-xs cursor-pointer transition-all",
                                        picked
                                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
                                          : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]",
                                      )}
                                    >
                                      <input
                                        type="radio"
                                        name="shipping-method"
                                        checked={!!picked}
                                        onChange={() =>
                                          setSelectedShippingOptionId(opt.id)
                                        }
                                        className="accent-[var(--accent-primary)]"
                                      />
                                      <span className="flex-1 font-medium text-[var(--text-primary)]">
                                        {opt.name || opt.method || "Delivery"}
                                      </span>
                                      <span className="font-semibold text-[var(--text-primary)]">
                                        {Number(opt.price) > 0
                                          ? format(Number(opt.price))
                                          : "Free"}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </>
                    ) : addressesLoading ? (
                      <div className="h-16 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddressFormMode("shipping")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] p-3 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Shipping Address
                      </button>
                    )}
                  </div>

                  {/* Price breakdown. Offer/bulk savings are already visible
                      on each cart group (strike-through + "You save"), so we
                      keep this summary focused on totals only. */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Subtotal ({items.length} items)</span>
                      <span>{format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Shipping</span>
                      <span>
                        {shippingPrice > 0 ? format(shippingPrice) : "Free"}
                      </span>
                    </div>
                    {promoApplied && promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount</span>
                        <span>-{format(promoDiscount)}</span>
                      </div>
                    )}
                    {donationAmount > 0 && (
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Donation</span>
                        <span>{format(donationAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[var(--border-primary)] pt-3 flex justify-between font-bold text-[var(--text-primary)] text-base">
                      <span>Total</span>
                      <span>{format(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <SectionToggle
                  title="Promo Code"
                  icon={<Tag className="h-4 w-4" />}
                  expanded={expandedSections.promo}
                  onToggle={() => toggleSection("promo")}
                >
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={promoApplied}
                      />
                      {promoApplied ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPromoApplied(false);
                            setPromoDiscount(0);
                            setPromoCode("");
                            toast.success("Promo removed");
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleApplyPromo}
                          loading={applyingPromo}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                    {promoApplied && promoDiscount > 0 && (
                      <p className="text-[11px] font-medium text-green-600">
                        {promoCode} applied {"\u2014"} you save {format(promoDiscount)}
                      </p>
                    )}
                    {!promoApplied && activePromos && activePromos.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Available offers
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activePromos.map((p) => {
                            // A code is disabled when it's either already
                            // claimed by this shopper or the global usage
                            // limit has been exhausted. We still render it
                            // so the admin's hand-out remains recognisable
                            // — just greyed out with a clear "Used" tag
                            // so the shopper knows why they can't apply it.
                            const used = !!p.usedByUser;
                            const exhausted = !!p.exhausted;
                            const disabled = used || exhausted;
                            const stateLabel = used
                              ? "Used"
                              : exhausted
                                ? "Used up"
                                : "";
                            const isPrivate = p.appliesTo === "SPECIFIC_USERS";
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => !disabled && setPromoCode(p.code)}
                                title={
                                  used
                                    ? "You've already claimed this code"
                                    : exhausted
                                      ? "This code has reached its usage limit"
                                      : isPrivate
                                        ? "Private invitation — only visible to you"
                                        : undefined
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                  disabled
                                    ? "cursor-not-allowed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                                    : "border-[var(--accent-primary)]/40 bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:border-[var(--accent-primary)]",
                                )}
                              >
                                <Tag className="h-3 w-3" />
                                <span
                                  className={cn(
                                    "font-mono font-semibold",
                                    disabled && "line-through",
                                  )}
                                >
                                  {p.code}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {p.discountType === "FLAT"
                                    ? `${format(p.discountValue)} off`
                                    : `${p.discountValue}% off`}
                                </span>
                                {stateLabel && (
                                  <span className="rounded-full bg-[var(--bg-primary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    {stateLabel}
                                  </span>
                                )}
                                {!disabled && isPrivate && (
                                  <span className="rounded-full bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                                    Invite
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionToggle>

                {/* Note */}
                <SectionToggle title="Add Note" icon={<StickyNote className="h-4 w-4" />} expanded={expandedSections.note} onToggle={() => toggleSection("note")}>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any special instructions..." rows={3} />
                </SectionToggle>

                {/* Donate — campaigns come from admin (Donation Campaigns) so the
                    checkout reflects whatever causes are currently live. */}
                <SectionToggle
                  title="Donate"
                  icon={<Gift className="h-4 w-4" />}
                  expanded={expandedSections.donate}
                  onToggle={() => toggleSection("donate")}
                >
                  <div className="space-y-4">
                    {donationCampaigns.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">
                        No donation campaigns live right now.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {donationCampaigns
                          .filter(
                            (c) => c.active !== false && c.isActive !== false,
                          )
                          .map((c) => {
                            const isCampaignPicked = selectedCampaignId === c.id;
                            // Preset amounts admin saved on the campaign.
                            // Fall back to `targetAmount` (legacy single
                            // suggested) when `amounts[]` isn't provided so
                            // older campaigns still offer one-click donate.
                            const presets = Array.isArray(c.amounts) && c.amounts.length > 0
                              ? c.amounts
                              : c.targetAmount
                                ? [c.targetAmount]
                                : [];
                            return (
                              <div
                                key={c.id}
                                className={cn(
                                  "rounded-lg border p-3 transition-all",
                                  isCampaignPicked
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
                                    : "border-[var(--border-primary)]",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                      {c.title}
                                    </p>
                                    {c.description && (
                                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
                                        {c.description}
                                      </p>
                                    )}
                                  </div>
                                  {isCampaignPicked && (
                                    <span className="shrink-0 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                      Selected
                                    </span>
                                  )}
                                </div>

                                {presets.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap gap-2">
                                    {presets.map((amt) => {
                                      const isPicked =
                                        isCampaignPicked &&
                                        selectedDonationAmount === amt;
                                      return (
                                        <button
                                          key={`${c.id}-${amt}`}
                                          type="button"
                                          onClick={() => {
                                            if (isPicked) {
                                              // Same chip clicked again -> deselect.
                                              setSelectedCampaignId(null);
                                              setSelectedDonationAmount(null);
                                              setDonationAmount(0);
                                            } else {
                                              setSelectedCampaignId(c.id);
                                              setSelectedDonationAmount(amt);
                                              setDonationAmount(amt);
                                            }
                                          }}
                                          className={cn(
                                            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                            isPicked
                                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                                              : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]",
                                          )}
                                        >
                                          {format(amt)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    <div>
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Or enter a custom amount
                      </p>
                      <Input
                        type="number"
                        min={0}
                        value={
                          selectedDonationAmount == null && donationAmount > 0
                            ? String(donationAmount)
                            : ""
                        }
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          // Custom amount wins — clear whichever preset
                          // was selected so the chips visually deselect.
                          setSelectedDonationAmount(null);
                          setDonationAmount(amount);
                        }}
                        placeholder="Enter any amount"
                      />
                    </div>

                    {donationAmount > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-[var(--accent-primary-light)] px-3 py-2">
                        <span className="text-xs text-[var(--accent-primary)]">
                          Donating
                        </span>
                        <span className="text-sm font-bold text-[var(--accent-primary)]">
                          {format(donationAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </SectionToggle>

                {/* Payment */}
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Method
                  </h3>
                  <div className="space-y-2">
                    {countryCode === "IND" && (
                      <label className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                        paymentMethod === "PayU" ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]" : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
                      )}>
                        <input type="radio" name="payment" checked={paymentMethod === "PayU"} onChange={() => setPaymentMethod("PayU")} className="accent-[var(--accent-primary)]" />
                        <Image src="/image/new-payu-logo.svg" alt="PayU" width={60} height={24} className="h-5 w-auto" />
                        <span className="text-sm text-[var(--text-secondary)]">PayU</span>
                      </label>
                    )}
                    <label className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                      paymentMethod === "PayGlocal" ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]" : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
                    )}>
                      <input type="radio" name="payment" checked={paymentMethod === "PayGlocal"} onChange={() => setPaymentMethod("PayGlocal")} className="accent-[var(--accent-primary)]" />
                      <Image src="/image/payglocal-logo.png" alt="PayGlocal" width={80} height={24} className="h-5 w-auto" />
                      <span className="text-sm text-[var(--text-secondary)]">PayGlocal</span>
                    </label>
                  </div>
                </div>

                {/* Place Order */}
                <Button fullWidth size="lg" loading={placing} onClick={handlePlaceOrder}>
                  Place Order — {format(total)}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Billing Address Modal */}
        <Modal isOpen={billingModalOpen} onClose={() => setBillingModalOpen(false)} title="Add Billing Address" size="md">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full Name *" value={billingForm.name} onChange={(e) => setBillingForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
            <Input label="Phone" value={billingForm.phone} onChange={(e) => setBillingForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
            <div className="sm:col-span-2">
              <Input label="Address *" value={billingForm.address} onChange={(e) => setBillingForm((p) => ({ ...p, address: e.target.value }))} placeholder="Street address" />
            </div>
            <Input label="City *" value={billingForm.city} onChange={(e) => setBillingForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
            <Input label="State *" value={billingForm.state} onChange={(e) => setBillingForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" />
            <Input label="Pincode *" value={billingForm.pincode} onChange={(e) => setBillingForm((p) => ({ ...p, pincode: e.target.value }))} placeholder="Pincode" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBillingModalOpen(false)}>Cancel</Button>
            <Button loading={savingBilling} onClick={handleSaveBilling}>Save Billing Address</Button>
          </div>
        </Modal>

        {/* Shipping Address Modal */}
        <Modal
          isOpen={shippingModalOpen}
          onClose={() => { setShippingModalOpen(false); setShippingFormMode("list"); }}
          title="Shipping Address"
          size="md"
        >
          {shippingFormMode === "list" ? (
            <div className="space-y-3">
              {/* Use billing address option */}
              {billingAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShippingId("billing");
                    setShippingModalOpen(false);
                    toast.success("Shipping set to billing address");
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                    selectedShippingId === "billing"
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
                      : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selectedShippingId === "billing" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--border-secondary)]"
                  )}>
                    {selectedShippingId === "billing" && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="text-xs">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{billingAddress.name} <span className="text-[10px] text-[var(--text-muted)]">(Billing)</span></p>
                    <p className="text-[var(--text-secondary)]">{billingAddress.address}</p>
                    <p className="text-[var(--text-secondary)]">{billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}</p>
                  </div>
                </button>
              )}

              {/* Saved addresses */}
              {addressesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />)}
                </div>
              ) : (
                addresses?.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setSelectedShippingId(addr.id);
                      setShippingModalOpen(false);
                      toast.success("Shipping address selected");
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      selectedShippingId === addr.id
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
                        : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selectedShippingId === addr.id ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--border-secondary)]"
                    )}>
                      {selectedShippingId === addr.id && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="text-xs">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {addr.name}
                        {addr.isDefault && <span className="ml-1.5 rounded bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-medium text-white">Default</span>}
                      </p>
                      <p className="text-[var(--text-secondary)]">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                      <p className="text-[var(--text-secondary)]">{addr.city}, {addr.state} - {addr.pincode}</p>
                      {addr.phone && <p className="text-[var(--text-muted)]">{addr.phone}</p>}
                    </div>
                  </button>
                ))
              )}

              {/* Add new button — opens the shared shipping form modal with
                  country/state/city dropdowns, phone validation and an
                  address-type picker. */}
              <button
                type="button"
                onClick={() => {
                  setShippingModalOpen(false);
                  setAddressFormMode("shipping");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] p-3 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
              >
                <Plus className="h-4 w-4" /> Add New Address
              </button>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name *" value={shippingForm.name} onChange={(e) => setShippingForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                <Input label="Phone" value={shippingForm.phone} onChange={(e) => setShippingForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
                <Input label="Email" value={shippingForm.email} onChange={(e) => setShippingForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                <Input label="Country" value={shippingForm.country} onChange={(e) => setShippingForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" />
                <div className="sm:col-span-2">
                  <Input label="Address Line 1 *" value={shippingForm.addressLine1} onChange={(e) => setShippingForm((p) => ({ ...p, addressLine1: e.target.value }))} placeholder="Street address" />
                </div>
                <div className="sm:col-span-2">
                  <Input label="Address Line 2" value={shippingForm.addressLine2} onChange={(e) => setShippingForm((p) => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, floor, etc." />
                </div>
                <Input label="City *" value={shippingForm.city} onChange={(e) => setShippingForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
                <Input label="State *" value={shippingForm.state} onChange={(e) => setShippingForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" />
                <Input label="Pincode *" value={shippingForm.pincode} onChange={(e) => setShippingForm((p) => ({ ...p, pincode: e.target.value }))} placeholder="Pincode" />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={shippingForm.isDefault} onChange={(e) => setShippingForm((p) => ({ ...p, isDefault: e.target.checked }))} className="accent-[var(--accent-primary)]" />
                Set as default shipping address
              </label>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShippingFormMode("list")}>Back</Button>
                <Button loading={createAddress.isPending} onClick={handleSaveShipping}>Save Address</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Shared address modal — drives both the billing form (updates the
            User row directly) and the shipping form (creates an Address
            row). See AddressFormModal for the form spec. */}
        <AddressFormModal
          isOpen={addressFormMode !== null}
          onClose={() => setAddressFormMode(null)}
          mode={addressFormMode ?? "billing"}
          initial={
            addressFormMode === "billing" ? billingInitial : shippingInitial
          }
          saving={
            updateMyProfile.isPending || createShippingAddress.isPending
          }
          onSubmit={async (value) => {
            if (addressFormMode === "billing") {
              await updateMyProfile.mutateAsync({
                name: value.name.trim(),
                email: value.email.trim(),
                phone: `${value.countryPhoneCode}${value.phone}`.replace(
                  /^\+?/,
                  "+",
                ),
                countryCode: value.countryPhoneCode,
                gender: value.gender || undefined,
                profileImage: value.profileImage || undefined,
                address: value.addressLine1.trim(),
                city: value.cityName,
                state: value.stateName,
                country: value.countryName,
                pincode: value.postalCode.trim() || undefined,
              });
              toast.success("Billing address saved");
              // When the shopper had no shipping selection yet, mirror
              // billing → shipping automatically so they can proceed.
              if (!selectedShippingId) setSelectedShippingId("billing");
            } else if (addressFormMode === "shipping") {
              const created = await createShippingAddress.mutateAsync({
                name: value.name.trim(),
                phone: `${value.countryPhoneCode}${value.phone}`.replace(
                  /^\+?/,
                  "+",
                ),
                email: value.email.trim(),
                addressLine1: value.addressLine1.trim(),
                city: value.cityName,
                state: value.stateName,
                pincode: value.postalCode.trim() || "",
                country: value.countryName,
                countryCode: value.countryPhoneCode,
                isDefault: !!value.isDefault,
                addressType: value.addressType,
                addressLabel:
                  value.addressType === "OTHER"
                    ? value.addressLabel?.trim() || undefined
                    : undefined,
              } as any);
              const newId = (created as any)?.data?.id ?? (created as any)?.id;
              if (typeof newId === "string" || typeof newId === "number") {
                setSelectedShippingId(String(newId));
              }
              toast.success("Shipping address saved");
            }
            setAddressFormMode(null);
          }}
        />
        <ConfirmModal
          isOpen={!!pendingConfirm}
          onClose={() => setPendingConfirm(null)}
          onConfirm={handleConfirmPending}
          title={
            pendingConfirm?.kind === "clear"
              ? "Empty your cart?"
              : "Remove this product?"
          }
          message={
            pendingConfirm?.kind === "clear"
              ? "All items across both storefronts will be removed. This cannot be undone."
              : pendingConfirm?.kind === "remove-product"
                ? `All variations of ${pendingConfirm.productName} in your cart will be removed. Offer and bulk pricing will recalculate on the remaining items.`
                : ""
          }
          confirmText="Remove"
          variant="danger"
        />
      </PrivateRoute>
    </DefaultPage>
  );
}

// Renders a ProductGroupSummary on the checkout left column. Mirrors the
// cart-drawer layout one-for-one so a shopper sees identical paid/free
// math + strikethrough totals on both surfaces. Expects the SAME enriched
// shape (from `useCartSummary`) that the drawer consumes.
function CheckoutSummaryGroup({
  group,
  onRemoveProduct,
}: {
  group: ProductGroupSummary;
  onRemoveProduct: () => void;
}) {
  const { format } = usePrice();
  const sharedAttrs = group.items[0]
    ? Object.entries(
        (group.items[0].attributes || {}) as Record<string, string>,
      ).filter(([k]) => k.toLowerCase() !== "color")
    : [];

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {group.productName}
          </h4>
          {sharedAttrs.length > 0 && (
            <p className="text-[11px] text-[var(--text-muted)]">
            {sharedAttrs.map(([k, v]) => `${k}: ${v}`).join(" \u00b7 ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemoveProduct}
          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent-danger)] hover:opacity-80 transition-opacity"
          aria-label={`Remove ${group.productName}`}
        >
          <Trash2 className="h-3 w-3" /> Remove product
        </button>
      </div>

      {/* Offer / Bulk badges — same copy as the cart drawer. */}
      <div className="flex flex-wrap gap-1.5">
        {group.appliedOffer && group.freeQty > 0 && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {"\u2713 "}
            {group.appliedOffer.name}
            {" \u2014 "}
            {group.freeQty} FREE
          </span>
        )}
        {group.bulkApplied && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Bulk Price Applied
          </span>
        )}
      </div>

      {/* Per-variation sub-rows. group.items are already enriched — the
          sub-row reads the EnrichedCartItem fields (effectivePrice /
          lineFinal / freeQtyInThisItem etc.) populated by useCartSummary. */}
      <div className="space-y-1.5">
        {group.items.map((item) => (
          <CheckoutSubRow key={item.id} item={item} />
        ))}
      </div>

      {/* Group total breakdown */}
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
                  {group.freeQty > 0 ? " \u2014 " : ""}
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

function CheckoutSubRow({ item }: { item: EnrichedCartItem }) {
  const updateCart = useUpdateCartItem();
  const removeCart = useRemoveCartItem();
  const { format } = usePrice();
  const isPending = updateCart.isPending || removeCart.isPending;

  const attrs = (item.attributes || {}) as Record<string, string>;
  const colorVal = Object.entries(attrs).find(([k]) => k.toLowerCase() === "color")?.[1];

  return (
    <div className={cn("flex gap-2.5 rounded-lg bg-[var(--bg-secondary)] p-2", isPending && "opacity-50 pointer-events-none")}>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
        {item.image ? (
          <Image src={resolveAssetUrl(item.image)} alt={item.productName} fill className="object-cover" sizes="48px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-4 w-4 text-[var(--text-muted)]" /></div>
        )}
        {item.isFreeItem && (
          <div className="absolute left-0.5 top-0.5 rounded bg-green-500 px-1 py-0.5 text-[7px] font-bold text-white">FREE</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {colorVal && <span className="text-xs font-medium text-[var(--text-primary)]">{colorVal}</span>}
          {(() => {
            const effective = item.effectivePrice ?? item.pricePerItem;
            const discounted = effective < item.pricePerItem;
            return (
              <>
                <span
                  className={cn(
                    "text-[11px]",
                    item.bulkApplied
                      ? "font-semibold text-[var(--accent-primary)]"
                      : discounted
                        ? "font-semibold text-green-600"
                        : "text-[var(--text-muted)]",
                  )}
                >
                  {format(effective)} each
                </span>
                {discounted && (
                  <span className="text-[10px] text-[var(--text-muted)] line-through">
                    {format(item.pricePerItem)}
                  </span>
                )}
              </>
            );
          })()}
        </div>
        {item.freeQtyInThisItem != null && item.freeQtyInThisItem > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">{item.paidQty ?? (item.quantity - item.freeQtyInThisItem)} paid</span>
            <span className="text-[9px] font-medium text-green-600">+ {item.freeQtyInThisItem} FREE</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-col items-end">
          {(() => {
            const rowOriginal = item.originalUnitPrice * item.quantity;
            const rowFinal = item.lineFinal;
            const showStrike = rowOriginal > rowFinal;
            return (
              <>
                {showStrike && (
                  <span className="text-[10px] text-[var(--text-muted)] line-through">
                    {format(rowOriginal)}
                  </span>
                )}
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {format(rowFinal)}
                </span>
              </>
            );
          })()}
        </div>
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
      </div>
    </div>
  );
}

function SectionToggle({ title, icon, expanded, onToggle, children }: { title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
        <span className="flex items-center gap-2">{icon}{title}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
