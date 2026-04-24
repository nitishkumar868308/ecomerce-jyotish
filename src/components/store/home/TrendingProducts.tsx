"use client";

import Link from "next/link";
import Image from "next/image";
import { useProductsFast } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ROUTES } from "@/config/routes";
import { ShoppingCart, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function TrendingProducts() {
  const { data, isLoading } = useProductsFast({
    limit: 6,
    sortBy: "popular",
    sortOrder: "desc",
  });
  const products = filterByPlatform(data?.data?.products, "wizard");

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-[var(--accent-primary-light)] p-1.5 sm:p-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Trending Now
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Most popular products this week
              </p>
            </div>
          </div>
          <Link
            href={ROUTES.CATEGORIES}
            className="hidden sm:inline-flex text-sm font-medium text-[var(--accent-primary)] hover:underline"
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton variant="text" lines={2} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <Link
                  href={ROUTES.PRODUCT(product.id)}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
                    {product.image?.[0] ? (
                      <Image
                        src={product.image[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--text-faint)]">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-1">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-primary)] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[var(--accent-primary)]">
                        {product.currencySymbol || ""}{product.price}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
