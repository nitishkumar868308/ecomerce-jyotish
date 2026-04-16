"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

function formatDimension(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({
  className,
  variant = "rectangle",
  width,
  height,
  lines = 3,
}: SkeletonProps) {
  const w = formatDimension(width);
  const h = formatDimension(height);

  if (variant === "circle") {
    const size = w ?? h ?? "48px";
    return (
      <div
        className={cn("shimmer rounded-full", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} style={{ width: w }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="shimmer rounded-md"
            style={{
              height: h ?? "14px",
              width: i === lines - 1 ? "70%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  // rectangle (default)
  return (
    <div
      className={cn("shimmer rounded-md", className)}
      style={{ width: w ?? "100%", height: h ?? "20px" }}
    />
  );
}

export default Skeleton;
