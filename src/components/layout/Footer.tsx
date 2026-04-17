"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOTER_NAV } from "@/config/navigation";
import { APP_NAME } from "@/config/constants";
import { ROUTES } from "@/config/routes";

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
}: {
  title: string;
  links: { label: string; href: string }[];
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
              href={link.href}
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
          {/* About column - Logo instead of text */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.HOME} className="inline-block">
              <Image
                src="/image/logohwm.png"
                alt="Hecate Wizard Mall"
                width={200}
                height={60}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Discover authentic products curated with care.
              Quality you can trust, delivered to your doorstep.
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
          <FooterLinkGroup title="Company" links={FOOTER_NAV.company} />
          <FooterLinkGroup title="Policies" links={FOOTER_NAV.policies} />

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
          <p>&copy; {currentYear} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.PRIVACY}
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Privacy
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Terms
            </Link>
            <Link
              href={ROUTES.SHIPPING_POLICY}
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
