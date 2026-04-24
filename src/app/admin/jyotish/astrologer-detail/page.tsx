"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useAdminAstrologers } from "@/services/admin/jyotish";
import { ArrowUpRight } from "lucide-react";
import type { AstrologerStatus } from "@/types/jyotish";
import { cn } from "@/lib/utils";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Admin landing page for the Jyotish astrologer roster. The heavy
 * editing surface (all fields, approve/active toggles, revenue split,
 * penalties, extra docs) lives on the per-id detail page — rows here
 * just link into it with enough preview info to triage the queue.
 */
export default function AstrologerListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // "All" is the default landing view so the admin sees every
  // astrologer (pending + approved + rejected) immediately instead
  // of having to click a tab to surface anything outside PENDING.
  const [statusFilter, setStatusFilter] = useState<AstrologerStatus | "ALL">(
    "ALL",
  );

  const { data, isLoading } = useAdminAstrologers({ page, limit: 20, search });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Backend flags (isApproved / isRejected / isActive) drive every status
  // chip the admin sees. `status` is derived so REJECTED wins over
  // APPROVED even if both booleans were ever accidentally set.
  const getStatus = (a: Record<string, unknown>): AstrologerStatus => {
    if (a.isRejected) return "REJECTED";
    if (a.isApproved) return "APPROVED";
    return "PENDING";
  };

  const allAstrologers = (data?.data as Record<string, unknown>[]) ?? [];
  // Pre-compute per-tab counts so each chip can show the number of
  // astrologers inside it. Same tab chip pattern as the profile-edit
  // requests page — keeps the two admin screens visually consistent.
  const counts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const a of allAstrologers) {
    counts.ALL += 1;
    counts[getStatus(a)] += 1;
  }
  const displayedAstrologers = allAstrologers.filter((a) =>
    statusFilter === "ALL" ? true : getStatus(a) === statusFilter,
  );

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "avatar",
      label: "Photo",
      render: (_val, row) => {
        // Backend stores the photo on `profile.image` as a storage-relative
        // path (e.g. /uploads/astrologer-photos/xyz.jpg). Resolve it to the
        // absolute backend URL so browsers actually load it — passing the
        // raw relative path meant the cell rendered a blank <img>.
        const raw =
          ((row.profile as Record<string, unknown> | undefined)?.image as
            | string
            | undefined) ?? (row.avatar as string | undefined);
        const src = raw ? resolveAssetUrl(raw) || raw : "";
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            --
          </div>
        );
      },
    },
    {
      key: "displayName",
      label: "Name",
      render: (_val, row) => (
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {(row.displayName as string) ||
              (row.fullName as string) ||
              "(unnamed)"}
          </p>
          {row.displayName && row.fullName ? (
            <p className="text-[11px] text-[var(--text-muted)]">
              {row.fullName as string}
            </p>
          ) : null}
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      render: (_val, row) => {
        const s = getStatus(row);
        const variant =
          s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : "warning";
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={variant}>{s}</Badge>
            {s === "APPROVED" && (
              <Badge variant={row.isActive ? "success" : "warning"}>
                {row.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <Link
          href={`/admin/jyotish/astrologer-detail/${row.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Astrologer Details"
        description="Review, approve and manage astrologer profiles."
      />

      <div className="mb-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search astrologers..."
          className="max-w-sm"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((key) => (
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
            <span>
              {key === "ALL"
                ? "All"
                : key.charAt(0) + key.slice(1).toLowerCase()}
            </span>
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
        data={displayedAstrologers}
        loading={isLoading}
        emptyMessage="No astrologers found"
      />

      {data && (data as any).totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={(data as any).page}
            totalPages={(data as any).totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
