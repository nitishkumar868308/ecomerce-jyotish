"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useJyotishTaxConfig,
  useUpdateJyotishTaxConfig,
} from "@/services/jyotish/tax";

export default function JyotishTaxSettingsPage() {
  const { data, isLoading } = useJyotishTaxConfig();
  const { mutate, isPending } = useUpdateJyotishTaxConfig();
  const [gst, setGst] = useState<string>("");

  useEffect(() => {
    if (data?.gstPercent != null) {
      setGst(String(data.gstPercent));
    }
  }, [data?.gstPercent]);

  const gstNumber = parseFloat(gst);
  const invalid =
    !Number.isFinite(gstNumber) || gstNumber < 0 || gstNumber > 100;

  const handleSave = () => {
    if (invalid) return;
    mutate(
      { gstPercent: gstNumber },
      {
        onSuccess: () => toast.success("GST updated"),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Update failed";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Jyotish GST Settings
      </h1>
      <p className="mt-1 text-sm text-[var(--text-tertiary)]">
        Applied to every consultation session before the platform commission
        split.
      </p>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
        {isLoading ? (
          <div className="text-sm text-[var(--text-tertiary)]">Loading…</div>
        ) : (
          <>
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              GST %
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 pr-8 text-[var(--text-primary)]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                %
              </span>
            </div>
            {invalid && (
              <p className="mt-1 text-xs text-[var(--accent-danger)]">
                Enter a number between 0 and 100.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={invalid || isPending}
                className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
