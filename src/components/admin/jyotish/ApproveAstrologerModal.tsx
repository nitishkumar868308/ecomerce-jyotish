"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useApproveAstrologer } from "@/services/admin/jyotish";
import type { Astrologer } from "@/types/jyotish";

interface Props {
  astrologer: Astrologer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApproveAstrologerModal({ astrologer, isOpen, onClose }: Props) {
  const [commission, setCommission] = useState<string>("20");
  const { mutate, isPending } = useApproveAstrologer();

  if (!isOpen || !astrologer) return null;

  const commissionNumber = parseFloat(commission);
  const invalid =
    !Number.isFinite(commissionNumber) ||
    commissionNumber < 0 ||
    commissionNumber > 100;

  const handleSubmit = () => {
    if (invalid) return;
    mutate(
      { id: astrologer.id, commissionPercent: commissionNumber },
      {
        onSuccess: () => {
          toast.success("Astrologer approved");
          onClose();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Approval failed";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Approve {astrologer.name}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Set the platform commission % for this astrologer.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Commission %
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 pr-8 text-[var(--text-primary)]"
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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={invalid || isPending}
            className="rounded-xl bg-[var(--accent-success)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
