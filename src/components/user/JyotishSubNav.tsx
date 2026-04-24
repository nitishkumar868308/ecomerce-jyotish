"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

// Local sub-nav for the Jyotish section inside the user dashboard.
// Surfaced on both /dashboard/jyotish (consultations) and /dashboard/wallet
// so the shopper can flip between their sessions and their wallet without
// hunting through the main nav.

const TABS = [
  {
    href: "/dashboard/jyotish",
    label: "Consultations",
    Icon: MessageSquare,
  },
  {
    href: "/dashboard/wallet",
    label: "Wallet",
    Icon: Wallet,
  },
];

export function JyotishSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-1.5">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
              active
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default JyotishSubNav;
