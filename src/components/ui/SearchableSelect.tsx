"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption<V extends string | number> {
  value: V;
  label: string;
  /** Optional secondary text shown muted next to the label. */
  hint?: string;
}

interface SearchableSelectProps<V extends string | number> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableSelectOption<V>[];
  value: V | "";
  onChange: (value: V | "") => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  clearable?: boolean;
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

const PANEL_MAX_HEIGHT = 320;
const PANEL_MARGIN = 4;
const MIN_SPACE = 160;

// Controlled searchable dropdown. The panel is portalled to document.body so it
// escapes ancestor `overflow` / `z-index` constraints (Modals, tables, etc.).
// Position is computed from the trigger's getBoundingClientRect and refreshed
// on scroll + resize; it flips above the trigger when there isn't enough room
// below.
export function SearchableSelect<V extends string | number>({
  label,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  options,
  value,
  onChange,
  disabled,
  loading,
  emptyMessage = "No options",
  clearable,
  className,
  id,
}: SearchableSelectProps<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
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

    // Close if the trigger got scrolled out of view inside a modal.
    if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
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

  // Recompute on open, on scroll, and on resize while open.
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

  // Outside-click close — considers trigger + portalled panel.
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

  // Focus search on open.
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

  // Keep highlighted row visible.
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback(
    (opt: SearchableSelectOption<V>) => {
      onChange(opt.value);
      close();
    },
    [onChange, close],
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
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) handleSelect(opt);
    }
  };

  return (
    <div className={cn("relative w-full", className)} onKeyDown={handleKey}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
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
          "flex w-full items-center gap-2 rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 text-left text-sm transition-colors",
          "border-[var(--border-primary)] hover:border-[var(--accent-primary)]",
          open &&
            "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20",
          disabled &&
            "cursor-not-allowed opacity-60 hover:border-[var(--border-primary)]",
        )}
      >
        <span
          className={cn(
            "flex-1 truncate",
            selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
          )}
        >
          {loading && !selected
            ? "Loading..."
            : selected
              ? selected.label
              : placeholder}
        </span>

        {clearable && selected && !disabled && (
          <span
            role="button"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </span>
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
                  const isSelected = opt.value === value;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-index={i}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]",
                        isSelected && "font-medium text-[var(--accent-primary)]",
                      )}
                    >
                      <span className="flex-1 truncate">
                        {opt.label}
                        {opt.hint && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">
                            {opt.hint}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                      )}
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
