"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminProduct } from "@/services/admin/products";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { Loader } from "@/components/ui/Loader";

export default function ViewProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useAdminProduct(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader variant="section" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--accent-danger)]">
        Failed to load product{error ? `: ${(error as Error).message}` : "."}
      </div>
    );
  }

  const product = data as typeof data & Record<string, unknown>;
  const images = Array.isArray(product.image) ? (product.image as string[]) : [];
  const hero = images[0];
  const variations = ((product.variations ?? []) as any[]).filter(
    (v) => !v.deleted,
  );
  const marketLinks = ((product.marketLinks ?? []) as any[]).filter(
    (m) => !m.deleted,
  );
  const tags = ((product.tags ?? []) as Array<{ id: number; name: string }>);
  const category = product.category as { name?: string } | undefined;
  const subcategory = product.subcategory as { name?: string } | undefined;
  const dimension = (product.dimension ?? {}) as Record<string, unknown>;
  const bulkTiers = Array.isArray(product.bulkPricingTiers)
    ? (product.bulkPricingTiers as Array<{ qty: number; unitPrice: number }>)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Back to products"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {product.name}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              SKU <span className="font-mono">{product.sku}</span>
            </p>
          </div>
        </div>

        <Link href={`/admin/products/${id}/edit`}>
          <Button leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
        </Link>
      </div>

      {/* Hero */}
      <div className="grid gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:grid-cols-[auto_1fr]">
        {hero ? (
          <img
            src={resolveAssetUrl(hero)}
            alt={product.name}
            className="h-32 w-32 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
            No image
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={product.active ? "success" : "danger"}>
              {product.active ? "Active" : "Inactive"}
            </Badge>
            {(product.platform as string[] | undefined)?.map((p) => (
              <Badge key={p} variant="info">
                {p}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {(product.short as string) || "No short description."}
          </p>
          <div className="flex flex-wrap gap-1 text-xs text-[var(--text-muted)]">
            {category?.name && (
              <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5">
                {category.name}
              </span>
            )}
            {subcategory?.name && (
              <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5">
                {subcategory.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Stat
              label="Price"
              value={product.price ? `\u20B9${product.price}` : "--"}
            />
            <Stat label="Stock" value={(product.stock as string) || "--"} />
            <Stat
              label="MRP"
              value={product.MRP ? `\u20B9${product.MRP}` : "--"}
            />
            {product.barCode && (
              <Stat label="FNSKU" value={product.barCode as string} />
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      {images.length > 1 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Gallery
          </p>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <img
                key={src + i}
                src={resolveAssetUrl(src)}
                alt=""
                className="h-20 w-20 rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Long description */}
      {product.description && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Description
          </p>
          <div
            className="prose prose-sm max-w-none text-[var(--text-primary)]"
            dangerouslySetInnerHTML={{ __html: product.description as string }}
          />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t.id} variant="info">
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dimensions */}
      {Object.keys(dimension).length > 0 && (
        <div className="grid gap-2 sm:grid-cols-4">
          {["l", "b", "h", "w"].map((k) => (
            <div
              key={k}
              className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {k === "l"
                  ? "Length"
                  : k === "b"
                    ? "Breadth"
                    : k === "h"
                      ? "Height"
                      : "Weight"}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-primary)]">
                {dimension[k] != null ? String(dimension[k]) : "--"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bulk tiers */}
      {bulkTiers.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Bulk pricing tiers
          </p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {bulkTiers.map((t, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {t.qty}+
                </span>{" "}
                → ₹{t.unitPrice}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Variations ({variations.length})
          </p>
          <div className="space-y-2">
            {variations.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {v.variationName}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <span className="font-mono">{v.sku}</span>
                    {(v.attributeCombo ?? []).map(
                      (c: { name: string; value: string }) => (
                        <span
                          key={`${c.name}=${c.value}`}
                          className="rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5"
                        >
                          {c.name}: {c.value}
                        </span>
                      ),
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Stat
                    label="Price"
                    value={v.price ? `\u20B9${v.price}` : "--"}
                    compact
                  />
                  <Stat
                    label="Stock"
                    value={v.stock || "--"}
                    compact
                  />
                  <Badge variant={v.active ? "success" : "danger"}>
                    {v.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market links */}
      {marketLinks.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Market Links
          </p>
          <div className="space-y-1.5">
            {marketLinks.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                    {m.countryCode}
                  </span>
                  <span className="font-medium">{m.name}</span>
                </span>
                <span className="truncate text-xs text-[var(--accent-primary)]">
                  {m.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "text-right" : "rounded-lg bg-[var(--bg-secondary)] px-3 py-1.5"}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
