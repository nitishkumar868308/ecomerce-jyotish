"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useAdminConsultantDurations,
  useCreateConsultantDuration,
  useUpdateConsultantDuration,
  useDeleteConsultantDuration,
  type ConsultantDuration,
  type DurationPayload,
} from "@/services/admin/consultant";

const EMPTY: DurationPayload = { minutes: 15, label: "", price: 0 };

export default function AdminConsultantDurationsPage() {
  const { data: durations = [], isLoading } = useAdminConsultantDurations();
  const createMut = useCreateConsultantDuration();
  const updateMut = useUpdateConsultantDuration();
  const deleteMut = useDeleteConsultantDuration();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConsultantDuration | null>(null);
  const [form, setForm] = useState<DurationPayload>(EMPTY);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (d: ConsultantDuration) => {
    setEditTarget(d);
    setForm({ minutes: d.minutes, label: d.label, price: d.price });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY);
  };

  const invalid =
    !Number.isFinite(form.minutes) ||
    form.minutes <= 0 ||
    form.label.trim().length < 1 ||
    !Number.isFinite(form.price) ||
    form.price < 0;

  const handleSubmit = () => {
    if (invalid) return;
    if (editTarget) {
      updateMut.mutate(
        { id: editTarget.id, payload: form },
        { onSuccess: closeModal },
      );
    } else {
      createMut.mutate(form, { onSuccess: closeModal });
    }
  };
  const handleDelete = (d: ConsultantDuration) => {
    if (!window.confirm(`Delete duration "${d.label}"?`)) return;
    deleteMut.mutate(d.id);
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Consultation Durations
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Time bundles users can pick when booking a consultation.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Duration
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Minutes</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[var(--text-tertiary)]"
                >
                  Loading…
                </td>
              </tr>
            ) : durations.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[var(--text-tertiary)]"
                >
                  No durations yet.
                </td>
              </tr>
            ) : (
              durations.map((d) => (
                <tr key={d.id} className="text-[var(--text-primary)]">
                  <td className="px-4 py-3 font-medium">{d.label}</td>
                  <td className="px-4 py-3">{d.minutes} min</td>
                  <td className="px-4 py-3">₹{d.price}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="rounded-lg bg-[var(--bg-tertiary)] p-2 hover:bg-[var(--bg-secondary)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        className="rounded-lg bg-[var(--accent-danger)]/10 p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20"
                      >
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
              {editTarget ? "Edit duration" : "Add duration"}
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Label
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="15 minutes"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Minutes
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minutes: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Price (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={invalid || saving}
                className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
