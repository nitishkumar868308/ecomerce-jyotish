"use client";

import { cn } from "@/lib/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner } from "@/components/ui/loader/Spinner";
import type { ReactNode } from "react";

interface InfiniteScrollWrapperProps {
  dataLength: number;
  next: () => void;
  hasMore: boolean;
  children: ReactNode;
  loader?: ReactNode;
  className?: string;
  scrollableTarget?: string;
}

export function InfiniteScrollWrapper({
  dataLength,
  next,
  hasMore,
  children,
  loader,
  className,
  scrollableTarget,
}: InfiniteScrollWrapperProps) {
  const defaultLoader = (
    <div className="flex items-center justify-center py-6">
      <Spinner size="md" />
    </div>
  );

  return (
    <InfiniteScroll
      dataLength={dataLength}
      next={next}
      hasMore={hasMore}
      loader={loader ?? defaultLoader}
      scrollableTarget={scrollableTarget}
      className={cn(className)}
    >
      {children}
    </InfiniteScroll>
  );
}

export default InfiniteScrollWrapper;
