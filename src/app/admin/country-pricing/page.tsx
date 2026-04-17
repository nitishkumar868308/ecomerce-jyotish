"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { useCountryPricing, useCreateCountryPrice, useDeleteCountryPrice } from "@/services/admin/shipping";
import { Plus, Trash2 } from "lucide-react";

export default function CountryPricingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ country: "", currency: "", conversionRate: "" });

  const { data, isLoading } = useCountryPricing({ page, limit: 20, search });
  const createMutation = useCreateCountryPrice();
  const deleteMutation = useDeleteCountryPrice();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      country: form.country,
      currency: form.currency,
      conversionRate: Number(form.conversionRate),
    });
    setModalOpen(false);
    setForm({ country: "", currency: "", conversionRate: "" });
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "country", label: "Country", sortable: true },
    { key: "currency", label: "Currency" },
    {
      key: "conversionRate",
      label: "Conversion Rate",
      sortable: true,
      render: (val) => Number(val).toFixed(4),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id as number)}>
            <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Country Pricing" description="Manage country-specific pricing and currency conversion">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Country Price</Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search country pricing..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No country pricing found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Country Price">
        <div className="space-y-4">
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. United States" />
          <Input label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="e.g. USD" />
          <Input label="Conversion Rate" type="number" value={form.conversionRate} onChange={(e) => setForm({ ...form, conversionRate: e.target.value })} placeholder="e.g. 0.012" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId !== null) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Country Price"
        message="Are you sure you want to delete this country pricing? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
