"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConsultantServices } from "@/services/consultant";
import { usePriceConverter } from "@/hooks/usePriceConverter";
import { Sparkles } from "lucide-react";
import type { ConsultantService } from "@/types/consultant";

interface ServiceListProps {
  onSelect?: (service: ConsultantService) => void;
  className?: string;
}

function ServiceSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <Skeleton className="aspect-[16/10] w-full rounded-none" height="100%" />
      <div className="space-y-2 p-4">
        <Skeleton height={16} width="70%" />
        <Skeleton variant="text" lines={2} />
        <Skeleton height={14} width="30%" />
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onSelect,
}: {
  service: ConsultantService;
  onSelect?: (service: ConsultantService) => void;
}) {
  const { format } = usePriceConverter();

  return (
    <button
      type="button"
      onClick={() => onSelect?.(service)}
      className="group w-full overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sparkles className="h-10 w-10 text-[var(--text-secondary)]/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]">
          {service.name}
        </h3>
        {service.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {service.description}
          </p>
        )}
        <p className="mt-3 text-base font-bold text-[var(--accent-primary)]">
          {format(service.price)}
        </p>
      </div>
    </button>
  );
}

export function ServiceList({ onSelect, className }: ServiceListProps) {
  const { data: services, isLoading } = useConsultantServices();

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceSkeleton key={i} />
        ))}
      </div>
    );
  }

  const activeServices = (services as ConsultantService[] | undefined)?.filter(
    (s) => s.isActive
  ) ?? [];

  if (activeServices.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No services available"
        description="Check back later for consultation services."
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {activeServices.map((service) => (
        <ServiceCard key={service.id} service={service} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default ServiceList;
