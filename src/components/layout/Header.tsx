"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronRight,
  Store,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { useQuickGoStore } from "@/stores/useQuickGoStore";
import { useCountryStore } from "@/stores/useCountryStore";
import { useCart } from "@/services/cart";
import { useCategories, useSubcategories } from "@/services/categories";
import { useHeaders } from "@/services/banners";
import { ROUTES } from "@/config/routes";
import { resolveMenuHref } from "@/lib/menuResolver";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Category, Subcategory } from "@/types/category";
import { HeaderSearchAutocomplete } from "./HeaderSearchAutocomplete";

type SiteVariant = "wizard" | "quickgo" | "jyotish";

function getSiteVariant(
  pathname: string,
  platformOverride?: string | null,
): SiteVariant {
  // Checkout (and other shared-chrome pages) live under /(store), so the
  // pathname alone doesn't say whether the shopper came from QuickGo. The
  // cart drawer appends `?platform=quickgo` on those transitions — honour
  // it so the header count + logo track the basket the shopper is about
  // to pay for.
  if (platformOverride === "quickgo" || platformOverride === "hecate-quickgo") {
    return "quickgo";
  }
  if (pathname.startsWith("/hecate-quickgo")) return "quickgo";
  if (pathname.startsWith("/jyotish")) return "jyotish";
  return "wizard";
}

