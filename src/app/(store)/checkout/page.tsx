"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { PrivateRoute } from "@/components/shared/PrivateRoute";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import CartSummary from "@/components/store/checkout/CartSummary";
import AddressSelector from "@/components/store/checkout/AddressSelector";
import PaymentSelector from "@/components/store/checkout/PaymentSelector";
import OrderReview from "@/components/store/checkout/OrderReview";

const STEPS = [
  { id: "cart", label: "Cart Review" },
  { id: "address", label: "Address" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Order Review" },
];

export default function CheckoutPage() {
  const [activeStep, setActiveStep] = useState("cart");

  const goTo = (step: string) => setActiveStep(step);

  return (
    <DefaultPage>
      <PrivateRoute>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Checkout" />

          {/* Step indicator */}
          <div className="mb-8">
            <Tabs tabs={STEPS} activeTab={activeStep} onChange={goTo} />
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {activeStep === "cart" && (
              <CartSummary onNext={() => goTo("address")} />
            )}
            {activeStep === "address" && (
              <AddressSelector
                onNext={() => goTo("payment")}
                onBack={() => goTo("cart")}
              />
            )}
            {activeStep === "payment" && (
              <PaymentSelector
                onNext={() => goTo("review")}
                onBack={() => goTo("address")}
              />
            )}
            {activeStep === "review" && (
              <OrderReview onBack={() => goTo("payment")} />
            )}
          </div>
        </div>
      </PrivateRoute>
    </DefaultPage>
  );
}
