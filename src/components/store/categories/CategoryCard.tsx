"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/config/routes";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Category } from "@/types/category";

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const productCount = category._count?.products ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Link href={ROUTES.CATEGORY(category.name)}>
        <div className="group relative overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
            {category.image ? (
              <Image
                src={resolveAssetUrl(category.image)}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl font-bold text-[var(--text-secondary)]/20">
                  {category.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Product count badge */}
            {productCount > 0 && (
              <Badge
                variant="default"
                className="absolute right-3 top-3 bg-[var(--bg-card)]/80 backdrop-blur-sm"
              >
                {productCount} product{productCount !== 1 ? "s" : ""}
              </Badge>
            )}

            {/* Name overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-bold text-white sm:text-xl">
                {category.name}
              </h3>
              {category.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-white/70">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default CategoryCard;
