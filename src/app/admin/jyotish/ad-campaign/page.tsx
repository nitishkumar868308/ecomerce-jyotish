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
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import {
  useAdminAdCampaigns,
  useCreateAdCampaign,
  useUpdateAdCampaign,
  useDeleteAdCampaign,
} from "@/services/admin/jyotish";
import {
  useAdminAllAdBookings,
  useAdminAdConfig,
} from "@/services/jyotish/ad-campaign";
import type { AdCampaign } from "@/types/jyotish";
import { Plus, Edit, Trash2, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogMode = "create" | "edit" | null;

type CampaignForm = {
  title: string;
  price: string;
  capacity: string;
  active: boolean;
};

const emptyForm: CampaignForm = {
  title: "",
  price: "",
  capacity: "",
  active: true,
};

type TopTab = "CAMPAIGNS" | "BOOKINGS";

export default function AdCampaignPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<AdCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  // Top-level tab: admin defined slot templates vs the live per-day
  // bookings astrologers have placed against the AdCampaignConfig rate.
  // Defaults to CAMPAIGNS so existing admin flow is unchanged.
  const [tab, setTab] = useState<TopTab>("CAMPAIGNS");

  const { data, isLoading } = useAdminAdCampaigns({ page, limit: 20, search });
  const createMutation = useCreateAdCampaign();
  const updateMutation = useUpdateAdCampaign();
  const deleteMutation = useDeleteAdCampaign();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogMode("create");
  };

  const openEdit = (c: AdCampaign) => {
    setEditing(c);
    setForm({
      title: c.title,
      price: String(c.price),
      capacity: String(c.capacity),
      active: c.active,
    });
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
    setForm(emptyForm);
  };

  const priceNum = parseFloat(form.price);
  const capNum = parseInt(form.capacity, 10);
  const canSubmit =
    !!form.title.trim() &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    Number.isFinite(capNum) &&
    capNum >= 1;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payload = {
      title: form.title.trim(),
      price: priceNum,
      capacity: capNum,
      active: form.active,
    };
    if (dialogMode === "edit" && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "title", label: "Campaign Title", sortable: true },
    {
      key: "price",
      label: "Slot Price",
      render: (val) => `₹${Number(val).toLocaleString()}`,
    },
    {
      key: "capacity",
      label: "Astrologer Slots",
      render: (val) => String(val),
    },
    {
      key: "active",
      label: "Status",
      render: (val) => (
        <Badge variant={val ? "success" : "danger"}>
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_v, row) => {
        const c = row as unknown as AdCampaign;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(c)}
              aria-label="Edit campaign"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(c.id)}
              aria-label="Delete campaign"
            >
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  const showForm = dialogMode === "create" || dialogMode === "edit";

  return (
    <div>
      <PageHeader
        title="Ad Campaigns"
        description="Admin-defined slot templates and the live astrologer bookings placed against them."
      >
        {tab === "CAMPAIGNS" && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Create Campaign
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("CAMPAIGNS")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "CAMPAIGNS"
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
          )}
        >
          <Plus className="h-4 w-4" />
          Campaign templates
        </button>
        <button
          type="button"
          onClick={() => setTab("BOOKINGS")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "BOOKINGS"
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Astrologer bookings
        </button>
      </div>

      {tab === "CAMPAIGNS" && (
        <>
          <div className="mb-4">
            <SearchInput
              onSearch={handleSearch}
              placeholder="Search campaigns..."
              className="max-w-sm"
            />
          </div>

          <Table
            columns={columns}
            data={(data?.data as Record<string, unknown>[]) ?? []}
            loading={isLoading}
            emptyMessage="No campaigns yet — create the first one."
          />

          {data && data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {tab === "BOOKINGS" && <AdBookingsTable />}

      <Modal
        isOpen={showForm}
        onClose={closeDialog}
        title={dialogMode === "edit" ? "Edit Campaign" : "Create Ad Campaign"}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Diwali 2026 Spotlight"
          />
          <Input
            label="Slot Price (₹)"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. 499"
          />
          <Input
            label="How many astrologer slots?"
            type="number"
            min={1}
            step={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="e.g. 20"
          />
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2">
            <span className="text-sm text-[var(--text-primary)]">Active</span>
            <Switch
              checked={form.active}
              onChange={(next) => setForm({ ...form, active: next })}
              label="Toggle active"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-4">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              loading={submitting}
            >
              {dialogMode === "edit" ? "Save Changes" : "Create"}
            </Button>
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
        title="Delete Campaign"
        message="Delete this campaign? This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

/**
 * Bookings tab — every per-day slot astrologers have bought, newest
 * first. Pulls from the admin-scoped `/admin/ad-campaign/bookings`
 * endpoint so we get the astrologer relation inline (name + email).
 */
function AdBookingsTable() {
  const { data: bookings, isLoading } = useAdminAllAdBookings();
  const { data: config } = useAdminAdConfig();

  const columns: Column<Record<string, any>>[] = [
    {
      key: "astrologer",
      label: "Astrologer",
      render: (_val, row) => {
        const a = row.astrologer as
          | { fullName?: string; displayName?: string; email?: string }
          | undefined;
        if (!a) return <span className="text-[var(--text-muted)]">-</span>;
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
      key: "startDate",
      label: "Start",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "endDate",
      label: "End",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "-",
    },
    {
      key: "days",
      label: "Days",
      render: (val) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {String(val ?? "-")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (val, row) => (
        <span className="font-semibold text-[var(--accent-primary)]">
          {(row.currencySymbol as string) ?? "₹"}
          {Number(val ?? 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const s = String(val ?? "PAID");
        const variant =
          s === "PAID" ? "success" : s === "CANCELLED" ? "danger" : "warning";
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Booked",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString() : "-",
    },
  ];

  return (
    <div>
      {/* {config && (
        <div className="mb-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-secondary)]">
          Current rate:{" "}
          <strong className="text-[var(--text-primary)]">
            {config.currencySymbol}
            {Number(config.pricePerDay).toLocaleString("en-IN")} / day
          </strong>
          {" · "}capacity{" "}
          <strong className="text-[var(--text-primary)]">
            {config.capacityPerDay}
          </strong>
          /day. Change these in the Ad config panel.
        </div>
      )} */}
      <Table
        columns={columns}
        data={bookings ?? []}
        loading={isLoading}
        emptyMessage="No astrologer has booked an ad slot yet."
      />
    </div>
  );
}
