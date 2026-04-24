"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpOptions {
  start?: number;
  duration?: number;
  decimals?: number;
  enabled?: boolean;
}

// Animates a number from `start` to `end` over `duration` ms.
// Uses rAF so it stays smooth and pauses when the tab is hidden.
export function useCountUp(end: number, options: CountUpOptions = {}) {
  const { start = 0, duration = 1400, decimals = 0, enabled = true } = options;
  const [value, setValue] = useState(enabled ? start : end);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    const startedAt = performance.now();
    const from = start;
    const delta = end - from;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      // easeOutQuart for that classic "settles into place" feel.
      const eased = 1 - Math.pow(1 - t, 4);
      const next = from + delta * eased;
      setValue(next);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [end, start, duration, enabled]);

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
