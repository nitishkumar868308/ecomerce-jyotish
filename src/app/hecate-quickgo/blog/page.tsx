"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  User,
  ArrowRight,
  BookOpen,
  Clock,
  Search,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useBlogs } from "@/services/blog";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { Blog } from "@/types/blog";

// QuickGo blog list — same structure as the wizard blog page, but lives
// inside the QuickGo route tree so the teal theme tokens apply and the
// links stay inside /hecate-quickgo/*.

const blogHref = (slug: string) => `/hecate-quickgo/blog/${slug}`;

export default function QuickGoBlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data: blogsData, isLoading } = useBlogs({ page, limit: 12, search });

  const allBlogs = useMemo(
    () =>
      ((blogsData?.data ?? []) as Blog[]).filter(
        (b) => b.isPublished !== false,
      ),
    [blogsData],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    allBlogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ["All", ...Array.from(set)];
  }, [allBlogs]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return allBlogs;
    return allBlogs.filter((b) => b.category === activeCategory);
  }, [allBlogs, activeCategory]);

  const featuredPost =
    page === 1 && activeCategory === "All" && filtered.length > 0
      ? filtered[0]
      : null;
  const remainingPosts = featuredPost ? filtered.slice(1) : filtered;

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary-light)] px-4 py-1.5 text-sm font-medium text-[var(--accent-primary)]">
            <BookOpen className="h-4 w-4" />
            QuickGo Blog
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            Insights & Stories
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            Tips, guides, and stories from the QuickGo world — delivered fast.
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search articles..."
                className="w-full rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[16/10] rounded-xl" />
                <Skeleton height={16} width="80%" />
                <Skeleton height={12} width="60%" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-[var(--text-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {search ? "No matching posts" : "No posts yet"}
            </h3>
            <p className="mt-1 text-[var(--text-secondary)]">
              {search
                ? "Try a different search term."
                : "Check back soon for new content."}
            </p>
          </div>
        )}

        {!isLoading && featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <FeaturedCard post={featuredPost} />
          </motion.div>
        )}

        {!isLoading && remainingPosts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remainingPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>
        )}

        {blogsData && blogsData.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={blogsData.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </>
  );
}

function FeaturedCard({ post }: { post: Blog }) {
  const rawCover = post.image || post.thumbnail || post.images?.[0];
  const cover = rawCover ? resolveAssetUrl(rawCover) || rawCover : undefined;
  const author = post.authorName || post.author;
  return (
    <Link
      href={blogHref(post.slug)}
      className="group grid gap-6 overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-shadow hover:shadow-md lg:grid-cols-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)] lg:aspect-auto">
        {cover ? (
          <Image
            src={cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-16 w-16 text-[var(--text-muted)]" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-6 lg:p-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-white">
            Featured
          </span>
          {post.category && (
            <span className="inline-flex w-fit items-center rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {post.category}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)] sm:text-3xl">
          {post.title}
        </h2>
        {(post.excerpt || post.shortDescription) && (
          <p className="mt-3 line-clamp-3 leading-relaxed text-[var(--text-secondary)]">
            {post.excerpt ?? post.shortDescription}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
          {author && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {author}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </span>
          {post.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readTime} min read
            </span>
          )}
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">
          Read More <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function BlogCard({ post }: { post: Blog }) {
  const rawCover = post.image || post.thumbnail || post.images?.[0];
  const cover = rawCover ? resolveAssetUrl(rawCover) || rawCover : undefined;
  const author = post.authorName || post.author;
  return (
    <Link
      href={blogHref(post.slug)}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        {cover ? (
          <Image
            src={cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-[var(--text-muted)]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {post.category && (
          <span className="mb-2 inline-flex w-fit items-center rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            {post.category}
          </span>
        )}

        <h3 className="line-clamp-2 text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]">
          {post.title}
        </h3>

        {(post.excerpt || post.shortDescription) && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
            {post.excerpt ?? post.shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-[var(--text-muted)]">
          <div className="flex min-w-0 items-center gap-2">
            {author && <span className="truncate">{author}</span>}
            {author && post.readTime && <span>·</span>}
            {post.readTime && (
              <span className="flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" /> {post.readTime} min
              </span>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 font-medium text-[var(--accent-primary)]">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
