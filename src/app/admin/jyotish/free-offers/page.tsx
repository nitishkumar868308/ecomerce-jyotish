"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminFreeOffers,
  useCreateFreeOffer,
  useUpdateFreeOffer,
  useDeleteFreeOffer,
  type FreeOfferPayload,
} from "@/services/admin/jyotish";
import type { FreeConsultationOffer } from "@/types/jyotish";

const EMPTY: FreeOfferPayload = {
  astrologerId: 0,
  title: "",
  description: "",
  astrologerAmount: 0,
  adminAmount: 0,
  sessionsCap: 10,
  startDate: "",
  endDate: "",
  active: true,
};

export default function AdminFreeOffersPage() {
  const { data: offers = [], isLoading } = useAdminFreeOffers();
  const createMut = useCreateFreeOffer();
  const updateMut = useUpdateFreeOffer();
  const deleteMut = useDeleteFreeOffer();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FreeConsultationOffer | null>(null);
  const [form, setForm] = useState<FreeOfferPayload>(EMPTY);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (o: FreeConsultationOffer) => {
    setEditTarget(o);
    setForm({
      astrologerId: o.astrologerId,
      title: o.title,
      description: o.description ?? "",
      astrologerAmount: o.astrologerAmount,
      adminAmount: o.adminAmount,
      sessionsCap: o.sessionsCap,
      startDate: o.startDate ?? "",
      endDate: o.endDate ?? "",
      active: o.active,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY);
  };

  const invalid =
    form.astrologerId <= 0 ||
    form.title.trim().length < 2 ||
    form.astrologerAmount < 0 ||
    form.adminAmount < 0 ||
    form.sessionsCap < 0;

  const handleSubmit = () => {
    if (invalid) return;
    if (editTarget) {
      updateMut.mutate(
        { id: editTarget.id, payload: form },
        {
          onSuccess: () => {
            toast.success("Offer updated");
            closeModal();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
        },
      );
    } else {
      createMut.mutate(form, {
        onSuccess: () => {
          toast.success("Offer created");
          closeModal();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Create failed"),
      });
    }
  };

  const handleDelete = (o: FreeConsultationOffer) => {
    if (!window.confirm(`Delete offer "${o.title}"?`)) return;
    deleteMut.mutate(o.id, {
      onSuccess: () => toast.success("Offer deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Free Consultation Offers
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Admin-funded free sessions for selected astrologers. Set both the
            admin share and the astrologer payout.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Offer
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Astro ID</th>
              <th className="px-4 py-3">Astro ₹</th>
              <th className="px-4 py-3">Admin ₹</th>
              <th className="px-4 py-3">Cap / Used</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Loading…</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No free offers yet.</td></tr>
            ) : (
              offers.map((o) => (
                <tr key={o.id} className="text-[var(--text-primary)]">
                  <td className="px-4 py-3 font-medium">{o.title}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{o.astrologerId}</td>
                  <td className="px-4 py-3">₹{o.astrologerAmount}</td>
                  <td className="px-4 py-3">₹{o.adminAmount}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {o.sessionsUsed}/{o.sessionsCap}
                  </td>
                  <td className="px-4 py-3">
                    <span className={o.active ? "inline-flex rounded-full bg-[var(--accent-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-success)]" : "inline-flex rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]"}>
                      {o.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(o)} className="rounded-lg bg-[var(--bg-tertiary)] p-2 hover:bg-[var(--bg-secondary)]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(o)} className="rounded-lg bg-[var(--accent-danger)]/10 p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {editTarget ? "Edit free offer" : "Add free offer"}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-[var(--text-secondary)]">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[var(--text-secondary)]">Description</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Astrologer ID</label>
                <input
                  type="number" min={1}
                  value={form.astrologerId}
                  onChange={(e) => setForm({ ...form, astrologerId: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Sessions Cap</label>
                <input
                  type="number" min={0}
                  value={form.sessionsCap}
                  onChange={(e) => setForm({ ...form, sessionsCap: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Astrologer share (₹)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={form.astrologerAmount}
                  onChange={(e) => setForm({ ...form, astrologerAmount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Admin share (₹)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={form.adminAmount}
                  onChange={(e) => setForm({ ...form, adminAmount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Start date</label>
                <input
                  type="date"
                  value={form.startDate ?? ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">End date</label>
                <input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <label className="col-span-2 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={invalid || saving} className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
