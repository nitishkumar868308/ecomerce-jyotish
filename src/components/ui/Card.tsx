"use client";

import React from "react";
import { cn } from "@/lib/utils";

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
} as const;

type Padding = keyof typeof paddingStyles;

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: Padding;
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm",
        paddingStyles[padding],
        hover &&
          "transition-transform duration-200 hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Card;
