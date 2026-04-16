"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card } from "@/components/ui/Card";
import {
  useAdminProduct,
  useAdminCreateProduct,
  useAdminUpdateProduct,
} from "@/services/admin/products";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface VariationForm {
  name: string;
  sku: string;
  price: string;
  mrp: string;
  stock: string;
}

export default function ProductCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const { data: existingProduct } = useAdminProduct(editId ?? "");
  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [isFeatured, setIsFeatured] = useState("false");
  const [images, setImages] = useState<File[]>([]);
  const [variations, setVariations] = useState<VariationForm[]>([]);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description);
      setShortDescription(existingProduct.shortDescription ?? "");
      setPrice(String(existingProduct.price));
      setMrp(String(existingProduct.mrp ?? ""));
      setSku(existingProduct.sku ?? "");
      setStock(String(existingProduct.stock));
      setCategoryId(String(existingProduct.categoryId));
      setSubcategoryId(String(existingProduct.subcategoryId ?? ""));
      setWeight(String(existingProduct.weight ?? ""));
      setDimensions(existingProduct.dimensions ?? "");
      setMetaTitle(existingProduct.metaTitle ?? "");
      setMetaDescription(existingProduct.metaDescription ?? "");
      setIsActive(String(existingProduct.isActive));
      setIsFeatured(String(existingProduct.isFeatured ?? false));
      if (existingProduct.variations) {
        setVariations(
          existingProduct.variations.map((v) => ({
            name: v.name,
            sku: v.sku ?? "",
            price: String(v.price),
            mrp: String(v.mrp ?? ""),
            stock: String(v.stock),
          })),
        );
      }
    }
  }, [existingProduct]);

  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      { name: "", sku: "", price: "", mrp: "", stock: "" },
    ]);
  };

  const updateVariation = (
    index: number,
    field: keyof VariationForm,
    value: string,
  ) => {
    setVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("shortDescription", shortDescription);
    formData.append("price", price);
    formData.append("mrp", mrp);
    formData.append("sku", sku);
    formData.append("stock", stock);
    formData.append("categoryId", categoryId);
    if (subcategoryId) formData.append("subcategoryId", subcategoryId);
    formData.append("weight", weight);
    formData.append("dimensions", dimensions);
    formData.append("metaTitle", metaTitle);
    formData.append("metaDescription", metaDescription);
    formData.append("isActive", isActive);
    formData.append("isFeatured", isFeatured);
    if (variations.length > 0) {
      formData.append("variations", JSON.stringify(variations));
    }
    images.forEach((file) => formData.append("images", file));

    if (editId) {
      await updateMutation.mutateAsync({
        id: Number(editId),
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        categoryId: Number(categoryId),
        isActive: isActive === "true",
      });
    } else {
      await createMutation.mutateAsync(formData);
    }

    router.push("/admin/products");
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title={editId ? "Edit Product" : "Create Product"}
        description={editId ? "Update product details" : "Add a new product to your catalog"}
      >
        <Link href="/admin/products">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              fullWidth
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <Input
              label="Short Description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Pricing & Stock
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="MRP (₹)"
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              fullWidth
            />
            <Input
              label="Stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              fullWidth
            />
          </div>
        </Card>

        {/* Category */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Organization
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Category ID"
              type="number"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="Subcategory ID"
              type="number"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              fullWidth
            />
            <Select
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
            <Select
              label="Featured"
              value={isFeatured}
              onChange={(e) => setIsFeatured(e.target.value)}
              options={[
                { value: "false", label: "No" },
                { value: "true", label: "Yes" },
              ]}
            />
          </div>
        </Card>

        {/* Shipping */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Shipping
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Weight (g)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              fullWidth
            />
            <Input
              label="Dimensions (LxWxH)"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="e.g. 10x5x3 cm"
              fullWidth
            />
          </div>
        </Card>

        {/* Images */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Images
          </h3>
          {editId && existingProduct?.images && existingProduct.images.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {existingProduct.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Product ${i + 1}`}
                  className="h-20 w-20 rounded-lg border border-[var(--border-primary)] object-cover"
                />
              ))}
            </div>
          )}
          <FileUpload
            accept="image/*"
            multiple
            maxSize={5 * 1024 * 1024}
            onUpload={(files) => setImages((prev) => [...prev, ...files])}
          />
        </Card>

        {/* Variations */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Variations
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariation}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Variation
            </Button>
          </div>
          {variations.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No variations added. Click &quot;Add Variation&quot; to create one.
            </p>
          ) : (
            <div className="space-y-4">
              {variations.map((v, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border-primary)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Variation {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariation(i)}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <Input
                      placeholder="Name"
                      value={v.name}
                      onChange={(e) => updateVariation(i, "name", e.target.value)}
                      fullWidth
                    />
                    <Input
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariation(i, "sku", e.target.value)}
                      fullWidth
                    />
                    <Input
                      placeholder="Price"
                      type="number"
                      value={v.price}
                      onChange={(e) => updateVariation(i, "price", e.target.value)}
                      fullWidth
                    />
                    <Input
                      placeholder="MRP"
                      type="number"
                      value={v.mrp}
                      onChange={(e) => updateVariation(i, "mrp", e.target.value)}
                      fullWidth
                    />
                    <Input
                      placeholder="Stock"
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariation(i, "stock", e.target.value)}
                      fullWidth
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SEO */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            SEO
          </h3>
          <div className="space-y-4">
            <Input
              label="Meta Title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              fullWidth
            />
            <Textarea
              label="Meta Description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {editId ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
