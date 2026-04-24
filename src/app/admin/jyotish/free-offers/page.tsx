"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Gift, Inbox, Check, X, Eye, Power } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminFreeOffers,
  useCreateFreeOffer,
  useUpdateFreeOffer,
  useDeleteFreeOffer,
  useAdminProfileEditRequests,
  useApproveProfileEdit,
  useRejectProfileEdit,
  type FreeOfferPayload,
} from "@/services/admin/jyotish";
import {
  useAstrologerFreeOffersAdmin,
  useSetAstrologerFreeOfferActive,
  type AstrologerFreeOfferRow,
} from "@/services/jyotish/sessions";
import type { FreeConsultationOffer } from "@/types/jyotish";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

// The admin-funded offers workflow isn't used yet — flip this to true
// to re-enable the "Admin-funded offers" tab + its "Add Offer" button.
// Keeping the code in place (not deleted) so ops can revive it without
// a git archaeology trip when the feature goes live.
const SHOW_ADMIN_OFFERS = false;

const EMPTY: FreeOfferPayload = {
  title: "",
  description: "",
  astrologerAmount: 0,
  adminAmount: 0,
  sessionsCap: 10,
  startDate: "",
  endDate: "",
  active: true,
};

type TopTab = "ADMIN_OFFERS" | "ASTRO_REQUESTS";

