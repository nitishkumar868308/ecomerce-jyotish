"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
// import BlogGrid from "@/components/store/blog/BlogGrid";
import { Pagination } from "@/components/ui/Pagination";
import { useBlogs } from "@/services/blog";

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const { data: blogs, isLoading } = useBlogs({ page, limit: 12 });

  return (
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Blog"
          description="Insights, guides, and stories from our team"
        />

        {/* <BlogGrid posts={blogs?.data ?? []} loading={isLoading} /> */}

        {blogs && blogs.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={blogs.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </DefaultPage>
  );
}
