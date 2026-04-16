"use client";

import { cn } from "@/lib/utils";
import { useProductsFast } from "@/services/products";
import { usePriceConverter } from "@/hooks/usePriceConverter";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturedProducts() {
  const { data, isLoading } = useProductsFast({
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  console.log("data", data)
  const { format } = usePriceConverter();

  const products = Array.isArray(data?.data?.products)
    ? data.data.products
    : [];

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-8 flex items-end justify-between lg:mb-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              Featured Products
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Handpicked just for you
            </p>
          </div>
          <Link
            href={ROUTES.CATEGORIES}
            className={cn(
              "hidden items-center gap-1 text-sm font-medium sm:flex",
              "text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary-hover)]"
            )}
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton
                  variant="rectangle"
                  className="aspect-square w-full rounded-xl"
                  height="100%"
                />
                <Skeleton variant="text" lines={2} />
              </div>
            ))}
          </div>
        )}

        {/* Products grid */}
        {!isLoading && products && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} format={format} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mobile "View All" button */}
        <div className="mt-8 text-center sm:hidden">
          <Link href={ROUTES.CATEGORIES}>
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All Products
            </Button>
          </Link>
        </div>

        {/* Desktop bottom CTA */}
        <div className="mt-10 hidden text-center sm:block">
          <Link href={ROUTES.CATEGORIES}>
            <Button
              variant="outline"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Explore All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  format,
}: {
  product: Product;
  format: (price: number) => string;
}) {
  const imageSrc = product.thumbnail || product.images?.[0];
  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100)
    : 0;

  return (
    <Link
      href={ROUTES.PRODUCT(product.id)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "border border-[var(--border-primary)] bg-[var(--bg-card)]",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-secondary)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-[var(--text-tertiary)]" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && discountPercent > 0 && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2.5 py-1",
              "bg-[var(--accent-danger)] text-xs font-semibold text-white"
            )}
          >
            -{discountPercent}%
          </span>
        )}

        {/* Quick hover overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-black/0 transition-all duration-300 group-hover:bg-black/5"
          )}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3
          className={cn(
            "line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]",
            "transition-colors group-hover:text-[var(--accent-primary)]"
          )}
        >
          {product.name}
        </h3>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-bold text-[var(--text-primary)]">
            {format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[var(--text-tertiary)] line-through">
              {format(product.mrp!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default FeaturedProducts;
