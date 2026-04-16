"use client";

import { cn } from "@/lib/utils";

interface DotsProps {
  size?: "sm" | "md";
  className?: string;
}

const dotSizeMap: Record<string, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2.5 w-2.5",
};

const delays = ["0s", "0.15s", "0.3s"];

export function Dots({ size = "md", className }: DotsProps) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)} role="status" aria-label="Loading">
      {delays.map((delay, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-[var(--accent-primary)] animate-bounce",
            dotSizeMap[size],
          )}
          style={{ animationDelay: delay }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Dots;
