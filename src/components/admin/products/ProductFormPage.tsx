"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PlatformSelector } from "@/components/admin/form/PlatformSelector";
import { ImageUploadMultiple, type ImageSlot } from "@/components/admin/form/ImageUploadMultiple";
import { RichTextEditor } from "@/components/admin/form/RichTextEditor";
import { TagCombobox } from "@/components/admin/form/TagCombobox";
import { BulkPricingTiers, type BulkTier } from "@/components/admin/form/BulkPricingTiers";
import { AttributesTab } from "@/components/admin/products/AttributesTab";
import { VariationsTab } from "@/components/admin/products/VariationsTab";
import { MarketLinksTab } from "@/components/admin/products/MarketLinksTab";
import {
  useAdminCreateProduct,
  useAdminUpdateProduct,
  checkProductSku,
} from "@/services/admin/products";
import { useCategories, useSubcategories } from "@/services/categories";
import { useOffers } from "@/services/admin/offers";
import { useAttributes } from "@/services/admin/attributes";
import { useUpload } from "@/services/admin/upload";
import type { Product } from "@/types/product";
import type { VariationRow } from "@/components/admin/products/VariationsTab";
import type { MarketLinkRow } from "@/components/admin/products/MarketLinksTab";
import {
  deriveSelectionsFromVariations,
  generateAttributeCombos,
  comboKey,
  comboLabel,
  suggestVariationSku,
  type AttributeSelection,
} from "@/lib/variations";
import toast from "react-hot-toast";

type Mode = "create" | "edit";

interface ProductFormPageProps {
  mode: Mode;
  initial?: Product | null;
}

// Flat state object so tab switches never unmount any field. Keys mirror the
// backend DTO where they can; anything without a direct column (e.g. dimension
// parts) is reassembled at submit time.
export interface ProductFormState {
  platform: string[];
  name: string;
  short: string;
  description: string; // long description (HTML)
  categoryId: number | "";
  subcategoryId: number | "";
  sku: string;
  barCode: string; // treated as FNSKU in the UI
  price: string;
  stock: string;
  MRP: string;
  offerId: number | "";
  dimL: string;
  dimB: string;
  dimH: string;
  dimW: string;
  tagIds: number[];
  images: ImageSlot[];
  bulkPricingTiers: BulkTier[];
  active: boolean;

  attributeSelections: AttributeSelection[];
  variations: VariationRow[];

  marketLinks: MarketLinkRow[];
}

const emptyState: ProductFormState = {
  platform: ["wizard"],
  name: "",
  short: "",
  description: "",
  categoryId: "",
  subcategoryId: "",
  sku: "",
  barCode: "",
  price: "",
  stock: "",
  MRP: "",
  offerId: "",
  dimL: "",
  dimB: "",
  dimH: "",
  dimW: "",
  tagIds: [],
  images: [],
  bulkPricingTiers: [],
  active: true,
  attributeSelections: [],
  variations: [],
  marketLinks: [],
};

// Slot key helper so we don't collide with freshly-picked files' keys.
let slotSeed = 0;
const nextSlotKey = () => `slot-${Date.now()}-${slotSeed++}`;

// Variation key helper — module-level so it survives re-renders.
let varSeed = 0;
const nextVarKey = () => `var-new-${Date.now()}-${varSeed++}`;

