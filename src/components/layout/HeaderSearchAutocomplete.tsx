"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  useProductSearch,
  type ProductSearchMatch,
} from "@/services/products";
import { useQuickGoStore } from "@/stores/useQuickGoStore";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";

interface HeaderSearchAutocompleteProps {
  variant: "wizard" | "quickgo";
  /**
   * Page path to navigate to when the shopper submits the form or
   * clicks "See all results for …" — the categories / listing page
   * that already owns the `?search=` param.
   */
  searchPath: string;
  /**
   * Mobile embeds the input inside the expandable search drawer; the
   * desktop variant is part of the always-visible header bar. The
   * dropdown behaviour is identical across both, just the shell
   * differs (full-width drawer vs centred bar).
   */
  layout: "desktop" | "mobile";
  onNavigated?: () => void;
  className?: string;
}

/**
 * Debounced header search field with a dropdown of product +
 * variation matches. Hitting Enter still works (drops into the
 * existing categories-with-search flow), but the dropdown lets the
 * shopper jump straight to a specific product — and, when the match
 * is on a variation, pre-selects that variation on the PDP via
 * `?variation=<id>`.
 */
export function HeaderSearchAutocomplete({
  variant,
  searchPath,
  layout,
  onNavigated,
  className,
}: HeaderSearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickGoCity = useQuickGoStore((s) => s.city);
  const quickGoPincode = useQuickGoStore((s) => s.pincode);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(id);
  }, [query]);

  const { data: matches, isFetching } = useProductSearch(debounced, {
    platform: variant,
    city: variant === "quickgo" ? quickGoCity || undefined : undefined,
    pincode:
      variant === "quickgo" ? quickGoPincode || undefined : undefined,
    limit: 8,
  });

  // Outside click closes the dropdown. Pointer events beat mouse/touch
  // so we don't double-dispatch on touch devices.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Reset keyboard cursor whenever results change so the first result
  // is always the default Enter target.
  useEffect(() => {
    setActiveIdx(0);
  }, [matches]);

  const goToMatch = (m: ProductSearchMatch) => {
    const base =
      variant === "quickgo" ? "/hecate-quickgo/product" : "/product";
    const slugOrId = m.slug || m.productId;
    const href = m.variation
      ? `${base}/${slugOrId}?variation=${encodeURIComponent(m.variation.id)}`
      : `${base}/${slugOrId}`;
    setOpen(false);
    setQuery("");
    setDebounced("");
    onNavigated?.();
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (matches && matches.length > 0) {
      goToMatch(matches[activeIdx] ?? matches[0]);
      return;
    }
    setOpen(false);
    setQuery("");
    onNavigated?.();
    router.push(`${searchPath}?search=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !matches || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown =
    open && debounced.length >= 2 && (isFetching || (matches?.length ?? 0) > 0 || debounced.length >= 2);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, colors, variations…"
          className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebounced("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          className={cn(
            "absolute z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-xl",
            layout === "desktop"
              ? "left-0 right-0"
              : "left-0 right-0 max-h-[60vh]",
          )}
        >
          {isFetching && (!matches || matches.length === 0) ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)]">
              <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent-primary)]" />
              Searching…
            </div>
          ) : matches && matches.length > 0 ? (
            <>
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Products
              </div>
              <ul role="listbox" className="pb-1">
                {matches.map((m, i) => (
                  <SearchRow
                    key={`${m.productId}:${m.variation?.id ?? "main"}`}
                    match={m}
                    active={i === activeIdx}
                    onPick={() => goToMatch(m)}
                    onHover={() => setActiveIdx(i)}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  onNavigated?.();
                  router.push(
                    `${searchPath}?search=${encodeURIComponent(debounced)}`,
                  );
                }}
                className="block w-full border-t border-[var(--border-primary)] px-4 py-2.5 text-left text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
              >
                See all results for “{debounced}” →
              </button>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No products match “{debounced}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchRow({
  match,
  active,
  onPick,
  onHover,
}: {
  match: ProductSearchMatch;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  // Prefer the variation image if one was picked, else fall back to
  // the product's primary image, else a neutral placeholder. We ask
  // next/image to skip optimisation because these thumbs are tiny and
  // often live on external storage.
  const rawImg = match.variation?.image || match.image;
  const src = rawImg ? resolveAssetUrl(rawImg) : null;

  const attrLabel =
    match.variation?.attrs && match.variation.attrs.length > 0
      ? match.variation.attrs
          .map((a) => `${a.name}: ${a.value}`)
          .join(" · ")
      : match.variation?.variationName || null;

  const price = match.price
    ? `${match.currencySymbol || "₹"}${match.price}`
    : null;

  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onPick}
        onMouseEnter={onHover}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
          active
            ? "bg-[var(--accent-primary)]/10"
            : "hover:bg-[var(--bg-secondary)]",
        )}
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
          {src ? (
            <Image
              src={src}
              alt={match.name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--text-muted)]">
              {match.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {match.name}
          </p>
          {attrLabel && (
            <p className="truncate text-[11px] text-[var(--text-secondary)]">
              {attrLabel}
            </p>
          )}
        </div>
        {price && (
          <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
            {price}
          </span>
        )}
      </button>
    </li>
  );
}

export default HeaderSearchAutocomplete;
