"use client";

import { Spinner } from "@/components/ui/loader/Spinner";

export default function PaymentProcessingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md text-center">
        <Spinner size="lg" className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Processing Payment...</h1>
        <p className="text-[var(--text-muted)]">Please do not close this page. We are processing your payment.</p>
      </div>
    </div>
  );
}
