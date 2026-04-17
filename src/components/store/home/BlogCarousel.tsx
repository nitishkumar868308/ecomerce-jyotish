"use client";

import { cn, truncate, formatDate } from "@/lib/utils";
import { useBlogs } from "@/services/blog";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ROUTES } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, BookOpen } from "lucide-react";
import "swiper/css";
import "swiper/css/free-mode";

export function BlogCarousel() {
  const { data, isLoading } = useBlogs({ limit: 6 });

  const blogs = data?.data?.filter((b) => b.isPublished);

  if (!isLoading && !blogs?.length) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 sm:mb-8 flex items-end justify-between lg:mb-12">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] lg:text-3xl">
              From Our Blog
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-[var(--text-secondary)]">
              Stories, tips, and insights
            </p>
          </div>
          <Link
            href={ROUTES.BLOG}
            className={cn(
              "hidden items-center gap-1 text-sm font-medium sm:flex",
              "text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary-hover)]"
            )}
          >
            All Posts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex gap-4 overflow-hidden sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-[280px] flex-shrink-0 sm:w-[320px]"
              >
                <Skeleton
                  variant="rectangle"
                  className="aspect-[16/10] w-full rounded-xl"
                  height="100%"
                />
                <div className="mt-3 space-y-2">
                  <Skeleton variant="rectangle" height={14} width="60%" />
                  <Skeleton variant="text" lines={2} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blog carousel */}
        {!isLoading && blogs && blogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Swiper
              modules={[FreeMode]}
              freeMode={{ enabled: true, sticky: false }}
              slidesPerView="auto"
              spaceBetween={16}
              breakpoints={{
                640: { spaceBetween: 24 },
              }}
              className="!overflow-visible"
            >
              {blogs.map((blog) => (
                <SwiperSlide
                  key={blog.id}
                  className="!w-[280px] sm:!w-[320px] lg:!w-[340px]"
                >
                  <BlogCard blog={blog} />
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        )}

        {/* Mobile "View All" */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={ROUTES.BLOG}
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              "text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary-hover)]"
            )}
          >
            View All Posts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BlogCard({
  blog,
}: {
  blog: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    image?: string;
    authorName?: string;
    createdAt: string;
    category?: string;
    readTime?: number;
    views?: number;
  };
}) {
  const excerpt = blog.excerpt || "";
  const dateStr = blog.createdAt;

  return (
    <Link
      href={ROUTES.BLOG_POST(blog.slug)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl",
        "border border-[var(--border-primary)] bg-[var(--bg-card)]",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        {blog.image ? (
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 280px, 340px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-tertiary)]">
            <BookOpen className="h-10 w-10 text-[var(--text-tertiary)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Date */}
        <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(dateStr)}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]",
            "transition-colors group-hover:text-[var(--accent-primary)]"
          )}
        >
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {truncate(excerpt, 100)}
        </p>

        {/* Read more */}
        <span
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            "text-[var(--accent-primary)] transition-colors group-hover:text-[var(--accent-primary-hover)]"
          )}
        >
          Read More
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default BlogCarousel;
