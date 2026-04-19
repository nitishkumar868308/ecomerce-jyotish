"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRejectAstrologer } from "@/services/admin/jyotish";
import type { Astrologer } from "@/types/jyotish";

interface Props {
  astrologer: Astrologer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RejectAstrologerModal({ astrologer, isOpen, onClose }: Props) {
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useRejectAstrologer();

  if (!isOpen || !astrologer) return null;

  const invalid = reason.trim().length < 3;

  const handleSubmit = () => {
    if (invalid) return;
    mutate(
      { id: astrologer.id, rejectionReason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Astrologer rejected");
          onClose();
          setReason("");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Rejection failed";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Reject {astrologer.name}?
        </h3>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          The astrologer will see this reason on their dashboard.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Reason
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            placeholder="Incomplete profile, missing credentials, etc."
          />
          {invalid && (
            <p className="mt-1 text-xs text-[var(--accent-danger)]">
              At least 3 characters required.
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
            className="rounded-xl bg-[var(--accent-danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
