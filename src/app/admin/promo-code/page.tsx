"use client";

import { useMemo, useState } from "react";
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
import { Tabs } from "@/components/ui/Tabs";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  useAdminPromos,
  useAdminCreatePromo,
  useAdminUpdatePromo,
  useAdminDeletePromo,
  useAdminPromoUsage,
} from "@/services/admin/promo";
import { useAdminUsers } from "@/services/admin/users";
import type {
  PromoCode,
  PromoDiscountType,
  PromoTargetType,
  PromoUsage,
} from "@/types/promo";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Ticket,
  Percent,
  IndianRupee,
  Users,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";

type DialogMode = "create" | "edit" | "view" | null;

interface FormState {
  code: string;
  discountType: PromoDiscountType;
  discountValue: string;
  targetType: PromoTargetType;
  userId: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  targetType: "ALL",
  userId: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

export default function PromoCodePage() {
  const [activeTab, setActiveTab] = useState("manage");

  return (
    <div>
      <PageHeader title="Promo Codes" description="Create promo codes and track usage history" />
      <Tabs
        tabs={[
          { id: "manage", label: "Manage Codes" },
          { id: "usage", label: "Usage History" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-5"
      />
      {activeTab === "manage" ? <ManageTab /> : <UsageTab />}
    </div>
  );
}

// ─── Manage Tab ──────────────────────────────────────────────
function ManageTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<PromoCode | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading } = useAdminPromos({ page, limit: 20, search });
  const { data: users = [] } = useAdminUsers();
  const createMutation = useAdminCreatePromo();
  const updateMutation = useAdminUpdatePromo();
  const deleteMutation = useAdminDeletePromo();

  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        value: String(u.id),
        label: u.name || u.email,
        hint: u.email,
      })),
    [users],
  );

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode("create");
  };

  const openEdit = (p: PromoCode) => {
    setSelected(p);
    const pp = p as any;
    const validFrom = pp.validFrom || "";
    const validTill = pp.validTill || p.validUntil || p.expiresAt || "";
    const eligible = Array.isArray(pp.eligibleUsers) ? pp.eligibleUsers : [];
    const appliesTo: string =
      pp.appliesTo ||
      (eligible.length > 0
        ? "SPECIFIC_USERS"
        : p.targetType === "USER"
          ? "SPECIFIC_USERS"
          : "ALL_USERS");
    setForm({
      code: p.code ?? "",
      discountType: (p.discountType ?? "PERCENTAGE") as PromoDiscountType,
      discountValue: String(p.discountValue ?? p.discountPercent ?? ""),
      targetType: (appliesTo === "SPECIFIC_USERS" ? "USER" : "ALL") as PromoTargetType,
      userId: eligible[0] ? String(eligible[0]) : p.userId ? String(p.userId) : "",
      maxUses: pp.usageLimit
        ? String(pp.usageLimit)
        : p.maxUses
          ? String(p.maxUses)
          : "",
      validFrom: validFrom ? String(validFrom).slice(0, 10) : "",
      validUntil: validTill ? String(validTill).slice(0, 10) : "",
      isActive: pp.active ?? p.isActive ?? true,
    });
    setMode("edit");
  };

  const openView = (p: PromoCode) => {
    setSelected(p);
    setMode("view");
  };

  const handleSubmit = async () => {
    // Backend DTO whitelists: code, appliesTo, discountType, discountValue,
    // usageLimit?, validFrom, validTill, eligibleUsers?, active?. Anything
    // else is rejected (forbidNonWhitelisted: true).
    const today = new Date();
    const validFrom =
      form.validFrom || today.toISOString().slice(0, 10);
    // If no end date, default to one year out so the DTO @IsDateString passes.
    const oneYearOut = new Date(today);
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
    const validTill =
      form.validUntil || oneYearOut.toISOString().slice(0, 10);

    const payload = {
      code: form.code.trim().toUpperCase(),
      appliesTo: form.targetType === "USER" ? "SPECIFIC_USERS" : "ALL_USERS",
      discountType: form.discountType,
      discountValue: Number(form.discountValue || 0),
      usageLimit: form.maxUses ? Number(form.maxUses) : undefined,
      validFrom: new Date(`${validFrom}T00:00:00Z`).toISOString(),
      validTill: new Date(`${validTill}T23:59:59Z`).toISOString(),
      eligibleUsers:
        form.targetType === "USER" && form.userId
          ? [Number(form.userId)]
          : undefined,
      active: form.isActive,
    } as unknown as Partial<PromoCode>;
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
      key: "code",
      label: "Code",
      sortable: true,
      render: (_val, row) => {
        const p = row as unknown as PromoCode;
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
              <Ticket className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{p.code}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "discountValue",
      label: "Discount",
      render: (_val, row) => {
        const p = row as unknown as PromoCode;
        const value = p.discountValue ?? p.discountPercent ?? 0;
        const isPct = (p.discountType ?? "PERCENTAGE") === "PERCENTAGE";
        return (
          <Badge variant={isPct ? "info" : "warning"}>
            {isPct ? `${value}%` : `₹${value}`}
          </Badge>
        );
      },
    },
    {
      key: "appliesTo",
      label: "Target",
      render: (_val, row) => {
        const p = row as any;
        const isUser =
          p.appliesTo === "SPECIFIC_USERS" ||
          p.targetType === "USER" ||
          !!p.userId ||
          (Array.isArray(p.eligibleUsers) && p.eligibleUsers.length > 0);
        return (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            {isUser ? (
              <>
                <UserIcon className="h-3.5 w-3.5" /> Specific user
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5" /> All users
              </>
            )}
          </span>
        );
      },
    },
    {
      key: "usedCount",
      label: "Usage",
      render: (_val, row) => {
        const p = row as any;
        const total = p.usedCount ?? 0;
        const perUser = p.usageLimit ?? p.maxUses;
        return (
          <div className="text-sm">
            <p className="text-[var(--text-primary)]">
              {total}{" "}
              <span className="text-xs text-[var(--text-muted)]">
                {total === 1 ? "redemption" : "redemptions"}
              </span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {perUser ? `Max ${perUser}/user` : "Unlimited / user"}
            </p>
          </div>
        );
      },
    },
    {
      key: "validTill",
      label: "Expires",
      render: (_val, row) => {
        const p = row as any;
        const date = p.validTill || p.validUntil || p.expiresAt;
        return date ? (
          <span className="text-sm text-[var(--text-primary)]">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Never</span>
        );
      },
    },
    {
      key: "active",
      label: "Status",
      render: (_val, row) => {
        const p = row as any;
        const active = p.active ?? p.isActive ?? true;
        return <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const p = row as unknown as PromoCode;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(p)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
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
        <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search promo codes..." className="sm:max-w-sm" />
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Promo Code
        </Button>
      </div>

      <Table
        columns={columns}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="No promo codes found"
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        isOpen={mode === "create" || mode === "edit"}
        onClose={closeDialog}
        title={mode === "edit" ? "Edit Promo Code" : "Add Promo Code"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SAVE20"
          />

          {/* Discount type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">
              <TypeCard
                active={form.discountType === "PERCENTAGE"}
                onClick={() => setForm({ ...form, discountType: "PERCENTAGE" })}
                icon={<Percent className="h-4 w-4" />}
                label="Percentage"
                description="e.g. 20% off"
              />
              <TypeCard
                active={form.discountType === "FLAT"}
                onClick={() => setForm({ ...form, discountType: "FLAT" })}
                icon={<IndianRupee className="h-4 w-4" />}
                label="Flat"
                description="Fixed rupee amount"
              />
            </div>
          </div>

          <Input
            label={form.discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"}
            type="number"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            placeholder={form.discountType === "PERCENTAGE" ? "20" : "500"}
          />

          {/* Target */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Who can use this?</label>
            <div className="grid grid-cols-2 gap-2">
              <TypeCard
                active={form.targetType === "ALL"}
                onClick={() => setForm({ ...form, targetType: "ALL", userId: "" })}
                icon={<Users className="h-4 w-4" />}
                label="All users"
                description="Anyone can redeem"
              />
              <TypeCard
                active={form.targetType === "USER"}
                onClick={() => setForm({ ...form, targetType: "USER" })}
                icon={<UserIcon className="h-4 w-4" />}
                label="Specific user"
                description="Pick a user below"
              />
            </div>
          </div>

          {form.targetType === "USER" && (
            <SearchableSelect
              label="User"
              placeholder="Pick a user"
              options={userOptions}
              value={form.userId}
              onChange={(v) => setForm({ ...form, userId: v as string })}
              clearable
            />
          )}

          <Input
            label="Max uses per user"
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            placeholder="Leave blank for unlimited"
            helperText={
              form.targetType === "USER"
                ? "How many times the picked user can redeem this code"
                : "How many times each shopper can redeem this code"
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Valid from"
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              helperText="Defaults to today"
            />
            <Input
              label="Valid until"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              helperText="Defaults to 1 year out"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
              <p className="text-xs text-[var(--text-muted)]">Allow customers to redeem this code</p>
            </div>
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.code.trim() || !form.discountValue}
              loading={submitting}
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View */}
      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Promo Code" size="lg">
        {selected &&
          (() => {
            const sp = selected as any;
            const eligibleIds: number[] = Array.isArray(sp.eligibleUsers)
              ? sp.eligibleUsers
              : selected.userId
                ? [Number(selected.userId)]
                : [];
            const isSpecific =
              sp.appliesTo === "SPECIFIC_USERS" ||
              selected.targetType === "USER" ||
              eligibleIds.length > 0;
            const eligibleUsers = eligibleIds
              .map((id) => users.find((u) => u.id === id))
              .filter((u): u is NonNullable<typeof u> => !!u);
            const perUserLimit = sp.usageLimit ?? selected.maxUses;

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--accent-primary-light)] to-[var(--bg-card)] p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Code
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-[var(--text-primary)]">
                    {selected.code}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Discount">
                    {(selected.discountType ?? "PERCENTAGE") === "PERCENTAGE"
                      ? `${selected.discountValue ?? selected.discountPercent}%`
                      : `₹${selected.discountValue}`}
                  </Field>
                  <Field label="Target">
                    {isSpecific ? "Specific user" : "All users"}
                  </Field>
                  <Field label="Total redemptions">
                    {selected.usedCount ?? 0}
                  </Field>
                  <Field label="Max uses per user">
                    {perUserLimit ?? "Unlimited"}
                  </Field>
                  <Field label="Valid from">
                    {sp.validFrom
                      ? new Date(sp.validFrom).toLocaleDateString()
                      : "—"}
                  </Field>
                  <Field label="Expires">
                    {sp.validTill || selected.validUntil || selected.expiresAt
                      ? new Date(
                          (sp.validTill ||
                            selected.validUntil ||
                            selected.expiresAt)!,
                        ).toLocaleDateString()
                      : "Never"}
                  </Field>
                </div>

                {/* Eligible users block — only shown for SPECIFIC_USERS
                    codes. Lists every user with name/email so the admin
                    can confirm exactly who this private invite will
                    show up for at checkout. */}
                {isSpecific && (
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      <UserIcon className="h-3.5 w-3.5" />
                      Eligible user{eligibleIds.length === 1 ? "" : "s"} ({eligibleIds.length})
                    </p>
                    {eligibleUsers.length === 0 ? (
                      <p className="text-xs text-[var(--accent-danger)]">
                        No users assigned. Edit the code and pick a user
                        so this invite can be redeemed.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {eligibleUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {u.name || `User #${u.id}`}
                              </p>
                              {u.email && (
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  {u.email}
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-[var(--text-muted)]">
                              #{u.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={closeDialog}>
                    Close
                  </Button>
                  <Button
                    onClick={() => openEdit(selected)}
                    leftIcon={<Edit className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })()}
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
        title="Delete Promo Code"
        message="Are you sure you want to delete this promo code? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

// ─── Usage Tab ───────────────────────────────────────────────
function UsageTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useAdminPromoUsage({ page, limit: 20, search });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "promoCode",
      label: "Code",
      render: (_val, row) => {
        const r = row as unknown as PromoUsage;
        return (
          <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
            {r.promoCode ?? `#${r.promoCodeId}`}
          </span>
        );
      },
    },
    {
      key: "userName",
      label: "User",
      render: (_val, row) => {
        const r = row as unknown as PromoUsage;
        return (
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{r.userName || `User #${r.userId}`}</p>
            {r.userEmail && <p className="text-xs text-[var(--text-muted)]">{r.userEmail}</p>}
          </div>
        );
      },
    },
    {
      key: "orderId",
      label: "Order",
      render: (val) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {val ? `#${val}` : "--"}
        </span>
      ),
    },
    {
      key: "amountBefore",
      label: "Before",
      render: (val) => <span className="text-sm text-[var(--text-primary)]">₹{Number(val || 0).toLocaleString()}</span>,
    },
    {
      key: "discountAmount",
      label: "Discount",
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-danger)]">
          – ₹{Number(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "amountAfter",
      label: "After",
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)]">
          <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          ₹{Number(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "usedAt",
      label: "Used at",
      render: (val) => (val ? new Date(val as string).toLocaleString() : "--"),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <SearchInput onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search by code or user..." className="max-w-sm" />
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          Usage history is not available yet — the backend endpoint may not be deployed. Once it's live, every redemption will appear here with the before and after amount.
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            loading={isLoading}
            emptyMessage="No redemptions yet"
          />
          {data && data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]"
          : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          active ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
    </button>
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
