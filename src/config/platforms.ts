import type { MultiCheckOption } from "@/components/admin/form/MultiCheck";

// Canonical storefront platforms. Values are what the backend stores in
// `platform: string[]` on Category / Subcategory / Banner etc. — keep in sync
// with storefront filter logic.
export const PLATFORM_OPTIONS: MultiCheckOption<string>[] = [
  { value: "wizard", label: "Hecate Wizard Mall" },
  { value: "quickgo", label: "Hecate QuickGo" },
];
