"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  INTERIOR_STYLES, LIGHT_SOURCES, KELVIN_TEMPS, ROOM_TYPES,
  IMAGE_SIZES, MATERIALS, materialsForStyle, buildPrompt,
  type Chip, type SizeOption,
} from "@/lib/design-options";

const ORIGINAL_SIZE: SizeOption = { id: "original", label: "Ảnh gốc", ratio: "Gốc", value: "auto", w: 0, h: 0 };

function detectDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ w: 1024, h: 1024 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

function pickClosestSize(w: number, h: number): SizeOption {
  const ratio = w / h;
  if (ratio > 1.3)  return IMAGE_SIZES.find(s => s.id === "landscape")!;
  if (ratio < 0.77) return IMAGE_SIZES.find(s => s.id === "portrait")!;
  return IMAGE_SIZES.find(s => s.id === "square")!;
}

// gpt-image-2 only outputs 3 fixed ratios (1:1, 9:16, 16:9). When the user asks
// for "Kích thước gốc" we center-crop the generated image back to the source
// photo's exact aspect ratio so the result truly matches the original.
function cropImageToAspect(dataUrl: string, aspect: number): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      let cw = iw, ch = ih;
      if (iw / ih > aspect) cw = Math.round(ih * aspect); // too wide → trim sides
      else ch = Math.round(iw / aspect);                  // too tall → trim top/bottom
      const sx = Math.round((iw - cw) / 2), sy = Math.round((ih - ch) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
import { createEditTask, createGenerationTask, pollTasks, suggestFurniture } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/ui/motion-primitives";
import { Loader2, Package, ImagePlus, FileText, Layers, Maximize2, Lightbulb, Thermometer, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Upload } from "@/components/animate-ui/icons/upload";
import { X } from "@/components/animate-ui/icons/x";
import { Download } from "@/components/animate-ui/icons/download";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronUp } from "@/components/animate-ui/icons/chevron-up";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { Check } from "@/components/animate-ui/icons/check";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;
type CatalogItem = { id: string; categoryId: string; name: string; description: string | null; imageUrl: string | null; imageData: string | null };
type CatalogCategory = { id: string; name: string };
type Project = {
  id: string; clientName: string; clientEmail: string | null;
  currentStep: number; settings: Record<string, unknown> | null;
};
type GenSettings = {
  style?: string | null;
  roomType?: string | null;
  lightSources?: string[];
  kelvin?: string | null;
  materials?: string[];
  furniture?: string[];
  customNote?: string | null;
  imageSize?: string | null;
};
type SavedImage = { id: string; url: string | null; b64Json: string | null; prompt: string | null; metadata?: unknown };
type GenResult = { url: string; prompt: string; savedId?: string; settings?: GenSettings };

