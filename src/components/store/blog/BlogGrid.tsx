"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { BlogCard } from "./BlogCard";
import type { Blog } from "@/types/blog";

interface BlogGridProps {
  blogs?: Blog[];
  loading?: boolean;
  className?: string;
}

function BlogSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <Skeleton className="aspect-[16/10] w-full rounded-none" height="100%" />
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton height={12} width="40%" />
        <Skeleton height={18} width="90%" />
        <Skeleton variant="text" lines={2} />
        <div className="flex items-center justify-between pt-1">
          <Skeleton height={12} width="30%" />
          <Skeleton height={12} width="20%" />
        </div>
      </div>
    </div>
  );
}

export function BlogGrid({ blogs, loading, className }: BlogGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <BlogSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!blogs || blogs.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-secondary)]">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}

export default BlogGrid;
