"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { useCart } from "@/services/cart";
import { useCategories, useSubcategories } from "@/services/categories";
import { useHeaders } from "@/services/banners";
import { ROUTES } from "@/config/routes";
import type { Category, Subcategory } from "@/types/category";

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { data: cartItems } = useCart();
  const itemCount = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? 0;
  const { mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen, openModal } =
    useUIStore();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: categories } = useCategories();
  const { data: subcategories } = useSubcategories(activeCategory?.id);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  // Build nav links from API header menu items, filter out special items
  const NAV_LINKS = headerMenuItems && headerMenuItems.length > 0
    ? headerMenuItems
        .filter((item) => {
          if (!item.active) return false;
          const lower = item.name.toLowerCase();
          return lower !== "enter the mall" && lower !== "hecate quickgo" && lower !== "jyotish";
        })
        .map((item) => {
          const lower = item.name.toLowerCase();
          let href = `/${lower.replace(/\s+/g, "-")}`;
          if (lower === "home") href = "/";
          else if (lower === "about") href = "/about";
          else if (lower === "contact") href = "/contact";
          return { label: item.name, href };
        })
    : [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ];

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

          {/* Logo - Bigger */}
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 shrink-0"
          >
            <Image
              src="/image/logohwm.png"
              alt="Hecate Wizard Mall"
              width={220}
              height={64}
              className="h-12 w-auto sm:h-14 lg:h-16 object-contain"
              priority
            />
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center flex-1 max-w-xl mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
              />
            </div>
          </form>

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
                      src={user.avatar || user.profileImage || ""}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
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

                {/* Hover Dropdown */}
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute right-0 top-full mt-1 w-48 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)] transition-all duration-200 z-50">
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
                router.push(ROUTES.CATEGORIES);
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
                className="absolute left-0 top-full z-50 w-[800px] rounded-b-xl border border-t-0 border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-xl)] animate-fadeIn"
                onMouseEnter={handleMegaMenuEnter}
                onMouseLeave={handleMegaMenuLeave}
              >
                <div className="flex min-h-[400px]">
                  {/* Left: Categories List */}
                  <div className="w-[240px] border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Categories
                    </p>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveCategory(cat)}
                        onClick={() => {
                          router.push(ROUTES.CATEGORY(cat.name));
                          setMegaMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-all duration-150",
                          activeCategory?.id === cat.id
                            ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-medium border-r-2 border-[var(--accent-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {cat.image && (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              width={24}
                              height={24}
                              className="rounded-md object-cover"
                            />
                          )}
                          {cat.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                      </button>
                    ))}

                    <div className="mx-4 my-2 border-t border-[var(--border-primary)]" />
                    <Link
                      href={ROUTES.CATEGORIES}
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
                    >
                      View All Categories
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Right: Subcategories + Featured Image */}
                  <div className="flex-1 p-6">
                    {activeCategory && (
                      <>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {activeCategory.name}
                          </h3>
                          <Link
                            href={ROUTES.CATEGORY(activeCategory.name)}
                            onClick={() => setMegaMenuOpen(false)}
                            className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
                          >
                            View All →
                          </Link>
                        </div>

                        {/* Subcategories Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {subcategories?.map((sub: Subcategory) => (
                            <Link
                              key={sub.id}
                              href={ROUTES.SUBCATEGORY(
                                activeCategory.name,
                                sub.name
                              )}
                              onClick={() => setMegaMenuOpen(false)}
                              className="group flex items-center gap-2 rounded-lg border border-[var(--border-primary)] p-2.5 transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] hover:shadow-sm"
                            >
                              {sub.image && (
                                <Image
                                  src={sub.image}
                                  alt={sub.name}
                                  width={36}
                                  height={36}
                                  className="rounded-md object-cover"
                                />
                              )}
                              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] font-medium truncate">
                                {sub.name}
                              </span>
                            </Link>
                          ))}
                        </div>

                        {/* Featured Category Image */}
                        {activeCategory.image && (
                          <Link
                            href={ROUTES.CATEGORY(activeCategory.name)}
                            onClick={() => setMegaMenuOpen(false)}
                            className="block overflow-hidden rounded-xl"
                          >
                            <div className="relative h-[140px] w-full overflow-hidden rounded-xl">
                              <Image
                                src={activeCategory.image}
                                alt={activeCategory.name}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-3 left-4">
                                <p className="text-white font-semibold text-sm">
                                  Shop {activeCategory.name}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Nav Links from API */}
          {NAV_LINKS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
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

          {/* Hecate QuickGo with logo */}
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

      {/* Mobile: Search bar (expandable) */}
      <div
        className={cn(
          "overflow-hidden border-b border-[var(--border-primary)] transition-all duration-300 lg:hidden",
          searchOpen ? "max-h-20 py-3 px-4" : "max-h-0 py-0 px-4"
        )}
      >
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
            autoFocus={searchOpen}
          />
        </form>
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
          <Link href={ROUTES.HOME} onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/image/logohwm.png"
              alt="Hecate Wizard Mall"
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
                href={ROUTES.CATEGORIES}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
              >
                <Store className="h-4 w-4" />
                Enter the Mall
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Link>

              {/* Quick category links (max 5) */}
              <div className="ml-2 mt-1 space-y-0.5">
                {categories?.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    href={ROUTES.CATEGORY(cat.name)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {cat.image && (
                      <Image
                        src={cat.image}
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
                    href={ROUTES.CATEGORIES}
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
              {NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
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

            {/* QuickGo & Jyotish */}
            <div className="px-4 py-2 space-y-1">
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
                        src={user.avatar || user.profileImage || ""}
                        alt={user.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
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
