"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Position = "top" | "bottom" | "left" | "right";

const positionStyles: Record<Position, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: Position;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-[var(--text-primary)] px-2.5 py-1.5 text-xs text-[var(--bg-card)] opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100",
          positionStyles[position],
        )}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