// ── Style card data ────────────────────────────────────────────────────────────
// Fallback gradients (used when image hasn't loaded yet)
const STYLE_GRADIENTS: Record<string, string> = {
  "modern-luxury": "#0f0f23",
  "japandi":       "#5c4a3a",
  "nordic":        "#d8d0c4",
  "indochine":     "#7a3b1e",
  "neo-classic":   "#16213e",
  "minimalist":    "#e8e4de",
  "mid-century":   "#8b6914",
  "tropical-chic": "#1a4731",
  "industrial":    "#1a1a1a",
  "korean":        "#c8aee0",
  "cinematic":     "#0d0d1a",
  "commercial":    "#1e2a3a",
};
const STYLE_DESC: Record<string, string> = {
  "modern-luxury": "Marble, vàng, sang trọng",
  "japandi":       "Wabi-sabi, gỗ, tối giản",
  "nordic":        "Ấm cúng, trắng, hygge",
  "indochine":     "Thuộc địa, mây tre, nhiệt đới",
  "neo-classic":   "Cổ điển, đối xứng, nhung",
  "minimalist":    "Thuần túy, không gian trống",
  "mid-century":   "Retro, teak, hữu cơ",
  "tropical-chic": "Cây xanh, rattan, breezy",
  "industrial":    "Thô, bê tông, kim loại",
  "korean":        "Pastel, đường cong, tinh tế",
  "cinematic":     "Kịch tính, moody, điện ảnh",
  "commercial":    "Chuyên nghiệp, open plan",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function imgUrl(img: SavedImage): string {
  return img.b64Json ? `data:image/png;base64,${img.b64Json}` : (img.url ?? "");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64UrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step, maxStep, onStepClick }: {
  step: Step; maxStep: Step; onStepClick: (s: Step) => void;
}) {
  const STEPS = [
    { n: 1 as Step, label: "Upload ảnh" },
    { n: 2 as Step, label: "Phong cách" },
    { n: 3 as Step, label: "Tạo ảnh" },
    { n: 4 as Step, label: "Bối cảnh" },
    { n: 5 as Step, label: "Xuất giá" },
  ];
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const visited = s.n <= maxStep && s.n !== step;
        const isClickable = visited;
        const isCurrent = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-1">
            <motion.button
              onClick={() => isClickable && onStepClick(s.n)}
              disabled={!isClickable}
              animate={{ scale: isCurrent ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className={cn(
                "size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                isCurrent    ? "bg-stone-900 text-white" :
                isClickable  ? "bg-stone-400 text-white hover:bg-stone-600 cursor-pointer" :
                               "bg-stone-100 text-stone-400 cursor-default",
              )}
            >
              {isClickable ? <Check className="size-2.5" /> : s.n}
            </motion.button>
            <span
              className={cn(
                "text-xs hidden sm:block transition-colors",
                isCurrent   ? "text-stone-700 font-medium" :
                isClickable ? "text-stone-400 hover:text-stone-600 cursor-pointer" :
                              "text-stone-300",
              )}
              onClick={() => isClickable && onStepClick(s.n)}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-5 h-px mx-1 flex-shrink-0 bg-stone-100 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 origin-left bg-stone-300"
                  initial={false}
                  animate={{ scaleX: s.n < maxStep ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Upload Zone ────────────────────────────────────────────────────────────────
function UploadZone({ files, onAdd, onRemove }: {
  files: { preview: string; name: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-3">
      <motion.div
        animate={{ scale: drag ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
          drag ? "border-stone-400 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/40",
        )}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
          if (dropped.length) onAdd([dropped[0]]);
        }}
      >
        <motion.div
          animate={{ y: drag ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4"
        >
          <Upload className="size-7 text-stone-400" animate={drag} loop={drag} />
        </motion.div>
        <p className="font-semibold text-stone-700 mb-1.5">Kéo & thả ảnh phòng vào đây</p>
        <p className="text-sm text-stone-400 mb-4">hoặc nhấn để chọn file từ máy tính</p>
        <span className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-500 bg-white">
          JPG, PNG, WEBP • Chỉ 1 ảnh phòng
        </span>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const picked = Array.from(e.target.files ?? []);
            if (picked.length) onAdd([picked[0]]);
            e.target.value = "";
          }}
        />
      </motion.div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {files.map((f, i) => (
              <motion.div
                key={f.preview}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="relative group"
              >
                <img src={f.preview} alt={f.name} className="size-24 rounded-xl object-cover border border-stone-200" />
                <button
                  onClick={() => onRemove(i)}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-stone-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-2.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Style Card ─────────────────────────────────────────────────────────────────
function StyleCard({ style, selected, onClick }: { style: Chip; selected: boolean; onClick: () => void }) {
  const fallbackBg = STYLE_GRADIENTS[style.id] ?? "#1a1a1a";
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-xl text-left transition-all duration-150 group block w-full",
          selected
            ? "ring-2 ring-stone-900 ring-offset-2"
            : "ring-1 ring-transparent hover:ring-stone-300",
        )}
        style={{ backgroundColor: fallbackBg }}
      >
        {/* Photo */}
        <img
          src={`/styles/${style.id}.jpg`}
          alt={style.label}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105 block"
          loading="lazy"
        />

        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-stone-900/20 flex items-end justify-end p-2">
            <div className="size-6 rounded-full bg-stone-900 flex items-center justify-center shadow">
              <Check className="size-3.5 text-white" />
            </div>
          </div>
        )}
      </button>

      {/* Label below the card */}
      <p className={cn(
        "text-xs font-semibold text-center truncate leading-tight transition-colors",
        selected ? "text-stone-900" : "text-stone-500",
      )}>
        {style.label}
      </p>
    </div>
  );
}

// ── Size tile (aspect-ratio picker) ──────────────────────────────────────────
function SizeTile({ active, onClick, title, subtitle, w, h, dashed }: {
  active: boolean; onClick: () => void; title: string; subtitle: string;
  w: number; h: number; dashed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-[76px] flex-col items-center gap-2 rounded-xl border p-2.5 transition-all select-none",
        active
          ? "border-stone-900 bg-stone-50 shadow-sm"
          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
      )}
    >
      <div className="flex h-9 items-center justify-center">
        <div
          className={cn(
            "rounded-[3px] transition-colors",
            dashed ? "border-2 border-dashed" : "border-2",
            active ? "border-stone-900 bg-stone-900/10" : "border-stone-300 group-hover:border-stone-400",
          )}
          style={{ width: w, height: h }}
        />
      </div>
      <div className="text-center leading-tight">
        <p className={cn("text-xs font-semibold", active ? "text-stone-900" : "text-stone-600")}>{title}</p>
        <p className="text-[10px] text-stone-400">{subtitle}</p>
      </div>
    </button>
  );
}

// ── Chip Group ─────────────────────────────────────────────────────────────────
function ChipGroup({ label, icon, chips, selected, onToggle }: {
  label: string; icon?: React.ReactNode; chips: Chip[]; selected: Set<string>;
  onToggle: (chip: Chip) => void; multi?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const count = chips.filter(c => selected.has(c.id)).length;
  return (
    <div className="border-b border-stone-100 pb-3">
      <AnimateIcon animateOnHover asChild>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-between py-1.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            {icon}
            {label}
            {count > 0 && (
              <span className="rounded-full bg-stone-900 px-1.5 text-[9px] font-bold leading-4 text-white">{count}</span>
            )}
          </span>
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </AnimateIcon>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          {chips.map(chip => {
            const active = selected.has(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => onToggle(chip)}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all select-none",
                  active
                    ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
                )}
              >
                {active && <Check className="size-3 -ml-0.5" />}
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Floating hero toolbar button ─────────────────────────────────────────────
function ToolButton({ icon, label, onClick, active, danger }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-16 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors",
        active
          ? "bg-stone-900 text-white"
          : danger
            ? "text-stone-500 hover:bg-red-50 hover:text-red-600"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Hero settings (options used to generate the shown image) ──────────────────
function settingsRows(s?: GenSettings): { label: string; value: string }[] {
  if (!s) return [];
  const rows: { label: string; value: string }[] = [];
  if (s.style) rows.push({ label: "Phong cách", value: s.style });
  if (s.roomType) rows.push({ label: "Loại phòng", value: s.roomType });
  if (s.lightSources?.length) rows.push({ label: "Nguồn sáng", value: s.lightSources.join(", ") });
  if (s.kelvin) rows.push({ label: "Nhiệt độ", value: s.kelvin });
  if (s.materials?.length) rows.push({ label: "Vật liệu", value: s.materials.join(", ") });
  if (s.furniture?.length) rows.push({ label: "Nội thất", value: s.furniture.join("; ") });
  if (s.imageSize) rows.push({ label: "Tỉ lệ", value: s.imageSize });
  if (s.customNote) rows.push({ label: "Ghi chú", value: s.customNote });
  return rows;
}

function HeroSettingsInfo({ settings }: { settings?: GenSettings }) {
  const rows = settingsRows(settings);
  if (rows.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Thông số đã dùng cho ảnh này"
          className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-lg bg-white/95 text-stone-500 shadow-lg backdrop-blur-sm transition-colors hover:text-stone-900"
        >
          <Info className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" align="start" className="max-w-[240px]">
        <p className="mb-1 font-semibold">Thông số đã dùng</p>
        <div className="space-y-0.5">
          {rows.map(r => (
            <div key={r.label} className="text-xs leading-relaxed">
              <span className="opacity-60">{r.label}:</span> {r.value}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Catalog Item Picker ────────────────────────────────────────────────────────
function CatalogItemPicker({ categories, items, selected, onToggle }: {
  categories: CatalogCategory[]; items: CatalogItem[];
  selected: Set<string>; onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(categories[0]?.id ?? null);
  const visible = items.filter(i => i.categoryId === activeCat);
  const imgFor = (item: CatalogItem) =>
    item.imageData ? `data:image/jpeg;base64,${item.imageData}` : (item.imageUrl ?? null);

  return (
    <div className="border-b border-stone-100 pb-3">
      <AnimateIcon animateOnHover asChild>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-between py-1.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5"><Package className="size-3" /> Sản phẩm catalog</span>
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </AnimateIcon>
      {expanded && (
        <div className="pt-1.5 space-y-2">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  activeCat === cat.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                )}>
                {cat.name}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="text-[11px] text-stone-400 py-2">Chưa có sản phẩm</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {visible.map(item => {
                const active = selected.has(item.id);
                const src = imgFor(item);
                return (
                  <button key={item.id} onClick={() => onToggle(item.id)}
                    className={cn("relative flex flex-col rounded-lg border overflow-hidden text-left transition-all",
                      active ? "border-stone-800 ring-1 ring-stone-800" : "border-stone-200 hover:border-stone-400",
                    )}>
                    <div className="aspect-square bg-stone-50 relative w-full">
                      {src ? (
                        <Image src={src} alt={item.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="size-4 text-stone-300" />
                        </div>
                      )}
                      {active && (
                        <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
                          <div className="size-5 rounded-full bg-stone-900 flex items-center justify-center">
                            <Check className="size-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1">
                      <p className="text-[11px] font-medium text-stone-800 truncate">{item.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export function ProjectWorkflow({ project, savedImages, sourceImages }: {
  project: Project;
  savedImages: SavedImage[];
  sourceImages: SavedImage[];
}) {
  const router = useRouter();

  const initStep = (): Step => {
    if (savedImages.length > 0 || project.currentStep >= 3) return 3;
    if (project.currentStep >= 2 || sourceImages.length > 0) return 2;
    return 1;
  };
  const [step, setStep] = useState<Step>(initStep);
  const [maxStep, setMaxStep] = useState<Step>(initStep);

  const goToStep = (s: Step) => {
    setStep(s);
    setMaxStep(prev => (s > prev ? s : prev));
  };

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ preview: string; name: string }[]>([]);
  const dbSourceUrls = sourceImages.map(imgUrl).filter(Boolean);

  const addFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    // Only one room photo is allowed — replace any previous one.
    previews.forEach(p => URL.revokeObjectURL(p.preview));
    setUploadedFiles([f]);
    setPreviews([{ preview: URL.createObjectURL(f), name: f.name }]);
  };
  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i].preview);
    setUploadedFiles(prev => prev.filter((_, j) => j !== i));
    setPreviews(prev => prev.filter((_, j) => j !== i));
  };

  // ── Step 2: Style ───────────────────────────────────────────────────────────
  const [roomType, setRoomType] = useState<Chip | null>(() => {
    const id = (project.settings as any)?.roomTypeId;
    return id ? (ROOM_TYPES.find(r => r.id === id) ?? null) : null;
  });
  const [selectedStyle, setSelectedStyle] = useState<Chip | null>(() => {
    const id = (project.settings as any)?.styleId;
    return id ? (INTERIOR_STYLES.find(s => s.id === id) ?? null) : null;
  });
  const [imageSize, setImageSize] = useState<SizeOption>(() => {
    const id = (project.settings as any)?.imageSizeId;
    if (id === "original") return ORIGINAL_SIZE;
    return (id ? IMAGE_SIZES.find(s => s.id === id) : null) ?? ORIGINAL_SIZE;
  });

  // AI furniture suggestions (analyze source image → suggest combos)
  const [furnitureSuggestions, setFurnitureSuggestions] = useState<string[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<Set<string>>(new Set());
  const [analyzingFurniture, setAnalyzingFurniture] = useState(false);

  // ── Step 3: Refinement ──────────────────────────────────────────────────────
  const [lightSources, setLightSources] = useState<Set<string>>(new Set());
  const [kelvin, setKelvin] = useState<Chip | null>(null);
  const [materials, setMaterials] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customNote, setCustomNote] = useState("");
  const [activeSourceFiles, setActiveSourceFiles] = useState<File[]>([]);
  const [refineSource, setRefineSource] = useState<string | null>(null);

  // Catalog
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch("/api/catalog/categories").then(r => r.json()).then(setCatalogCategories).catch(() => {});
    fetch("/api/catalog/items").then(r => r.json()).then(setCatalogItems).catch(() => {});
  }, []);

  // Keep material selection valid: drop any picked material that doesn't fit the current style.
  useEffect(() => {
    const valid = new Set(materialsForStyle(selectedStyle?.id).map(m => m.id));
    setMaterials(prev => {
      const next = new Set([...prev].filter(id => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectedStyle]);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [results, setResults] = useState<GenResult[]>(() =>
    savedImages.map(img => ({
      url: imgUrl(img),
      prompt: img.prompt ?? "",
      savedId: img.id,
      settings: (img.metadata as GenSettings | null) ?? undefined,
    }))
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState(false);

  // Result viewer (hero + variations strip)
  const [heroKey, setHeroKey] = useState<string | null>(null);
  const [heroZoom, setHeroZoom] = useState(false);
  const [confirmDeleteHero, setConfirmDeleteHero] = useState(false);
  const keyOf = (r: GenResult) => r.savedId ?? r.url;

  // Drag-to-scroll for the variations strip. We only capture the pointer once a
  // real drag starts (>4px) so a plain click still reaches the thumbnail button.
  const variationsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false, pointerId: -1, captured: false });
  const onStripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = variationsRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false, pointerId: e.pointerId, captured: false };
  };
  const onStripPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const el = variationsRef.current;
    if (!el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      try { el.setPointerCapture(d.pointerId); d.captured = true; } catch { /* ignore */ }
    }
    if (d.moved) el.scrollLeft = d.scrollLeft - dx;
  };
  const onStripPointerUp = () => {
    const d = dragRef.current;
    if (d.captured) {
      try { variationsRef.current?.releasePointerCapture(d.pointerId); } catch { /* ignore */ }
    }
    d.active = false;
    d.captured = false;
  };

  // Change style/room-type inline (from step 3) without navigating back to step 2
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const persistStyleSettings = (roomTypeId?: string, styleId?: string) => {
    fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { roomTypeId, styleId, imageSizeId: imageSize.id } }),
    }).catch(() => {});
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggle1 = (current: Chip | null, chip: Chip, setter: (v: Chip | null) => void) =>
    setter(current?.id === chip.id ? null : chip);

  const toggleSet = (chip: Chip, setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    setter(prev => { const n = new Set(prev); n.has(chip.id) ? n.delete(chip.id) : n.add(chip.id); return n; });

  const buildCurrentPrompt = () => buildPrompt({
    roomType,
    style: selectedStyle,
    lightSources: LIGHT_SOURCES.filter(s => lightSources.has(s.id)),
    kelvin,
    materials: MATERIALS.filter(m => materials.has(m.id)),
    catalogItems: catalogItems.filter(i => selectedItems.has(i.id)),
    customNote,
    furniture: [...selectedFurniture],
    hasReferenceImage: !!(refineSource || uploadedFiles.length > 0),
  });

  // Analyze the source room photo with a vision model → furniture combo suggestions.
  // `silent` mode (used for the auto-run on entering step 2) suppresses toasts.
  const runFurnitureAnalysis = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    setAnalyzingFurniture(true);
    try {
      const files = await getSourceFiles();
      if (!files[0]) {
        if (!silent) toast.error("Cần có ảnh gốc để AI phân tích");
        return;
      }
      const b64 = await fileToBase64(files[0]);
      const dataUrl = `data:${files[0].type || "image/jpeg"};base64,${b64}`;
      const combos = await suggestFurniture(dataUrl, selectedStyle?.label);
      if (combos.length === 0) {
        if (!silent) toast.error("Không nhận được gợi ý, thử lại");
        return;
      }
      setFurnitureSuggestions(combos);
      if (!silent) toast.success("AI đã gợi ý combo nội thất");
    } catch {
      if (!silent) toast.error("Phân tích ảnh thất bại");
    } finally {
      setAnalyzingFurniture(false);
    }
  };

  // Auto-suggest furniture the first time the user reaches step 2 (if none yet).
  const furnitureAutoRun = useRef(false);
  useEffect(() => {
    if (
      step === 2 &&
      !furnitureAutoRun.current &&
      furnitureSuggestions.length === 0 &&
      !analyzingFurniture
    ) {
      furnitureAutoRun.current = true;
      runFurnitureAnalysis({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const getSourceFiles = async (): Promise<File[]> => {
    if (refineSource) {
      try {
        const url = refineSource;
        const file = url.startsWith("data:")
          ? base64UrlToFile(url, `refine-${Date.now()}.png`)
          : await fetch(url).then(r => r.blob()).then(b => new File([b], `refine-${Date.now()}.png`, { type: "image/png" }));
        return [file];
      } catch { /* fall through */ }
    }
    if (uploadedFiles.length > 0) return uploadedFiles;
    if (activeSourceFiles.length > 0) return activeSourceFiles;
    const files: File[] = [];
    for (const img of sourceImages) {
      const url = imgUrl(img);
      if (!url) continue;
      try {
        if (url.startsWith("data:")) {
          files.push(base64UrlToFile(url, `source-${img.id}.png`));
        } else {
          const blob = await fetch(url).then(r => r.blob());
          files.push(new File([blob], `source-${img.id}.png`, { type: "image/png" }));
        }
      } catch { /* skip */ }
    }
    setActiveSourceFiles(files);
    return files;
  };

  const saveImageToDB = async (url: string, prompt: string, metadata?: GenSettings): Promise<string | undefined> => {
    try {
      const isBase64 = url.startsWith("data:image/");
      const base = isBase64 ? { b64Json: url.split(",")[1], prompt } : { url, prompt };
      const body = { ...base, metadata };
      const res = await fetch(`/api/projects/${project.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return ((await res.json()) as { id: string }).id;
    } catch { /* non-critical */ }
  };

  // ── Step transitions ─────────────────────────────────────────────────────────
  const advanceToStep2 = async () => {
    if (uploadedFiles.length > 0) {
      setSavingStep(true);
      try {
        for (const file of uploadedFiles) {
          const b64 = await fileToBase64(file);
          await fetch(`/api/projects/${project.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ b64Json: b64, type: "room_original" }),
          });
        }
      } catch { /* non-critical */ }
      finally { setSavingStep(false); }
    }
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: 2, status: "in_progress" }),
    }).catch(() => {});
    goToStep(2);
  };

  const handleGenerateFromStyle = async () => {
    if (!selectedStyle) { toast.error("Vui lòng chọn phong cách"); return; }
    setSavingStep(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStep: 3,
          settings: { roomTypeId: roomType?.id, styleId: selectedStyle.id, imageSizeId: imageSize.id },
        }),
      });
      goToStep(3);
      await triggerGenerate();
    } catch {
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSavingStep(false);
    }
  };

  // ── Generation ───────────────────────────────────────────────────────────────
  const triggerGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setGenProgress("Đang khởi tạo...");
    try {
      const prompt = buildCurrentPrompt();
      const genSettings: GenSettings = {
        style: selectedStyle?.label ?? null,
        roomType: roomType?.label ?? null,
        lightSources: LIGHT_SOURCES.filter(s => lightSources.has(s.id)).map(s => s.label),
        kelvin: kelvin?.label ?? null,
        materials: materialsForStyle(selectedStyle?.id).filter(m => materials.has(m.id)).map(m => m.label),
        furniture: [...selectedFurniture],
        customNote: customNote.trim() || null,
        imageSize: imageSize.id === "original" ? "Kích thước gốc" : `${imageSize.ratio} · ${imageSize.label}`,
      };
      const taskId = `${project.id}-${Date.now()}`;
      const files = await getSourceFiles();

      let resolvedSize = imageSize;
      let originalAspect: number | null = null; // crop the result back to this when "Kích thước gốc"
      if (imageSize.id === "original" && files.length > 0) {
        const { w, h } = await detectDimensions(files[0]);
        originalAspect = w / h;
        resolvedSize = pickClosestSize(w, h);
      } else if (imageSize.id === "original") {
        resolvedSize = IMAGE_SIZES[0];
      }

      let task;
      if (files.length > 0) {
        setGenProgress("Đang gửi ảnh lên server...");
        task = await createEditTask(taskId, files, prompt, "gpt-image-2", resolvedSize.value);
      } else {
        task = await createGenerationTask(taskId, prompt, "gpt-image-2", resolvedSize.value);
      }
      setGenProgress("AI đang render... (30–120s)");
      while (true) {
        await new Promise(r => setTimeout(r, 2500));
        const { items } = await pollTasks([task.id]);
        const cur = items[0];
        if (!cur) continue;
        if (cur.elapsed_secs) setGenProgress(`Đang render... ${Math.round(cur.elapsed_secs)}s`);
        if (cur.status === "success") {
          const imgData = cur.data?.[0];
          let url = imgData?.b64_json
            ? `data:image/png;base64,${imgData.b64_json}`
            : (imgData?.url ?? "");
          // Persist backend image URLs as base64 so they survive the AI server
          // restarting or cleaning up temp files (otherwise the link 404s later).
          if (url && !url.startsWith("data:")) {
            try {
              const blob = await fetch(url).then(r => r.blob());
              url = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch { /* keep original url as fallback */ }
          }
          // "Kích thước gốc" → crop the model's fixed-ratio output back to the
          // source photo's exact aspect ratio so the result matches the original.
          if (url && originalAspect && url.startsWith("data:")) {
            try { url = await cropImageToAspect(url, originalAspect); } catch { /* keep uncropped */ }
          }
          if (url) {
            const savedId = await saveImageToDB(url, prompt, genSettings);
            setResults(prev => [{ url, prompt, savedId, settings: genSettings }, ...prev]);
            setHeroKey(savedId ?? url); // focus the freshly generated image
          }
          break;
        }
        if (cur.status === "error") throw new Error(cur.error ?? "Sinh ảnh thất bại");
      }
      toast.success("Ảnh đã được tạo!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setGenError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  };


  const deleteImage = async (result: GenResult) => {
    if (result.savedId) {
      await fetch(`/api/projects/${project.id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: result.savedId }),
      }).catch(() => {});
    }
    setResults(prev => prev.filter(r => r !== result));
    if (refineSource === result.url) setRefineSource(null);
  };

  const download = (url: string, index: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `gp-interior-${project.id}-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const heroResult = results.find(r => keyOf(r) === heroKey) ?? results[0] ?? null;
  const beforeUrl = previews[0]?.preview ?? dbSourceUrls[0] ?? null;

  return (
    <div className="flex h-full flex-col">

      {/* ── Persistent header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-stone-100 px-3 md:px-5 py-3 flex-shrink-0">
        <AnimateIcon animateOnHover asChild>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
        </AnimateIcon>
        <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
          <button
            onClick={() => router.push("/projects")}
            className="text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
          >
            Dự án
          </button>
          <span className="text-stone-300 flex-shrink-0">/</span>
          <span className="font-semibold text-stone-900 truncate">{project.clientName}</span>
        </nav>
        <StepIndicator step={step} maxStep={maxStep} onStepClick={goToStep} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Upload                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto">
          <FadeIn className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
            <p className="text-xs font-semibold text-stone-400 mb-1">Bước 1 / 3</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Upload ảnh phòng</h2>
            <p className="text-sm text-stone-400 mb-8 max-w-md">
              Chụp ảnh phòng thực tế để AI transform theo phong cách bạn chọn.
              Có thể bỏ qua để tạo ảnh từ đầu.
            </p>

            <UploadZone files={previews} onAdd={addFiles} onRemove={removeFile} />

            {/* Show previously uploaded from DB if no new files */}
            {dbSourceUrls.length > 0 && previews.length === 0 && (
              <div className="mt-5">
                <p className="text-xs text-stone-400 mb-2">Ảnh đã upload trước đó:</p>
                <div className="flex flex-wrap gap-2">
                  {dbSourceUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className="size-24 rounded-xl object-cover border border-stone-200" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-10">
              <button
                onClick={() => goToStep(2)}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Bỏ qua, chọn phong cách →
              </button>
              <AnimateIcon animateOnHover asChild>
                <Button onClick={advanceToStep2} disabled={savingStep} className="gap-2">
                  {savingStep
                    ? <><Loader2 className="size-4 animate-spin" /> Đang lưu...</>
                    : <><span>Tiếp tục</span> <ArrowRight className="size-4" /></>
                  }
                </Button>
              </AnimateIcon>
            </div>
          </FadeIn>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Style Selection                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="flex-1 overflow-y-auto">
          <FadeIn className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
            <p className="text-xs font-semibold text-stone-400 mb-1">Bước 2 / 3</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Chọn phong cách</h2>
            <p className="text-sm text-stone-400 mb-8">Chọn phong cách thiết kế nội thất cho dự án.</p>

            {/* Room type */}
            <div className="mb-7">
              <p className="text-xs font-semibold text-stone-500 mb-3">Loại phòng</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map(rt => {
                  const active = roomType?.id === rt.id;
                  return (
                    <button
                      key={rt.id}
                      onClick={() => toggle1(roomType, rt, setRoomType)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-all select-none",
                        active
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
                      )}
                    >
                      {active && <Check className="size-3.5 -ml-0.5" />}
                      {rt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI furniture suggestions */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-stone-500">Đồ nội thất (AI gợi ý)</p>
                <AnimateIcon animateOnHover asChild>
                  <button
                    onClick={() => runFurnitureAnalysis()}
                    disabled={analyzingFurniture}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all disabled:opacity-50"
                  >
                    {analyzingFurniture
                      ? <><Loader2 className="size-3 animate-spin" /> Đang phân tích…</>
                      : <><Sparkles className="size-3.5" /> Phân tích ảnh gốc</>}
                  </button>
                </AnimateIcon>
              </div>
              {furnitureSuggestions.length === 0 ? (
                <p className="text-xs text-stone-400">
                  AI phân tích ảnh gốc và gợi ý các combo đồ nội thất phù hợp với không gian. Chọn combo để đưa vào bản thiết kế.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {furnitureSuggestions.map(f => {
                    const active = selectedFurniture.has(f);
                    return (
                      <button
                        key={f}
                        onClick={() => setSelectedFurniture(prev => {
                          const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n;
                        })}
                        className={cn(
                          "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all select-none text-left",
                          active
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
                        )}
                      >
                        {active && <Check className="size-3 -ml-0.5 flex-shrink-0" />}
                        {f}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Style grid */}
            <div className="mb-7">
              <p className="text-xs font-semibold text-stone-400 mb-3">
                Phong cách {selectedStyle && <span className="text-stone-600 normal-case font-normal">— đã chọn: {selectedStyle.label}</span>}
              </p>
              <StaggerGroup className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {INTERIOR_STYLES.map(s => (
                  <StaggerItem key={s.id}>
                    <StyleCard
                      style={s}
                      selected={selectedStyle?.id === s.id}
                      onClick={() => toggle1(selectedStyle, s, setSelectedStyle)}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>

            {/* Image size */}
            <div className="mb-10">
              <p className="text-xs font-semibold text-stone-500 mb-3">Tỉ lệ ảnh kết quả</p>
              <div className="flex flex-wrap gap-2.5">
                {/* Default: match source */}
                <SizeTile
                  active={imageSize.id === "original"}
                  onClick={() => setImageSize(ORIGINAL_SIZE)}
                  title="Gốc"
                  subtitle="Mặc định"
                  w={26}
                  h={26}
                  dashed
                />
                {IMAGE_SIZES.map(s => {
                  const w = s.w > s.h ? 32 : s.w < s.h ? 18 : 26;
                  const h = s.h > s.w ? 32 : s.h < s.w ? 18 : 26;
                  return (
                    <SizeTile
                      key={s.id}
                      active={imageSize.id === s.id}
                      onClick={() => setImageSize(s)}
                      title={s.ratio}
                      subtitle={s.label}
                      w={w}
                      h={h}
                    />
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <AnimateIcon animateOnHover asChild>
                <button
                  onClick={() => goToStep(1)}
                  className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <ArrowLeft className="size-4" /> Quay lại
                </button>
              </AnimateIcon>
              <AnimateIcon animateOnHover asChild>
                <Button
                  onClick={handleGenerateFromStyle}
                  disabled={!selectedStyle || savingStep || generating}
                  className="gap-2"
                >
                  {savingStep || generating
                    ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</>
                    : <><Sparkles className="size-4" /> Tạo ảnh</>
                  }
                </Button>
              </AnimateIcon>
            </div>
          </FadeIn>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: Generate & Refine                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

          {/* ── Left panel ─────────────────────────────────────────────────── */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-stone-100 bg-stone-50/40 max-h-[42vh] md:max-h-none">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

            {/* Refine source OR original thumbnails */}
            {refineSource ? (
              <div className="border-b border-stone-100 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-stone-400">Đang chỉnh sửa</p>
                  <button
                    onClick={() => setRefineSource(null)}
                    className="text-[10px] text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-0.5"
                  >
                    <X className="size-2.5" /> Bỏ chọn
                  </button>
                </div>
                <div className="relative overflow-hidden rounded-xl border-2 border-stone-800">
                  <img src={refineSource} alt="" className="w-full aspect-video object-cover" />
                </div>
                <p className="text-[10px] text-stone-400 mt-1.5">Chỉnh settings bên dưới rồi nhấn tạo lại</p>
              </div>
            ) : (dbSourceUrls.length > 0 || previews.length > 0) && (
              <div className="border-b border-stone-100 pb-3">
                <p className="text-xs font-semibold text-stone-400 mb-2">Ảnh gốc</p>
                <div className="flex flex-wrap gap-1.5">
                  {(previews.length > 0 ? previews.map(p => p.preview) : dbSourceUrls).slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="size-14 rounded-lg object-cover border border-stone-200" />
                  ))}
                </div>
              </div>
            )}

            {/* Style badge */}
            {selectedStyle && (
              <div className="border-b border-stone-100 pb-3">
                <p className="text-[11px] font-semibold text-stone-500 mb-2">Phong cách</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative overflow-hidden rounded-lg flex-1 min-w-0 h-10"
                    style={{ backgroundColor: STYLE_GRADIENTS[selectedStyle.id] ?? "#1a1a1a" }}>
                    <img
                      src={`/styles/${selectedStyle.id}.jpg`}
                      alt={selectedStyle.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
                    <div className="relative flex items-center px-3 h-full">
                      <span className="text-xs font-semibold text-white truncate">{selectedStyle.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStyleDialogOpen(true)}
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
                  >
                    Đổi
                  </button>
                </div>
              </div>
            )}

            {/* Light sources */}
            <ChipGroup
              label="Nguồn sáng"
              icon={<Lightbulb className="size-3" />}
              chips={LIGHT_SOURCES}
              selected={lightSources}
              onToggle={chip => toggleSet(chip, setLightSources)}
              multi
            />

            {/* Kelvin */}
            <ChipGroup
              label="Nhiệt độ Kelvin"
              icon={<Thermometer className="size-3" />}
              chips={KELVIN_TEMPS}
              selected={new Set(kelvin ? [kelvin.id] : [])}
              onToggle={chip => toggle1(kelvin, chip, setKelvin)}
            />

            {/* Materials — filtered to fit the selected style */}
            <ChipGroup
              label="Vật liệu"
              icon={<Layers className="size-3" />}
              chips={materialsForStyle(selectedStyle?.id)}
              selected={materials}
              onToggle={chip => toggleSet(chip, setMaterials)}
              multi
            />

            {/* Catalog */}
            {catalogItems.length > 0 && (
              <CatalogItemPicker
                categories={catalogCategories}
                items={catalogItems}
                selected={selectedItems}
                onToggle={id => setSelectedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
              />
            )}

            {/* Custom note */}
            <div className="pb-2">
              <p className="mb-2 text-xs font-semibold text-stone-400">Ghi chú thêm</p>
              <Textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Yêu cầu cụ thể..."
                className="text-xs min-h-[60px]"
              />
            </div>
            </div>

            {/* Sticky generate footer — always visible */}
            <div className="flex-shrink-0 border-t border-stone-100 bg-stone-50/80 p-3 backdrop-blur-sm">
              <AnimateIcon animateOnHover asChild>
                <Button size="lg" className="w-full gap-2" onClick={triggerGenerate} disabled={generating}>
                  {generating
                    ? <><Loader2 className="size-4 animate-spin" /> {genProgress || "Đang tạo..."}</>
                    : refineSource
                      ? <><Sparkles className="size-4" /> Tạo lại ảnh này</>
                      : <><Sparkles className="size-4" /> Tạo thêm ảnh</>
                  }
                </Button>
              </AnimateIcon>
            </div>
          </aside>

          {/* ── Right panel: hero result + variations ───────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Kết quả</h2>
                <p className="text-xs text-stone-400 flex items-center gap-1.5">
                  {generating ? (
                    <><Loader2 className="size-3 animate-spin" /> {genProgress || "Đang tạo…"}</>
                  ) : results.length > 0 ? (
                    <><span className="size-1.5 rounded-full bg-emerald-500" /> Hoàn thành · {results.length} ảnh</>
                  ) : "Chưa có ảnh"}
                </p>
              </div>
              {heroResult && (
                <AnimateIcon animateOnHover asChild>
                  <Button variant="outline" size="sm" onClick={() => download(heroResult.url, 0)}>
                    <Download className="size-4" /> Tải về
                  </Button>
                </AnimateIcon>
              )}
            </div>

            {/* Error */}
            {genError && !generating && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 mb-4 flex items-start gap-3 flex-shrink-0">
                <X className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-600 font-semibold mb-0.5">Tạo ảnh thất bại</p>
                  <p className="text-xs text-red-400">{genError}</p>
                </div>
                <button onClick={() => setGenError(null)}>
                  <X className="size-3.5 text-red-300 hover:text-red-500" />
                </button>
              </div>
            )}

            {/* First-generation spinner (no results yet) */}
            {generating && results.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-5">
                  <div className="size-14 rounded-full border-4 border-stone-100 border-t-stone-800 animate-spin" />
                  <div className="absolute inset-0 m-auto flex items-center justify-center">
                    <Sparkles className="size-5 text-stone-600" animate loop loopDelay={400} />
                  </div>
                </div>
                <p className="font-semibold text-stone-700 mb-1">Đang tạo ảnh nội thất...</p>
                <p className="text-sm text-stone-400">{genProgress}</p>
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && !generating && (
              <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                <div className="size-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4">
                  <Sparkles className="size-7 text-stone-300" />
                </div>
                <p className="font-semibold text-stone-600 mb-1">Chưa có ảnh nào</p>
                <p className="text-sm text-stone-400 max-w-xs">
                  Nhấn <strong className="text-stone-600">Tạo thêm ảnh</strong> ở bên trái để bắt đầu.
                </p>
              </div>
            )}

            {/* Hero image */}
            {heroResult && (
              <motion.div
                key={keyOf(heroResult)}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 aspect-[4/3] max-h-[60vh]"
              >
                <img src={heroResult.url} alt="Kết quả" className="h-full w-full object-cover" />

                {/* After badge */}
                <span className="absolute top-3 left-3 rounded-lg bg-stone-900/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  After
                </span>

                {/* Settings info (hover for parameters) */}
                <HeroSettingsInfo settings={heroResult.settings} />

                {/* Generating overlay (regenerating while a result is shown) */}
                {generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-sm">
                    <Loader2 className="size-7 animate-spin text-stone-700" />
                    <p className="text-xs font-medium text-stone-600">{genProgress || "Đang tạo…"}</p>
                  </div>
                )}

                {/* Before inset */}
                {beforeUrl && (
                  <div className="absolute bottom-3 left-3 w-28 overflow-hidden rounded-lg border-2 border-white/80 shadow-lg">
                    <span className="absolute top-1 left-1 z-10 rounded bg-stone-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Before
                    </span>
                    <img src={beforeUrl} alt="Ảnh gốc" className="h-20 w-full object-cover" />
                  </div>
                )}

                {/* Floating action toolbar */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white/95 shadow-lg backdrop-blur-sm">
                  <ToolButton
                    icon={<ImagePlus className="size-4" />}
                    label="Chỉnh sửa"
                    active={refineSource === heroResult.url}
                    onClick={() => setRefineSource(prev => prev === heroResult.url ? null : heroResult.url)}
                  />
                  <ToolButton
                    icon={<Download className="size-4" animateOnHover />}
                    label="Tải về"
                    onClick={() => download(heroResult.url, 0)}
                  />
                  {confirmDeleteHero ? (
                    <div className="flex flex-col border-t border-stone-100">
                      <button
                        onClick={() => { deleteImage(heroResult); setConfirmDeleteHero(false); setHeroKey(null); }}
                        className="flex w-16 items-center justify-center gap-1 bg-red-500 px-2 py-2 text-[10px] font-semibold text-white hover:bg-red-600"
                      >
                        <Check className="size-3" /> Xóa
                      </button>
                      <button
                        onClick={() => setConfirmDeleteHero(false)}
                        className="w-16 px-2 py-1.5 text-[10px] text-stone-500 hover:bg-stone-100"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <ToolButton
                      icon={<X className="size-4" />}
                      label="Xóa"
                      danger
                      onClick={() => setConfirmDeleteHero(true)}
                    />
                  )}
                </div>

                {/* View fullscreen */}
                <button
                  onClick={() => setHeroZoom(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <Maximize2 className="size-3.5" /> Phóng to
                </button>
              </motion.div>
            )}

            {/* Variations strip */}
            {results.length > 0 && (
              <div className="mt-5 flex-shrink-0">
                <p className="mb-2 text-xs font-semibold text-stone-400">
                  Các biến thể ({results.length})
                </p>
                <div
                  ref={variationsRef}
                  onPointerDown={onStripPointerDown}
                  onPointerMove={onStripPointerMove}
                  onPointerUp={onStripPointerUp}
                  onPointerLeave={onStripPointerUp}
                  className="flex gap-2.5 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <AnimatePresence mode="popLayout">
                    {results.map((r, i) => (
                      <motion.button
                        key={keyOf(r)}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        onClick={() => { if (dragRef.current.moved) return; setHeroKey(keyOf(r)); }}
                        className={cn(
                          "relative aspect-[4/3] w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                          keyOf(r) === keyOf(heroResult)
                            ? "border-stone-900"
                            : "border-transparent hover:border-stone-300",
                        )}
                      >
                        <img src={r.url} alt="" draggable={false} className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 rounded bg-stone-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {refineSource === r.url && (
                          <span className="absolute top-1.5 right-1.5 rounded bg-stone-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            Sửa
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change-style popup (from step 3, without leaving the page) */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đổi phong cách</DialogTitle>
          </DialogHeader>

          {/* Room type */}
          <div>
            <p className="text-[11px] font-semibold text-stone-500 mb-2">Loại phòng</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map(rt => {
                const active = roomType?.id === rt.id;
                return (
                  <button
                    key={rt.id}
                    onClick={() => {
                      const next = active ? null : rt;
                      setRoomType(next);
                      persistStyleSettings(next?.id, selectedStyle?.id);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all select-none",
                      active
                        ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
                    )}
                  >
                    {active && <Check className="size-3.5 -ml-0.5" />}
                    {rt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style grid */}
          <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1">
            <p className="text-[11px] font-semibold text-stone-500 mb-2">Phong cách</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {INTERIOR_STYLES.map(s => (
                <StyleCard
                  key={s.id}
                  style={s}
                  selected={selectedStyle?.id === s.id}
                  onClick={() => {
                    setSelectedStyle(s);
                    persistStyleSettings(roomType?.id, s.id);
                    setStyleDialogOpen(false);
                    toast.success(`Đã đổi phong cách: ${s.label}`);
                  }}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero fullscreen zoom */}
      <AnimatePresence>
        {heroZoom && heroResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
            onClick={() => setHeroZoom(false)}
          >
            <motion.img
              src={heroResult.url}
              alt="Zoom"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setHeroZoom(false)}
              className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
