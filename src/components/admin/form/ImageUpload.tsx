"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";

interface ImageUploadProps {
  label?: string;
  hint?: string;
  /** The persisted image URL (saved on the entity). */
  value?: string | null;
  /**
   * Called when the user picks a new file. Parent holds the File and runs the
   * upload AFTER the entity is inserted — keeps disk writes in sync with DB.
   */
  onFileChange: (file: File | null) => void;
  /** Called when the user clears an already-persisted image (value -> null). */
  onClearPersisted?: () => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml";
const MAX_MB = 5;

/**
 * Deferred image picker. Shows a preview the instant the admin picks a file,
 * but never calls the upload API — the parent page uploads the File after its
 * create/update mutation succeeds, so nothing lands on disk for records that
 * never got saved.
 */
export function ImageUpload({
  label = "Image",
  hint,
  value,
  onFileChange,
  onClearPersisted,
  disabled,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewBlob, setPreviewBlob] = useState<string>("");

  // Release blob URLs when the pending file changes or the component unmounts.
  useEffect(() => {
    if (!pendingFile) {
      setPreviewBlob("");
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewBlob(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const persistedPreview = value ? resolveAssetUrl(value) : "";
  const previewSrc = previewBlob || persistedPreview;
  const hasImage = !!previewSrc;

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) return;
    setPendingFile(file);
    onFileChange(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingFile) {
      setPendingFile(null);
      onFileChange(null);
      return;
    }
    // Nothing pending — user is clearing the saved URL.
    onClearPersisted?.();
  };

  const statusLine = pendingFile
    ? `Selected: ${pendingFile.name} · uploads after save`
    : value
      ? "Click to replace image"
      : `PNG, JPG, WebP, GIF · up to ${MAX_MB}MB`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={handlePick}
        disabled={disabled}
        className={cn(
          "group relative flex w-full items-center gap-4 rounded-xl border-2 border-dashed p-3 text-left transition-colors",
          "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
          {previewSrc ? (
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            {!hasImage && <UploadCloud className="h-4 w-4" />}
            {hasImage ? (pendingFile ? "Ready to upload" : "Image attached") : "Click to upload"}
          </p>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {statusLine}
          </p>
        </div>

        {hasImage && !disabled && (
          <span
            role="button"
            aria-label="Remove image"
            onClick={handleClear}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--accent-danger)]"
          >
            <X className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );
}
