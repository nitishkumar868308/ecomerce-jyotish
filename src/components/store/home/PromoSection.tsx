"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export function PromoSection() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-gradient-to-br from-[var(--accent-primary)] via-[var(--accent-primary-hover)] to-[var(--accent-primary)]",
            "px-5 py-8 sm:px-10 sm:py-14 lg:px-16 lg:py-20"
          )}
        >
          {/* Decorative background elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
            {/* Content */}
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Limited Time Offer
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-5xl">
                Special Offers
              </h2>

              <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base lg:text-lg">
                Discover exclusive deals on our finest collections. Premium quality
                at unbeatable prices -- shop now before the offers end.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href={ROUTES.CATEGORIES}>
                  <Button
                    variant="secondary"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    className="bg-white text-[var(--accent-primary)] hover:bg-white/90"
                  >
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats / highlights */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {[
                { value: "50%", label: "Up to off" },
                { value: "Free", label: "Shipping" },
                { value: "100+", label: "Products" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col items-center rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm",
                    "transition-colors duration-300 hover:bg-white/15"
                  )}
                >
                  <span className="text-2xl font-bold text-white sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-xs text-white/70 sm:text-sm">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PromoSection;
