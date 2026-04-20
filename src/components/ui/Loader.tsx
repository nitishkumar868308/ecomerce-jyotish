"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

type LoaderVariant = "fullpage" | "section" | "inline";
export type LoaderSurface =
  | "wizard"
  | "quickgo"
  | "jyotish"
  | "astrologer"
  | "dashboard"
  | "admin";

interface LoaderProps {
  variant?: LoaderVariant;
  message?: string;
  className?: string;
  /**
   * Theme surface. Drives orb colours / label so each area of the app has
   * its own feel. Auto-detected from pathname when omitted.
   */
  surface?: LoaderSurface;
}

/**
 * Surface palette map. Each surface gets its own pair of ring colours plus a
 * label that doubles as the sr-only announcement. All colours are raw CSS so
 * we don't depend on a surface's CSS variables being loaded when the loader
 * briefly renders above a different theme.
 */
const PALETTE: Record<
  LoaderSurface,
  { outer: string; inner: string; glow: string; label: string }
> = {
  wizard: {
    outer: "#7C3AED", // purple 600
    inner: "#F59E0B", // amber 500
    glow: "rgba(124, 58, 237, 0.35)",
    label: "Hecate Wizard Mall",
  },
  quickgo: {
    outer: "#0D9488", // teal 600
    inner: "#10B981", // emerald 500
    glow: "rgba(20, 184, 166, 0.35)",
    label: "Hecate QuickGo",
  },
  jyotish: {
    outer: "#F5D37F", // jy-accent-gold-ish
    inner: "#C084FC", // purple 400
    glow: "rgba(245, 211, 127, 0.35)",
    label: "Jyotish",
  },
  astrologer: {
    outer: "#F5D37F",
    inner: "#A855F7", // purple 500 — slightly richer than jyotish to feel "pro"
    glow: "rgba(168, 85, 247, 0.35)",
    label: "Astrologer Dashboard",
  },
  dashboard: {
    outer: "#6366F1", // indigo 500
    inner: "#8B5CF6",
    glow: "rgba(99, 102, 241, 0.35)",
    label: "Dashboard",
  },
  admin: {
    outer: "#0F172A", // slate 900 — authoritative
    inner: "#38BDF8", // sky 400
    glow: "rgba(56, 189, 248, 0.35)",
    label: "Admin",
  },
};

/**
 * Pick a sensible default surface from the current URL so pages that don't
 * pass an explicit `surface` still feel themed. Falls back to wizard.
 */
function detectSurface(pathname: string | null | undefined): LoaderSurface {
  const p = (pathname ?? "").toLowerCase();
  if (p.startsWith("/admin")) return "admin";
  if (p.startsWith("/hecate-quickgo")) return "quickgo";
  if (p.startsWith("/jyotish/astrologer-dashboard")) return "astrologer";
  if (p.startsWith("/jyotish")) return "jyotish";
  if (p.startsWith("/dashboard")) return "dashboard";
  return "wizard";
}

/* ------------------------------------------------
   Mystical Orb — coloured per surface
   ------------------------------------------------ */

function MysticalOrb({
  scale = 1,
  surface = "wizard",
}: {
  scale?: number;
  surface?: LoaderSurface;
}) {
  const size = 80 * scale;
  const orbSize = 24 * scale;
  const tone = PALETTE[surface];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${1.5 * scale}px solid transparent`,
          borderTopColor: tone.outer,
          borderRightColor: tone.outer,
          opacity: 0.5,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 8 * scale,
          border: `${1.5 * scale}px solid transparent`,
          borderTopColor: tone.inner,
          borderLeftColor: tone.inner,
          opacity: 0.7,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 16 * scale,
          border: `${1.5 * scale}px solid transparent`,
          borderBottomColor: tone.outer,
          borderRightColor: tone.inner,
          opacity: 0.9,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="relative rounded-full"
        style={{
          width: orbSize,
          height: orbSize,
          background: `radial-gradient(circle, ${tone.inner} 0%, ${tone.outer} 70%, transparent 100%)`,
          boxShadow: `0 0 ${24 * scale}px ${tone.glow}`,
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <motion.div
          key={angle}
          className="absolute rounded-full"
          style={{
            width: 3 * scale,
            height: 3 * scale,
            background: tone.inner,
          }}
          animate={{
            x: [
              Math.cos((angle * Math.PI) / 180) * 28 * scale,
              Math.cos(((angle + 30) * Math.PI) / 180) * 36 * scale,
              Math.cos((angle * Math.PI) / 180) * 28 * scale,
            ],
            y: [
              Math.sin((angle * Math.PI) / 180) * 28 * scale,
              Math.sin(((angle + 30) * Math.PI) / 180) * 36 * scale,
              Math.sin((angle * Math.PI) / 180) * 28 * scale,
            ],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: angle / 360,
          }}
        />
      ))}
    </div>
  );
}

function InlineLoader({
  className,
  surface = "wizard",
}: {
  className?: string;
  surface?: LoaderSurface;
}) {
  const tone = PALETTE[surface];
  return (
    <motion.div
      className={cn("inline-flex items-center gap-1.5", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: i === 1 ? tone.inner : tone.outer,
          }}
          animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </motion.div>
  );
}

export function Loader({
  variant = "section",
  message,
  className,
  surface,
}: LoaderProps) {
  const pathname = usePathname();
  const resolvedSurface = surface ?? detectSurface(pathname);
  const tone = PALETTE[resolvedSurface];

  if (variant === "inline") {
    return <InlineLoader className={className} surface={resolvedSurface} />;
  }

  const isFullpage = variant === "fullpage";

  const wrapperClasses = cn(
    "flex flex-col items-center justify-center",
    isFullpage
      ? "fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
      : "w-full min-h-[200px] h-full",
    className,
  );

  return (
    <AnimatePresence>
      <motion.div
        className={wrapperClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        role="status"
        aria-label={message || tone.label}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <MysticalOrb
            scale={isFullpage ? 1.2 : 1}
            surface={resolvedSurface}
          />
        </motion.div>

        <motion.p
          className="mt-5 text-sm font-medium tracking-wide"
          style={{ color: tone.outer }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {message || tone.label}
        </motion.p>

        <span className="sr-only">Loading {tone.label}...</span>
      </motion.div>
    </AnimatePresence>
  );
}

export default Loader;
