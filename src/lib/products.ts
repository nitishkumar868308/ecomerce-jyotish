import type { Product } from "@/types/product";

export type StorePlatform = "wizard" | "quickgo";

/**
 * Keep only products whose `platform` array includes the current storefront.
 * Products with no `platform` field are treated as wizard-only (legacy default).
 */
export function filterByPlatform<T extends Pick<Product, "platform">>(
  products: T[] | undefined,
  platform: StorePlatform,
): T[] {
  if (!products) return [];
  return products.filter((p) => {
    const list = Array.isArray(p.platform) ? p.platform : ["wizard"];
    return list.includes(platform);
  });
}
