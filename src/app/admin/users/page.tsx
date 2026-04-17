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
import { useAdminUsers, useAdminUpdateUser } from "@/services/admin/users";
import { Edit, Eye } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<Record<string, unknown> | null>(null);
  const [role, setRole] = useState("");

  const { data, isLoading } = useAdminUsers({ page, limit: 20, search });
  const updateMutation = useAdminUpdateUser();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleUpdate = async () => {
    if (editUser) {
      await updateMutation.mutateAsync({ id: editUser.id as number, role });
      setEditUser(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (val) => {
        const r = val as string;
        return <Badge variant={r === "ADMIN" ? "info" : "default"}>{r}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (val) => new Date(val as string).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditUser(row); setRole(row.role as string); }}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" description="Manage registered users" />

      <div className="mb-4">
        <SearchInput onSearch={handleSearch} placeholder="Search users..." className="max-w-sm" />
      </div>

      <Table columns={columns} data={(data?.data as Record<string, unknown>[]) ?? []} loading={isLoading} emptyMessage="No users found" />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={editUser !== null} onClose={() => setEditUser(null)} title="Edit User Role">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">{editUser?.name as string} ({editUser?.email as string})</p>
          <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. USER, ADMIN" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
