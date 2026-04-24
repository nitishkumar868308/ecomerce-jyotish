"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOTER_NAV } from "@/config/navigation";
import { APP_NAME } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { resolveMenuHref } from "@/lib/menuResolver";

type SiteVariant = "wizard" | "quickgo" | "jyotish";

function getSiteVariant(
  pathname: string,
  platformOverride?: string | null,
): SiteVariant {
  if (platformOverride === "quickgo" || platformOverride === "hecate-quickgo") {
    return "quickgo";
  }
  if (pathname.startsWith("/hecate-quickgo")) return "quickgo";
  if (pathname.startsWith("/jyotish")) return "jyotish";
  return "wizard";
}

const FOOTER_BRAND: Record<SiteVariant, { logoSrc: string; logoAlt: string; homeHref: string; tagline: string; appName: string }> = {
  wizard: {
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    homeHref: ROUTES.HOME,
    tagline: "Discover authentic products curated with care. Quality you can trust, delivered to your doorstep.",
    appName: APP_NAME,
  },
  quickgo: {
    logoSrc: "/image/hecate quickgo logo transpreant new.png",
    logoAlt: "Hecate QuickGo",
    homeHref: ROUTES.QUICKGO.HOME,
    tagline: "Fast delivery of groceries & essentials in minutes. Quality you can trust, delivered in a flash.",
    appName: "Hecate QuickGo",
  },
  jyotish: {
    logoSrc: "/image/logohwm.png",
    logoAlt: "Hecate Wizard Mall",
    homeHref: ROUTES.HOME,
    tagline: "Discover authentic products curated with care. Quality you can trust, delivered to your doorstep.",
    appName: APP_NAME,
  },
};

const SOCIAL_LINKS = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Twitter", icon: Twitter, href: "#" },
  { label: "YouTube", icon: Youtube, href: "#" },
  { label: "Email", icon: Mail, href: "mailto:info@hecatewizardmall.com" },
];

function FooterLinkGroup({
  title,
  links,
  variant,
}: {
  title: string;
  links: { label: string; href: string }[];
  variant: SiteVariant;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              // Resolve by label so policy/about/contact links stay within
              // the current site variant (wizard → /about, quickgo →
              // /hecate-quickgo/about, etc.).
              href={resolveMenuHref(link.label, variant)}
              className="text-sm text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--accent-primary)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variant = getSiteVariant(
    pathname,
    searchParams?.get("platform")?.toLowerCase(),
  );
  const brand = FOOTER_BRAND[variant];

  return (
    <footer
      className={cn(
        "border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]",
        className,
      )}
    >
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* About column - Logo instead of text (variant-aware) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={brand.homeHref} className="inline-block">
              <Image
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={200}
                height={60}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              {brand.tagline}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--accent-primary)] hover:text-white hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <FooterLinkGroup title="Company" links={FOOTER_NAV.company} variant={variant} />
          <FooterLinkGroup title="Policies" links={FOOTER_NAV.policies} variant={variant} />

          {/* Contact Info instead of Account links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                <span className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  27 Deepali, Pitampura, New Delhi 110034
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                <a
                  href="mailto:info@hecatewizardmall.com"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
                >
                  info@hecatewizardmall.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                <a
                  href="tel:+919717033830"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
                >
                  +91 9717033830
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border-primary)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-[var(--text-muted)] sm:flex-row lg:px-8">
          <p>&copy; {currentYear} {brand.appName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href={resolveMenuHref("privacy", variant)}
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Privacy
            </Link>
            <Link
              href={resolveMenuHref("terms", variant)}
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Terms
            </Link>
            <Link
              href={resolveMenuHref("shipping", variant)}
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
