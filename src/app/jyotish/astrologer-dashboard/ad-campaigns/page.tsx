"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useMyAdCampaigns,
  useCreateAdCampaign,
} from "@/services/jyotish/ad-campaign";
import { usePrice } from "@/hooks/usePrice";
import type { AdCampaign } from "@/types/jyotish";

interface CampaignForm {
  title: string;
  description: string;
  budget: string;
  startDate: string;
  endDate: string;
}

const EMPTY: CampaignForm = {
  title: "",
  description: "",
  budget: "",
  startDate: "",
  endDate: "",
};

export default function MyAdCampaignsPage() {
  const { user } = useAuthStore();
  const astrologerId = user?.id;
  const { data, isLoading } = useMyAdCampaigns();
  const createMut = useCreateAdCampaign();
  const { format } = usePrice();

  const campaigns: AdCampaign[] = useMemo(() => (data ?? []) as AdCampaign[], [data]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(EMPTY);

  const invalid =
    form.title.trim().length < 2 ||
    !Number.isFinite(parseFloat(form.budget)) ||
    parseFloat(form.budget) <= 0 ||
    !form.startDate ||
    !form.endDate ||
    new Date(form.endDate) <= new Date(form.startDate);

  const handleSubmit = () => {
    if (invalid) return;
    createMut.mutate(
      {
        astrologerId,
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget),
        startDate: form.startDate,
        endDate: form.endDate,
      },
      {
        onSuccess: () => {
          toast.success("Ad campaign created");
          setModalOpen(false);
          setForm(EMPTY);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            My Ad Campaigns
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Boost your visibility on Jyotish. Campaigns are reviewed by admin
            before going live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--jy-accent-purple)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl shimmer" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No campaigns yet. Click &ldquo;New Campaign&rdquo; to launch your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const spent = Number(c.spent ?? 0);
            const budget = Number(c.budget ?? 0);
            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
            const statusCls =
              c.status === "ACTIVE"
                ? "bg-[var(--accent-success)]/10 text-[var(--accent-success)]"
                : c.status === "PAUSED"
                  ? "bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]"
                  : "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]";
            return (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {c.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <span>
                        {new Date(c.startDate).toLocaleDateString()} →{" "}
                        {new Date(c.endDate).toLocaleDateString()}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-medium ${statusCls}`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {format(spent)} / {format(budget)}
                    </div>
                    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                      <div
                        className="h-full bg-[var(--jy-accent-purple)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              New Ad Campaign
            </h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Budget will be deducted from your wallet when the campaign is
              approved and goes live.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="Diwali special boost"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={createMut.isPending}
                className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={invalid || createMut.isPending}
                className="rounded-xl bg-[var(--jy-accent-purple)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createMut.isPending ? "Submitting…" : "Launch campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
