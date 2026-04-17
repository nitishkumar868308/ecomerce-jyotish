"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useAdminProfileEditRequests, useApproveProfileEdit, useRejectProfileEdit } from "@/services/admin/jyotish";
import { Eye, Check, X } from "lucide-react";

export default function ProfileEditRequestsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useAdminProfileEditRequests({ page, limit: 20, search });
  const approveMutation = useApproveProfileEdit();
  const rejectMutation = useRejectProfileEdit();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync(id);
  };

  const handleReject = async (id: number) => {
    await rejectMutation.mutateAsync(id);
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "astrologer",
      label: "Astrologer",
      render: (val) => {
        const a = val as { name: string } | undefined;
        return a?.name ?? "-";
      },
    },
    { key: "fieldName", label: "Field", sortable: true },
    { key: "oldValue", label: "Current Value" },
    { key: "newValue", label: "Requested Value" },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = val as string;
        const variant = s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Requested",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const status = row.status as string;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewItem(row)}>
              <Eye className="h-4 w-4" />
            </Button>
            {status === "PENDING" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleApprove(row.id as number)}>
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReject(row.id as number)}>
                  <X className="h-4 w-4 text-[var(--accent-danger)]" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Profile Edit Requests" description="Review astrologer profile edit requests" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search requests..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No edit requests found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={viewItem !== null} onClose={() => setViewItem(null)} title="Edit Request Details">
        {viewItem && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Astrologer</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{(viewItem.astrologer as { name: string })?.name ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Field</p>
              <p className="text-sm text-[var(--text-primary)]">{viewItem.fieldName as string}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Current Value</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap rounded bg-[var(--bg-secondary)] p-2">{(viewItem.oldValue as string) ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Requested Value</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap rounded bg-[var(--bg-secondary)] p-2">{(viewItem.newValue as string) ?? "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Reason</p>
              <p className="text-sm text-[var(--text-primary)]">{(viewItem.reason as string) ?? "-"}</p>
            </div>
            <div className="flex justify-end gap-2">
              {(viewItem.status as string) === "PENDING" && (
                <>
                  <Button variant="ghost" onClick={() => { handleReject(viewItem.id as number); setViewItem(null); }}>Reject</Button>
                  <Button onClick={() => { handleApprove(viewItem.id as number); setViewItem(null); }}>Approve</Button>
                </>
              )}
              {(viewItem.status as string) !== "PENDING" && (
                <Button variant="ghost" onClick={() => setViewItem(null)}>Close</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
