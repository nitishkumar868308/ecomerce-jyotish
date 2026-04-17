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
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/services/cart";
import { useAddresses, useCreateAddress } from "@/services/address";
import { useShippingByCountry } from "@/services/shipping";
import { useCountryStore } from "@/stores/useCountryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { api, ENDPOINTS } from "@/lib/api";
import { ROUTES } from "@/config/routes";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  ShoppingBag, MapPin, CreditCard,
  ChevronDown, ChevronUp, Clock, Truck, Tag, Gift, StickyNote,
  Plus, Check, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuantityControl } from "@/components/store/shared/QuantityControl";
import type { CartItem } from "@/types/cart";
import type { Address } from "@/types/user";

const EMPTY_ADDRESS_FORM = {
  name: "", phone: "", email: "", addressLine1: "", addressLine2: "",
  city: "", state: "", pincode: "", country: "India", isDefault: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cartItems, isLoading: cartLoading } = useCart();
  const { code: countryCode, symbol: currencySymbol } = useCountryStore();
  const { data: shippingOptions } = useShippingByCountry(countryCode);
  const { user } = useAuthStore();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createAddress = useCreateAddress();

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
      };
    }
    return null;
  }, [user]);

  // Shipping address selection
  const [selectedShippingId, setSelectedShippingId] = useState<number | "billing" | null>(null);

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

  // Billing form state
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
    countryCode === "IND" ? "PayU" : "PayGlocal"
  );
  const [placing, setPlacing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    promo: false, note: false, donate: false,
  });

  const items = cartItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCurrency = items[0]?.currencySymbol || currencySymbol;

  const shippingPrice = useMemo(() => {
    if (!shippingOptions || shippingOptions.length === 0) return 0;
    return shippingOptions[0]?.price ?? 0;
  }, [shippingOptions]);

  const total = subtotal + shippingPrice - promoDiscount + donationAmount;

  const isQuickGo = typeof window !== "undefined" && window.location.pathname.includes("quickgo");
  const now = new Date();
  const before3pm = now.getHours() < 15;

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  };

  // Get the resolved shipping address for order
  const resolvedShippingAddress = useMemo(() => {
    if (selectedShippingId === "billing" && billingAddress) {
      return billingAddress;
    }
    if (typeof selectedShippingId === "number" && addresses) {
      const addr = addresses.find((a) => a.id === selectedShippingId);
      if (addr) {
        return {
          name: addr.name, phone: addr.phone,
          address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : ""),
          city: addr.city, state: addr.state, pincode: addr.pincode,
        };
      }
    }
    return null;
  }, [selectedShippingId, billingAddress, addresses]);

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
      // Save billing to user profile
      await api.put(ENDPOINTS.AUTH.UPDATE_USER, {
        userId: user!.id,
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
          variationId: item.variationId,
          name: item.productName,
          quantity: item.quantity,
          price: item.effectivePrice ?? item.pricePerItem,
          pricePerItem: item.pricePerItem,
          attributes: item.attributes,
          image: item.image,
          paidQty: item.paidQty ?? item.quantity,
          freeQty: item.freeQtyInThisItem ?? 0,
          bulkApplied: item.bulkApplied ?? false,
          offerApplied: item.offerSummary?.claimed ?? false,
          offerName: item.offerSummary?.offerName,
          offerId: item.offerSummary?.offerId,
          barCode: item.barCode,
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

                {/* Cart Items (grouped by product) */}
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] divide-y divide-[var(--border-primary)]">
                  {groupCheckoutItems(items).map((group) => (
                    <CheckoutGroupRow key={group.key} group={group} symbol={itemCurrency} />
                  ))}
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
                      <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)] space-y-0.5">
                        <p className="font-medium text-[var(--text-primary)]">{billingAddress.name}</p>
                        {billingAddress.phone && <p>{billingAddress.phone}</p>}
                        <p>{billingAddress.address}</p>
                        <p>{billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBillingForm({
                            name: user?.name || "", phone: user?.phone || "",
                            address: "", city: "", state: "", pincode: "",
                          });
                          setBillingModalOpen(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] p-3 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Billing Address
                      </button>
                    )}
                  </div>

                  {/* Shipping Address Section */}
                  <div className="mb-4 pb-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Shipping Address
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShippingFormMode("list");
                          setShippingModalOpen(true);
                        }}
                        className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {resolvedShippingAddress ? (
                      <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)] space-y-0.5">
                        <p className="font-medium text-[var(--text-primary)]">{resolvedShippingAddress.name}</p>
                        {resolvedShippingAddress.phone && <p>{resolvedShippingAddress.phone}</p>}
                        <p>{resolvedShippingAddress.address}</p>
                        <p>{resolvedShippingAddress.city}, {resolvedShippingAddress.state} - {resolvedShippingAddress.pincode}</p>
                        {selectedShippingId === "billing" && (
                          <p className="text-[10px] italic text-[var(--text-muted)] mt-1">Same as billing address</p>
                        )}
                      </div>
                    ) : addressesLoading ? (
                      <div className="h-16 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShippingFormMode("form");
                          setShippingForm({ ...EMPTY_ADDRESS_FORM, name: user?.name || "", phone: user?.phone || "" });
                          setShippingModalOpen(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-primary)] p-3 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Shipping Address
                      </button>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Subtotal ({items.length} items)</span>
                      <span>{itemCurrency}{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Shipping</span>
                      <span>{shippingPrice > 0 ? `${itemCurrency}${shippingPrice}` : "Free"}</span>
                    </div>
                    {promoApplied && promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount</span>
                        <span>-{itemCurrency}{promoDiscount}</span>
                      </div>
                    )}
                    {donationAmount > 0 && (
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Donation</span>
                        <span>{itemCurrency}{donationAmount}</span>
                      </div>
                    )}
                    <div className="border-t border-[var(--border-primary)] pt-3 flex justify-between font-bold text-[var(--text-primary)] text-base">
                      <span>Total</span>
                      <span>{itemCurrency}{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <SectionToggle title="Promo Code" icon={<Tag className="h-4 w-4" />} expanded={expandedSections.promo} onToggle={() => toggleSection("promo")}>
                  <div className="flex gap-2">
                    <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter code" disabled={promoApplied} />
                    <Button size="sm" onClick={handleApplyPromo} loading={applyingPromo} disabled={promoApplied}>
                      {promoApplied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </SectionToggle>

                {/* Note */}
                <SectionToggle title="Add Note" icon={<StickyNote className="h-4 w-4" />} expanded={expandedSections.note} onToggle={() => toggleSection("note")}>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any special instructions..." rows={3} />
                </SectionToggle>

                {/* Donate */}
                <SectionToggle title="Donate" icon={<Gift className="h-4 w-4" />} expanded={expandedSections.donate} onToggle={() => toggleSection("donate")}>
                  <div className="flex gap-2">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonationAmount(donationAmount === amt ? 0 : amt)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                          donationAmount === amt
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                            : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                        )}
                      >
                        {itemCurrency}{amt}
                      </button>
                    ))}
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
                  Place Order — {itemCurrency}{total.toLocaleString()}
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

              {/* Add new button */}
              <button
                type="button"
                onClick={() => {
                  setShippingForm({ ...EMPTY_ADDRESS_FORM, name: user?.name || "", phone: user?.phone || "" });
                  setShippingFormMode("form");
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
      </PrivateRoute>
    </DefaultPage>
  );
}

