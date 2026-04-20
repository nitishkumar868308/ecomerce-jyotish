"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAdminAstrologers } from "@/services/admin/jyotish";
import { Eye, Check, X, Percent } from "lucide-react";
import { ApproveAstrologerModal } from "@/components/admin/jyotish/ApproveAstrologerModal";
import { RejectAstrologerModal } from "@/components/admin/jyotish/RejectAstrologerModal";
import { SetCommissionModal } from "@/components/admin/jyotish/SetCommissionModal";
import type { Astrologer, AstrologerStatus } from "@/types/jyotish";
import { cn } from "@/lib/utils";

export default function AstrologerDetailPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null);
  const [statusFilter, setStatusFilter] = useState<AstrologerStatus | "ALL">("PENDING");
  const [approveTarget, setApproveTarget] = useState<Astrologer | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Astrologer | null>(null);
  const [commissionTarget, setCommissionTarget] = useState<Astrologer | null>(null);

  const { data, isLoading } = useAdminAstrologers({ page, limit: 20, search });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const getStatus = (a: Record<string, unknown>): AstrologerStatus =>
    (a.status as AstrologerStatus) ?? (a.isVerified ? "APPROVED" : "PENDING");

  const allAstrologers = (data?.data as Record<string, unknown>[]) ?? [];
  const displayedAstrologers = allAstrologers.filter((a) =>
    statusFilter === "ALL" ? true : getStatus(a) === statusFilter
  );

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "avatar",
      label: "Photo",
      render: (val) =>
        val ? (
          <img src={val as string} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">--</div>
        ),
    },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email" },
    { key: "specialization", label: "Specialization" },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (val) => val ? `${Number(val).toFixed(1)} / 5` : "-",
    },
    {
      key: "isVerified",
      label: "Status",
      render: (_val, row) => {
        const s = getStatus(row);
        const variant = s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewItem(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          {getStatus(row) === "PENDING" && (
            <>
              <button
                type="button"
                onClick={() => setApproveTarget(row as unknown as Astrologer)}
                title="Approve"
                className="rounded-lg bg-[var(--accent-success)]/10 p-2 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRejectTarget(row as unknown as Astrologer)}
                title="Reject"
                className="rounded-lg bg-[var(--accent-danger)]/10 p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {getStatus(row) === "APPROVED" && (
            <button
              type="button"
              onClick={() => setCommissionTarget(row as unknown as Astrologer)}
              title="Edit commission"
              className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              <Percent className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Astrologer Details" description="View and manage astrologer profiles" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search astrologers..." className="max-w-sm" />
      </div>

      <div className="mb-4 flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === key
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
            )}
          >
            {key === "ALL" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Table columns={columns} data={displayedAstrologers} loading={isLoading} emptyMessage="No astrologers found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={viewItem !== null} onClose={() => setViewItem(null)} title="Astrologer Profile">
        {viewItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {viewItem.avatar && (
                <img src={viewItem.avatar as string} alt="" className="h-16 w-16 rounded-full object-cover" />
              )}
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{viewItem.name as string}</p>
                <p className="text-sm text-[var(--text-secondary)]">{viewItem.email as string}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Specialization</p>
                <p className="text-sm text-[var(--text-primary)]">{(viewItem.specialization as string) ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Experience</p>
                <p className="text-sm text-[var(--text-primary)]">{(viewItem.experience as string) ?? "-"} years</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Rating</p>
                <p className="text-sm text-[var(--text-primary)]">{viewItem.rating ? `${Number(viewItem.rating).toFixed(1)} / 5` : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Phone</p>
                <p className="text-sm text-[var(--text-primary)]">{(viewItem.phone as string) ?? "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Bio</p>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{(viewItem.bio as string) ?? "-"}</p>
            </div>
            {getStatus(viewItem) === "APPROVED" && viewItem.commissionPercent != null && (
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Commission</p>
                <p className="text-sm text-[var(--text-primary)]">{viewItem.commissionPercent as number}%</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ApproveAstrologerModal
        astrologer={approveTarget}
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
      />
      <RejectAstrologerModal
        astrologer={rejectTarget}
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
      />
      <SetCommissionModal
        astrologer={commissionTarget}
        isOpen={!!commissionTarget}
        onClose={() => setCommissionTarget(null)}
      />
    </div>
  );
}
