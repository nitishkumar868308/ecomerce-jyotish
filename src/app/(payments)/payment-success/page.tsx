"use client";

import Link from "next/link";
import { CheckCircle, Package, Home } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-success-light)]">
          <CheckCircle className="h-10 w-10 text-[var(--accent-success)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Payment Successful!</h1>
        <p className="text-[var(--text-muted)] mb-8">Your order has been placed successfully. You will receive a confirmation email shortly.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={ROUTES.DASHBOARD_ORDERS}>
            <Button leftIcon={<Package className="h-4 w-4" />}>View Orders</Button>
          </Link>
          <Link href={ROUTES.HOME}>
            <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
