"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import {
  useAdminVideoStories,
  useAdminCreateVideoStory,
  useAdminUpdateVideoStory,
  useAdminDeleteVideoStory,
} from "@/services/admin/banners";
import { useUpload } from "@/services/admin/upload";
import { resolveAssetUrl } from "@/lib/assetUrl";
import type { VideoStory } from "@/types/banner";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  UploadCloud,
  PlayCircle,
  X,
  Link as LinkIcon,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

interface FormState {
  title: string;
  videoUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  videoUrl: "",
  isActive: true,
};

function normalize(row: any): VideoStory & { _video: string } {
  const video = row.url || row.videoUrl || "";
  const isActive = row.active ?? row.isActive ?? true;
  return { ...row, videoUrl: video, url: video, isActive, active: isActive, _video: video };
}

export default function VideoStoryPage() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<VideoStory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useAdminVideoStories();
  const createMutation = useAdminCreateVideoStory();
  const updateMutation = useAdminUpdateVideoStory();
  const deleteMutation = useAdminDeleteVideoStory();
  const uploadMutation = useUpload();

  const rows = useMemo(() => {
    const list = (data ?? []).map(normalize);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) => r.title?.toLowerCase().includes(q) || r.videoUrl?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode("create");
  };

  const openEdit = (row: VideoStory) => {
    const v = normalize(row);
    setSelected(v);
    setForm({
      title: v.title ?? "",
      videoUrl: v.videoUrl ?? "",
      isActive: v.isActive ?? true,
    });
    setMode("edit");
  };

  const openView = (row: VideoStory) => {
    setSelected(normalize(row));
    setMode("view");
  };

  const handleVideoFile = async (file: File) => {
    const result = await uploadMutation.mutateAsync({ file, folder: "video-story" });
    setForm((f) => ({ ...f, videoUrl: result.url }));
  };

  const handleSubmit = async () => {
    // Backend DTO accepts only { title, url, active } — anything else is
    // rejected by the strict ValidationPipe.
    const payload = {
      title: form.title.trim(),
      url: form.videoUrl,
      active: form.isActive,
    };
    if (mode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, index) => (
        <span className="font-medium text-[var(--text-secondary)]">{index + 1}</span>
      ),
    },
    {
      key: "url",
      label: "Preview",
      render: (_val, row) => {
        const r = row as unknown as VideoStory & { _video: string };
        const src = resolveAssetUrl(r._video || r.url || r.videoUrl);
        return src ? (
          <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-black">
            <video src={src} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
              <PlayCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)]">
            <PlayCircle className="h-5 w-5" />
          </div>
        );
      },
    },
    { key: "title", label: "Title", sortable: true },
    {
      key: "videoUrl",
      label: "Video",
      render: (_val, row) => {
        const r = row as unknown as VideoStory & { _video: string };
        const v = r._video || r.videoUrl || r.url;
        return v ? (
          <a
            href={resolveAssetUrl(v)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[220px] items-center gap-1 truncate text-xs text-[var(--accent-primary)] hover:underline"
          >
            <LinkIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{v}</span>
          </a>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">--</span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (_val, row) => {
        const r = row as unknown as VideoStory;
        const active = r.isActive ?? r.active;
        return <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const r = row as unknown as VideoStory;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(r)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Video Stories" description="Upload and manage video stories for the storefront">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Video Story
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search by title or URL..." className="max-w-sm" />
      </div>

      <Table
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage={search ? "No video stories match your search" : "No video stories yet"}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Video Story" : "Add Video Story"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Story title"
          />

          {/* Video upload/URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Video</label>
            {form.videoUrl ? (
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
                <video
                  src={resolveAssetUrl(form.videoUrl)}
                  className="h-16 w-28 rounded bg-black object-cover"
                  controls
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[var(--text-muted)]">{form.videoUrl}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, videoUrl: "" })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="ghost"
                onClick={() => videoInputRef.current?.click()}
                leftIcon={<UploadCloud className="h-4 w-4" />}
                loading={uploadMutation.isPending}
                className="sm:w-auto"
              >
                Upload video
              </Button>
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="Or paste a URL..."
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
              <p className="text-xs text-[var(--text-muted)]">Visible on the storefront</p>
            </div>
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim() || !form.videoUrl}
              loading={submitting}
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Video Story" size="lg">
        {selected && (
          <div className="space-y-4">
            {(selected.url || selected.videoUrl) && (
              <video
                src={resolveAssetUrl(selected.url || selected.videoUrl)}
                controls
                className="w-full rounded-xl bg-black"
              />
            )}
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{selected.title}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Status">
                <Badge variant={selected.active ?? selected.isActive ? "success" : "default"}>
                  {selected.active ?? selected.isActive ? "Active" : "Inactive"}
                </Badge>
              </Field>
              <Field label="Created">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "--"}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Video Story"
        message="Are you sure you want to delete this video story? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <div className="mt-0.5 text-sm text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