function hydrateFromProduct(
  product: Product,
  attrs: ReturnType<typeof useAttributes>["data"],
): ProductFormState {
  const p = product as Product & Record<string, unknown>;
  const images: ImageSlot[] = Array.isArray(p.image)
    ? (p.image as string[]).map((url) => ({
        key: nextSlotKey(),
        persisted: url,
      }))
    : [];

  const dim = (p.dimension ?? {}) as Record<string, unknown>;
  const readDim = (k: string) => (dim[k] != null ? String(dim[k]) : "");

  const rawTiers = (p.bulkPricingTiers ?? []) as unknown;
  const bulkPricingTiers: BulkTier[] = Array.isArray(rawTiers)
    ? (rawTiers as Array<{ qty: number; unitPrice: number }>)
        .map((t) => ({
          qty: Number(t.qty) || 0,
          unitPrice: Number(t.unitPrice) || 0,
        }))
        .filter((t) => t.qty > 0)
    : [];

  const variations: VariationRow[] = ((p.variations ?? []) as any[]).map(
    (v) => ({
      _key: `var-${v.id}`,
      id: v.id,
      attributeCombo: Array.isArray(v.attributeCombo) ? v.attributeCombo : [],
      variationName: v.variationName ?? "",
      sku: v.sku ?? "",
      name: v.name ?? "",
      price: v.price ?? "",
      stock: v.stock ?? "",
      MRP: v.MRP ?? "",
      short: v.short ?? "",
      description: v.description ?? "",
      active: v.active ?? true,
      offerId: v.offerId ?? "",
      barCode: v.barCode ?? "",
      bulkPricingTiers: Array.isArray(v.bulkPricingTiers)
        ? v.bulkPricingTiers.map((t: any) => ({
            qty: Number(t.qty) || 0,
            unitPrice: Number(t.unitPrice) || 0,
          }))
        : [],
      images: Array.isArray(v.image)
        ? (v.image as string[]).map((url) => ({
            key: nextSlotKey(),
            persisted: url,
          }))
        : [],
      tagIds: Array.isArray(v.tags)
        ? (v.tags as Array<{ id: number }>).map((t) => t.id)
        : [],
    }),
  );

  const marketLinks: MarketLinkRow[] = ((p.marketLinks ?? []) as any[]).map(
    (m) => ({
      _key: `ml-${m.id}`,
      id: m.id,
      name: m.name ?? "",
      url: m.url ?? "",
      countryName: m.countryName ?? "",
      countryCode: m.countryCode ?? "",
    }),
  );

  return {
    platform: (p.platform as string[]) ?? ["wizard"],
    name: p.name ?? "",
    short: (p.short as string) ?? "",
    description: p.description ?? "",
    categoryId: (p.categoryId as number) ?? "",
    subcategoryId: (p.subcategoryId as number) ?? "",
    sku: p.sku ?? "",
    barCode: (p.barCode as string) ?? "",
    price: (p.price as string) ?? "",
    stock: (p.stock as string) ?? "",
    MRP: (p.MRP as string) ?? "",
    offerId: (p.offerId as number) ?? "",
    dimL: readDim("l"),
    dimB: readDim("b"),
    dimH: readDim("h"),
    dimW: readDim("w"),
    tagIds: Array.isArray(p.tags)
      ? (p.tags as Array<{ id: number }>).map((t) => t.id)
      : [],
    images,
    bulkPricingTiers,
    active: p.active ?? true,
    attributeSelections: deriveSelectionsFromVariations(
      variations.map((v) => ({ attributeCombo: v.attributeCombo })),
      attrs,
    ),
    variations,
    marketLinks,
  };
}

