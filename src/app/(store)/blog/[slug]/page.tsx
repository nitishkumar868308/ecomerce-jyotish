"use client";

import { useParams } from "next/navigation";
import DefaultPage from "@/components/layout/DefaultPage";
import BlogDetail from "@/components/store/blog/BlogDetail";
import { useBlog } from "@/services/blog";

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

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlog(params.slug);

  return (
    <DefaultPage>
      {isLoading ? (
        <BlogSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            Post not found
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            The blog post you are looking for does not exist.
          </p>
        </div>
      ) : post ? (
        <BlogDetail post={post} />
      ) : null}
    </DefaultPage>
  );
}
