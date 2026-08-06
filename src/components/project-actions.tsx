"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-stone-400 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:text-stone-700"
            title="Tùy chọn"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" /> Xóa dự án
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => { setEditOpen(false); router.refresh(); }}
      />
      <DeleteDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => { setDeleteOpen(false); router.refresh(); }}
      />
    </div>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────
function EditDialog({
  project, open, onOpenChange, onSaved,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dự án</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Tên khách hàng *">
            <Input
              autoFocus
              value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.clientEmail}
              onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
            />
          </Field>
          <Field label="Mô tả không gian">
            <Textarea
              rows={3}
              value={form.roomDescription}
              onChange={e => setForm(f => ({ ...f, roomDescription: e.target.value }))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({
  project, open, onOpenChange, onDeleted,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa dự án</DialogTitle>
          <DialogDescription>
            Xóa dự án <strong className="text-stone-900">{project.clientName}</strong>? Tất cả ảnh
            đã tạo sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="size-3.5 animate-spin" />}
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  );
}
