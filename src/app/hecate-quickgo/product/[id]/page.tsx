"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import { useCartStore } from "@/stores/useCartStore";
import toast from "react-hot-toast";

export default function QuickGoProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.PRODUCTS.SINGLE(id));
      return data.data || data;
    },
    enabled: !!id,
  });

  const handleAdd = () => {
    if (!product) return;
    addItem({ ...product, quantity: qty });
    toast.success("Added to cart!");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="h-80 rounded-xl shimmer" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded shimmer" />
            <div className="h-4 w-1/2 rounded shimmer" />
            <div className="h-10 w-1/3 rounded shimmer" />
            <div className="h-24 rounded shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Product not found</p>
        <Link
          href="/hecate-quickgo/categories"
          className="text-sm text-[var(--qg-primary,#0d9488)] underline"
        >
          Browse categories
        </Link>
      </div>
    );
  }

  const p = product;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/hecate-quickgo/categories"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--qg-text-secondary,#64748b)] hover:text-[var(--qg-primary,#0d9488)]"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-[var(--qg-border,#e0f2f1)] bg-white p-6">
          {p.images?.[0] || p.image ? (
            <img
              src={p.images?.[0] || p.image}
              alt={p.name}
              className="mx-auto h-72 object-contain"
            />
          ) : (
            <div className="flex h-72 items-center justify-center text-5xl text-[var(--qg-primary,#0d9488)]/30">
              {p.name?.[0]}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="mb-2 text-2xl font-bold">{p.name}</h1>
          {p.brand && (
            <p className="mb-2 text-sm text-[var(--qg-text-secondary,#64748b)]">
              by {p.brand}
            </p>
          )}
          <p className="mb-4 text-3xl font-bold text-[var(--qg-primary,#0d9488)]">
            &#8377;{p.price?.toLocaleString("en-IN") ?? 0}
          </p>

          {p.description && (
            <p className="mb-6 text-sm leading-relaxed text-[var(--qg-text-secondary,#64748b)]">
              {p.description}
            </p>
          )}

          {/* Quantity */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium">Qty:</span>
            <div className="flex items-center rounded-lg border border-[var(--qg-border,#e0f2f1)]">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-lg hover:bg-[var(--qg-primary,#0d9488)]/5"
              >
                -
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-1.5 text-lg hover:bg-[var(--qg-primary,#0d9488)]/5"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-xl bg-[var(--qg-primary,#0d9488)] py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Add to Cart
            </button>
            <Link
              href="/hecate-quickgo/checkout"
              onClick={handleAdd}
              className="flex-1 rounded-xl border border-[var(--qg-primary,#0d9488)] py-3 text-center text-sm font-semibold text-[var(--qg-primary,#0d9488)] transition-colors hover:bg-[var(--qg-primary,#0d9488)]/5"
            >
              Buy Now
            </Link>
          </div>

          {/* Info badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: "\u26A1", text: "10 min delivery" },
              { icon: "\u21A9", text: "Easy returns" },
              { icon: "\u2714", text: "Quality assured" },
            ].map((b) => (
              <span
                key={b.text}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--qg-primary,#0d9488)]/5 px-3 py-1 text-xs font-medium text-[var(--qg-primary,#0d9488)]"
              >
                {b.icon} {b.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