interface CheckoutGroup {
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
}

function groupCheckoutItems(items: CartItem[]): CheckoutGroup[] {
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
    };
  });
}

function CheckoutGroupRow({ group, symbol }: { group: CheckoutGroup; symbol: string }) {
  const sharedAttrs = Object.entries(
    (group.items[0].attributes || {}) as Record<string, string>
  ).filter(([k]) => k.toLowerCase() !== "color");

  return (
    <div className="p-4 space-y-2">
      {/* Product name + shared attrs */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{group.productName}</h4>
        {sharedAttrs.length > 0 && (
          <p className="text-[11px] text-[var(--text-muted)]">
            {sharedAttrs.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </p>
        )}
      </div>

      {/* Offer / Bulk badges */}
      <div className="flex flex-wrap gap-1.5">
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
      </div>

      {/* Sub-rows per color/variation */}
      <div className="space-y-1.5">
        {group.items.map((item) => (
          <CheckoutSubRow key={item.id} item={item} symbol={symbol} />
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
            <span className="text-xs text-[var(--text-muted)] line-through">{symbol}{group.originalPrice.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">You pay</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{symbol}{group.totalPrice.toLocaleString()}</span>
        </div>
        {(group.freeQty > 0 || group.bulkApplied) && group.originalPrice > group.totalPrice && (
          <div className="flex items-center justify-end">
            <span className="text-[10px] font-semibold text-green-600">
              You save {symbol}{(group.originalPrice - group.totalPrice).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutSubRow({ item, symbol }: { item: CartItem; symbol: string }) {
  const updateCart = useUpdateCartItem();
  const removeCart = useRemoveCartItem();
  const isPending = updateCart.isPending || removeCart.isPending;

  const attrs = (item.attributes || {}) as Record<string, string>;
  const colorVal = Object.entries(attrs).find(([k]) => k.toLowerCase() === "color")?.[1];

  return (
    <div className={cn("flex gap-2.5 rounded-lg bg-[var(--bg-secondary)] p-2", isPending && "opacity-50 pointer-events-none")}>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
        {item.image ? (
          <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-4 w-4 text-[var(--text-muted)]" /></div>
        )}
        {item.isFreeItem && (
          <div className="absolute left-0.5 top-0.5 rounded bg-green-500 px-1 py-0.5 text-[7px] font-bold text-white">FREE</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {colorVal && <span className="text-xs font-medium text-[var(--text-primary)]">{colorVal}</span>}
          {item.bulkApplied ? (
            <span className="text-[11px] text-[var(--accent-primary)] font-semibold">{symbol}{item.effectivePrice} each</span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">{symbol}{item.pricePerItem} each</span>
          )}
        </div>
        {item.freeQtyInThisItem != null && item.freeQtyInThisItem > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">{item.paidQty ?? (item.quantity - item.freeQtyInThisItem)} paid</span>
            <span className="text-[9px] font-medium text-green-600">{item.freeQtyInThisItem} FREE</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-bold text-[var(--text-primary)]">{symbol}{item.totalPrice.toLocaleString()}</span>
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
