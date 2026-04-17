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
import { useCountryTaxes, useCreateCountryTax } from "@/services/admin/tax";
import { Plus } from "lucide-react";

export default function CountryTaxesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ country: "", taxPercent: "", taxName: "" });

  const { data, isLoading } = useCountryTaxes({ page, limit: 20, search });
  const createMutation = useCreateCountryTax();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      country: form.country,
      taxPercent: Number(form.taxPercent),
      taxName: form.taxName,
    });
    setModalOpen(false);
    setForm({ country: "", taxPercent: "", taxName: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "country", label: "Country", sortable: true },
    { key: "taxName", label: "Tax Name" },
    {
      key: "taxPercent",
      label: "Tax %",
      sortable: true,
      render: (val) => `${val}%`,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Country Taxes" description="Manage tax rates by country">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Tax</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search country taxes..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No country taxes found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Country Tax">
        <div className="space-y-4">
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" />
          <Input label="Tax Name" value={form.taxName} onChange={(e) => setForm({ ...form, taxName: e.target.value })} placeholder="e.g. GST" />
          <Input label="Tax %" type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} placeholder="e.g. 18" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
