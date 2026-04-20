"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCategories } from "@/services/categories";
import { useProducts } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { useQuickGoStore } from "@/stores/useQuickGoStore";

export default function QuickGoCategoriesPage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const { data: categories, isLoading: catLoading } = useCategories();
  const quickGoCity = useQuickGoStore((s) => s.city);
  const { data: productsData, isLoading: prodLoading } = useProducts({
    ...(selectedCat ? { categoryId: selectedCat } : {}),
    platform: "quickgo",
    city: quickGoCity || undefined,
  });
  const products = filterByPlatform(productsData?.data, "quickgo");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">
        <span className="text-[var(--qg-primary,#0d9488)]">Categories</span>
      </h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20 space-y-1">
            <button
              onClick={() => setSelectedCat("")}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                !selectedCat
                  ? "bg-[var(--qg-primary,#0d9488)]/10 text-[var(--qg-primary,#0d9488)]"
                  : "text-[var(--qg-text-secondary,#64748b)] hover:bg-[var(--qg-primary,#0d9488)]/5"
              }`}
            >
              All Categories
            </button>
            {catLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg shimmer" />
                ))
              : (categories ?? []).map((cat: any) => {
                  const id = cat._id || cat.id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedCat(String(id))}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedCat === String(id)
                          ? "bg-[var(--qg-primary,#0d9488)]/10 text-[var(--qg-primary,#0d9488)]"
                          : "text-[var(--qg-text-secondary,#64748b)] hover:bg-[var(--qg-primary,#0d9488)]/5"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
          </div>
        </aside>

        {/* Mobile categories */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          <button
            onClick={() => setSelectedCat("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              !selectedCat
                ? "bg-[var(--qg-primary,#0d9488)] text-white"
                : "bg-[var(--qg-primary,#0d9488)]/5 text-[var(--qg-text-secondary,#64748b)]"
            }`}
          >
            All
          </button>
          {(categories ?? []).map((cat: any) => {
            const id = cat._id || cat.id;
            return (
              <button
                key={id}
                onClick={() => setSelectedCat(String(id))}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  selectedCat === String(id)
                    ? "bg-[var(--qg-primary,#0d9488)] text-white"
                    : "bg-[var(--qg-primary,#0d9488)]/5 text-[var(--qg-text-secondary,#64748b)]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Products grid */}
        <div className="min-w-0 flex-1">
          {prodLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl shimmer" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white py-16 text-center">
              <p className="text-sm text-[var(--qg-text-secondary,#64748b)]">
                No products found in this category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((p: any) => (
                <Link
                  key={p._id || p.id}
                  href={`/hecate-quickgo/product/${p.slug || p._id || p.id}`}
                  className="group rounded-xl border border-[var(--qg-border,#e0f2f1)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {(() => {
                    const rawImg = Array.isArray(p.image)
                      ? p.image[0]
                      : p.images?.[0] || p.image;
                    const resolved = resolveAssetUrl(rawImg);
                    return resolved ? (
                      <img
                        src={resolved}
                        alt={p.name}
                        className="mb-3 h-28 w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-[var(--qg-primary,#0d9488)]/5 text-2xl">
                        {p.name?.[0]}
                      </div>
                    );
                  })()}
                  <h3 className="mb-1 truncate text-sm font-medium group-hover:text-[var(--qg-primary,#0d9488)]">
                    {p.name}
                  </h3>
                  <p className="text-sm font-bold text-[var(--qg-primary,#0d9488)]">
                    &#8377;{p.price?.toLocaleString("en-IN") ?? 0}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
