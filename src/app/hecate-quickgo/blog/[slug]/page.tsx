"use client";

import { useParams } from "next/navigation";
import BlogDetail from "@/components/store/blog/BlogDetail";
import { useBlog } from "@/services/blog";

// QuickGo blog detail — reuses the shared BlogDetail component (which
// already resolves asset URLs and picks up teal tokens via the QuickGo
// layout). Layout chrome comes from /hecate-quickgo/layout.

function BlogSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6 px-4 py-8">
      <div className="h-10 w-3/4 rounded bg-[var(--bg-secondary)]" />
      <div className="h-4 w-1/3 rounded bg-[var(--bg-secondary)]" />
      <div className="aspect-video rounded-xl bg-[var(--bg-secondary)]" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-[var(--bg-secondary)]" />
        <div className="h-4 w-full rounded bg-[var(--bg-secondary)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--bg-secondary)]" />
      </div>
    </div>
  );
}

export default function QuickGoBlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlog(params.slug);

  if (isLoading) return <BlogSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          Post not found
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          The blog post you are looking for does not exist.
        </p>
      </div>
    );
  }

  if (!post) return null;

  return <BlogDetail post={post} />;
}
