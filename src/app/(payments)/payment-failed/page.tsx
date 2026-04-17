"use client";

import Link from "next/link";
import { XCircle, RotateCcw, Home } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/Button";

export default function PaymentFailedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-danger-light)]">
          <XCircle className="h-10 w-10 text-[var(--accent-danger)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Payment Failed</h1>
        <p className="text-[var(--text-muted)] mb-8">Something went wrong with your payment. Your money has not been deducted. Please try again.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={ROUTES.CHECKOUT}>
            <Button leftIcon={<RotateCcw className="h-4 w-4" />}>Try Again</Button>
          </Link>
          <Link href={ROUTES.HOME}>
            <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
