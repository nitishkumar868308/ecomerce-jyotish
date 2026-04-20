"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  useContactMessages,
  useReplyContactMessage,
  useMarkContactRead,
  useDeleteContactMessage,
  type ContactMessage,
} from "@/services/admin/messages";
import { Eye, Mail, Trash2, Send, ExternalLink, Phone } from "lucide-react";

type DialogMode = "view" | "reply" | null;

export default function ContactMessagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [replyForm, setReplyForm] = useState({ subject: "", body: "" });

  const { data, isLoading } = useContactMessages({ page, limit: 20, search });
  const replyMutation = useReplyContactMessage();
  const markReadMutation = useMarkContactRead();
  const deleteMutation = useDeleteContactMessage();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openView = (m: ContactMessage) => {
    setSelected(m);
    setMode("view");
    if (!m.isRead) markReadMutation.mutate(m.id);
  };

  const openReply = (m: ContactMessage) => {
    setSelected(m);
    setReplyForm({
      subject: m.subject ? `Re: ${m.subject}` : "Thanks for reaching out",
      body: "",
    });
    setMode("reply");
  };

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
    setReplyForm({ subject: "", body: "" });
  };

  const handleSendReply = async () => {
    if (!selected) return;
    await replyMutation.mutateAsync({
      id: selected.id,
      subject: replyForm.subject.trim(),
      body: replyForm.body.trim(),
    });
    closeDialog();
  };

  const handleMailto = () => {
    if (!selected) return;
    const body = replyForm.body.trim();
    const subject = replyForm.subject.trim();
    const href = `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  // Auto-compose fallback subject when opening reply
  useEffect(() => {
    if (mode === "reply" && selected && !replyForm.subject) {
      setReplyForm((f) => ({
        ...f,
        subject: selected.subject ? `Re: ${selected.subject}` : "Thanks for reaching out",
      }));
    }
  }, [mode, selected, replyForm.subject]);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "From",
      sortable: true,
      render: (_val, row) => {
        const m = row as unknown as ContactMessage;
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary-light)] text-sm font-semibold text-[var(--accent-primary)]">
              {(m.name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--text-primary)]">{m.name}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{m.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "subject",
      label: "Subject",
      render: (_val, row) => {
        const m = row as unknown as ContactMessage;
        return (
          <div>
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {m.subject || <span className="italic text-[var(--text-muted)]">No subject</span>}
            </p>
            <p className="line-clamp-1 text-xs text-[var(--text-muted)]">{m.message}</p>
          </div>
        );
      },
    },
    {
      key: "isRead",
      label: "Status",
      render: (_val, row) => {
        const m = row as unknown as ContactMessage;
        if (m.repliedAt) return <Badge variant="success">Replied</Badge>;
        return m.isRead ? <Badge variant="default">Read</Badge> : <Badge variant="info">New</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Received",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "--"),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => {
        const m = row as unknown as ContactMessage;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openView(m)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openReply(m)} aria-label="Reply">
              <Mail className="h-4 w-4 text-[var(--accent-primary)]" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-[var(--accent-danger)]" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        description="Read and reply to messages from the contact form"
      />

      <div className="mb-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search messages..."
          className="max-w-sm"
        />
      </div>

      <Table
        columns={columns}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="No messages found"
      />

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* View modal */}
      <Modal isOpen={mode === "view"} onClose={closeDialog} title="Message Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary-light)] text-lg font-semibold text-[var(--accent-primary)]">
                {(selected.name ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[var(--text-primary)]">
                  {selected.name}
                </p>
                <a
                  href={`mailto:${selected.email}`}
                  className="inline-flex items-center gap-1 truncate text-xs text-[var(--accent-primary)] hover:underline"
                >
                  {selected.email}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {selected.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Phone className="h-3 w-3" /> {selected.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Subject
              </p>
              <p className="mt-1 text-base font-medium text-[var(--text-primary)]">
                {selected.subject || (
                  <span className="italic text-[var(--text-muted)]">No subject</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Message
              </p>
              <div className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)]">
                {selected.message}
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Received {new Date(selected.createdAt).toLocaleString()}
            </p>

            <div className="flex justify-end gap-2 border-t border-[var(--border-primary)] pt-3">
              <Button variant="ghost" onClick={closeDialog}>
                Close
              </Button>
              <Button onClick={() => openReply(selected)} leftIcon={<Mail className="h-4 w-4" />}>
                Reply via Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply modal */}
      <Modal isOpen={mode === "reply"} onClose={closeDialog} title="Reply via Email" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">To</span>
                <a
                  href={`mailto:${selected.email}`}
                  className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                >
                  <Mail className="h-3 w-3" /> {selected.email}
                </a>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-[var(--text-primary)]">
                {selected.name}
              </p>
            </div>

            <Input
              label="Subject"
              value={replyForm.subject}
              onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })}
              placeholder="Subject"
            />
            <Textarea
              label="Message"
              value={replyForm.body}
              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
              placeholder={`Hi ${selected.name.split(" ")[0] || "there"},\n\nThank you for reaching out...`}
              rows={8}
            />

            <details className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">
                View original message
              </summary>
              <div className="mt-2 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">
                {selected.message}
              </div>
            </details>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-primary)] pt-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={handleMailto} leftIcon={<ExternalLink className="h-4 w-4" />}>
                Open in mail app
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={closeDialog} disabled={replyMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={replyMutation.isPending || !replyForm.subject.trim() || !replyForm.body.trim()}
                  loading={replyMutation.isPending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send Reply
                </Button>
              </div>
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
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
