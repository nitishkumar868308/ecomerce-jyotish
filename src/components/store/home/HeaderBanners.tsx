"use client";

import { useHeaders } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { cn } from "@/lib/utils";

export default function HeaderBanners() {
  const { data: headers, isLoading } = useHeaders();

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[50px] sm:h-[60px] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const activeHeaders = headers?.filter((h) => h.active && !h.deleted);

  if (!activeHeaders?.length) return null;

  return (
    <section className="py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {activeHeaders.slice(0, 3).map((header) => (
            <div
              key={header.id}
              className={cn(
                "rounded-xl px-4 py-3 sm:px-5 sm:py-4",
                "border border-[var(--border-primary)] bg-[var(--bg-card)]",
                "text-center text-xs sm:text-sm font-medium text-[var(--text-primary)]"
              )}
            >
              {header.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
