"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./loader/Skeleton";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  className?: string;
}

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span className="ml-1 inline-flex flex-col text-[10px] leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "transition-colors",
          direction === "asc"
            ? "text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] opacity-40",
        )}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "-mt-0.5 transition-colors",
          direction === "desc"
            ? "text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] opacity-40",
        )}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  onSort,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--bg-secondary)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]",
                  col.sortable && "cursor-pointer select-none hover:text-[var(--text-primary)]",
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  {col.sortable && (
                    <SortIcon
                      direction={sortKey === col.key ? sortDir : null}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {loading &&
            Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton variant="text" lines={1} />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--text-secondary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-[var(--text-primary)]"
                  >
                    {col.render
                      ? col.render(row[col.key], row, rowIdx)
                      : (row[col.key] as React.ReactNode) ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
