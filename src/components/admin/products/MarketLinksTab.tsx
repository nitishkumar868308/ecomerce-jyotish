"use client";

import { useMemo } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useLocationStates } from "@/services/admin/location";

export interface MarketLinkRow {
  _key: string;
  id?: string;
  name: string;
  url: string;
  countryName: string;
  countryCode: string;
}

interface MarketLinksTabProps {
  value: MarketLinkRow[];
  onChange: (next: MarketLinkRow[]) => void;
}

let linkSeed = 0;
const nextKey = () => `ml-${Date.now()}-${linkSeed++}`;

export function MarketLinksTab({ value, onChange }: MarketLinksTabProps) {
  const { data: locations } = useLocationStates();

  // Deduped country list from the Location master.
  const countryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of locations ?? []) {
      if (l.countryName) names.add(l.countryName);
    }
    return Array.from(names).map((name) => ({
      value: name,
      label: name,
      hint: name.slice(0, 2).toUpperCase(),
    }));
  }, [locations]);

  const addRow = () =>
    onChange([
      ...value,
      {
        _key: nextKey(),
        name: "",
        url: "",
        countryName: "",
        countryCode: "",
      },
    ]);

  const patch = (key: string, fields: Partial<MarketLinkRow>) =>
    onChange(value.map((r) => (r._key === key ? { ...r, ...fields } : r)));

  const remove = (key: string) =>
    onChange(value.filter((r) => r._key !== key));

  const setCountry = (key: string, countryName: string) => {
    if (!countryName) {
      patch(key, { countryName: "", countryCode: "" });
      return;
    }
    patch(key, {
      countryName,
      countryCode: countryName.slice(0, 2).toUpperCase(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Market Links
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            External marketplace URLs for this product (Amazon, Flipkart, Etsy
            etc.) — one per country. Countries are sourced from the Location
            master.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRow}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Add link
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
          No market links yet. Add one to showcase where the product is listed
          externally.
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((row) => (
            <div
              key={row._key}
              className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 sm:p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <SearchableSelect
                  label="Country"
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  options={countryOptions}
                  value={row.countryName}
                  onChange={(v) =>
                    setCountry(row._key, v === "" ? "" : (v as string))
                  }
                  emptyMessage="No countries configured — add Locations first"
                  clearable
                />

                <Input
                  label="Marketplace name"
                  value={row.name}
                  onChange={(e) => patch(row._key, { name: e.target.value })}
                  placeholder="e.g. Amazon"
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(row._key)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-danger)]"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  label="URL"
                  value={row.url}
                  onChange={(e) => patch(row._key, { url: e.target.value })}
                  placeholder="https://..."
                />
                {row.url && /^https?:\/\//i.test(row.url) && (
                  <div className="flex items-end">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 text-xs font-medium text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Test link
                    </a>
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Stored as{" "}
                <span className="font-mono">
                  {row.countryCode || "??"}
                </span>{" "}
                — code is derived from the country name; edit on the global
                Market Links page if you need to override.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
