"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, Star, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Represents one image slot. `persisted` URLs have been written to the backend
 * already (edit flow). `file` is a freshly-picked File the parent still has to
 * upload after save.
 */
export interface ImageSlot {
  /** Stable client-side key for React render. */
  key: string;
  /** Backend URL (if already saved). */
  persisted?: string | null;
  /** Unsaved File (if just picked). Parent calls useUpload for this on submit. */
  file?: File;
}

interface ImageUploadMultipleProps {
  label?: string;
  hint?: string;
  value: ImageSlot[];
  onChange: (next: ImageSlot[]) => void;
  /** Optional max count; defaults to 10. */
  max?: number;
  disabled?: boolean;
  className?: string;
}

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml";
const MAX_MB = 5;

// Multi-image picker: accepts several files at once, shows tile grid, first
// tile is marked as "Primary" (storefront thumbnail), tiles drag to reorder.
// Uploads happen AFTER the entity saves — parent iterates `value` and calls
// /upload for any slot with a `file`.
export function ImageUploadMultiple({
  label = "Images",
  hint,
  value,
  onChange,
  max = 10,
  disabled,
  className,
}: ImageUploadMultipleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFromRef = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  // Generate + revoke blob URLs so unsaved files render without re-encoding.
  useEffect(() => {
    const next: Record<string, string> = {};
    const created: string[] = [];
    for (const slot of value) {
      if (slot.file) {
        const url = URL.createObjectURL(slot.file);
        next[slot.key] = url;
        created.push(url);
      }
    }
    setBlobUrls(next);
    return () => {
      for (const u of created) URL.revokeObjectURL(u);
    };
  }, [value]);

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const space = Math.max(0, max - value.length);
    const accepted: ImageSlot[] = [];
    for (const file of Array.from(files).slice(0, space)) {
      if (file.size > MAX_MB * 1024 * 1024) continue;
      accepted.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
      });
    }
    if (accepted.length) onChange([...value, ...accepted]);
  };

  const removeSlot = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const makePrimary = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [moved] = next.splice(i, 1);
    next.unshift(moved);
    onChange(next);
  };

  const handleDrop = (to: number) => {
    const from = dragFromRef.current;
    dragFromRef.current = null;
    setOverIndex(null);
    if (from === null || from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
            ({value.length}/{max})
          </span>
        </label>
        {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {value.map((slot, i) => {
          const src = slot.file
            ? blobUrls[slot.key] ?? ""
            : resolveAssetUrl(slot.persisted ?? "");
          const isPrimary = i === 0;
          return (
            <div
              key={slot.key}
              draggable
              onDragStart={() => {
                dragFromRef.current = i;
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDragLeave={() => setOverIndex((x) => (x === i ? null : x))}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => setOverIndex(null)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border-2 bg-[var(--bg-secondary)] transition-all",
                isPrimary
                  ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40"
                  : "border-[var(--border-primary)]",
                overIndex === i && "ring-2 ring-[var(--accent-primary)]",
              )}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
                  Loading...
                </div>
              )}

              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <span
                  className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md bg-white/20 backdrop-blur"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 backdrop-blur transition-colors hover:bg-[var(--accent-danger)]"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[11px] text-white">
                {isPrimary ? (
                  <span className="flex items-center gap-1 rounded-md bg-[var(--accent-primary)] px-1.5 py-0.5 font-semibold">
                    <Star className="h-3 w-3" />
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    className="rounded-md bg-black/40 px-1.5 py-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                  >
                    Make primary
                  </button>
                )}
                {slot.file && (
                  <span className="rounded-md bg-amber-500/90 px-1.5 py-0.5 font-medium">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {value.length < max && (
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-5 w-5" />
            <span className="text-xs font-medium">Add image</span>
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        First image is used as the primary thumbnail. Drag tiles to reorder. New
        picks upload once the product is saved.
      </p>
    </div>
  );
}
