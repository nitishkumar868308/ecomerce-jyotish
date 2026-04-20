"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAdminUsers } from "@/services/admin/users";
import { useProducts } from "@/services/products";
import { useCountryPricing } from "@/services/admin/shipping";
import { useCreateOrder } from "@/services/orders";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { apiError } from "@/lib/apiMessage";
import {
  Search,
  UserPlus,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface LineItem {
  productId: string;
  productName: string;
  variationId?: string;
  variationName?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

interface AddressForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const EMPTY_ADDRESS: AddressForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

/**
 * Admin create-order — full rewrite to match the brief:
 *   - Search + pick real products (with variations)
 *   - Select a user from the customer list
 *   - Billing + shipping address capture (shipping can mirror billing)
 *   - Country drives currency/shipping (via country pricing table)
 */
export default function CreateOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  const { data: users = [] } = useAdminUsers();
  const { data: productsResp } = useProducts();
  const { data: countryPricing = [] } = useCountryPricing();

  const products = useMemo<any[]>(() => {
    const payload: any = productsResp;
    if (Array.isArray(payload?.data?.products)) return payload.data.products;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [productsResp]);

  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const [billing, setBilling] = useState<AddressForm>(EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<AddressForm>(EMPTY_ADDRESS);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [note, setNote] = useState("");

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = (users as any[]).filter(
      (u) => (u.role ?? "USER") === "USER" || !u.role,
    );
    if (!q) return list.slice(0, 20);
    return list
      .filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          String(u.id ?? "").includes(q),
      )
      .slice(0, 20);
  }, [users, userSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 10);
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [products, productSearch]);

  const selectedUser = useMemo(
    () => (users as any[]).find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  // Currency + country row derived from the billing country so totals feel
  // right to the admin creating the order.
  const countryRow = useMemo(() => {
    const name = billing.country?.trim().toLowerCase();
    return (
      (countryPricing as any[]).find(
        (c) => c.country?.toLowerCase() === name || c.code?.toLowerCase() === name,
      ) ?? null
    );
  }, [countryPricing, billing.country]);

  const currencySymbol = countryRow?.currencySymbol ?? "₹";
  const shippingCharge = Number(countryRow?.shippingPrice ?? 0);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal + shippingCharge;

  const addProductToOrder = (product: any, variation?: any) => {
    const key = `${product.id}-${variation?.id ?? "base"}`;
    if (items.some((i) => `${i.productId}-${i.variationId ?? "base"}` === key)) {
      toast("Already added", { icon: "ℹ️" });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        variationId: variation?.id,
        variationName: variation?.variationName,
        sku: variation?.sku || product.sku || "",
        unitPrice: Number(variation?.price ?? product.price) || 0,
        quantity: 1,
        image: Array.isArray(product.image) ? product.image[0] : undefined,
      },
    ]);
  };

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const pickUser = (u: any) => {
    setSelectedUserId(u.id);
    // Prefill billing with the user's profile so the admin doesn't retype.
    setBilling({
      name: u.name ?? "",
      phone: u.phone ?? "",
      email: u.email ?? "",
      address: u.address ?? u.addressLine1 ?? "",
      city: u.city ?? "",
      state: u.state ?? "",
      pincode: u.pincode ?? "",
      country: u.country ?? "India",
    });
  };

  const handleSubmit = async () => {
    if (!selectedUserId) return toast.error("Select a customer first");
    if (items.length === 0) return toast.error("Add at least one product");
    if (!billing.name || !billing.address || !billing.city) {
      return toast.error("Fill in billing name, address and city");
    }
    const finalShipping = sameAsBilling ? billing : shipping;

    try {
      await createOrder.mutateAsync({
        userId: selectedUserId,
        items: items.map((i) => ({
          productId: i.productId,
          variationId: i.variationId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.unitPrice,
          sku: i.sku,
        })) as any,
        billingAddress: billing,
        shippingAddress: finalShipping,
        subtotal,
        shippingCharges: shippingCharge,
        totalAmount: total,
        paymentMethod: /india/i.test(billing.country) ? "PayU" : "PayGlocal",
        note,
      } as any);
      router.push("/admin/orders");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Order"
        description="Place an order on behalf of a customer"
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column: products + addresses */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              <UserPlus className="h-4 w-4" /> Customer
            </h2>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {selectedUser.name}{" "}
                    <span className="text-xs text-[var(--text-muted)]">
                      (#{selectedUser.id})
                    </span>
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {selectedUser.email} {selectedUser.phone ? ` · ${selectedUser.phone}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserId(null)}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email or ID..."
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 pl-9 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[var(--border-primary)]">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                      No users match.
                    </p>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => pickUser(u)}
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--border-primary)] px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[var(--text-primary)]">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-[var(--text-muted)]">
                            {u.email}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-[var(--text-muted)]">
                          #{u.id}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          {/* Products */}
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              <Package className="h-4 w-4" /> Products
            </h2>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 pl-9 text-sm text-[var(--text-primary)]"
              />
            </div>

            {filteredProducts.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[var(--border-primary)]">
                {filteredProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="border-b border-[var(--border-primary)] p-3 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {Array.isArray(p.image) && p.image[0] && (
                          <img
                            src={resolveAssetUrl(p.image[0])}
                            alt={p.name}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {p.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {currencySymbol}
                            {Number(p.price).toLocaleString("en-IN")} · SKU{" "}
                            {p.sku || "—"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addProductToOrder(p)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {p.variations?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.variations.map((v: any) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => addProductToOrder(p, v)}
                            className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-0.5 text-[11px] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                          >
                            {v.variationName || v.name || v.sku}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 divide-y divide-[var(--border-primary)] rounded-lg border border-[var(--border-primary)]">
                {items.map((it, idx) => (
                  <div
                    key={`${it.productId}-${it.variationId ?? "base"}`}
                    className="flex items-center gap-3 p-3"
                  >
                    {it.image && (
                      <img
                        src={resolveAssetUrl(it.image)}
                        alt={it.productName}
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {it.productName}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {it.variationName ? `${it.variationName} · ` : ""}SKU{" "}
                        {it.sku || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(idx, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-16 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-center text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) =>
                          updateItem(idx, {
                            unitPrice: Number(e.target.value),
                          })
                        }
                        className="w-24 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-right text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-md p-1.5 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Addresses */}
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Billing address
            </h2>
            <AddressFields value={billing} onChange={setBilling} />

            <label className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
              />
              Ship to the same address
            </label>

            {!sameAsBilling && (
              <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Shipping address
                </h3>
                <AddressFields value={shipping} onChange={setShipping} />
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Admin note (optional)
              </label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything fulfilment needs to know"
              />
            </div>
          </section>
        </div>

        {/* Right column: order summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Summary
            </h3>

            <div className="space-y-2 text-sm">
              <Row
                label="Subtotal"
                value={`${currencySymbol}${subtotal.toLocaleString("en-IN")}`}
              />
              <Row
                label="Shipping"
                value={
                  shippingCharge > 0
                    ? `${currencySymbol}${shippingCharge.toLocaleString("en-IN")}`
                    : "Free"
                }
              />
              <div className="my-2 border-t border-[var(--border-primary)]" />
              <Row
                label={<span className="font-semibold">Total</span>}
                value={
                  <span className="text-base font-bold text-[var(--accent-primary)]">
                    {currencySymbol}
                    {total.toLocaleString("en-IN")}
                  </span>
                }
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Payment gateway:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {/india/i.test(billing.country) ? "PayU" : "PayGlocal"}
                </span>{" "}
                (auto from billing country)
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/orders")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                loading={createOrder.isPending}
                disabled={items.length === 0 || !selectedUserId}
              >
                Create order
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AddressFields({
  value,
  onChange,
}: {
  value: AddressForm;
  onChange: (v: AddressForm) => void;
}) {
  const patch = (p: Partial<AddressForm>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        label="Full name"
        value={value.name}
        onChange={(e) => patch({ name: e.target.value })}
      />
      <Input
        label="Phone"
        value={value.phone}
        onChange={(e) => patch({ phone: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        value={value.email}
        onChange={(e) => patch({ email: e.target.value })}
        className={cn()}
      />
      <Input
        label="Country"
        value={value.country}
        onChange={(e) => patch({ country: e.target.value })}
      />
      <div className="sm:col-span-2">
        <Input
          label="Address"
          value={value.address}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="Street, apartment, landmark"
        />
      </div>
      <Input
        label="City"
        value={value.city}
        onChange={(e) => patch({ city: e.target.value })}
      />
      <Input
        label="State"
        value={value.state}
        onChange={(e) => patch({ state: e.target.value })}
      />
      <Input
        label="Pincode"
        value={value.pincode}
        onChange={(e) => patch({ pincode: e.target.value })}
      />
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-[var(--text-secondary)]">
      <span>{label}</span>
      <span className="text-right text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
