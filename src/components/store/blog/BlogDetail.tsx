"use client";

import React from "react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { Calendar, ArrowLeft, Clock, Tag as TagIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Blog } from "@/types/blog";

interface BlogDetailProps {
  blog?: Blog;
  /** Preferred name used by pages — kept as an alias for backwards compat. */
  post?: Blog;
  className?: string;
}

// Magazine-style layout that works for both Wizard (indigo) and QuickGo
// (teal). Theme tokens drive the colours so the same component fits either
// storefront — only the hosting layout's CSS class decides which palette.

export function BlogDetail({ blog, post, className }: BlogDetailProps) {
  const router = useRouter();
  const data = blog || post;

  if (!data) return null;

  // Uploaded images live on the backend as relative paths; run them through
  // resolveAssetUrl so next/image sees an absolute, same-origin URL.
  const rawCover = data.image || data.thumbnail || data.images?.[0];
  const cover = rawCover ? resolveAssetUrl(rawCover) || rawCover : undefined;
  const author = data.authorName || data.author;
  const authorImage = data.authorImage
    ? resolveAssetUrl(data.authorImage) || data.authorImage
    : undefined;
  const body = data.content || data.description || "";
  const sanitized =
    typeof window !== "undefined" ? DOMPurify.sanitize(body) : body;

  return (
    <article className={cn("w-full", className)}>
      {/* Hero */}
      <header className="relative overflow-hidden">
        {cover ? (
          <div className="relative h-[300px] w-full sm:h-[380px] lg:h-[460px]">
            <Image
              src={cover}
              alt={data.title}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/0" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-12">
              <div className="mx-auto max-w-3xl">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                {data.category && (
                  <span className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    {data.category}
                  </span>
                )}
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                  {data.title}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {data.category && (
              <span className="mb-3 inline-flex rounded-full bg-[var(--accent-primary-light)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                {data.category}
              </span>
            )}
            <h1 className="text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
              {data.title}
            </h1>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:pt-14">
        {/* Meta strip */}
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[var(--border-primary)] pb-6 text-sm text-[var(--text-secondary)]">
          {author && (
            <div className="flex items-center gap-2.5">
              {authorImage ? (
                <Image
                  src={authorImage}
                  alt={author}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/20"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-sm font-semibold text-white">
                  {author.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Written by
                </p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {author}
                </p>
              </div>
            </div>
          )}

          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Calendar className="h-4 w-4" />
            {formatDate(data.publishedAt || data.createdAt)}
          </span>
          {data.readTime && (
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Clock className="h-4 w-4" />
              {data.readTime} min read
            </span>
          )}
        </div>

        {/* Excerpt as a big lead-in */}
        {(data.excerpt || data.shortDescription) && (
          <p className="mb-8 border-l-4 border-[var(--accent-primary)] pl-4 text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
            {data.excerpt ?? data.shortDescription}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-base max-w-none text-[var(--text-primary)] sm:prose-lg
            prose-headings:text-[var(--text-primary)] prose-headings:font-bold
            prose-headings:tracking-tight
            prose-p:text-[var(--text-secondary)] prose-p:leading-[1.75]
            prose-a:text-[var(--accent-primary)] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--text-primary)]
            prose-img:rounded-2xl prose-img:shadow-md
            prose-blockquote:border-l-[var(--accent-primary)] prose-blockquote:not-italic
            prose-blockquote:text-[var(--text-secondary)]
            prose-code:rounded prose-code:bg-[var(--bg-secondary)] prose-code:px-1.5 prose-code:py-0.5
            prose-code:text-[var(--accent-primary)] prose-code:font-mono
            prose-code:before:content-[''] prose-code:after:content-['']
            prose-hr:border-[var(--border-primary)]"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-[var(--border-primary)] pt-6">
            <TagIcon className="h-4 w-4 text-[var(--text-muted)]" />
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author footer card */}
        {author && (
          <div className="mt-10 flex items-start gap-5 rounded-2xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--accent-primary-light)] to-[var(--bg-card)] p-6">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={author}
                width={72}
                height={72}
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white shadow-md sm:h-[72px] sm:w-[72px]"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-2xl font-semibold text-white ring-4 ring-white shadow-md sm:h-[72px] sm:w-[72px]">
                {author.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                About the author
              </p>
              <p className="mt-0.5 text-lg font-bold text-[var(--text-primary)]">
                {author}
              </p>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Thanks for reading. Share this story with someone who needs it
                today.
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default BlogDetail;
