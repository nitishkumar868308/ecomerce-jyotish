"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useAdminConsultantServices,
  useCreateConsultantService,
  useUpdateConsultantService,
  useDeleteConsultantService,
  type ConsultantService,
  type ServicePayload,
} from "@/services/admin/consultant";

const EMPTY: ServicePayload = {
  name: "",
  description: "",
  image: "",
  price: 0,
  isActive: true,
};

export default function AdminConsultantServicesPage() {
  const { data: services = [], isLoading } = useAdminConsultantServices();
  const createMut = useCreateConsultantService();
  const updateMut = useUpdateConsultantService();
  const deleteMut = useDeleteConsultantService();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConsultantService | null>(null);
  const [form, setForm] = useState<ServicePayload>(EMPTY);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (svc: ConsultantService) => {
    setEditTarget(svc);
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      image: svc.image ?? "",
      price: svc.price,
      isActive: svc.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY);
  };

  const invalid =
    form.name.trim().length < 2 ||
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

  const handleDelete = (svc: ConsultantService) => {
    if (!window.confirm(`Delete service "${svc.name}"?`)) return;
    deleteMut.mutate(svc.id);
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Consultant Services
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage the services astrologers can offer (Vedic, Numerology, Tarot,
            etc).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--text-tertiary)]"
                >
                  Loading…
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--text-tertiary)]"
                >
                  No services yet.
                </td>
              </tr>
            ) : (
              services.map((svc) => (
                <tr key={svc.id} className="text-[var(--text-primary)]">
                  <td className="px-4 py-3 font-medium">{svc.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {svc.description || "—"}
                  </td>
                  <td className="px-4 py-3">₹{svc.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        svc.isActive
                          ? "inline-flex rounded-full bg-[var(--accent-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-success)]"
                          : "inline-flex rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]"
                      }
                    >
                      {svc.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(svc)}
                        className="rounded-lg bg-[var(--bg-tertiary)] p-2 hover:bg-[var(--bg-secondary)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(svc)}
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
              {editTarget ? "Edit service" : "Add service"}
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="Vedic Astrology"
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
                  Image URL
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="/uploads/… or https://…"
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
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>
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
