"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  useAdminProfileEditRequests,
  useApproveProfileEdit,
  useRejectProfileEdit,
} from "@/services/admin/jyotish";
import { Eye, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

/**
 * Admin queue for astrologer-submitted profile edit requests. Four
 * tabs along the top (All → Approved → Pending → Rejected) with "All"
 * as the default landing view so the admin sees everything at a
 * glance. The underlying backend endpoint returns the full list in
 * one go; we filter client-side by `overallStatus` so switching tabs
 * never triggers a refetch.
 */
export default function ProfileEditRequestsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [viewItem, setViewItem] = useState<Record<string, any> | null>(null);

  // Backend returns the full list in one shot and doesn't paginate —
  // so we fetch once and slice client-side. Reset to page 1 whenever
  // the tab or search changes so the admin never lands on a dead page.
  const { data, isLoading } = useAdminProfileEditRequests({
    page: 1,
    limit: 500,
    search,
  });
  useEffect(() => setPage(1), [statusFilter, search]);
  const approveMutation = useApproveProfileEdit();
  const rejectMutation = useRejectProfileEdit();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Free-offer requests have their own dedicated admin page
  // (/admin/jyotish/free-offers — "Astrologer requests" tab). Filter
  // them out here so the same row doesn't appear in two queues.
  const rawList = useMemo(() => {
    const raw = (data?.data as Record<string, any>[]) ?? [];
    return raw.filter(
      (r) =>
        String(r.section ?? "").toLowerCase() !== "free sessions offer",
    );
  }, [data]);

  const statusOf = (r: Record<string, any>) =>
    String(r.overallStatus ?? r.status ?? "PENDING").toUpperCase();

  const { counts, filtered } = useMemo(() => {
    const counts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of rawList) {
      counts.ALL += 1;
      const s = statusOf(r);
      // Treat PARTIALLY_APPROVED / FULFILLED as APPROVED for tab
      // counting — admin doesn't need a separate bucket for those at
      // the roster level; they click through for the detail anyway.
      if (s === "APPROVED" || s === "PARTIALLY_APPROVED" || s === "FULFILLED") {
        counts.APPROVED += 1;
      } else if (s === "REJECTED") {
        counts.REJECTED += 1;
      } else {
        counts.PENDING += 1;
      }
    }
    const filtered = rawList.filter((r) => {
      if (statusFilter === "ALL") return true;
      const s = statusOf(r);
      if (statusFilter === "APPROVED") {
        return s === "APPROVED" || s === "PARTIALLY_APPROVED" || s === "FULFILLED";
      }
      if (statusFilter === "PENDING") return s === "PENDING";
      if (statusFilter === "REJECTED") return s === "REJECTED";
      return true;
    });
    return { counts, filtered };
  }, [rawList, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync(id);
  };
  const handleReject = async (id: number) => {
    await rejectMutation.mutateAsync({ id });
  };

  const columns: Column<Record<string, any>>[] = [
    {
      key: "astrologer",
      label: "Astrologer",
      render: (_val, row) => {
        const a = row.astrologer as
          | { fullName?: string; displayName?: string; email?: string }
          | undefined;
        if (!a)
          return <span className="text-[var(--text-muted)]">-</span>;
        return (
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {a.displayName || a.fullName || "(unnamed)"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {a.email ?? ""}
            </p>
          </div>
        );
      },
    },
    {
      key: "section",
      label: "Section",
      render: (val) => (
        <span className="text-sm text-[var(--text-primary)]">
          {(val as string) ?? "-"}
        </span>
      ),
    },
    {
      key: "fields",
      label: "Field",
      render: (_val, row) => {
        const fields = (row.fields ?? {}) as Record<string, any>;
        const label =
          fields._fieldLabel ??
          Object.keys(fields).find((k) => k !== "_fieldLabel") ??
          "-";
        return <span className="text-sm">{String(label)}</span>;
      },
    },
    {
      key: "reason",
      label: "Reason",
      render: (val) => {
        const text = (val as string) ?? "";
        return (
          <span
            className="block max-w-[280px] truncate text-sm text-[var(--text-secondary)]"
            title={text}
          >
            {text || "-"}
          </span>
        );
      },
    },
    {
      key: "overallStatus",
      label: "Status",
      render: (_val, row) => {
        const s = statusOf(row);
        const variant =
          s === "APPROVED" || s === "FULFILLED"
            ? "success"
            : s === "REJECTED"
              ? "danger"
              : s === "PARTIALLY_APPROVED"
                ? "warning"
                : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Requested",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const status = statusOf(row);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewItem(row)}
              title="View request"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {status === "PENDING" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(row.id as number)}
                  title="Approve"
                >
                  <Check className="h-4 w-4 text-[var(--accent-success)]" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(row.id as number)}
                  title="Reject"
                >
                  <X className="h-4 w-4 text-[var(--accent-danger)]" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tabs: Array<{ key: StatusFilter; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "APPROVED", label: "Approved" },
    { key: "PENDING", label: "Pending" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div>
      <PageHeader
        title="Profile Edit Requests"
        description="Review astrologer-submitted change requests."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search astrologer or reason…"
          className="sm:max-w-sm"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === key
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
            )}
          >
            {label}
            <span
              className={cn(
                "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                statusFilter === key
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={pageItems}
        loading={isLoading}
        emptyMessage={
          statusFilter === "ALL"
            ? "No edit requests yet."
            : `No ${statusFilter.toLowerCase()} requests.`
        }
      />

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <Modal
        isOpen={viewItem !== null}
        onClose={() => setViewItem(null)}
        title="Edit request details"
      >
        {viewItem && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta label="Astrologer">
                {viewItem.astrologer?.displayName ??
                  viewItem.astrologer?.fullName ??
                  "-"}
                <p className="text-[11px] text-[var(--text-muted)]">
                  {viewItem.astrologer?.email ?? ""}
                </p>
              </Meta>
              <Meta label="Section">{viewItem.section ?? "-"}</Meta>
              <Meta label="Field">
                {(() => {
                  const fields = (viewItem.fields ?? {}) as Record<string, any>;
                  return (
                    fields._fieldLabel ??
                    Object.keys(fields).find((k) => k !== "_fieldLabel") ??
                    "-"
                  );
                })()}
              </Meta>
              <Meta label="Status">
                <Badge
                  variant={
                    statusOf(viewItem) === "APPROVED" ||
                    statusOf(viewItem) === "FULFILLED"
                      ? "success"
                      : statusOf(viewItem) === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {statusOf(viewItem)}
                </Badge>
              </Meta>
              <Meta label="Requested">
                {viewItem.createdAt
                  ? new Date(viewItem.createdAt).toLocaleString()
                  : "-"}
              </Meta>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Requested value
              </p>
              <div className="mt-1 max-h-60 overflow-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
                <RequestedValueView fields={viewItem.fields ?? {}} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Astrologer&rsquo;s reason
              </p>
              <p className="mt-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                {(viewItem.reason as string) || "—"}
              </p>
            </div>

            {viewItem.adminNote && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Admin note
                </p>
                <p className="mt-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {viewItem.adminNote}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              {statusOf(viewItem) === "PENDING" ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await handleReject(viewItem.id as number);
                      setViewItem(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleApprove(viewItem.id as number);
                      setViewItem(null);
                    }}
                  >
                    Approve &amp; apply
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => setViewItem(null)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

/* ─────────────────── Requested-value renderer ───────────────────
 * The astrologer-side fields payload mixes scalars (a single new bio
 * string, a new phone) with nested objects (the full Free sessions
 * offer blob). Rendering `String(value)` blew up with "[object
 * Object]" on the nested case. Instead we peel _fieldLabel off, detect
 * the payload shape, and render a friendly key→value list. Mirrors
 * the formatter used on the astrologer's own profile page so both
 * sides see the exact same data. */

const MONEY_KEYS = new Set([
  "price",
  "amount",
  "ratePerMinute",
  "grossValuePerUser",
  "adminPayoutPerUser",
  "astrologerPayoutPerSession",
  "gstPerUser",
  "payablePerUser",
]);

function humanizeKey(key: string): string {
  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

function formatScalar(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "number") {
    if (MONEY_KEYS.has(key)) return `₹${value.toLocaleString()}`;
    return String(value);
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
    if (MONEY_KEYS.has(key) && /^\d+(\.\d+)?$/.test(value)) {
      return `₹${Number(value).toLocaleString()}`;
    }
    return value;
  }
  return String(value);
}

function RequestedValueView({
  fields,
}: {
  fields: Record<string, any>;
}) {
  const f = { ...fields };
  delete f._fieldLabel;
  const keys = Object.keys(f);

  if (keys.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">—</p>;
  }

  // Single primitive key — e.g. `{ bio: "new bio text" }`. Show as a
  // simple block, no table chrome needed.
  if (keys.length === 1) {
    const k = keys[0];
    const v = f[k];
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      return <KeyValueList obj={v} />;
    }
    return (
      <p className="whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">
        {formatScalar(k, v)}
      </p>
    );
  }

  return <KeyValueList obj={f} />;
}

function KeyValueList({ obj }: { obj: Record<string, any> }) {
  const entries = Object.entries(obj).filter(
    ([, v]) => v != null && v !== "",
  );
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">—</p>;
  }
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {humanizeKey(k)}
          </dt>
          <dd className="mt-0.5 break-words text-sm text-[var(--text-primary)]">
            {typeof v === "object" && v !== null && !Array.isArray(v)
              ? JSON.stringify(v)
              : formatScalar(k, v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
