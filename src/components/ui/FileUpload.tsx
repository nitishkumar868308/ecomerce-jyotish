"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  preview?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onUpload,
  accept,
  multiple = false,
  maxSize,
  preview = true,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<{ name: string; url: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setError(null);
      const files = Array.from(fileList);

      if (maxSize) {
        const oversized = files.find((f) => f.size > maxSize);
        if (oversized) {
          setError(
            `"${oversized.name}" exceeds max size of ${formatFileSize(maxSize)}`,
          );
          return;
        }
      }

      if (preview) {
        const newPreviews = files.map((file) => ({
          name: file.name,
          url: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : "",
          size: file.size,
        }));
        setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));
      }

      onUpload(files);
    },
    [maxSize, multiple, onUpload, preview],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const removePreview = (idx: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      if (updated[idx].url) URL.revokeObjectURL(updated[idx].url);
      updated.splice(idx, 1);
      return updated;
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
          dragging
            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : "border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-secondary)]"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--accent-primary)]">
            Click to upload
          </span>{" "}
          or drag and drop
        </p>
        {accept && (
          <p className="text-xs text-[var(--text-secondary)]">
            Accepted: {accept}
          </p>
        )}
        {maxSize && (
          <p className="text-xs text-[var(--text-secondary)]">
            Max size: {formatFileSize(maxSize)}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-[var(--accent-danger)]">{error}</p>
      )}

      {preview && previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((file, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2"
            >
              {file.url ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-14 w-14 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col">
                <span className="max-w-[120px] truncate text-xs font-medium text-[var(--text-primary)]">
                  {file.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePreview(idx);
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-danger)] text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove ${file.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
