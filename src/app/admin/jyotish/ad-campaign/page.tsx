"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { useAdminAdCampaigns, useCreateAdCampaign } from "@/services/admin/jyotish";
import { Plus } from "lucide-react";

export default function AdCampaignPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", astrologerId: "", startDate: "", endDate: "", budget: "" });

  const { data, isLoading } = useAdminAdCampaigns({ page, limit: 20, search });
  const createMutation = useCreateAdCampaign();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      title: form.title,
      astrologerId: Number(form.astrologerId),
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget),
    });
    setModalOpen(false);
    setForm({ title: "", astrologerId: "", startDate: "", endDate: "", budget: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "title", label: "Campaign Title", sortable: true },
    {
      key: "astrologer",
      label: "Astrologer",
      render: (val) => {
        const a = val as { name: string } | undefined;
        return a?.name ?? "-";
      },
    },
    {
      key: "budget",
      label: "Budget",
      sortable: true,
      render: (val) => `₹${Number(val).toLocaleString()}`,
    },
    {
      key: "startDate",
      label: "Start",
      render: (val) => val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "endDate",
      label: "End",
      render: (val) => val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => <Badge variant={val ? "success" : "danger"}>{val ? "Active" : "Inactive"}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Ad Campaigns" description="Manage Jyotish ad campaigns">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Create Campaign</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search campaigns..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No campaigns found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Ad Campaign">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campaign title" />
          <Input label="Astrologer ID" value={form.astrologerId} onChange={(e) => setForm({ ...form, astrologerId: e.target.value })} placeholder="Astrologer ID" />
          <Input label="Budget (₹)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="e.g. 5000" />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
