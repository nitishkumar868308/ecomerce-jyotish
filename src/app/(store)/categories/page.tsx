"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
import CategoryList from "@/components/store/categories/CategoryList";

export default function CategoriesPage() {
  return (
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="All Categories"
          description="Browse our complete collection of categories"
        />
        <CategoryList />
      </div>
    </DefaultPage>
  );
}
