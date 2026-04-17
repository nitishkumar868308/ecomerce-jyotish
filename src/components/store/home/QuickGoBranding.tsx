"use client";

import Image from "next/image";
import Link from "next/link";
import { Zap, Clock, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

const PERKS = [
  { icon: Zap, label: "Express Delivery" },
  { icon: Clock, label: "Same-Day Dispatch" },
  { icon: Package, label: "Safe Packaging" },
];

export default function QuickGoBranding() {
  return (
    <section className="py-6 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.QUICKGO.HOME} className="block">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-6 sm:p-8 lg:p-14 cursor-pointer hover:shadow-2xl transition-shadow"
        >
          {/* Animated decorative circles */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-white/5"
          />
          <motion.div
            animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="pointer-events-none absolute right-1/3 bottom-4 h-20 w-20 rounded-full bg-cyan-300/15"
          />

          <div className="relative flex flex-col items-center gap-6 sm:gap-8 lg:flex-row lg:justify-between">
            {/* Left: content */}
            <div className="max-w-xl text-center lg:text-left">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-4 inline-block"
              >
                <Image
                  src="/image/hecate quickgo logo transpreant new.png"
                  alt="Hecate QuickGo"
                  width={200}
                  height={56}
                  className="h-10 w-auto sm:h-12 lg:h-14 brightness-0 invert"
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold leading-tight text-white lg:text-4xl"
              >
                Lightning Fast Delivery
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-2 sm:mt-3 text-sm sm:text-base text-white/85 lg:text-lg"
              >
                Get your favourite products delivered at blazing speed. Same-day
                dispatch, real-time tracking, and doorstep convenience — only
                with Hecate QuickGo.
              </motion.p>

              {/* Perks */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:justify-start"
              >
                {PERKS.map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-sm"
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {label}
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <span
                  className={cn(
                    "mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-sm font-semibold text-teal-700 shadow-lg transition-all",
                    "group-hover:bg-white/90 group-hover:shadow-xl group-hover:-translate-y-0.5"
                  )}
                >
                  Explore QuickGo
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </span>
              </motion.div>
            </div>

            {/* Right: animated speed illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden lg:flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Zap className="h-16 w-16 text-cyan-200" strokeWidth={1.5} />
                </motion.div>
                {/* Glow ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-cyan-300/30"
                />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium tracking-wide text-white/70 uppercase">
                Speed Guaranteed
              </span>
            </motion.div>
          </div>
        </motion.div>
        </Link>
      </div>
    </section>
  );
}
