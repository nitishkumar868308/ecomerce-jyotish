"use client";

import React from "react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { Blog } from "@/types/blog";

interface BlogDetailProps {
  blog: Blog;
  className?: string;
}

export function BlogDetail({ blog, className }: BlogDetailProps) {
  const router = useRouter();
  const thumbnail = blog.thumbnail || blog.images?.[0];

  const sanitizedContent =
    typeof window !== "undefined"
      ? DOMPurify.sanitize(blog.content)
      : blog.content;

  return (
    <article className={cn("mx-auto max-w-3xl", className)}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        className="mb-6"
      >
        Back
      </Button>

      {/* Header image */}
      {thumbnail && (
        <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <Image
            src={thumbnail}
            alt={blog.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Meta */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
        {blog.author && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{blog.author}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
        </div>
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--accent-primary-light)] px-3 py-1 text-xs font-medium text-[var(--accent-primary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mb-6 text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
        {blog.title}
      </h1>

      {/* Content */}
      <div
        className="prose prose-sm max-w-none text-[var(--text-primary)] sm:prose-base
          prose-headings:text-[var(--text-primary)] prose-headings:font-bold
          prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
          prose-a:text-[var(--accent-primary)] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[var(--text-primary)]
          prose-img:rounded-xl
          prose-blockquote:border-l-[var(--accent-primary)] prose-blockquote:text-[var(--text-secondary)]"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </article>
  );
}

export default BlogDetail;
