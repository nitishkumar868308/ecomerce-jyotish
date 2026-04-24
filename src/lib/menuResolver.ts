import { ROUTES } from "@/config/routes";

type SiteVariant = "wizard" | "quickgo" | "jyotish";

/**
 * Normalise an admin-entered menu label to a canonical key we can look up.
 *
 * Rules:
 *   - lowercase
 *   - collapse non-alphanumeric runs to a single space
 *   - strip leading/trailing whitespace
 *   - drop filler words that don't change meaning ("us", "the", "page", "our")
 */
function normalise(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const filler = new Set(["us", "the", "page", "our", "of"]);
  return cleaned
    .split(" ")
    .filter((w) => w && !filler.has(w))
    .join(" ");
}

/**
 * Alias map — canonical key (already normalised) to the concrete URL that
 * exists in the app. Add new entries here when new storefront routes ship.
 *
 * Values are either a single path or a function of the current site variant
 * (so "home" can route to `/` on wizard but `/hecate-quickgo` on quickgo).
 */
type Resolver = string | ((variant: SiteVariant) => string);

// QuickGo hosts its own themed copies of static pages under /hecate-quickgo/*.
// When the current variant is quickgo we route there; otherwise the default
// wizard routes apply.
const qg = (path: string) => (v: SiteVariant) =>
  v === "quickgo" ? `/hecate-quickgo${path}` : path;

const ALIASES: Record<string, Resolver> = {
  // Home
  home: (v) => (v === "quickgo" ? ROUTES.QUICKGO.HOME : "/"),

  // Static content pages
  about: qg("/about"),
  contact: qg("/contact"),
  faq: "/faq",
  faqs: "/faq",
  blog: qg("/blog"),
  blogs: qg("/blog"),

  // Policies
  privacy: qg("/privacy-policy"),
  "privacy policy": qg("/privacy-policy"),
  refund: qg("/refund-policy"),
  "refund policy": qg("/refund-policy"),
  shipping: qg("/shipping-and-return-policy"),
  "shipping policy": qg("/shipping-and-return-policy"),
  "shipping return": qg("/shipping-and-return-policy"),
  "shipping return policy": qg("/shipping-and-return-policy"),
  "shipping returns": qg("/shipping-and-return-policy"),
  returns: qg("/shipping-and-return-policy"),
  terms: qg("/terms-and-conditions"),
  "terms conditions": qg("/terms-and-conditions"),
  tnc: qg("/terms-and-conditions"),

  // Commerce
  categories: (v) =>
    v === "quickgo" ? "/hecate-quickgo/categories" : "/categories",
  "book consultant": "/book-consultant",
  "book jyotish": "/book-consultant",
  jyotish: "/book-consultant",
};

/**
 * Map an admin-entered header label to the canonical URL it should link to.
 *
 * Lookup order:
 *  1. Exact normalised alias (e.g. "Contact Us" → "contact" → /contact)
 *  2. Alias hit where the input starts with the key (e.g. "Shipping Return Policy")
 *  3. Fallback: kebab-case the cleaned label (preserves unknown custom links,
 *     e.g. admin adds "New Arrivals" → /new-arrivals)
 */
export function resolveMenuHref(label: string, variant: SiteVariant): string {
  const key = normalise(label);

  const direct = ALIASES[key];
  if (direct !== undefined) {
    return typeof direct === "function" ? direct(variant) : direct;
  }

  // Longest-first prefix match so "shipping return policy" wins over "shipping"
  const sortedKeys = Object.keys(ALIASES).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (key === k || key.startsWith(`${k} `) || key.endsWith(` ${k}`)) {
      const val = ALIASES[k];
      return typeof val === "function" ? val(variant) : val;
    }
  }

  // Unknown: slugify what the admin typed. Results in a 404 if no route exists,
  // but it keeps the data-driven flow intact for future routes.
  const slug = key.replace(/\s+/g, "-");
  return slug ? `/${slug}` : "/";
}
