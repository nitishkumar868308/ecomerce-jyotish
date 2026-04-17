"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ENDPOINTS } from "@/lib/api";
import type { Address } from "@/types/user";
import toast from "react-hot-toast";

export function AddressManager() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India" });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => { const { data } = await api.get(ENDPOINTS.ADDRESS.LIST); return data.data as Address[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (editAddress) {
        return api.put(ENDPOINTS.ADDRESS.UPDATE(editAddress.id), payload);
      }
      return api.post(ENDPOINTS.ADDRESS.CREATE, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setModalOpen(false);
      setEditAddress(null);
      toast.success(editAddress ? "Address updated!" : "Address added!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(ENDPOINTS.ADDRESS.DELETE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setDeleteId(null);
      toast.success("Address deleted!");
    },
  });

  const openCreate = () => {
    setEditAddress(null);
    setForm({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India" });
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditAddress(addr);
    setForm({ name: addr.name, phone: addr.phone, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || "", city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country });
    setModalOpen(true);
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Addresses</h2>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add New</Button>
      </div>

      {!addresses?.length ? (
        <EmptyState icon={MapPin} title="No addresses" description="Add a delivery address to get started." action={{ label: "Add Address", onClick: openCreate }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} padding="md" className="relative">
              {addr.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--accent-success-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-success)]">
                  <Check className="h-3 w-3" /> Default
                </span>
              )}
              <p className="font-semibold text-[var(--text-primary)]">{addr.name}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{addr.addressLine1}</p>
              {addr.addressLine2 && <p className="text-sm text-[var(--text-secondary)]">{addr.addressLine2}</p>}
              <p className="text-sm text-[var(--text-secondary)]">{addr.city}, {addr.state} {addr.pincode}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{addr.phone}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(addr)} leftIcon={<Edit className="h-3 w-3" />}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(addr.id)} leftIcon={<Trash2 className="h-3 w-3" />} className="text-[var(--accent-danger)]">Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAddress ? "Edit Address" : "Add Address"}>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4 p-1">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required fullWidth />
          <Input label="Address Line 1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} required fullWidth />
          <Input label="Address Line 2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} fullWidth />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editAddress ? "Update" : "Add"} Address</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Delete Address" message="Are you sure you want to delete this address?" variant="danger" />
    </div>
  );
}

export default AddressManager;
