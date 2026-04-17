"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useDonations } from "@/services/admin/donations";

export default function DonatePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useDonations({ page, limit: 20, search });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "donorName", label: "Donor", sortable: true },
    { key: "email", label: "Email" },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => `₹${Number(val).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = val as string;
        return <Badge variant={s === "COMPLETED" ? "success" : s === "FAILED" ? "danger" : "warning"}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Donations" description="View all donations received" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search donations..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No donations found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
