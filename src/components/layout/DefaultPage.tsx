"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Topbar from "./Topbar";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import { CartDrawer } from "@/components/store/cart/CartDrawer";

interface DefaultPageProps {
  children: React.ReactNode;
  className?: string;
}

export function DefaultPage({ children, className }: DefaultPageProps) {
  // Apply the QuickGo theme at the frame level when the shopper arrived
  // here from QuickGo (the cart drawer tags checkout with
  // `?platform=quickgo`). Scoped here so Header/Topbar/Footer all re-read
  // the teal tokens — not just the main content.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const platform = searchParams?.get("platform")?.toLowerCase();
  const isQuickGoFrame =
    pathname?.startsWith("/hecate-quickgo") ||
    platform === "quickgo" ||
    platform === "hecate-quickgo";

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]",
        isQuickGoFrame && "quickgo-theme",
      )}
    >
      <Topbar />
      <Header />

      <main
        className={cn(
          "flex-1 pt-0 pb-[60px] md:pb-0",
          className,
        )}
      >
        {children}
      </main>

      <Footer />
      <MobileNav />

      {/* Global Overlays (AuthModal is mounted at root so it works on admin routes too) */}
      <CartDrawer />
    </div>
  );
}

export default DefaultPage;
