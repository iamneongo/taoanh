"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, User, FileText } from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    roomDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Tạo dự án thất bại");
      const data = await res.json() as { id: string };
      toast.success("Đã tạo dự án");
      router.push(`/projects/${data.id}`);
    } catch {
      toast.error("Tạo dự án thất bại, thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="max-w-2xl mx-auto px-8 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      <h1 className="text-xl font-bold text-stone-900 mb-1">Dự án mới</h1>
      <p className="text-sm text-stone-400 mb-8">Nhập thông tin khách hàng để bắt đầu</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client info */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/40 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="size-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Thông tin khách hàng</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Tên khách hàng <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Email</label>
            <Input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              placeholder="khachhang@email.com"
            />
          </div>
        </div>

        {/* Room description */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/40 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Mô tả không gian</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Ghi chú ban đầu
            </label>
            <Textarea
              value={form.roomDescription}
              onChange={(e) => setForm({ ...form, roomDescription: e.target.value })}
              placeholder="Phòng khách 25m², hướng Đông, cần phong cách hiện đại..."
              rows={4}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Đang tạo..." : "Tạo dự án và bắt đầu"}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
    </div>
  );
}
