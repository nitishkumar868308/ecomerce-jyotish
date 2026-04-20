"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTags, useCreateTag } from "@/services/admin/tags";
import type { Tag } from "@/types/product";

interface TagComboboxProps {
  label?: string;
  hint?: string;
  value: number[];
  onChange: (next: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type PanelPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
};

const PANEL_MAX_HEIGHT = 320;
const PANEL_MARGIN = 4;
const MIN_SPACE = 180;

/**
 * Tag selector: search existing tags, pick many, or type a new name and hit
 * Enter to create it inline. New tags are POSTed to /tags immediately — that
 * lets them be reused across products without a separate admin step.
 */
export function TagCombobox({
  label = "Tags",
  hint,
  value,
  onChange,
  placeholder = "Add tags...",
  disabled,
  className,
}: TagComboboxProps) {
  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const active = (tags ?? []).filter((t) => t.active);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selected = useMemo(
    () => active.filter((t) => selectedSet.has(t.id)),
    [active, selectedSet],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter((t) => t.name.toLowerCase().includes(q));
  }, [active, query]);

  const exactMatch = useMemo(
    () =>
      query.trim()
        ? active.find(
            (t) => t.name.toLowerCase() === query.trim().toLowerCase(),
          )
        : undefined,
    [active, query],
  );

  const canCreate =
    query.trim().length > 0 && !exactMatch && !createTag.isPending;

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    if (rect.bottom < 0 || rect.top > vh) {
      setOpen(false);
      return;
    }
    const spaceBelow = vh - rect.bottom - PANEL_MARGIN;
    const spaceAbove = rect.top - PANEL_MARGIN;
    const above = spaceBelow < MIN_SPACE && spaceAbove > spaceBelow;
    const avail = Math.max(160, above ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, avail);
    const width = Math.min(rect.width, vw - 16);
    let left = rect.left;
    if (left + width > vw - 8) left = vw - width - 8;
    if (left < 8) left = 8;
    setPos({
      top: above
        ? Math.max(8, rect.top - maxHeight - PANEL_MARGIN)
        : rect.bottom + PANEL_MARGIN,
      left,
      width,
      maxHeight,
      above,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (id: number) => {
    if (selectedSet.has(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || !canCreate) return;
    try {
      const created = await createTag.mutateAsync({ name, active: true });
      if (created?.id) {
        onChange([...value, created.id]);
      }
      setQuery("");
      inputRef.current?.focus();
    } catch {
      // createTag hook already toasts errors.
    }
  };

  const removeChip = (id: number) => {
    onChange(value.filter((x) => x !== id));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch) {
        toggle(exactMatch.id);
        setQuery("");
      } else if (canCreate) {
        void handleCreate();
      }
    } else if (e.key === "Backspace" && !query && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
          {hint && (
            <span className="text-xs text-[var(--text-muted)]">{hint}</span>
          )}
        </div>
      )}

      <div
        ref={triggerRef}
        onClick={() => !disabled && (setOpen(true), inputRef.current?.focus())}
        className={cn(
          "flex min-h-[42px] w-full cursor-text flex-wrap items-center gap-1 rounded-lg border bg-[var(--bg-secondary)] px-2 py-1.5 text-sm transition-colors",
          "border-[var(--border-primary)] hover:border-[var(--accent-primary)]",
          open &&
            "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {selected.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.12))] px-1.5 py-0.5 text-xs font-medium text-[var(--accent-primary)]"
          >
            {t.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(t.id);
              }}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remove ${t.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={selected.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {open &&
        mounted &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 10000,
            }}
            className="flex flex-col overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {isLoading ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Loading tags...
                </div>
              ) : filtered.length === 0 && !canCreate ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  No tags found. Type a name and press Enter to create.
                </div>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedSet.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        toggle(t.id);
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-tertiary)]",
                        isSelected
                          ? "font-medium text-[var(--accent-primary)]"
                          : "text-[var(--text-secondary)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          isSelected
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                            : "border-[var(--border-primary)] bg-transparent",
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        )}
                      </span>
                      <span className="flex-1 truncate">{t.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-left text-sm font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                {createTag.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create tag &quot;{query.trim()}&quot;
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

// Type guard for callers that want the label list from ids.
export function tagLabels(ids: number[], tags: Tag[] | undefined) {
  if (!tags?.length) return [];
  const map = new Map(tags.map((t) => [t.id, t.name]));
  return ids.map((id) => map.get(id)).filter(Boolean) as string[];
}
