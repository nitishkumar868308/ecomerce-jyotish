"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CelestialBackgroundProps {
  className?: string;
  starCount?: number;
  children?: React.ReactNode;
}

export function CelestialBackground({
  className,
  starCount = 80,
  children,
}: CelestialBackgroundProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 0.5,
        delay: `${Math.random() * 4}s`,
        duration: `${2 + Math.random() * 3}s`,
      })),
    [starCount],
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Stars layer */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: 0.3,
              animation: `jy-twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Nebula gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-1/4 -top-1/4 h-[60%] w-[60%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50%] w-[50%] rounded-full bg-indigo-900/15 blur-[100px]" />
        <div className="absolute left-1/3 top-1/3 h-[30%] w-[30%] rounded-full bg-amber-900/10 blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default CelestialBackground;
