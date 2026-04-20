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
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SMSOption<V extends string | number> {
  value: V;
  label: string;
  hint?: string;
}

interface SearchableMultiSelectProps<V extends string | number> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SMSOption<V>[];
  value: V[];
  onChange: (next: V[]) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  /** Maximum number of chips to show inside the trigger (extras collapse to "+N"). */
  maxChips?: number;
  className?: string;
  id?: string;
}

type PanelPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
};

const PANEL_MAX_HEIGHT = 360;
const PANEL_MARGIN = 4;
const MIN_SPACE = 180;

/**
 * Portalled multi-select with search. Handles thousands of options — dropdown
 * is virtualised lazily via the native scroll container (no custom virtual
 * list) and search filters label + hint. Trigger shows selected values as
 * removable chips so the admin doesn't have to reopen the panel to prune.
 */
export function SearchableMultiSelect<V extends string | number>({
  label,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  options,
  value,
  onChange,
  disabled,
  loading,
  emptyMessage = "No options",
  maxChips = 4,
  className,
  id,
}: SearchableMultiSelectProps<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.value)),
    [options, selectedSet],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // If the trigger isn't visible (user scrolled a modal etc.) close instead
    // of anchoring to an off-screen rect.
    if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
      setOpen(false);
      return;
    }

    const spaceBelow = vh - rect.bottom - PANEL_MARGIN;
    const spaceAbove = rect.top - PANEL_MARGIN;
    const above = spaceBelow < MIN_SPACE && spaceAbove > spaceBelow;
    const avail = Math.max(160, above ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, avail);

    // Horizontal clamp — keep the panel fully inside the viewport even when
    // the trigger hugs the right edge (admin sidebar + narrow modal).
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

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const toggle = useCallback(
    (v: V) => {
      if (selectedSet.has(v)) {
        onChange(value.filter((x) => x !== v));
      } else {
        onChange([...value, v]);
      }
    },
    [onChange, selectedSet, value],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) toggle(opt.value);
    }
  };

  const shownChips = selectedOptions.slice(0, maxChips);
  const extra = selectedOptions.length - shownChips.length;

  return (
    <div className={cn("relative w-full", className)} onKeyDown={handleKey}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 flex items-center justify-between text-sm font-medium text-[var(--text-primary)]"
        >
          <span>{label}</span>
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-normal text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
            >
              Clear all
            </button>
          )}
        </label>
      )}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex min-h-[42px] w-full items-center gap-2 rounded-lg border bg-[var(--bg-secondary)] px-2.5 py-1.5 text-left text-sm transition-colors",
          "border-[var(--border-primary)] hover:border-[var(--accent-primary)]",
          open &&
            "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20",
          disabled &&
            "cursor-not-allowed opacity-60 hover:border-[var(--border-primary)]",
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="flex-1 truncate text-[var(--text-muted)]">
            {loading ? "Loading..." : placeholder}
          </span>
        ) : (
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {shownChips.map((opt) => (
              <span
                key={String(opt.value)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary-light,rgba(99,102,241,0.12))] px-1.5 py-0.5 text-xs font-medium text-[var(--accent-primary)]"
              >
                <span className="max-w-[180px] truncate">{opt.label}</span>
                <span
                  role="button"
                  aria-label={`Remove ${opt.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.value);
                  }}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                +{extra} more
              </span>
            )}
          </div>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        mounted &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
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
            <div className="relative shrink-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKey}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              <span>
                {selectedOptions.length} selected · {filtered.length} shown
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
              {loading ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  {query ? `No matches for "${query}"` : emptyMessage}
                </div>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = selectedSet.has(opt.value);
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-index={i}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => toggle(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]",
                        isSelected &&
                          "font-medium text-[var(--accent-primary)]",
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
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 truncate">
                        {opt.label}
                        {opt.hint && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">
                            {opt.hint}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
