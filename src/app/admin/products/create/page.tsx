"use client";

// Legacy route — the product form has moved to `/admin/products/new` (and
// `/admin/products/[id]/edit`). Anyone following an old link or bookmark lands
// on the new flow automatically.
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyProductCreateRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const id = params.get("id");
    router.replace(id ? `/admin/products/${id}/edit` : "/admin/products/new");
  }, [params, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
      Redirecting...
    </div>
  );
}
