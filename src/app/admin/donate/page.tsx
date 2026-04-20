"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import {
  useDonations,
  useCreateDonation,
  useUpdateDonation,
  useDeleteDonation,
  useDonationCampaigns,
  useCreateDonationCampaign,
  useUpdateDonationCampaign,
  useDeleteDonationCampaign,
  type Donation,
  type DonationCampaign,
} from "@/services/admin/donations";
import { Plus, Edit, Eye, Trash2, Heart } from "lucide-react";

export default function DonatePage() {
  const [activeTab, setActiveTab] = useState("campaigns");

  return (
    <div>
      <PageHeader title="Donations" description="Manage donation campaigns and track donors" />
      <Tabs
        tabs={[
          { id: "campaigns", label: "Campaigns" },
          { id: "donors", label: "Donors" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-5"
      />
      {activeTab === "campaigns" ? <CampaignsTab /> : <DonorsTab />}
    </div>
  );
}

// ─── Campaigns Tab ──────────────────────────────────────────
type CampaignMode = "create" | "edit" | "view" | null;

interface CampaignForm {
  title: string;
  description: string;
  image: string;
  amounts: string; // comma-separated, e.g. "100, 500, 1000"
  isActive: boolean;
}

const EMPTY_CAMPAIGN: CampaignForm = {
  title: "",
  description: "",
  image: "",
  amounts: "100, 500, 1000, 5000",
  isActive: true,
};

function parseAmounts(input: string): number[] {
  return input
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function CampaignsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<CampaignMode>(null);
  const [selected, setSelected] = useState<DonationCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_CAMPAIGN);

  const { data, isLoading, error } = useDonationCampaigns({ page, limit: 20, search });
  const createMutation = useCreateDonationCampaign();
  const updateMutation = useUpdateDonationCampaign();
  const deleteMutation = useDeleteDonationCampaign();

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_CAMPAIGN);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_CAMPAIGN);
    setMode("create");
  };

  const openEdit = (c: DonationCampaign) => {
    setSelected(c);
    const cc = c as any;
    const arr: number[] = Array.isArray(cc.amounts) ? cc.amounts : [];
    setForm({
      title: c.title ?? "",
      description: c.description ?? "",
      image: c.image ?? "",
      amounts: arr.length ? arr.join(", ") : "",
      isActive: cc.active ?? c.isActive ?? true,
    });
    setMode("edit");
  };

  const openView = (c: DonationCampaign) => {
    setSelected(c);
    setMode("view");
  };

  const handleSubmit = async () => {
    // Backend DTO whitelists exactly: { title, description, amounts[], active? }
    // — image / targetAmount / currency aren't persisted server-side.
    const amounts = parseAmounts(form.amounts);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      amounts,
      active: form.isActive,
    } as any;
    if (mode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "icon",
      label: "",
      render: () => (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--accent-danger)]">
          <Heart className="h-4 w-4" />
        </div>
      ),
    },
    {
      key: "title",
      label: "Campaign",
      sortable: true,
      render: (_val, row) => {
        const c = row as unknown as DonationCampaign;
        return (
          <div>
            <p className="font-medium text-[var(--text-primary)]">{c.title}</p>
            {c.description && (
              <p className="line-clamp-1 text-xs text-[var(--text-muted)]">{c.description}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "amounts",
      label: "Suggested",
      render: (_val, row) => {
        const c = row as any;
        const arr: number[] = Array.isArray(c.amounts) ? c.amounts : [];
        return arr.length ? (
          <span className="text-xs text-[var(--text-secondary)]">
            {arr.map((a) => `₹${a.toLocaleString()}`).join(" · ")}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        );
      },
    },
    {
      key: "raisedAmount",
      label: "Raised",
      render: (_val, row) => {
        const c = row as any;
        const donations = c.userDonations ?? [];
        const total = donations.reduce(
          (sum: number, d: any) => sum + Number(d.amount ?? 0),
          0,
        );
        return (
          <span className="text-sm font-medium text-[var(--accent-primary)]">
            ₹{total.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "active",
      label: "Status",
      render: (_val, row) => {
        const c = row as any;
        const active = c.active ?? c.isActive ?? true;
        return (
          <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const c = row as unknown as DonationCampaign;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(c)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}>
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search campaigns..."
          className="sm:max-w-sm"
        />
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Campaign
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          Campaigns endpoint not available. Add `/donation-campaigns` on the backend to enable.
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            loading={isLoading}
            emptyMessage="No campaigns yet"
          />
          {data && data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Campaign" : "Add Campaign"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Campaign title"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this donation for?"
            rows={3}
          />

          <Input
            label="Suggested amounts (₹)"
            value={form.amounts}
            onChange={(e) => setForm({ ...form, amounts: e.target.value })}
            placeholder="100, 500, 1000, 5000"
            helperText="Comma-separated quick-pick amounts shown to donors"
          />

          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
              <p className="text-xs text-[var(--text-muted)]">Accept donations for this campaign</p>
            </div>
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim()}
              loading={submitting}
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Campaign" size="lg">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{selected.title}</p>
              {selected.description && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{selected.description}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Suggested amounts">
                {Array.isArray((selected as any).amounts) && (selected as any).amounts.length
                  ? (selected as any).amounts.map((a: number) => `₹${a.toLocaleString()}`).join(" · ")
                  : "—"}
              </Field>
              <Field label="Status">
                <Badge variant={(selected as any).active ?? selected.isActive ? "success" : "default"}>
                  {(selected as any).active ?? selected.isActive ? "Active" : "Inactive"}
                </Badge>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog}>Close</Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
            </div>
          </div>
        )}
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
        message="Are you sure you want to delete this campaign? Associated donations will remain."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

// ─── Donors Tab ─────────────────────────────────────────────
type DonorMode = "create" | "edit" | "view" | null;

interface DonorForm {
  name: string;
  email: string;
  phone: string;
  amount: string;
  campaignId: string;
  message: string;
  status: string;
}

const EMPTY_DONOR: DonorForm = {
  name: "",
  email: "",
  phone: "",
  amount: "",
  campaignId: "",
  message: "",
  status: "COMPLETED",
};

function DonorsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DonorMode>(null);
  const [selected, setSelected] = useState<Donation | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<DonorForm>(EMPTY_DONOR);

  const { data, isLoading } = useDonations({ page, limit: 20, search });
  const { data: campaigns } = useDonationCampaigns({ limit: 100 });
  const createMutation = useCreateDonation();
  const updateMutation = useUpdateDonation();
  const deleteMutation = useDeleteDonation();

  const campaignOptions = useMemo(() => campaigns?.data ?? [], [campaigns]);

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_DONOR);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_DONOR);
    setMode("create");
  };

  const openEdit = (d: Donation) => {
    setSelected(d);
    setForm({
      name: d.donorName || d.name || "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      amount: String(d.amount ?? ""),
      campaignId: d.campaignId ? String(d.campaignId) : "",
      message: d.message ?? "",
      status: d.paymentStatus || d.status || "COMPLETED",
    });
    setMode("edit");
  };

  const openView = (d: Donation) => {
    setSelected(d);
    setMode("view");
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      donorName: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      amount: Number(form.amount || 0),
      campaignId: form.campaignId ? Number(form.campaignId) : undefined,
      message: form.message.trim() || undefined,
      paymentStatus: form.status,
      status: form.status,
    };
    if (mode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeDialog();
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "donorName",
      label: "Donor",
      render: (_val, row) => {
        const d = row as unknown as Donation;
        return (
          <div>
            <p className="font-medium text-[var(--text-primary)]">{d.donorName || d.name}</p>
            {d.email && <p className="text-xs text-[var(--text-muted)]">{d.email}</p>}
          </div>
        );
      },
    },
    {
      key: "campaignTitle",
      label: "Campaign",
      render: (_val, row) => {
        const d = row as unknown as Donation;
        return d.campaignTitle ? (
          <span className="text-sm text-[var(--text-primary)]">{d.campaignTitle}</span>
        ) : d.campaignId ? (
          <span className="font-mono text-xs text-[var(--text-muted)]">#{d.campaignId}</span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">General</span>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (val) => (
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          ₹{Number(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Status",
      render: (_val, row) => {
        const d = row as unknown as Donation;
        const s = d.paymentStatus || d.status || "PENDING";
        return (
          <Badge variant={s === "COMPLETED" ? "success" : s === "FAILED" ? "danger" : "warning"}>
            {s}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const d = row as unknown as Donation;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(d)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)}>
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search donors..."
          className="sm:max-w-sm"
        />
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Donation
        </Button>
      </div>

      <Table
        columns={columns}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="No donations yet"
      />
      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Donation" : "Add Donation"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Donor name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
            <Input
              label="Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1000"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="optional"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="optional"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Campaign</label>
            <select
              value={form.campaignId}
              onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="">General donation</option>
              {campaignOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Message (optional)"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={2}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim() || !form.amount}
              loading={submitting}
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Donation Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] p-5 text-center">
              <Heart className="mx-auto h-6 w-6 text-[var(--accent-danger)]" />
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                ₹{Number(selected.amount ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                from {selected.donorName || selected.name}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Email">{selected.email || "—"}</Field>
              <Field label="Phone">{selected.phone || "—"}</Field>
              <Field label="Campaign">{selected.campaignTitle || "General"}</Field>
              <Field label="Status">
                <Badge
                  variant={
                    (selected.paymentStatus || selected.status) === "COMPLETED"
                      ? "success"
                      : (selected.paymentStatus || selected.status) === "FAILED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {selected.paymentStatus || selected.status || "PENDING"}
                </Badge>
              </Field>
            </div>
            {selected.message && (
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Message</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{selected.message}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog}>Close</Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
            </div>
          </div>
        )}
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
        title="Delete Donation"
        message="Are you sure you want to delete this donation record?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm text-[var(--text-primary)]">{children}</p>
    </div>
  );
}
