"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/config/routes";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Subcategory } from "@/types/category";

interface SubcategoryGridProps {
  subcategories: Subcategory[];
  className?: string;
}

function SubcategoryCard({ subcategory }: { subcategory: Subcategory }) {
  const productCount = subcategory._count?.products ?? 0;
  const parentName = subcategory.category?.name || String(subcategory.categoryId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Link
        href={ROUTES.SUBCATEGORY(
          parentName,
          subcategory.name
        )}
      >
        <div className="group flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-col sm:items-start sm:p-4">
          {/* Image */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] sm:aspect-[3/2] sm:h-auto sm:w-full">
            {subcategory.image ? (
              <Image
                src={resolveAssetUrl(subcategory.image)}
                alt={subcategory.name}
                fill
                sizes="(max-width: 640px) 56px, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-lg font-bold text-[var(--text-secondary)]/30">
                  {subcategory.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 sm:w-full">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
              {subcategory.name}
            </h3>
            {productCount > 0 && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {productCount} item{productCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function SubcategoryGrid({
  subcategories,
  className,
}: SubcategoryGridProps) {
  const active = subcategories.filter((s) => s.active);

  if (active.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          No subcategories available.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {active.map((sub) => (
        <SubcategoryCard key={sub.id} subcategory={sub} />
      ))}
    </div>
  );
}

export default SubcategoryGrid;
