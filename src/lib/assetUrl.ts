import { API_CONFIG } from "@/lib/api";

// Resolves a URL returned by the upload API (e.g. "/uploads/foo/bar.jpg") to
// something an <img> can fetch directly. Absolute URLs pass through untouched
// so existing Cloudinary / remote image references keep working.
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleaned}`;
}

interface ProductLikeForImage {
  image?: Array<string | null | undefined> | null;
}

/**
 * Resolve the product image at index `idx` through `resolveAssetUrl`, falling
 * back to the placeholder when missing. Centralises the fix for bare `/uploads`
 * paths returned by the backend.
 */
export function productImage(
  product: ProductLikeForImage | null | undefined,
  idx = 0
): string {
  const raw = product?.image?.[idx];
  const resolved = resolveAssetUrl(raw);
  return resolved || "/placeholder.png";
}