const HEADER_CONFIG: Record<SiteVariant, {
  logoSrc: string;
  logoAlt: string;
  homeHref: string;
  categoriesHref: string;
  categoryHref: (name: string, slug?: string) => string;
  subcategoryHref: (catName: string, subName: string, catSlug?: string, subSlug?: string) => string;
  searchPath: string;
}> = {
  wizard: {
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    homeHref: ROUTES.HOME,
    categoriesHref: ROUTES.CATEGORIES,
    categoryHref: (name) => ROUTES.CATEGORY(name),
    subcategoryHref: (catName, subName) => ROUTES.SUBCATEGORY(catName, subName),
    searchPath: "/categories",
  },
  quickgo: {
    logoSrc: "/image/hecate quickgo logo transpreant new.png",
    logoAlt: "Hecate QuickGo",
    homeHref: ROUTES.QUICKGO.HOME,
    categoriesHref: ROUTES.QUICKGO.CATEGORIES,
    categoryHref: (name, slug) => `${ROUTES.QUICKGO.CATEGORIES}?cat=${encodeURIComponent(slug || name)}`,
    subcategoryHref: (catName, subName, catSlug, subSlug) =>
      `${ROUTES.QUICKGO.CATEGORIES}?cat=${encodeURIComponent(catSlug || catName)}&sub=${encodeURIComponent(subSlug || subName)}`,
    searchPath: ROUTES.QUICKGO.CATEGORIES,
  },
  jyotish: {
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    homeHref: ROUTES.HOME,
    categoriesHref: ROUTES.CATEGORIES,
    categoryHref: (name) => ROUTES.CATEGORY(name),
    subcategoryHref: (catName, subName) => ROUTES.SUBCATEGORY(catName, subName),
    searchPath: "/categories",
  },
};

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const variant = getSiteVariant(
    pathname,
    searchParams?.get("platform")?.toLowerCase(),
  );
  const headerCfg = HEADER_CONFIG[variant];
  const { user, isLoggedIn } = useAuthStore();
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { data: cart } = useCart();
  // Count only items that belong to this storefront — a shopper browsing
  // wizard shouldn't see their QuickGo basket count on the wizard header.
  // Logged-out shoppers can't have a cart, so the count stays at 0 naturally
  // (useCart is disabled when !isLoggedIn).
  const itemCount = !isLoggedIn
    ? 0
    : cart?.items?.reduce((sum, item) => {
        const p = String(item.purchasePlatform ?? "").toLowerCase();
        const normalised =
          p === "quickgo" || p === "hecate-quickgo" ? "quickgo" : "wizard";
        const target = variant === "quickgo" ? "quickgo" : "wizard";
        if (normalised !== target) return sum;
        return sum + (item.quantity || 1);
      }, 0) ?? 0;
  const { mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen, openModal } =
    useUIStore();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Header mega-menu: when the shopper is on QuickGo, scope
  // category/subcategory lookups to the QuickGo platform + their
  // picked city so the menu never shows a category that wouldn't
  // render on a click. Wizard header gets the unfiltered list (no
  // opts passed = no platform/city query params).
  const quickGoCityForMenu = useQuickGoStore((s) => s.city);
  // QuickGo is an India-only surface. Hide the cross-site entry point
  // whenever the shopper has switched to a non-India storefront so we
  // don't tease a service they can't actually use.
  const countryCode = useCountryStore((s) => s.code);
  const isIndiaCountry = (countryCode ?? "IND").toUpperCase() === "IND";
  const categoryScope =
    variant === "quickgo"
      ? { platform: "quickgo" as const, city: quickGoCityForMenu || undefined }
      : undefined;
  const { data: categories } = useCategories(categoryScope);
  const { data: subcategories } = useSubcategories(
    activeCategory?.id,
    categoryScope,
  );
  const { data: headerMenuItems } = useHeaders();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setMegaMenuOpen(false);
  }, [pathname, setMobileMenuOpen, setSearchOpen]);

  // Set first category as active when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleMegaMenuEnter = () => {
    clearTimeout(megaMenuTimeout.current);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 200);
  };


  // Build nav links from API header menu items. "Enter the Mall" is rendered
  // separately as the branded mega-menu trigger (with Store icon), so we drop
  // it from the API-fed list here to avoid a duplicate label next to it.
  // Items render in backend order (createdAt asc = earliest first).
  const activeMenuItems = (headerMenuItems ?? []).filter((item) => {
    if (!item.active) return false;
    const lower = item.name.toLowerCase();
    return lower !== "enter the mall";
  });

  const rawNavItems =
    activeMenuItems.length > 0
      ? activeMenuItems.map((item) => ({ label: item.name }))
      : [
          { label: "Home" },
          { label: "About" },
          { label: "Contact" },
        ];

  // Label → href via the shared resolver. Handles synonyms ("Contact Us" →
  // /contact), policies ("Shipping Policy" → /shipping-and-return-policy) and
  // falls back to a kebab-cased slug for unknown items.
  const NAV_LINKS = rawNavItems.map((item) => ({
    label: item.label,
    href: resolveMenuHref(item.label, variant),
  }));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-[var(--bg-primary)] transition-shadow duration-300",
        className
      )}
    >
      {/* Main Header Bar */}
      <div className="border-b border-[var(--border-primary)] shadow-[var(--shadow-sm)]">
        <div className="mx-auto max-w-7xl flex h-[64px] sm:h-[72px] items-center justify-between px-4 lg:px-8">
          {/* Left: Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Logo - Bigger (variant-aware) */}
          <Link
            href={headerCfg.homeHref}
            className="flex items-center gap-2 shrink-0"
          >
            <Image
              src={headerCfg.logoSrc}
              alt={headerCfg.logoAlt}
              width={220}
              height={64}
              className="h-12 w-auto sm:h-14 lg:h-16 object-contain"
              priority
            />
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
            <HeaderSearchAutocomplete
              variant={variant === "quickgo" ? "quickgo" : "wizard"}
              searchPath={headerCfg.searchPath}
              layout="desktop"
              onNavigated={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile search */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={toggleCart}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* User icon / Welcome */}
            {isLoggedIn && user ? (
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Account"
                >
                  {(user.avatar || user.profileImage) ? (
                    <Image
                      // Profile images come back as storage-relative paths
                      // (e.g. /uploads/user-profile/xyz.jpg). Pass them
                      // through the asset resolver so Next's <Image> gets
                      // an absolute, whitelisted URL.
                      src={
                        resolveAssetUrl(user.avatar || user.profileImage || "") ||
                        user.avatar ||
                        user.profileImage ||
                        ""
                      }
                      alt={user.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-xs font-bold text-white">
                      {user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "U"}
                    </span>
                  )}
                  <span className="hidden sm:block text-xs font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                    Welcome, {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-[var(--text-muted)]" />
                </button>

                {/* Hover Dropdown — pt-2 provides a hoverable bridge so the
                    dropdown does not close while the cursor traverses the gap
                    between the trigger and panel. */}
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute right-0 top-full pt-2 w-48 transition-all duration-200 z-50">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]">
                  <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => router.push(ROUTES.DASHBOARD)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        useAuthStore.getState().logout();
                        router.push(ROUTES.HOME);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--accent-danger)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openModal("auth")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Login"
              >
                <User className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden lg:block border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="mx-auto max-w-7xl flex items-center gap-0 px-4 lg:px-8">
          {/* Enter the Mall - Mega Menu Trigger */}
          <div
            ref={megaMenuRef}
            className="relative"
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
          >
            <button
              type="button"
              onClick={() => {
                router.push(headerCfg.categoriesHref);
                setMegaMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200",
                megaMenuOpen
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
              )}
            >
              <Store className="h-4 w-4" />
              Enter the Mall
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  megaMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Mega Dropdown */}
            {megaMenuOpen && (
              <div
                className="absolute left-0 top-full z-50 w-[min(820px,calc(100vw-2rem))] rounded-b-xl border border-t-0 border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-xl)] animate-fadeIn"
                onMouseEnter={handleMegaMenuEnter}
                onMouseLeave={handleMegaMenuLeave}
              >
                <div className="flex min-h-[380px] max-h-[min(520px,75vh)]">
                  {/* Left: Categories List (unchanged — works well) */}
                  <div className="w-[240px] shrink-0 overflow-y-auto border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Categories
                    </p>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveCategory(cat)}
                        onClick={() => {
                          router.push(headerCfg.categoryHref(cat.name, (cat as any).slug));
                          setMegaMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-all duration-150",
                          activeCategory?.id === cat.id
                            ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium border-r-2 border-[var(--accent-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {cat.image && (
                            <Image
                              src={resolveAssetUrl(cat.image)}
                              alt={cat.name}
                              width={24}
                              height={24}
                              className="rounded-md object-cover shrink-0"
                            />
                          )}
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      </button>
                    ))}

                    <div className="mx-4 my-2 border-t border-[var(--border-primary)]" />
                    <Link
                      href={headerCfg.categoriesHref}
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
                    >
                      View All Categories
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Right: Subcategories only — no category hero image.
                      Responsive grid adapts to panel width. */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {activeCategory && (
                      <>
                        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-primary)] px-5 py-3">
                          <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
                            {activeCategory.name}
                          </h3>
                          <Link
                            href={headerCfg.categoryHref(activeCategory.name, (activeCategory as any).slug)}
                            onClick={() => setMegaMenuOpen(false)}
                            className="shrink-0 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                          >
                            View All →
                          </Link>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                          {subcategories && subcategories.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                              {subcategories.map((sub: Subcategory) => (
                                <Link
                                  key={sub.id}
                                  href={headerCfg.subcategoryHref(
                                    activeCategory.name,
                                    sub.name,
                                    (activeCategory as any).slug,
                                    (sub as any).slug
                                  )}
                                  onClick={() => setMegaMenuOpen(false)}
                                  className="group flex flex-col items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] hover:shadow-md"
                                >
                                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
                                    {sub.image ? (
                                      <Image
                                        src={resolveAssetUrl(sub.image)}
                                        alt={sub.name}
                                        fill
                                        sizes="(max-width:640px) 120px, 160px"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[var(--text-faint)]">
                                        <Store className="h-6 w-6" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="line-clamp-2 text-xs font-medium leading-tight text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]">
                                    {sub.name}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-sm text-[var(--text-muted)]">
                                No subcategories yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Nav Links from API */}
          {NAV_LINKS.map((item, i) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Cross-site link: show opposite site's logo/link based on current variant */}
          {variant !== "quickgo" && isIndiaCountry && (
            <Link
              href={ROUTES.QUICKGO.HOME}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors rounded-lg"
            >
              <Image
                src="/image/hecate quickgo logo transpreant new.png"
                alt="QuickGo"
                width={240}
                height={64}
                className="h-14 w-auto object-contain"
              />
            </Link>
          )}
          {variant === "quickgo" && (
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-[var(--bg-secondary)] transition-colors rounded-lg"
            >
              <Image
                src="/image/logohwm.png"
                alt="Hecate Wizard Mall"
                width={220}
                height={64}
                className="h-12 w-auto object-contain"
              />
            </Link>
          )}

          {/* Jyotish Link */}
          <Link
            href={ROUTES.JYOTISH.HOME}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[var(--accent-secondary)] hover:text-[var(--accent-secondary-hover)] transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Jyotish
          </Link>
        </div>
      </div>

      {/* Mobile: Search bar (expandable). Uses the same autocomplete
          component as desktop — dropdown anchors to the drawer's width. */}
      <div
        className={cn(
          "overflow-visible border-b border-[var(--border-primary)] transition-all duration-300 lg:hidden",
          searchOpen ? "max-h-[80vh] py-3 px-4" : "max-h-0 py-0 px-4",
        )}
      >
        {searchOpen && (
          <HeaderSearchAutocomplete
            variant={variant === "quickgo" ? "quickgo" : "wizard"}
            searchPath={headerCfg.searchPath}
            layout="mobile"
            onNavigated={() => setSearchOpen(false)}
          />
        )}
      </div>

      {/* Mobile: Left Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile: Left Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[85%] max-w-[320px] bg-[var(--bg-primary)] shadow-2xl transition-transform duration-300 ease-out lg:hidden overflow-hidden flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
          <Link href={headerCfg.homeHref} onClick={() => setMobileMenuOpen(false)}>
            <Image
              src={headerCfg.logoSrc}
              alt={headerCfg.logoAlt}
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col py-2">
            {/* Enter the Mall Section - Links to categories page */}
            <div className="px-4 py-2">
              <Link
                href={headerCfg.categoriesHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
              >
                <Store className="h-4 w-4" />
                {variant === "quickgo" ? "Browse QuickGo" : "Enter the Mall"}
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Link>

              {/* Quick category links (max 5) */}
              <div className="ml-2 mt-1 space-y-0.5">
                {categories?.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    href={headerCfg.categoryHref(cat.name, (cat as any).slug)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {cat.image && (
                      <Image
                        src={resolveAssetUrl(cat.image)}
                        alt={cat.name}
                        width={24}
                        height={24}
                        className="rounded-md object-cover"
                      />
                    )}
                    <span className="truncate">{cat.name}</span>
                  </Link>
                ))}
                {categories && categories.length > 5 && (
                  <Link
                    href={headerCfg.categoriesHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                  >
                    View All {categories.length} Categories →
                  </Link>
                )}
              </div>
            </div>

            <div className="mx-4 border-t border-[var(--border-primary)]" />

            {/* Nav Links */}
            <div className="px-4 py-2">
              {NAV_LINKS.map((item, i) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={`${item.label}-${i}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mx-4 border-t border-[var(--border-primary)]" />

            {/* Cross-site links: show opposite site based on current variant */}
            <div className="px-4 py-2 space-y-1">
              {variant !== "quickgo" && isIndiaCountry && (
                <Link
                  href={ROUTES.QUICKGO.HOME}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  <Image
                    src="/image/hecate quickgo logo transpreant new.png"
                    alt="QuickGo"
                    width={220}
                    height={56}
                    className="h-12 w-auto object-contain"
                  />
                </Link>
              )}
              {variant === "quickgo" && (
                <Link
                  href={ROUTES.HOME}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Image
                    src="/image/logohwm.png"
                    alt="Hecate Wizard Mall"
                    width={200}
                    height={56}
                    className="h-10 w-auto object-contain"
                  />
                </Link>
              )}
              <Link
                href={ROUTES.JYOTISH.HOME}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-secondary)]"
              >
                <Sparkles className="h-4 w-4" />
                Jyotish
              </Link>
            </div>

            <div className="mx-4 border-t border-[var(--border-primary)]" />

            {/* Auth section */}
            <div className="px-4 py-2">
              {isLoggedIn && user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    {(user.avatar || user.profileImage) ? (
                      <Image
                        src={
                          resolveAssetUrl(
                            user.avatar || user.profileImage || "",
                          ) ||
                          user.avatar ||
                          user.profileImage ||
                          ""
                        }
                        alt={user.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-xs font-bold text-white">
                        {user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) ?? "U"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        Welcome, {user.name?.split(" ")[0]}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href={ROUTES.DASHBOARD}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      useAuthStore.getState().logout();
                      setMobileMenuOpen(false);
                      router.push(ROUTES.HOME);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-danger)] hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    openModal("auth");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)]"
                >
                  <User className="h-4 w-4" /> Login / Register
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
