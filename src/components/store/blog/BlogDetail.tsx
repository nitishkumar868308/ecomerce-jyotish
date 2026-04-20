"use client";

import React from "react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { Calendar, User, ArrowLeft, Clock, Tag as TagIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { Blog } from "@/types/blog";

interface BlogDetailProps {
  blog?: Blog;
  /** Preferred name used by pages — kept as an alias for backwards compat. */
  post?: Blog;
  className?: string;
}

export function BlogDetail({ blog, post, className }: BlogDetailProps) {
  const router = useRouter();
  const data = blog || post;

  if (!data) return null;

  const cover = data.image || data.thumbnail || data.images?.[0];
  const author = data.authorName || data.author;
  const body = data.content || data.description || "";

  const sanitized = typeof window !== "undefined" ? DOMPurify.sanitize(body) : body;

  return (
    <article className={cn("mx-auto max-w-3xl", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        className="mb-6"
      >
        Back to all posts
      </Button>

      {data.category && (
        <span className="mb-3 inline-flex rounded-full bg-[var(--accent-primary-light)] px-3 py-1 text-xs font-medium text-[var(--accent-primary)]">
          {data.category}
        </span>
      )}

      <h1 className="mb-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
        {data.title}
      </h1>

      {/* Meta bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
        {author && (
          <div className="flex items-center gap-2">
            {data.authorImage ? (
              <Image
                src={data.authorImage}
                alt={author}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[11px] font-semibold text-white">
                {author.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="font-medium text-[var(--text-primary)]">{author}</span>
          </div>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {formatDate(data.publishedAt || data.createdAt)}
        </span>
        {data.readTime && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {data.readTime} min read
          </span>
        )}
      </div>

      {cover && (
        <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <Image
            src={cover}
            alt={data.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Short description intro */}
      {(data.excerpt || data.shortDescription) && (
        <p className="mb-6 text-lg leading-relaxed text-[var(--text-secondary)]">
          {data.excerpt ?? data.shortDescription}
        </p>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              <TagIcon className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-sm max-w-none text-[var(--text-primary)] sm:prose-base
          prose-headings:text-[var(--text-primary)] prose-headings:font-bold
          prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
          prose-a:text-[var(--accent-primary)] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[var(--text-primary)]
          prose-img:rounded-xl
          prose-blockquote:border-l-[var(--accent-primary)] prose-blockquote:text-[var(--text-secondary)]"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />

      {/* Author footer */}
      {author && (
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          {data.authorImage ? (
            <Image
              src={data.authorImage}
              alt={author}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-lg font-semibold text-white">
              {author.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Written by
            </p>
            <p className="mt-0.5 text-base font-semibold text-[var(--text-primary)]">{author}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default BlogDetail;
