"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Topbar from "./Topbar";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

interface DefaultPageProps {
  children: React.ReactNode;
  className?: string;
}

export function DefaultPage({ children, className }: DefaultPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
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
    </div>
  );
}

export default DefaultPage;
