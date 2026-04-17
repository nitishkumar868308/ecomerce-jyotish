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
import { Eye } from "lucide-react";

export default function AstrologerDetailPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useAdminAstrologers({ page, limit: 20, search });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

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
      render: (val) => <Badge variant={val ? "success" : "warning"}>{val ? "Verified" : "Pending"}</Badge>,
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewItem(row)}>
            <Eye className="h-4 w-4" />
          </Button>
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

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No astrologers found" />

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
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
