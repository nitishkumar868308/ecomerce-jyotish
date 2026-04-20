import type { Banner } from "@/types/banner";

/**
 * Tolerant country-code matching. Admin country selectors might store ISO-2
 * ("IN"), ISO-3 ("IND") or the name ("India"); we match on any of those.
 */
export function countryCodesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x === y) return true;
  // ISO-2 embedded inside ISO-3 (IN vs IND) — cover both directions.
  if (x.length === 2 && y.startsWith(x)) return true;
  if (y.length === 2 && x.startsWith(y)) return true;
  return false;
}

/**
 * Storefront banner filter.
 *  - `country` is the selected country code/name (wizard topbar).
 *  - `cityStateIds` are the State (Location) ids that match the user's picked
 *    city on QuickGo; a banner passes if any of its BannerState.stateId is in
 *    this set.
 *  - Banners without any country restriction pass the country check; banners
 *    without any state restriction pass the state check.
 */
export function filterBannersForStorefront(
  banners: Banner[] | undefined,
  opts: { country?: string; cityStateIds?: number[] },
): Banner[] {
  if (!banners) return [];
  const { country, cityStateIds } = opts;
  return banners.filter((b) => {
    if (!b.active) return false;

    // Country gate.
    if (country && b.countries && b.countries.length > 0) {
      const matched = b.countries.some((c) =>
        countryCodesMatch(c.countryCode, country),
      );
      if (!matched) return false;
    }

    // City / state gate.
    if (cityStateIds && cityStateIds.length && b.states && b.states.length > 0) {
      const set = new Set(cityStateIds);
      const matched = b.states.some((s) => set.has(s.stateId));
      if (!matched) return false;
    }

    return true;
  });
}
