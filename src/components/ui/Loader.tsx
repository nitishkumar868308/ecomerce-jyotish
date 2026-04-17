"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type LoaderVariant = "fullpage" | "section" | "inline";

interface LoaderProps {
  variant?: LoaderVariant;
  message?: string;
  className?: string;
}

/* ------------------------------------------------
   Mystical Orb — the core visual
   Three concentric rings orbit around a glowing
   center orb, with floating sparkle particles.
   ------------------------------------------------ */

function MysticalOrb({ scale = 1 }: { scale?: number }) {
  const size = 80 * scale;
  const orbSize = 24 * scale;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ring — slow reverse rotation */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${1.5 * scale}px solid transparent`,
          borderTopColor: "var(--accent-primary)",
          borderRightColor: "var(--accent-primary)",
          opacity: 0.5,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Middle ring — medium speed */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 8 * scale,
          border: `${1.5 * scale}px solid transparent`,
          borderTopColor: "var(--accent-secondary)",
          borderLeftColor: "var(--accent-secondary)",
          opacity: 0.7,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner ring — fast rotation */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 16 * scale,
          border: `${1.5 * scale}px solid transparent`,
          borderBottomColor: "var(--accent-primary)",
          borderRightColor: "var(--accent-secondary)",
          opacity: 0.9,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Center glowing orb */}
      <motion.div
        className="relative rounded-full loader-orb-glow"
        style={{
          width: orbSize,
          height: orbSize,
          background:
            "radial-gradient(circle, var(--accent-secondary) 0%, var(--accent-primary) 70%, transparent 100%)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparkle particles */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <motion.div
          key={angle}
          className="absolute rounded-full"
          style={{
            width: 3 * scale,
            height: 3 * scale,
            background: "var(--accent-secondary)",
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

/* ------------------------------------------------
   Inline variant — compact orb for buttons, etc.
   ------------------------------------------------ */

function InlineLoader({ className }: { className?: string }) {
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
            background:
              i === 1 ? "var(--accent-secondary)" : "var(--accent-primary)",
          }}
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
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

/* ------------------------------------------------
   Main Loader component
   ------------------------------------------------ */

export function Loader({ variant = "section", message, className }: LoaderProps) {
  if (variant === "inline") {
    return <InlineLoader className={className} />;
  }

  const isFullpage = variant === "fullpage";

  const wrapperClasses = cn(
    "flex flex-col items-center justify-center",
    isFullpage
      ? "fixed inset-0 z-[9999] bg-[var(--bg-overlay)] backdrop-blur-sm"
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
        aria-label={message || "Loading"}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <MysticalOrb scale={isFullpage ? 1.2 : 1} />
        </motion.div>

        {message && (
          <motion.p
            className="mt-5 text-sm font-medium text-[var(--text-muted)] tracking-wide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {message}
          </motion.p>
        )}

        <span className="sr-only">Loading...</span>
      </motion.div>
    </AnimatePresence>
  );
}

export default Loader;
