"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ROUTES } from "@/config/routes";
import type { Blog } from "@/types/blog";

interface BlogCardProps {
  blog: Blog;
  className?: string;
}

export function BlogCard({ blog, className }: BlogCardProps) {
  const thumbnail = blog.thumbnail || blog.images?.[0];

  return (
    <Link href={ROUTES.BLOG_POST(blog.slug)} className={cn("group block", className)}>
      <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={blog.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl font-bold text-[var(--text-secondary)]/20">
                {blog.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--accent-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="line-clamp-2 text-base font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)] sm:text-lg">
            {blog.title}
          </h3>

          {blog.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {blog.excerpt}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
            </div>
            <span className="text-sm font-medium text-[var(--accent-primary)]">
              Read More
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
