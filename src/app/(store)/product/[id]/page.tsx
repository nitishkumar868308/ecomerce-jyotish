"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import DefaultPage from "@/components/layout/DefaultPage";
import ProductDetail from "@/components/store/product/ProductDetail";
import RelatedProducts from "@/components/store/product/RelatedProducts";
import { useProduct } from "@/services/products";
import { ROUTES } from "@/config/routes";
import { Loader2 } from "lucide-react";

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Loading product...</p>
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
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            Product not found
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link
            href={ROUTES.CATEGORIES}
            className="mt-2 rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary-hover)]"
          >
            Browse Products
          </Link>
        </div>
      ) : product ? (
        <>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ProductDetail product={product} />
          </div>
          {product.categoryId && (
            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <RelatedProducts
                categoryId={product.categoryId}
                currentProductId={product.id}
              />
            </div>
          )}
        </>
      ) : null}
    </DefaultPage>
  );
}
