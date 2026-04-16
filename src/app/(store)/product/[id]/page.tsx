"use client";

import { useParams } from "next/navigation";
import DefaultPage from "@/components/layout/DefaultPage";
import ProductDetail from "@/components/store/product/ProductDetail";
import RelatedProducts from "@/components/store/product/RelatedProducts";
import { useProduct } from "@/services/products";

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image skeleton */}
        <div className="aspect-square rounded-xl bg-[var(--bg-secondary)]" />
        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-[var(--bg-secondary)]" />
          <div className="h-6 w-1/4 rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-full rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--bg-secondary)]" />
          <div className="h-4 w-2/3 rounded bg-[var(--bg-secondary)]" />
          <div className="mt-6 h-12 w-40 rounded-lg bg-[var(--bg-secondary)]" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(params.id);

  return (
    <DefaultPage>
      {isLoading ? (
        <ProductSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            Product not found
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            The product you are looking for does not exist or has been removed.
          </p>
        </div>
      ) : product ? (
        <>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ProductDetail product={product} />
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <RelatedProducts
              categoryId={product.categoryId}
              currentProductId={product._id}
            />
          </div>
        </>
      ) : null}
    </DefaultPage>
  );
}
