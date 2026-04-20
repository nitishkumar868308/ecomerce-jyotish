"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useAstrologerProfile } from "@/services/jyotish/profile";
import { AstrologerStats } from "@/components/jyotish/dashboard/AstrologerStats";
import { SessionHistory } from "@/components/jyotish/dashboard/SessionHistory";
import { StatusBanner } from "@/components/jyotish/dashboard/StatusBanner";
import { PendingChatRequests } from "@/components/jyotish/dashboard/PendingChatRequests";

export default function AstrologerDashboardPage() {
  const { user } = useAuthStore();
  const { data: astrologer } = useAstrologerProfile(user?.id ?? "");

  return (
    <div className="space-y-6">
      {astrologer && <StatusBanner astrologer={astrologer} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--jy-text-primary)]">
            Welcome back, {user?.name?.split(" ")[0] ?? "Astrologer"}
          </h1>
          <p className="text-sm text-[var(--jy-text-muted)]">
            Here&apos;s what&apos;s happening with your consultations today.
          </p>
        </div>
      </div>
      <PendingChatRequests />
      <AstrologerStats />
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--jy-accent-gold)]">
          Recent sessions
        </h2>
        <SessionHistory />
      </section>
    </div>
  );
}