export function ProductFormPage({ mode, initial }: ProductFormPageProps) {
  const router = useRouter();
  const [state, setState] = useState<ProductFormState>(emptyState);
  const [tab, setTab] = useState<"details" | "attributes" | "variations" | "market">("details");
  const [skuCheck, setSkuCheck] = useState<{
    status: "idle" | "checking" | "ok" | "taken";
    message?: string;
  }>({ status: "idle" });
  // Keeps track of whether we've initialised from `initial` yet (hydrate once).
  const hydratedRef = useRef(false);

  const { data: categories } = useCategories();
  const { data: subcategoriesAll } = useSubcategories();
  const { data: offers } = useOffers();
  const { data: attributes } = useAttributes({ fresh: true });

  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();
  const uploadMutation = useUpload();

  // Hydrate once attributes are available so attributeSelections reconstruct.
  useEffect(() => {
    if (mode !== "edit") return;
    if (hydratedRef.current) return;
    if (!initial) return;
    if (!attributes) return; // wait for attributes before deriving selections
    hydratedRef.current = true;
    setState(hydrateFromProduct(initial, attributes));
  }, [mode, initial, attributes]);

  // Subcategories scoped to the selected category.
  const subcategoriesForCategory = useMemo(() => {
    if (!state.categoryId) return [];
    return (subcategoriesAll ?? []).filter(
      (s) => s.categoryId === state.categoryId,
    );
  }, [subcategoriesAll, state.categoryId]);

  const categoryOptions = useMemo(
    () =>
      (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const subcategoryOptions = useMemo(
    () =>
      subcategoriesForCategory.map((s) => ({ value: s.id, label: s.name })),
    [subcategoriesForCategory],
  );
  const offerOptions = useMemo(
    () =>
      (offers ?? [])
        .filter((o) => o.active)
        .map((o) => ({
          value: o.id,
          label: o.name,
          hint: o.discountType,
        })),
    [offers],
  );

  const patch = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => setState((s) => ({ ...s, [key]: value }));

  // Live SKU uniqueness check (debounced via timer ref).
  const skuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.sku.trim()) {
      setSkuCheck({ status: "idle" });
      return;
    }
    if (mode === "edit" && initial && state.sku === initial.sku) {
      setSkuCheck({ status: "idle" });
      return;
    }
    setSkuCheck({ status: "checking" });
    if (skuTimer.current) clearTimeout(skuTimer.current);
    skuTimer.current = setTimeout(async () => {
      try {
        const available = await checkProductSku(
          state.sku.trim(),
          initial?.id,
        );
        setSkuCheck({
          status: available ? "ok" : "taken",
          message: available ? "Available" : "Already in use",
        });
      } catch {
        setSkuCheck({ status: "idle" });
      }
    }, 400);
    return () => {
      if (skuTimer.current) clearTimeout(skuTimer.current);
    };
  }, [state.sku, mode, initial]);

  // ─── Variations helpers ───────────────────────────────────────────────────

  const existingComboKeys = useMemo(() => {
    const set = new Set<string>();
    for (const v of state.variations) set.add(comboKey(v.attributeCombo));
    return set;
  }, [state.variations]);

  const handleGenerate = () => {
    const preview = generateAttributeCombos(
      state.attributeSelections,
      attributes ?? [],
    );
    const missing = preview.filter((c) => !existingComboKeys.has(comboKey(c)));
    if (missing.length === 0) return;
    const additions: VariationRow[] = missing.map((combo) => ({
      _key: nextVarKey(),
      attributeCombo: combo,
      variationName: comboLabel(combo) || "Variation",
      sku: suggestVariationSku(state.sku, combo),
      name: "",
      price: state.price,
      stock: state.stock,
      MRP: state.MRP,
      short: state.short,
      description: state.description,
      active: true,
      offerId: state.offerId,
      barCode: state.barCode,
      bulkPricingTiers: state.bulkPricingTiers.map((t) => ({ ...t })),
      images: state.images.map((s) => ({
        key: nextSlotKey(),
        file: s.file,
        persisted: s.persisted,
      })),
      tagIds: state.tagIds,
    }));
    patch("variations", [...state.variations, ...additions]);
  };

  const handleAddBlank = () => {
    patch("variations", [
      ...state.variations,
      {
        _key: nextVarKey(),
        attributeCombo: [],
        variationName: "Custom variation",
        sku: suggestVariationSku(state.sku, []),
        name: "",
        price: state.price,
        stock: state.stock,
        MRP: state.MRP,
        short: state.short,
        description: state.description,
        active: true,
        offerId: state.offerId,
        barCode: state.barCode,
        bulkPricingTiers: state.bulkPricingTiers.map((t) => ({ ...t })),
        images: state.images.map((s) => ({
          key: nextSlotKey(),
          file: s.file,
          persisted: s.persisted,
        })),
        tagIds: state.tagIds,
      },
    ]);
  };

  const handleFillFromDefaults = () => {
    patch(
      "variations",
      state.variations.map((v) => ({
        ...v,
        price: v.price || state.price,
        MRP: v.MRP || state.MRP,
        stock: v.stock || state.stock,
        short: v.short || state.short,
        description: v.description || state.description,
        barCode: v.barCode || state.barCode,
        offerId: v.offerId || state.offerId,
        bulkPricingTiers:
          v.bulkPricingTiers.length > 0
            ? v.bulkPricingTiers
            : state.bulkPricingTiers.map((t) => ({ ...t })),
        images:
          v.images.length > 0
            ? v.images
            : state.images.map((s) => ({
                key: nextSlotKey(),
                file: s.file,
                persisted: s.persisted,
              })),
      })),
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Submit flow:
   *   1. Upload every pending image (product + each variation) so we have URLs.
   *   2. POST or PUT the product with the assembled payload.
   *   3. Navigate back to the list.
   */
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending;

  const validationError = (): string | null => {
    if (!state.name.trim()) return "Name is required";
    if (state.platform.length === 0) return "Pick at least one platform";
    if (!state.subcategoryId) return "Subcategory is required";
    if (!state.sku.trim()) return "SKU is required";
    if (skuCheck.status === "taken") return "SKU is already in use";
    return null;
  };

  const uploadImageSlots = async (
    slots: ImageSlot[],
    folder: string,
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (const slot of slots) {
      if (slot.file) {
        try {
          const { url } = await uploadMutation.mutateAsync({
            file: slot.file,
            folder,
          });
          urls.push(url);
        } catch {
          // Skip failed uploads; upload hook toasts errors.
        }
      } else if (slot.persisted) {
        urls.push(slot.persisted);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    const err = validationError();
    if (err) {
      toast.error(err);
      return;
    }

    // Upload product-level images first.
    const productImageUrls = await uploadImageSlots(state.images, "products");

    // For each variation, upload its images in turn.
    const variationsPayload = [] as Array<Record<string, unknown>>;
    for (const v of state.variations) {
      const urls = await uploadImageSlots(v.images, "product-variations");
      variationsPayload.push({
        variationName: v.variationName,
        sku: v.sku,
        name: v.name || undefined,
        price: v.price || undefined,
        stock: v.stock || undefined,
        MRP: v.MRP || undefined,
        short: v.short || undefined,
        description: v.description || undefined,
        active: v.active,
        offerId: typeof v.offerId === "number" ? v.offerId : undefined,
        barCode: v.barCode || undefined,
        image: urls,
        bulkPricingTiers: v.bulkPricingTiers,
        attributeCombo: v.attributeCombo,
        tagIds: v.tagIds,
      });
    }

    const dimension = (() => {
      const d: Record<string, number> = {};
      if (state.dimL) d.l = Number(state.dimL);
      if (state.dimB) d.b = Number(state.dimB);
      if (state.dimH) d.h = Number(state.dimH);
      if (state.dimW) d.w = Number(state.dimW);
      return Object.keys(d).length ? d : undefined;
    })();

    const payload = {
      platform: state.platform,
      name: state.name.trim(),
      short: state.short.trim() || undefined,
      description: state.description || undefined,
      categoryId:
        typeof state.categoryId === "number" ? state.categoryId : undefined,
      subcategoryId:
        typeof state.subcategoryId === "number" ? state.subcategoryId : 0,
      sku: state.sku.trim(),
      barCode: state.barCode.trim() || undefined,
      price: state.price || undefined,
      stock: state.stock || undefined,
      MRP: state.MRP || undefined,
      offerId: typeof state.offerId === "number" ? state.offerId : undefined,
      dimension,
      tagIds: state.tagIds,
      image: productImageUrls,
      bulkPricingTiers: state.bulkPricingTiers,
      active: state.active,
      variations: variationsPayload,
      marketLinks: state.marketLinks
        .filter((m) => m.name && m.url && m.countryName)
        .map((m) => ({
          name: m.name,
          url: m.url,
          countryName: m.countryName,
          countryCode: m.countryCode,
        })),
    };

    try {
      if (mode === "edit" && initial?.id) {
        await updateMutation.mutateAsync({
          id: initial.id,
          ...payload,
        } as unknown as Parameters<typeof updateMutation.mutateAsync>[0]);
      } else {
        await createMutation.mutateAsync(
          payload as unknown as Parameters<typeof createMutation.mutateAsync>[0],
        );
      }
      router.push("/admin/products");
    } catch {
      // service hooks already toast errors
    }
  };

  const tabs = [
    { id: "details", label: "Details" },
    { id: "attributes", label: "Attributes" },
    {
      id: "variations",
      label: `Variations${state.variations.length > 0 ? ` (${state.variations.length})` : ""}`,
    },
    {
      id: "market",
      label: `Market Links${state.marketLinks.length > 0 ? ` (${state.marketLinks.length})` : ""}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header / action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Back to products"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {mode === "edit" ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {mode === "edit"
                ? `ID ${initial?.id}`
                : "Fill in the details, then add variations and market links."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/products">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {mode === "edit" ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Platform pinned at the top so it is visible across tabs. */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <PlatformSelector
          value={state.platform}
          onChange={(next) => patch("platform", next)}
        />
      </div>

      <Tabs
        tabs={tabs}
        activeTab={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:p-5">
        {/* Details tab */}
        {tab === "details" && (
          <div className="space-y-5">
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Product name"
                  value={state.name}
                  onChange={(e) => patch("name", e.target.value)}
                  placeholder="e.g. Crystal Pendant"
                />
                <div>
                  <Input
                    label="SKU (unique)"
                    value={state.sku}
                    onChange={(e) => patch("sku", e.target.value)}
                    placeholder="e.g. CP-001"
                  />
                  {skuCheck.status !== "idle" && (
                    <p
                      className={`mt-1 text-xs ${
                        skuCheck.status === "ok"
                          ? "text-green-600"
                          : skuCheck.status === "taken"
                            ? "text-[var(--accent-danger)]"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      {skuCheck.status === "checking"
                        ? "Checking availability..."
                        : skuCheck.message}
                    </p>
                  )}
                </div>
              </div>

              <Textarea
                label="Short description"
                value={state.short}
                onChange={(e) => patch("short", e.target.value)}
                placeholder="One-liner shown on the product card"
                rows={2}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SearchableSelect
                  label="Category"
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  options={categoryOptions}
                  value={state.categoryId}
                  onChange={(v) => {
                    patch(
                      "categoryId",
                      v === "" ? "" : (v as number),
                    );
                    // Reset subcategory when category changes.
                    patch("subcategoryId", "");
                  }}
                  clearable
                />
                <SearchableSelect
                  label="Subcategory"
                  placeholder={
                    state.categoryId
                      ? "Select subcategory"
                      : "Pick a category first"
                  }
                  searchPlaceholder="Search subcategories..."
                  options={subcategoryOptions}
                  value={state.subcategoryId}
                  onChange={(v) =>
                    patch(
                      "subcategoryId",
                      v === "" ? "" : (v as number),
                    )
                  }
                  disabled={!state.categoryId}
                  emptyMessage="No subcategories for this category"
                  clearable
                />
              </div>
            </section>

            <div className="border-t border-[var(--border-primary)]" />

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Pricing & stock
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Input
                  label="Price (INR)"
                  type="number"
                  value={state.price}
                  onChange={(e) => patch("price", e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="MRP"
                  type="number"
                  value={state.MRP}
                  onChange={(e) => patch("MRP", e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Stock"
                  type="number"
                  value={state.stock}
                  onChange={(e) => patch("stock", e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="FNSKU / barcode"
                  value={state.barCode}
                  onChange={(e) => patch("barCode", e.target.value)}
                  placeholder="e.g. X001ABCDE"
                />
              </div>

              <SearchableSelect
                label="Offer (optional)"
                placeholder="No offer"
                searchPlaceholder="Search offers..."
                options={offerOptions}
                value={state.offerId}
                onChange={(v) =>
                  patch("offerId", v === "" ? "" : (v as number))
                }
                clearable
              />

              <BulkPricingTiers
                label="Bulk pricing tiers"
                hint="Unit price drops when qty crosses each threshold"
                value={state.bulkPricingTiers}
                onChange={(next) => patch("bulkPricingTiers", next)}
                basePrice={state.price || null}
              />
            </section>

            <div className="border-t border-[var(--border-primary)]" />

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Dimensions (cm)
              </h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <Input
                  label="Length"
                  type="number"
                  value={state.dimL}
                  onChange={(e) => patch("dimL", e.target.value)}
                />
                <Input
                  label="Breadth"
                  type="number"
                  value={state.dimB}
                  onChange={(e) => patch("dimB", e.target.value)}
                />
                <Input
                  label="Height"
                  type="number"
                  value={state.dimH}
                  onChange={(e) => patch("dimH", e.target.value)}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={state.dimW}
                  onChange={(e) => patch("dimW", e.target.value)}
                />
              </div>
            </section>

            <div className="border-t border-[var(--border-primary)]" />

            <section className="space-y-4">
              <TagCombobox
                value={state.tagIds}
                onChange={(next) => patch("tagIds", next)}
              />
              <ImageUploadMultiple
                value={state.images}
                onChange={(next) => patch("images", next)}
                hint="Uploaded after save"
              />
            </section>

            <div className="border-t border-[var(--border-primary)]" />

            <section className="space-y-4">
              <RichTextEditor
                label="Long description"
                value={state.description}
                onChange={(v) => patch("description", v)}
                placeholder="Full product description with formatting..."
                minHeight={220}
              />

              <div className="flex items-start gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                <span>
                  <strong className="text-[var(--text-primary)]">SEO:</strong>{" "}
                  Slug, meta title, meta description, and keywords are auto-
                  generated on the backend from name, short description, and tags.
                </span>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={state.active}
                  onChange={(e) => patch("active", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-primary)] accent-[var(--accent-primary)]"
                />
                Active
              </label>
            </section>
          </div>
        )}

        {/* Attributes tab */}
        {tab === "attributes" && (
          <AttributesTab
            attributes={attributes ?? []}
            selections={state.attributeSelections}
            onSelectionsChange={(next) => patch("attributeSelections", next)}
            existingComboKeys={existingComboKeys}
            onGenerate={handleGenerate}
            onAddBlank={handleAddBlank}
            onSwitchToVariations={() => setTab("variations")}
          />
        )}

        {/* Variations tab */}
        {tab === "variations" && (
          <VariationsTab
            variations={state.variations}
            onVariationsChange={(next) => patch("variations", next)}
            offerOptions={offerOptions}
            onFillFromDefaults={handleFillFromDefaults}
            onDeleteRequest={(key) =>
              patch(
                "variations",
                state.variations.filter((v) => v._key !== key),
              )
            }
          />
        )}

        {/* Market Links tab */}
        {tab === "market" && (
          <MarketLinksTab
            value={state.marketLinks}
            onChange={(next) => patch("marketLinks", next)}
          />
        )}
      </div>
    </div>
  );
}
