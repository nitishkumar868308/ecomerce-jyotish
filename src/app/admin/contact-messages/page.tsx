"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useContactMessages } from "@/services/admin/messages";
import { Eye } from "lucide-react";

export default function ContactMessagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMessage, setViewMessage] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useContactMessages({ page, limit: 20, search });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email" },
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "isRead",
      label: "Status",
      render: (val) => <Badge variant={val ? "default" : "info"}>{val ? "Read" : "New"}</Badge>,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewMessage(row)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Contact Messages" description="View messages from the contact form" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search messages..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No messages found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={viewMessage !== null} onClose={() => setViewMessage(null)} title="Message Details">
        {viewMessage && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">From</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{viewMessage.name as string} ({viewMessage.email as string})</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Subject</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{viewMessage.subject as string}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Message</p>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{viewMessage.message as string}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Date</p>
              <p className="text-sm text-[var(--text-primary)]">{new Date(viewMessage.createdAt as string).toLocaleString()}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewMessage(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
