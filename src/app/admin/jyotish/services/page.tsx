"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminConsultantServices,
  useCreateConsultantService,
  useUpdateConsultantService,
  useDeleteConsultantService,
  type ConsultantService,
  type ServicePayload,
} from "@/services/admin/consultant";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";

const EMPTY: ServicePayload = {
  title: "",
  shortDesc: "",
  longDesc: "",
  image: "",
  active: true,
};

export default function AdminConsultantServicesPage() {
  const { data: services = [], isLoading } = useAdminConsultantServices();
  const createMut = useCreateConsultantService();
  const updateMut = useUpdateConsultantService();
  const deleteMut = useDeleteConsultantService();
  const uploadMut = useUpload();

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
      title: svc.title,
      shortDesc: svc.shortDesc ?? "",
      longDesc: svc.longDesc ?? "",
      image: svc.image ?? "",
      active: svc.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY);
  };

  const invalid = form.title.trim().length < 2;

  const handleImagePick = async (file: File) => {
    try {
      const { url } = await uploadMut.mutateAsync({
        file,
        folder: "consultant-services",
      });
      setForm((f) => ({ ...f, image: url }));
    } catch {
      // toast handled by useUpload
    }
  };

  const handleSubmit = () => {
    if (invalid) return;
    const payload: ServicePayload = {
      ...form,
      shortDesc: form.shortDesc?.trim() || undefined,
      longDesc: form.longDesc?.trim() || undefined,
      image: form.image || undefined,
    };
    if (editTarget) {
      updateMut.mutate(
        { id: editTarget.id, payload },
        {
          onSuccess: () => {
            toast.success("Service updated");
            closeModal();
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Update failed"),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Service created");
          closeModal();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Create failed"),
      });
    }
  };

  const handleDelete = (svc: ConsultantService) => {
    if (!window.confirm(`Delete service "${svc.title}"?`)) return;
    deleteMut.mutate(svc.id, {
      onSuccess: () => toast.success("Service deleted"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  const saving = createMut.isPending || updateMut.isPending;
  const uploading = uploadMut.isPending;

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
              <th className="px-4 py-3 w-20">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Short Description</th>
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
              services.map((svc) => {
                const src = resolveAssetUrl(svc.image);
                return (
                  <tr key={svc.id} className="text-[var(--text-primary)]">
                    <td className="px-4 py-3">
                      {src ? (
                        <Image
                          src={src}
                          alt={svc.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[var(--bg-secondary)]" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{svc.title}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {svc.shortDesc || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          svc.active
                            ? "inline-flex rounded-full bg-[var(--accent-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-success)]"
                            : "inline-flex rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]"
                        }
                      >
                        {svc.active ? "Active" : "Inactive"}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {editTarget ? "Edit service" : "Add service"}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Name
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="Vedic Astrology"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Image
                </label>
                <div className="mt-1 flex items-center gap-3">
                  {form.image ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border-primary)]">
                      <Image
                        src={resolveAssetUrl(form.image) || form.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: "" })}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                    <Upload className="h-4 w-4" />
                    {uploading
                      ? "Uploading…"
                      : form.image
                        ? "Replace image"
                        : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImagePick(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Short Description
                </label>
                <input
                  value={form.shortDesc ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, shortDesc: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="A one-line tagline shown in listings"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Long Description
                </label>
                <textarea
                  rows={5}
                  value={form.longDesc ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, longDesc: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                  placeholder="Full description shown on the service detail page"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
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
                disabled={invalid || saving || uploading}
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
