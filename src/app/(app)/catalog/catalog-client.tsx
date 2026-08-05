"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Loader2, X, FolderOpen,
  Package, ImageIcon, ChevronRight,
} from "lucide-react";

type Category = { id: string; name: string; description: string | null };
type Item = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageData: string | null;
  active: boolean;
};

export function CatalogClient({
  initialCategories,
  initialItems,
}: {
  initialCategories: Category[];
  initialItems: Item[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems]           = useState<Item[]>(initialItems);
  const [activeCatId, setActiveCatId] = useState<string | null>(initialCategories[0]?.id ?? null);

  const [catDialog, setCatDialog]   = useState<{ mode: "add" | "edit"; cat?: Category } | null>(null);
  const [itemDialog, setItemDialog] = useState<{ mode: "add" | "edit"; item?: Item } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "cat" | "item"; id: string; name: string } | null>(null);

  const activeCat  = categories.find(c => c.id === activeCatId) ?? null;
  const visibleItems = items.filter(i => i.categoryId === activeCatId);

  const imageFor = (item: Item) =>
    item.imageData ? `data:image/jpeg;base64,${item.imageData}` : item.imageUrl ?? null;

  // ── Category CRUD ──────────────────────────────────────────────────────────
  const saveCategory = async (name: string, description: string, catId?: string) => {
    const url  = catId ? `/api/catalog/categories/${catId}` : "/api/catalog/categories";
    const method = catId ? "PUT" : "POST";
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    if (!res.ok) throw new Error();
    const saved = await res.json() as Category;
    if (catId) {
      setCategories(prev => prev.map(c => c.id === catId ? saved : c));
    } else {
      setCategories(prev => [...prev, saved]);
      setActiveCatId(saved.id);
    }
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/catalog/categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    setCategories(prev => prev.filter(c => c.id !== id));
    setItems(prev => prev.filter(i => i.categoryId !== id));
    if (activeCatId === id) setActiveCatId(categories.find(c => c.id !== id)?.id ?? null);
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────
  const saveItem = async (data: Partial<Item> & { name: string }, itemId?: string) => {
    const url    = itemId ? `/api/catalog/items/${itemId}` : "/api/catalog/items";
    const method = itemId ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, categoryId: activeCatId }),
    });
    if (!res.ok) throw new Error();
    const saved = await res.json() as Item;
    if (itemId) {
      setItems(prev => prev.map(i => i.id === itemId ? saved : i));
    } else {
      setItems(prev => [...prev, saved]);
    }
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/catalog/items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="flex h-full">
      {/* ── Sidebar: categories ──────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 border-r border-stone-100 flex flex-col bg-stone-50/40">
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">Danh mục</span>
          <button
            onClick={() => setCatDialog({ mode: "add" })}
            className="size-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {categories.length === 0 && (
            <p className="px-3 py-4 text-xs text-stone-400 text-center">Chưa có danh mục</p>
          )}
          {categories.map(cat => (
            <div
              key={cat.id}
              className={cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors",
                activeCatId === cat.id
                  ? "bg-stone-200/70 text-stone-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
              )}
              onClick={() => setActiveCatId(cat.id)}
            >
              <FolderOpen className="size-3.5 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{cat.name}</span>
              <span className="text-xs text-stone-400">{items.filter(i => i.categoryId === cat.id).length}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                <button onClick={() => setCatDialog({ mode: "edit", cat })}
                  className="size-5 rounded flex items-center justify-center hover:bg-stone-200 text-stone-400 hover:text-stone-700">
                  <Pencil className="size-2.5" />
                </button>
                <button onClick={() => setDeleteTarget({ type: "cat", id: cat.id, name: cat.name })}
                  className="size-5 rounded flex items-center justify-center hover:bg-red-50 text-stone-400 hover:text-red-600">
                  <Trash2 className="size-2.5" />
                </button>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main: items ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100">
          <div>
            <h1 className="text-base font-semibold text-stone-900">
              {activeCat ? activeCat.name : "Danh mục sản phẩm"}
            </h1>
            {activeCat?.description && (
              <p className="text-xs text-stone-400 mt-0.5">{activeCat.description}</p>
            )}
          </div>
          {activeCat && (
            <button
              onClick={() => setItemDialog({ mode: "add" })}
              className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700 transition-colors"
            >
              <Plus className="size-3.5" /> Thêm sản phẩm
            </button>
          )}
        </div>

        <div className="px-8 py-6">
          {!activeCat ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-10 text-stone-200 mb-4" />
              <p className="text-sm font-medium text-stone-500 mb-1">Chưa có danh mục nào</p>
              <p className="text-xs text-stone-400 mb-4">Tạo danh mục trước (Ghế, Bàn, Tủ...)</p>
              <button
                onClick={() => setCatDialog({ mode: "add" })}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
              >
                <Plus className="size-3.5" /> Tạo danh mục
              </button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-10 text-stone-200 mb-4" />
              <p className="text-sm font-medium text-stone-500 mb-1">Chưa có sản phẩm</p>
              <p className="text-xs text-stone-400 mb-4">Thêm sản phẩm vào danh mục "{activeCat.name}"</p>
              <button
                onClick={() => setItemDialog({ mode: "add" })}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
              >
                <Plus className="size-3.5" /> Thêm sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  imageSrc={imageFor(item)}
                  onEdit={() => setItemDialog({ mode: "edit", item })}
                  onDelete={() => setDeleteTarget({ type: "item", id: item.id, name: item.name })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      {catDialog && (
        <CategoryDialog
          mode={catDialog.mode}
          cat={catDialog.cat}
          onClose={() => setCatDialog(null)}
          onSave={async (name, desc) => {
            await saveCategory(name, desc, catDialog.cat?.id);
            setCatDialog(null);
          }}
        />
      )}

      {itemDialog && activeCatId && (
        <ItemDialog
          mode={itemDialog.mode}
          item={itemDialog.item}
          onClose={() => setItemDialog(null)}
          onSave={async (data) => {
            await saveItem(data, itemDialog.item?.id);
            setItemDialog(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget.type === "cat") await deleteCategory(deleteTarget.id);
            else await deleteItem(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, imageSrc, onEdit, onDelete }: {
  item: Item; imageSrc: string | null;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative rounded-xl border border-stone-100 bg-white overflow-hidden hover:border-stone-300 transition-colors">
      <div className="aspect-square bg-stone-50 relative">
        {imageSrc ? (
          <Image src={imageSrc} alt={item.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="size-8 text-stone-200" />
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="size-6 rounded-md bg-white/90 flex items-center justify-center shadow text-stone-600 hover:text-stone-900">
            <Pencil className="size-3" />
          </button>
          <button onClick={onDelete}
            className="size-6 rounded-md bg-white/90 flex items-center justify-center shadow text-stone-600 hover:text-red-600">
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-stone-900 truncate">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-stone-400 truncate mt-0.5">{item.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Category dialog ───────────────────────────────────────────────────────────
function CategoryDialog({ mode, cat, onClose, onSave }: {
  mode: "add" | "edit"; cat?: Category;
  onClose: () => void; onSave: (name: string, desc: string) => Promise<void>;
}) {
  const [name, setName] = useState(cat?.name ?? "");
  const [desc, setDesc] = useState(cat?.description ?? "");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!name.trim()) { toast.error("Nhập tên danh mục"); return; }
    setSaving(true);
    try { await onSave(name, desc); toast.success(mode === "add" ? "Đã thêm danh mục" : "Đã lưu"); }
    catch { toast.error("Lỗi, thử lại"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={mode === "add" ? "Thêm danh mục" : "Chỉnh sửa danh mục"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Tên danh mục *">
          <input autoFocus className={inputCls} value={name} onChange={e => setName(e.target.value)}
            placeholder="VD: Ghế, Bàn, Tủ..." onKeyDown={e => e.key === "Enter" && handle()} />
        </Field>
        <Field label="Mô tả">
          <input className={inputCls} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tuỳ chọn" />
        </Field>
      </div>
      <DialogFooter saving={saving} onClose={onClose} onSave={handle} />
    </Modal>
  );
}

// ── Item dialog ───────────────────────────────────────────────────────────────
function ItemDialog({ mode, item, onClose, onSave }: {
  mode: "add" | "edit"; item?: Item;
  onClose: () => void; onSave: (data: { name: string; description: string; imageUrl: string; imageData?: string }) => Promise<void>;
}) {
  const [name, setName]   = useState(item?.name ?? "");
  const [desc, setDesc]   = useState(item?.description ?? "");
  const [imgUrl, setImgUrl] = useState(item?.imageUrl ?? "");
  const [preview, setPreview] = useState<string | null>(
    item?.imageData ? `data:image/jpeg;base64,${item.imageData}` : item?.imageUrl ?? null
  );
  const [imgData, setImgData] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setImgData(result.split(",")[1]);
      setImgUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handle = async () => {
    if (!name.trim()) { toast.error("Nhập tên sản phẩm"); return; }
    setSaving(true);
    try {
      await onSave({ name, description: desc, imageUrl: imgUrl, imageData: imgData });
      toast.success(mode === "add" ? "Đã thêm sản phẩm" : "Đã lưu");
    } catch { toast.error("Lỗi, thử lại"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={mode === "add" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Tên sản phẩm *">
          <input autoFocus className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Ghế ăn Monaco Oak" />
        </Field>
        <Field label="Mô tả cho AI">
          <textarea rows={2} className={cn(inputCls, "resize-none")} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="VD: ghế ăn gỗ sồi chân kim loại màu đen, phong cách Bắc Âu" />
        </Field>
        <Field label="Ảnh sản phẩm">
          <div className="flex gap-3">
            {/* Upload */}
            <div
              className="size-24 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:border-stone-400 transition-colors flex-shrink-0 overflow-hidden bg-stone-50 relative"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
              ) : (
                <ImageIcon className="size-6 text-stone-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <button onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 text-left">
                Chọn file ảnh
              </button>
              <input className={cn(inputCls, "text-xs")} value={imgUrl} onChange={e => { setImgUrl(e.target.value); setPreview(e.target.value || null); setImgData(undefined); }} placeholder="hoặc dán URL ảnh" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </Field>
      </div>
      <DialogFooter saving={saving} onClose={onClose} onSave={handle} />
    </Modal>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <Modal title="Xác nhận xóa" onClose={onClose}>
      <p className="text-sm text-stone-600">Xóa <strong className="text-stone-900">{name}</strong>? Hành động này không thể hoàn tác.</p>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className={cancelBtn}>Hủy</button>
        <button disabled={deleting} onClick={async () => { setDeleting(true); try { await onConfirm(); } catch { toast.error("Xóa thất bại"); setDeleting(false); } }}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
          {deleting && <Loader2 className="size-3.5 animate-spin" />} Xóa
        </button>
      </div>
    </Modal>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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

function DialogFooter({ saving, onClose, onSave }: { saving: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      <button onClick={onClose} className={cancelBtn}>Hủy</button>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50">
        {saving && <Loader2 className="size-3.5 animate-spin" />} Lưu
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400";
const cancelBtn = "rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50";
