"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function CreateOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerEmail: "",
    productId: "",
    quantity: "1",
    shippingAddress: "",
    notes: "",
  });

  const handleSubmit = async () => {
    // TODO: call create order mutation
    router.push("/admin/orders");
  };

  return (
    <div>
      <PageHeader title="Create Order" description="Create a new manual order" />

      <Card>
        <div className="space-y-4 p-2">
          <Input
            label="Customer Email"
            value={form.customerEmail}
            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            placeholder="customer@example.com"
          />
          <Input
            label="Product ID"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            placeholder="Product ID"
          />
          <Input
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <Input
            label="Shipping Address"
            value={form.shippingAddress}
            onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
            placeholder="Full shipping address"
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Order notes (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.push("/admin/orders")}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Order</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
