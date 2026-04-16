"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
import FilterSidebar from "@/components/store/categories/FilterSidebar";
import ProductGrid from "@/components/store/product/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { useProducts } from "@/services/products";
import { useCategory } from "@/services/categories";

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: category, isLoading: categoryLoading } = useCategory(params.category);
  const { data: products, isLoading: productsLoading } = useProducts({
    categoryId: params.category,
    page,
    ...filters,
  });

  const isLoading = categoryLoading || productsLoading;

  return (
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={category?.name ?? "Category"}
          description={category?.description}
        />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <FilterSidebar
              categoryId={params.category}
              filters={filters}
              onChange={setFilters}
            />
          </aside>

          {/* Products */}
          <div className="flex-1">
            <ProductGrid products={products?.data ?? []} loading={isLoading} />

            {products && products.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={products.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultPage>
  );
}
