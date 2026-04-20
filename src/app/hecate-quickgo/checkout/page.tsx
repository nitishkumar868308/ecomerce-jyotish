"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";

/**
 * Quickgo checkout is intentionally a thin forward to the unified checkout
 * at /checkout?platform=quickgo — that's where all the real logic lives
 * (item selection, billing/shipping, PayU vs PayGlocal routing, etc.).
 *
 * Keeping the quickgo route alive for backwards-compat links means we don't
 * break any cart drawer / email CTAs that point here.
 */
export default function QuickGoCheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout?platform=quickgo");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader variant="section" message="Preparing checkout..." />
    </div>
  );
}
