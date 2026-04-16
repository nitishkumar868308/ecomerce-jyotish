"use client";

import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)]",
        className,
      )}
      role="status"
      aria-label="Page loading"
    >
      <Spinner size="lg" />
    </div>
  );
}

export default PageLoader;
