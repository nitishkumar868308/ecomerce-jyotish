"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  useJyotishChatSessions,
  useAcceptChat,
  useRejectChat,
} from "@/services/jyotish/sessions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";

/**
 * Live "Incoming chat requests" widget on the astrologer dashboard.
 *
 * Accept → server marks the session ACTIVE, billing starts (per-minute).
 * Reject → opens a reason modal; the reason is stored on the session and
 * visible to admin for follow-up.
 *
 * Note: the per-minute billing timer itself is enforced server-side via the
 * chat gateway + scheduled job. The user's chat screen polls the session and
 * reacts to balance changes (see ChatWindow).
 */
export function PendingChatRequests() {
  const router = useRouter();
  const { user } = useAuthStore();
  const startTransition = useUIStore((s) => s.startTransition);
  const { data: sessions } = useJyotishChatSessions(user?.id);
  const accept = useAcceptChat();
  const reject = useRejectChat();
  const [rejecting, setRejecting] = useState<{
    sessionId: number;
    userName: string;
  } | null>(null);
  const [reason, setReason] = useState("");

  const pending = (sessions ?? []).filter(
    (s: any) =>
      String(s.status).toUpperCase() === "PENDING" ||
      String(s.status).toUpperCase() === "REQUESTED",
  );

  if (pending.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-[var(--jy-accent-gold)]/30 bg-[var(--jy-accent-gold)]/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--jy-accent-gold)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--jy-accent-gold)]">
          Incoming chat requests ({pending.length})
        </h3>
      </div>
      <ul className="space-y-2">
        {pending.map((s: any) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--jy-bg-card)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--jy-text-primary)]">
                {s.userName ?? s.user?.name ?? `User #${s.userId}`}
              </p>
              <p className="text-xs text-[var(--jy-text-muted)]">
                Requested{" "}
                {(() => {
                  const iso = s.requestedAt ?? s.createdAt;
                  return iso
                    ? new Date(iso).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                })()}
                {s.serviceId ? ` · Service #${s.serviceId}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={async () => {
                  startTransition("Starting chat…");
                  await accept.mutateAsync({
                    sessionId: Number(s.id),
                    astrologerId: Number(user?.id),
                  });
                  router.push(
                    `/jyotish/astrologer-dashboard/chat/${Number(s.id)}`,
                  );
                }}
                disabled={accept.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
              </button>
              <button
                type="button"
                onClick={() =>
                  setRejecting({
                    sessionId: Number(s.id),
                    userName: s.userName ?? `User #${s.userId}`,
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </li>
        ))}
      </ul>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--jy-bg-card)] p-5">
            <h4 className="text-sm font-semibold text-[var(--jy-text-primary)]">
              Reject request from {rejecting.userName}
            </h4>
            <p className="mt-1 text-xs text-[var(--jy-text-muted)]">
              Please share a short reason. It will be visible to the user and
              our admin team.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Busy with another consultation right now."
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--jy-text-primary)] placeholder:text-[var(--jy-text-muted)] outline-none focus:border-[var(--jy-accent-gold)]/40"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setReason("");
                }}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[var(--jy-text-secondary)] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reject.isPending || reason.trim().length < 3}
                onClick={async () => {
                  await reject.mutateAsync({
                    sessionId: rejecting.sessionId,
                    astrologerId: Number(user?.id),
                    reason: reason.trim(),
                  });
                  setRejecting(null);
                  setReason("");
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Reject with reason
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PendingChatRequests;
