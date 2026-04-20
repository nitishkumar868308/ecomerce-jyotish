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
import { Badge } from "@/components/ui/Badge";
import {
  useAdminUsers,
  useAdminUpdateUser,
  useAdminDeleteUser,
} from "@/services/admin/users";
import type { User, UserRole } from "@/types/user";
import { resolveAssetUrl } from "@/lib/assetUrl";
import {
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  Clock,
  Users as UsersIcon,
  UserCheck,
  Calendar,
} from "lucide-react";

type DialogMode = "edit" | "view" | null;

const ROLE_OPTIONS: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

function formatRelative(iso?: string | null) {
  if (!iso) return "Never";
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function pickLastLogin(u: User): string | null | undefined {
  return u.lastLoginAt ?? u.lastLogin ?? null;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER" as UserRole,
  });

  const { data: users, isLoading, error } = useAdminUsers();
  const updateMutation = useAdminUpdateUser();
  const deleteMutation = useAdminDeleteUser();

  const rows = useMemo(() => {
    const list = users ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const all = users ?? [];
    const admins = all.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
    const active7d = all.filter((u) => {
      const ll = pickLastLogin(u);
      if (!ll) return false;
      return Date.now() - new Date(ll).getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: all.length, admins, active7d };
  }, [users]);

  const openView = (u: User) => {
    setSelected(u);
    setDialogMode("view");
  };

  const openEdit = (u: User) => {
    setSelected(u);
    setForm({
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      role: u.role ?? "USER",
    });
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelected(null);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
    });
    closeDialog();
  };

  const submitting = updateMutation.isPending;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "__serial",
      label: "#",
      render: (_v, _r, index) => (
        <span className="font-medium text-[var(--text-secondary)]">{index + 1}</span>
      ),
    },
    {
      key: "name",
      label: "User",
      render: (_val, row) => {
        const u = row as unknown as User;
        const src = resolveAssetUrl(u.profileImage || u.avatar);
        return (
          <div className="flex items-center gap-3">
            {src ? (
              <img src={src} alt={u.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-sm font-semibold text-white">
                {(u.name ?? "U").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--text-primary)]">{u.name}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (val) =>
        val ? (
          <span className="text-sm text-[var(--text-primary)]">{val as string}</span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">--</span>
        ),
    },
    {
      key: "role",
      label: "Role",
      render: (val) => {
        const r = val as string;
        const variant: "info" | "default" | "warning" =
          r === "ADMIN" ? "info" : r === "SUPER_ADMIN" ? "warning" : "default";
        return <Badge variant={variant}>{r}</Badge>;
      },
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (_val, row) => {
        const u = row as unknown as User;
        const ll = pickLastLogin(u);
        if (!ll) return <span className="text-xs text-[var(--text-muted)]">Never</span>;
        const ago = formatRelative(ll);
        const isRecent = Date.now() - new Date(ll).getTime() < 7 * 24 * 60 * 60 * 1000;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRecent ? "bg-[var(--accent-success,#10b981)]" : "bg-[var(--text-muted)]"
              }`}
            />
            <span className="text-sm text-[var(--text-primary)]">{ago}</span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const u = row as unknown as User;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(u)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(u.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Users" description="Manage registered users and track login activity" />

      {/* Stats row */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<UsersIcon className="h-5 w-5" />} label="Total Users" value={stats.total} />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Admins" value={stats.admins} tone="info" />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Active (7 days)"
          value={stats.active7d}
          tone="success"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search by name, email or phone..."
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-1">
          {(["ALL", ...ROLE_OPTIONS] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {r === "ALL" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <Table
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
          loading={isLoading}
          emptyMessage={search || roleFilter !== "ALL" ? "No users match your filters" : "No users yet"}
        />
      )}

      {/* Edit */}
      <Modal isOpen={dialogMode === "edit"} onClose={closeDialog} title="Edit User" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
              {resolveAssetUrl(selected.profileImage || selected.avatar) ? (
                <img
                  src={resolveAssetUrl(selected.profileImage || selected.avatar)}
                  alt={selected.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)] text-sm font-semibold text-white">
                  {(selected.name ?? "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {selected.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)] font-mono">
                  ID: {selected.id}
                </p>
              </div>
            </div>
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91..."
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={submitting || !form.name.trim() || !form.email.trim()}
                loading={submitting}
              >
                Update
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View */}
      <Modal isOpen={dialogMode === "view"} onClose={closeDialog} title="User Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] p-5">
              {resolveAssetUrl(selected.profileImage || selected.avatar) ? (
                <img
                  src={resolveAssetUrl(selected.profileImage || selected.avatar)}
                  alt={selected.name}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/30"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-2xl font-bold text-white">
                  {(selected.name ?? "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-[var(--text-primary)]">
                  {selected.name}
                </p>
                <p className="truncate text-sm text-[var(--text-muted)]">{selected.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={selected.role === "ADMIN" ? "info" : selected.role === "SUPER_ADMIN" ? "warning" : "default"}>
                    {selected.role?.replace("_", " ")}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">ID: {selected.id}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile icon={<Phone className="h-4 w-4" />} label="Phone" value={selected.phone} />
              <InfoTile
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={selected.email}
              />
              <InfoTile
                icon={<Shield className="h-4 w-4" />}
                label="Country"
                value={selected.country ?? selected.countryCode}
              />
              <InfoTile
                icon={<Calendar className="h-4 w-4" />}
                label="Joined"
                value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : undefined}
              />
            </div>

            {/* Login activity */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Clock className="h-3.5 w-3.5" /> Login Activity
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Last login</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                    {formatRelative(pickLastLogin(selected))}
                  </p>
                  {pickLastLogin(selected) && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(pickLastLogin(selected)!).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Login count</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                    {selected.loginCount ?? "--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Last updated</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                    {selected.updatedAt ? formatRelative(selected.updatedAt) : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
              <Button onClick={() => openEdit(selected)} leftIcon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
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
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "info" | "success";
}) {
  const accent =
    tone === "info"
      ? "bg-[var(--accent-primary-light)] text-[var(--accent-primary)]"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-500"
        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm text-[var(--text-primary)] truncate">
        {value || <span className="text-[var(--text-muted)]">--</span>}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-12 text-center">
      <AlertCircle className="h-6 w-6 text-[var(--accent-danger)]" />
      <p className="text-sm font-medium text-[var(--text-primary)]">Failed to load users</p>
      <p className="max-w-sm text-xs text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
