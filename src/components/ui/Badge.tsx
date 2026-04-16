"use client";

import React from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default:
    "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]",
  success:
    "bg-[var(--accent-success-light)] text-[var(--accent-success)]",
  warning:
    "bg-[var(--accent-warning-light)] text-[var(--accent-warning)]",
  danger:
    "bg-[var(--accent-danger-light)] text-[var(--accent-danger)]",
  info:
    "bg-[var(--accent-info-light)] text-[var(--accent-info)]",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
} as const;

type Variant = keyof typeof variantStyles;
type Size = keyof typeof sizeStyles;

export interface BadgeProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
