"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useBlogs } from "@/services/blog";
import { ROUTES } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import type { Blog } from "@/types/blog";

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const { data: blogsData, isLoading } = useBlogs({ page, limit: 12 });

  const blogs = blogsData?.data ?? [];
  const featuredPost = page === 1 && blogs.length > 0 ? blogs[0] : null;
  const remainingPosts = page === 1 && featuredPost ? blogs.slice(1) : blogs;

  return (
    <DefaultPage>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] py-12 sm:py-16 border-b border-[var(--border-primary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary-light)] px-4 py-1.5 text-sm font-medium text-[var(--accent-primary)]">
            <BookOpen className="h-4 w-4" />
            Our Blog
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            Insights & Stories
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            Discover guides, tips, and stories from our world of mystical wisdom
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[16/10] rounded-xl" />
                <Skeleton height={16} width="80%" />
                <Skeleton height={12} width="60%" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && blogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">No posts yet</h3>
            <p className="mt-1 text-[var(--text-secondary)]">Check back soon for new content</p>
          </div>
        )}

        {/* Featured Post (first page only) */}
        {!isLoading && featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Link
              href={ROUTES.BLOG_POST(featuredPost.slug)}
              className="group grid gap-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow lg:grid-cols-2"
            >
              <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-[var(--bg-secondary)]">
                {featuredPost.image ? (
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
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
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-white">
                  Featured
                </span>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors sm:text-3xl">
                  {featuredPost.title}
                </h2>
                {featuredPost.excerpt && (
                  <p className="mt-3 text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  {featuredPost.authorName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {featuredPost.authorName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(featuredPost.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {featuredPost.readTime && (
                    <span>{featuredPost.readTime} min read</span>
                  )}
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)]">
                  Read More <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Blog Grid */}
        {!isLoading && remainingPosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingPosts.map((post: Blog, idx: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {blogsData && blogsData.totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={blogsData.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </DefaultPage>
  );
}

function BlogCard({ post }: { post: Blog }) {
  return (
    <Link
      href={ROUTES.BLOG_POST(post.slug)}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        {post.image ? (
          <Image
            src={post.image}
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
        {/* Category badge */}
        {post.category && (
          <div className="mb-2">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
              {post.category}
            </span>
          </div>
        )}

        <h3 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1 text-[var(--accent-primary)] font-medium">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
