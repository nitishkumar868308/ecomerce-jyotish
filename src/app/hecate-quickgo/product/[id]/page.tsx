"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ProductDetail from "@/components/store/product/ProductDetail";
import RelatedProducts from "@/components/store/product/RelatedProducts";
import { useProduct } from "@/services/products";
import { useQuickGoStore } from "@/stores/useQuickGoStore";
import { ROUTES } from "@/config/routes";
import { Loader } from "@/components/ui/Loader";

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center py-20">
        <Loader variant="section" message="Loading product..." />
      </div>
    </div>
  );
}

export default function QuickGoProductPage() {
  const params = useParams<{ id: string }>();
  const quickGoCity = useQuickGoStore((s) => s.city);
  const quickGoPincode = useQuickGoStore((s) => s.pincode);
  // Pass the shopper's location so the backend returns only variations
  // actually stocked at the effective fulfillment warehouse (Delhi or
  // Bangalore). Without both values the endpoint returns the regular
  // full payload — that fallback is intentional for the admin preview
  // path.
  const { data: product, isLoading, error } = useProduct(params.id, {
    city: quickGoCity || undefined,
    pincode: quickGoPincode || undefined,
  });

  if (isLoading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          Product not found
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href={ROUTES.QUICKGO.CATEGORIES}
          className="mt-2 rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary-hover)]"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductDetail product={product} hideUnavailableVariations />
      </div>
      {product.categoryId && (
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <RelatedProducts
            categoryId={product.categoryId}
            currentProductId={product.id}
            platform="quickgo"
            city={quickGoCity || undefined}
            pincode={quickGoPincode || undefined}
          />
        </div>
      )}
    </>
  );
}
