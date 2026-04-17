"use client";

import Link from "next/link";
import { Sparkles, Star, Moon, ArrowRight, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

const OFFERINGS = [
  { icon: Star, label: "Astrology" },
  { icon: Moon, label: "Tarot Reading" },
  { icon: Sparkles, label: "Numerology" },
];

export default function JyotishBranding() {
  return (
    <section className="py-6 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.JYOTISH.HOME} className="block">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-8 lg:p-14 cursor-pointer hover:shadow-2xl transition-shadow"
        >
          {/* Animated decorative elements */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-purple-400/15"
          />

          {/* Twinkling stars */}
          {[
            { top: "8%", right: "25%", size: "h-2 w-2", delay: 0 },
            { top: "15%", left: "33%", size: "h-1.5 w-1.5", delay: 0.5 },
            { bottom: "12%", right: "33%", size: "h-1 w-1", delay: 1 },
            { top: "30%", right: "15%", size: "h-1.5 w-1.5", delay: 1.5 },
            { bottom: "25%", left: "20%", size: "h-1 w-1", delay: 2 },
          ].map((star, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
              className={cn(
                "pointer-events-none absolute rounded-full bg-yellow-300/60",
                star.size
              )}
              style={{ top: star.top, right: star.right, left: star.left, bottom: star.bottom }}
            />
          ))}

          <div className="relative flex flex-col items-center gap-6 sm:gap-8 lg:flex-row lg:justify-between">
            {/* Left: content */}
            <div className="max-w-xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-medium text-yellow-200 backdrop-blur-sm"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                Hecate Jyotish
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold leading-tight text-white lg:text-4xl"
              >
                Unlock the Mysteries of Your Stars
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-2 sm:mt-3 text-sm sm:text-base text-white/85 lg:text-lg"
              >
                Connect with expert astrologers, tarot readers, and numerologists
                for personalised guidance. Discover what the cosmos has in store
                for you.
              </motion.p>

              {/* Offerings */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:justify-start"
              >
                {OFFERINGS.map(({ icon: Icon, label }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.08, y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-sm cursor-pointer"
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-200" />
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
                    "mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-sm font-semibold text-purple-700 shadow-lg transition-all",
                    "group-hover:bg-white/90 group-hover:shadow-xl group-hover:-translate-y-0.5"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Consult Now
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </span>
              </motion.div>
            </div>

            {/* Right: animated mystical illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden lg:flex flex-col items-center gap-4"
            >
              <div className="relative flex h-40 w-40 items-center justify-center">
                {/* Orbiting ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-yellow-300/20"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-purple-300/20"
                />

                {/* Center moon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <Moon className="h-12 w-12 text-yellow-200" strokeWidth={1.5} />
                  {/* Glow */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-yellow-300/10"
                  />
                </motion.div>

                {/* Orbiting stars */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute"
                  style={{ top: "-4px", right: "20%" }}
                >
                  <Sparkles className="h-5 w-5 text-yellow-300/80" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute"
                  style={{ bottom: "0", left: "10%" }}
                >
                  <Star className="h-4 w-4 text-yellow-200/60 fill-yellow-200/30" />
                </motion.div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute"
                  style={{ top: "30%", right: "-8px" }}
                >
                  <Sun className="h-4 w-4 text-orange-300/50" />
                </motion.div>
              </div>
              <span className="text-xs sm:text-sm font-medium tracking-wide text-white/70 uppercase">
                Celestial Guidance
              </span>
            </motion.div>
          </div>
        </motion.div>
        </Link>
      </div>
    </section>
  );
}
