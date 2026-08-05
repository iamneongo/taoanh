"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  clientName: string;
  clientEmail: string | null;
  roomDescription: string | null;
  status: string;
};

export function ProjectActions({ project }: { project: Project }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.preventDefault()}
      >
        <button
          onClick={() => setEditOpen(true)}
          className="size-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="Chỉnh sửa"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="size-7 rounded-md flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Xóa dự án"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {editOpen && (
        <EditDialog
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh(); }}
        />
      )}

      {deleteOpen && (
        <DeleteDialog
          project={project}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => { setDeleteOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────
function EditDialog({
  project, onClose, onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    clientName: project.clientName,
    clientEmail: project.clientEmail ?? "",
    roomDescription: project.roomDescription ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.clientName.trim()) { toast.error("Tên khách hàng không được để trống"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã lưu");
      onSaved();
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Chỉnh sửa dự án">
      <div className="space-y-4">
        <Field label="Tên khách hàng *">
          <input
            autoFocus
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
            value={form.clientName}
            onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
            value={form.clientEmail}
            onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
          />
        </Field>
        <Field label="Mô tả không gian">
          <textarea
            rows={3}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 resize-none"
            value={form.roomDescription}
            onChange={e => setForm(f => ({ ...f, roomDescription: e.target.value }))}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          Lưu
        </button>
      </div>
    </Modal>
  );
}

// ── Delete dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({
  project, onClose, onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa dự án");
      onDeleted();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Xóa dự án">
      <p className="text-sm text-stone-600">
        Xóa dự án <strong className="text-stone-900">{project.clientName}</strong>?
        Tất cả ảnh đã tạo sẽ bị xóa vĩnh viễn.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
        >
          Hủy
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting && <Loader2 className="size-3.5 animate-spin" />}
          Xóa
        </button>
      </div>
    </Modal>
  );
}

// ── Shared modal shell ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="size-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</label>
      {children}
    </div>
  );
}