export default function AdminFreeOffersPage() {
  const { data: offers = [], isLoading } = useAdminFreeOffers();
  const createMut = useCreateFreeOffer();
  const updateMut = useUpdateFreeOffer();
  const deleteMut = useDeleteFreeOffer();

  // Second tab: astrologer-submitted free session requests come in
  // via the ProfileEditRequest pipeline with section="Free sessions
  // offer". We reuse the existing admin list hook and filter so we
  // don't have to duplicate the approve/reject pipeline.
  const [tab, setTab] = useState<TopTab>(
    SHOW_ADMIN_OFFERS ? "ADMIN_OFFERS" : "ASTRO_REQUESTS",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FreeConsultationOffer | null>(null);
  const [form, setForm] = useState<FreeOfferPayload>(EMPTY);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (o: FreeConsultationOffer) => {
    setEditTarget(o);
    setForm({
      title: o.title,
      description: o.description ?? "",
      astrologerAmount: o.astrologerAmount,
      adminAmount: o.adminAmount,
      sessionsCap: o.sessionsCap,
      startDate: o.startDate ?? "",
      endDate: o.endDate ?? "",
      active: o.active,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY);
  };

  const invalid =
    form.title.trim().length < 2 ||
    form.astrologerAmount < 0 ||
    form.adminAmount < 0 ||
    form.sessionsCap < 0;

  const handleSubmit = () => {
    if (invalid) return;
    if (editTarget) {
      updateMut.mutate(
        { id: editTarget.id, payload: form },
        {
          onSuccess: () => {
            toast.success("Offer updated");
            closeModal();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
        },
      );
    } else {
      createMut.mutate(form, {
        onSuccess: () => {
          toast.success("Offer created");
          closeModal();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Create failed"),
      });
    }
  };

  const handleDelete = (o: FreeConsultationOffer) => {
    if (!window.confirm(`Delete offer "${o.title}"?`)) return;
    deleteMut.mutate(o.id, {
      onSuccess: () => toast.success("Offer deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  const saving = createMut.isPending || updateMut.isPending;

  const [adminPage, setAdminPage] = useState(1);
  const adminTotalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
  const adminPageItems = useMemo(
    () => offers.slice((adminPage - 1) * PAGE_SIZE, adminPage * PAGE_SIZE),
    [offers, adminPage],
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Free Consultation Offers
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Astrologer-submitted free session campaigns — review, approve or
            reject.
          </p>
        </div>
        {SHOW_ADMIN_OFFERS && tab === "ADMIN_OFFERS" && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Offer
          </button>
        )}
      </div>

      {/* Tab switcher is hidden while admin-funded offers are off —
          only one surface (astrologer requests) is live right now, so
          there's nothing to switch between. Flip SHOW_ADMIN_OFFERS to
          bring the tabs back. */}
      {SHOW_ADMIN_OFFERS && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("ADMIN_OFFERS")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === "ADMIN_OFFERS"
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
            )}
          >
            <Gift className="h-4 w-4" />
            Admin-funded offers
          </button>
          <button
            type="button"
            onClick={() => setTab("ASTRO_REQUESTS")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === "ASTRO_REQUESTS"
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]",
            )}
          >
            <Inbox className="h-4 w-4" />
            Astrologer requests
          </button>
        </div>
      )}

      {tab === "ASTRO_REQUESTS" && <AstrologerFreeRequestsTable />}

      {SHOW_ADMIN_OFFERS && tab === "ADMIN_OFFERS" && (
      <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Astro ₹</th>
              <th className="px-4 py-3">Admin ₹</th>
              <th className="px-4 py-3">Cap / Used</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Loading…</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No free offers yet.</td></tr>
            ) : (
              adminPageItems.map((o) => (
                <tr key={o.id} className="text-[var(--text-primary)]">
                  <td className="px-4 py-3 font-medium">{o.title}</td>
                  <td className="px-4 py-3">₹{o.astrologerAmount}</td>
                  <td className="px-4 py-3">₹{o.adminAmount}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {o.sessionsUsed}/{o.sessionsCap}
                  </td>
                  <td className="px-4 py-3">
                    <span className={o.active ? "inline-flex rounded-full bg-[var(--accent-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-success)]" : "inline-flex rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]"}>
                      {o.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(o)} className="rounded-lg bg-[var(--bg-tertiary)] p-2 hover:bg-[var(--bg-secondary)]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(o)} className="rounded-lg bg-[var(--accent-danger)]/10 p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {adminTotalPages > 1 && (
          <div className="border-t border-[var(--border-primary)] px-4 py-3">
            <Pagination
              currentPage={adminPage}
              totalPages={adminTotalPages}
              onPageChange={setAdminPage}
            />
          </div>
        )}
      </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {editTarget ? "Edit free offer" : "Add free offer"}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-[var(--text-secondary)]">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[var(--text-secondary)]">Description</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[var(--text-secondary)]">Sessions Cap</label>
                <input
                  type="number" min={0}
                  value={form.sessionsCap}
                  onChange={(e) => setForm({ ...form, sessionsCap: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Astrologer share (₹)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={form.astrologerAmount}
                  onChange={(e) => setForm({ ...form, astrologerAmount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Admin share (₹)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={form.adminAmount}
                  onChange={(e) => setForm({ ...form, adminAmount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">Start date</label>
                <input
                  type="date"
                  value={form.startDate ?? ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)]">End date</label>
                <input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <label className="col-span-2 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={invalid || saving} className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────── Astrologer requests tab ──────────
 *
 * Reads the existing profile-edit-request pipeline and filters to
 * rows with section="Free sessions offer" — the astrologer dashboard
 * writes here when they submit a campaign. The payable-to-admin
 * numbers the astrologer saw on their side are mirrored verbatim in
 * the `fields.freeOffer` payload, so the admin sees exactly what the
 * astrologer committed to pay.
 */
function AstrologerFreeRequestsTable() {
  const { data, isLoading } = useAdminProfileEditRequests();
  const approve = useApproveProfileEdit();
  const reject = useRejectProfileEdit();
  const [viewItem, setViewItem] = useState<Record<string, any> | null>(null);
  const { data: liveOffers = [] } = useAstrologerFreeOffersAdmin();
  const setActive = useSetAstrologerFreeOfferActive();

  const rows = useMemo(() => {
    const raw = (data?.data ?? []) as Array<Record<string, any>>;
    return raw.filter(
      (r) =>
        String(r.section ?? "")
          .toLowerCase()
          .includes("free sessions"),
    );
  }, [data]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  const statusOf = (r: Record<string, any>) =>
    String(r.overallStatus ?? r.status ?? "PENDING").toUpperCase();

  return (
    <>
    {/* Live / approved offers — admin can deactivate with one click.
        Deactivating stops new sessions from attaching the offer but
        leaves any already-live session untouched (its freeMinutesGranted
        was snapshot on accept). */}
    <LiveOffersPanel
      offers={liveOffers}
      onToggle={(row) =>
        setActive.mutate({ id: row.id, active: !row.active })
      }
      pending={setActive.isPending}
    />

    <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)]">
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        Submitted requests
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
          <tr>
            <th className="px-4 py-3">Astrologer</th>
            <th className="px-4 py-3">Offer</th>
            <th className="px-4 py-3">Rate</th>
            <th className="px-4 py-3">Minutes × uses</th>
            <th className="px-4 py-3">Pays admin/user</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {isLoading ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-[var(--text-tertiary)]"
              >
                Loading requests…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-[var(--text-tertiary)]"
              >
                No astrologer-submitted free-session requests yet.
              </td>
            </tr>
          ) : (
            pageItems.map((r) => {
              const offer = (r.fields?.freeOffer ?? {}) as Record<string, any>;
              const astro = r.astrologer as
                | { fullName?: string; displayName?: string; email?: string }
                | undefined;
              const status = statusOf(r);
              const statusCls =
                status === "APPROVED" || status === "FULFILLED"
                  ? "bg-[var(--accent-success)]/10 text-[var(--accent-success)]"
                  : status === "REJECTED"
                    ? "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]"
                    : "bg-[var(--jy-accent-gold)]/10 text-[var(--jy-accent-gold)]";
              return (
                <tr key={r.id} className="text-[var(--text-primary)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {astro?.displayName ?? astro?.fullName ?? "(unnamed)"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {astro?.email ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate">{offer.title ?? "—"}</p>
                    {offer.description && (
                      <p className="max-w-[220px] truncate text-[11px] text-[var(--text-muted)]">
                        {offer.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    ₹{Number(offer.ratePerMinute ?? 0).toLocaleString("en-IN")}
                    <span className="text-[11px] text-[var(--text-muted)]">
                      /min
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {offer.minutesPerSession ?? 0} × {offer.usesPerUser ?? 0}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--jy-accent-gold,#eab308)]">
                    ₹
                    {Number(offer.payablePerUser ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        statusCls,
                      )}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewItem(r)}
                        className="rounded-lg bg-[var(--bg-tertiary)] p-2 hover:bg-[var(--bg-secondary)]"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              approve.mutate(r.id as number, {
                                onSuccess: () =>
                                  toast.success("Approved"),
                              })
                            }
                            className="rounded-lg bg-[var(--accent-success)]/10 p-2 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20"
                            aria-label="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reject.mutate(
                                { id: r.id as number },
                                {
                                  onSuccess: () =>
                                    toast.success("Rejected"),
                                },
                              )
                            }
                            className="rounded-lg bg-[var(--accent-danger)]/10 p-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20"
                            aria-label="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="border-t border-[var(--border-primary)] px-4 py-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewItem(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
                  Astrologer free-offer request
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {viewItem.fields?.freeOffer?.title ?? "Offer"}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  by{" "}
                  {viewItem.astrologer?.displayName ??
                    viewItem.astrologer?.fullName ??
                    "(unnamed)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <DetailRow
                label="Times per user"
                value={`${viewItem.fields?.freeOffer?.usesPerUser ?? 0}`}
              />
              <DetailRow
                label="Minutes / session"
                value={`${viewItem.fields?.freeOffer?.minutesPerSession ?? 0} min`}
              />
              <DetailRow
                label="Rate"
                value={`₹${Number(viewItem.fields?.freeOffer?.ratePerMinute ?? 0).toLocaleString("en-IN")}/min`}
              />
              <DetailRow
                label="Gross value / user"
                value={`₹${Number(viewItem.fields?.freeOffer?.grossValuePerUser ?? 0).toLocaleString("en-IN")}`}
              />
              <DetailRow
                label="Admin share / user"
                value={`₹${Number(viewItem.fields?.freeOffer?.adminPayoutPerUser ?? 0).toLocaleString("en-IN")}`}
              />
              <DetailRow
                label="GST / user"
                value={`₹${Number(viewItem.fields?.freeOffer?.gstPerUser ?? 0).toLocaleString("en-IN")}`}
              />
              <DetailRow
                label="Payable to admin / user"
                value={`₹${Number(viewItem.fields?.freeOffer?.payablePerUser ?? 0).toLocaleString("en-IN")}`}
                highlight
              />
              {viewItem.fields?.freeOffer?.startDate && (
                <DetailRow
                  label="Window"
                  value={`${viewItem.fields.freeOffer.startDate} → ${viewItem.fields.freeOffer.endDate ?? "∞"}`}
                />
              )}
            </dl>

            {viewItem.reason && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Astrologer note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {viewItem.reason}
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {statusOf(viewItem) === "PENDING" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      reject.mutate(
                        { id: viewItem.id as number },
                        {
                          onSuccess: () => {
                            toast.success("Rejected");
                            setViewItem(null);
                          },
                        },
                      );
                    }}
                    className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      approve.mutate(viewItem.id as number, {
                        onSuccess: () => {
                          toast.success("Approved");
                          setViewItem(null);
                        },
                      });
                    }}
                    className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/**
 * Live-offers panel for the admin free-offers screen. Shows every
 * AstrologerFreeOffer row the backend has — status (active/inactive/
 * expired), who owns it, usage so far — with a one-click toggle on
 * each. Intentionally lightweight: this is a power-ops view, not a
 * public dashboard.
 */
function LiveOffersPanel({
  offers,
  onToggle,
  pending,
}: {
  offers: AstrologerFreeOfferRow[];
  onToggle: (row: AstrologerFreeOfferRow) => void;
  pending: boolean;
}) {
  if (!offers.length) return null;
  const now = Date.now();
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border-primary)]">
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        Active / past offers
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-secondary)]/60 text-left text-[var(--text-secondary)]">
          <tr>
            <th className="px-4 py-3">Astrologer</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Minutes / uses</th>
            <th className="px-4 py-3">Window</th>
            <th className="px-4 py-3">Redemptions</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-primary)]">
          {offers.map((o) => {
            const start = o.startDate ? new Date(o.startDate).getTime() : -Infinity;
            const end = o.endDate ? new Date(o.endDate).getTime() : Infinity;
            const expired = end < now;
            const notYetLive = start > now;
            const status = !o.active
              ? { label: "Inactive", cls: "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]" }
              : expired
                ? { label: "Expired", cls: "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]" }
                : notYetLive
                  ? { label: "Scheduled", cls: "bg-[var(--jy-accent-gold,#eab308)]/15 text-[var(--jy-accent-gold,#eab308)]" }
                  : { label: "Live", cls: "bg-[var(--accent-success)]/10 text-[var(--accent-success)]" };
            const astro = o.astrologer;
            const astroName = astro?.displayName || astro?.fullName || `#${o.astrologerId}`;
            return (
              <tr key={o.id} className="text-[var(--text-primary)]">
                <td className="px-4 py-3">
                  <p className="font-medium">{astroName}</p>
                  {astro?.email && (
                    <p className="text-[11px] text-[var(--text-muted)]">{astro.email}</p>
                  )}
                </td>
                <td className="px-4 py-3">{o.title}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {o.minutesPerSession} min × {o.usesPerUser}/user
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-[12px]">
                  {o.startDate
                    ? new Date(o.startDate).toLocaleDateString()
                    : "—"}
                  {" → "}
                  {o.endDate ? new Date(o.endDate).toLocaleDateString() : "∞"}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {o._count?.sessions ?? 0} sessions · {o._count?.usages ?? 0} users
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      status.cls,
                    )}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onToggle(o)}
                    disabled={pending}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                      o.active
                        ? "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20"
                        : "bg-[var(--accent-success)]/10 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20",
                      pending && "opacity-60",
                    )}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {o.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        highlight &&
          "col-span-2 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-3",
      )}
    >
      <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-semibold",
          highlight
            ? "text-[var(--accent-primary)]"
            : "text-[var(--text-primary)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
