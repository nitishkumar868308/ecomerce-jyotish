"use client";

import { useParams } from "next/navigation";
import { ProductFormPage } from "@/components/admin/products/ProductFormPage";
import { useAdminProduct } from "@/services/admin/products";
import { Loader } from "@/components/ui/Loader";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useAdminProduct(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader variant="section" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--accent-danger)]">
        Failed to load product{error ? `: ${(error as Error).message}` : "."}
      </div>
    );
  }

  return <ProductFormPage mode="edit" initial={data} />;
}
