"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERIOR_STYLES, LIGHT_SOURCES, KELVIN_TEMPS, ROOM_TYPES,
  IMAGE_SIZES, MATERIALS, buildPrompt,
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
import { createEditTask, createGenerationTask, pollTasks } from "@/lib/api";
import {
  Upload, X, Download, Sparkles, Loader2,
  ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
  Check, Package, RefreshCw, ImagePlus, FileText, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;
type CatalogItem = { id: string; categoryId: string; name: string; description: string | null; imageUrl: string | null; imageData: string | null };
type CatalogCategory = { id: string; name: string };
type Project = {
  id: string; clientName: string; clientEmail: string | null;
  currentStep: number; settings: Record<string, unknown> | null;
};
type SavedImage = { id: string; url: string | null; b64Json: string | null; prompt: string | null };
type GenResult = { url: string; prompt: string; savedId?: string };

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
        return (
          <div key={s.n} className="flex items-center gap-1">
            <button
              onClick={() => isClickable && onStepClick(s.n)}
              disabled={!isClickable}
              className={cn(
                "size-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0",
                step === s.n  ? "bg-stone-900 text-white" :
                isClickable   ? "bg-stone-400 text-white hover:bg-stone-600 cursor-pointer" :
                                "bg-stone-100 text-stone-400 cursor-default",
              )}
            >
              {isClickable ? <Check className="size-2.5" /> : s.n}
            </button>
            <span
              className={cn(
                "text-xs hidden sm:block transition-colors",
                step === s.n ? "text-stone-700 font-medium" :
                isClickable  ? "text-stone-400 hover:text-stone-600 cursor-pointer" :
                               "text-stone-300",
              )}
              onClick={() => isClickable && onStepClick(s.n)}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("w-5 h-px mx-1 flex-shrink-0", s.n < maxStep ? "bg-stone-300" : "bg-stone-100")} />
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
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
          drag ? "border-stone-400 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/40",
        )}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
          if (dropped.length) onAdd(dropped);
        }}
      >
        <div className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <Upload className="size-7 text-stone-400" />
        </div>
        <p className="font-semibold text-stone-700 mb-1.5">Kéo & thả ảnh phòng vào đây</p>
        <p className="text-sm text-stone-400 mb-4">hoặc nhấn để chọn file từ máy tính</p>
        <span className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-500 bg-white">
          JPG, PNG, WEBP • Có thể chọn nhiều ảnh
        </span>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            const picked = Array.from(e.target.files ?? []);
            if (picked.length) onAdd(picked);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img src={f.preview} alt={f.name} className="size-24 rounded-xl object-cover border border-stone-200" />
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-stone-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
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

// ── Chip Group ─────────────────────────────────────────────────────────────────
function ChipGroup({ label, chips, selected, onToggle, multi = false }: {
  label: string; chips: Chip[]; selected: Set<string>;
  onToggle: (chip: Chip) => void; multi?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border-b border-stone-100 pb-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
      >
        {label}
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {chips.map(chip => {
            const active = selected.has(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => onToggle(chip)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all select-none",
                  active
                    ? "border-stone-800 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
                )}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────────
function ResultCard({ result, isRefineSource, onDownload, onRefine, onUseAsSource, onDelete }: {
  result: GenResult;
  isRefineSource: boolean;
  onDownload: () => void;
  onRefine: () => void;
  onUseAsSource: () => void;
  onDelete: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
    <>
      <div className={cn(
        "group relative overflow-hidden rounded-xl border bg-white transition-all",
        isRefineSource ? "border-stone-800 ring-2 ring-stone-800 ring-offset-1" : "border-stone-100",
      )}>
        <div className="relative aspect-square cursor-zoom-in overflow-hidden" onClick={() => setZoom(true)}>
          <img src={result.url} alt="Generated" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          {isRefineSource && (
            <div className="absolute top-2 left-2 rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-semibold text-white">
              Đang chỉnh sửa
            </div>
          )}
        </div>
        <div className="flex gap-0.5 p-1.5">
          <button
            onClick={onRefine}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs transition-colors",
              isRefineSource
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
            )}
          >
            <ImagePlus className="size-3" /> Chỉnh sửa
          </button>
          <button
            onClick={onUseAsSource}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors"
          >
            <RefreshCw className="size-3" /> Làm ảnh gốc
          </button>
          <button
            onClick={onDownload}
            className="flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs text-stone-400 hover:bg-stone-50 hover:text-stone-800 transition-colors"
          >
            <Download className="size-3" />
          </button>
          {confirmingDelete ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { setConfirmingDelete(false); onDelete(); }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                <Check className="size-3" /> Xóa
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex items-center justify-center rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={() => setZoom(false)}
        >
          <img src={result.url} alt="Zoom" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          <button
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
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
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
      >
        <span className="flex items-center gap-1.5"><Package className="size-3" /> Sản phẩm catalog</span>
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>
      {expanded && (
        <div className="pt-1 space-y-2">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                  activeCat === cat.id ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
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
                            <span className="text-white text-[10px] font-bold">✓</span>
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
    setUploadedFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => ({ preview: URL.createObjectURL(f), name: f.name }))]);
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

  // Generation
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [results, setResults] = useState<GenResult[]>(() =>
    savedImages.map(img => ({ url: imgUrl(img), prompt: img.prompt ?? "", savedId: img.id }))
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState(false);

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
    hasReferenceImage: !!(refineSource || uploadedFiles.length > 0),
  });

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

  const saveImageToDB = async (url: string, prompt: string): Promise<string | undefined> => {
    try {
      const isBase64 = url.startsWith("data:image/");
      const body = isBase64 ? { b64Json: url.split(",")[1], prompt } : { url, prompt };
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
      const taskId = `${project.id}-${Date.now()}`;
      const files = await getSourceFiles();

      let resolvedSize = imageSize;
      if (imageSize.id === "original" && files.length > 0) {
        const { w, h } = await detectDimensions(files[0]);
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
          const url = imgData?.b64_json
            ? `data:image/png;base64,${imgData.b64_json}`
            : (imgData?.url ?? "");
          if (url) {
            const savedId = await saveImageToDB(url, prompt);
            setResults(prev => [{ url, prompt, savedId }, ...prev]);
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

  const useAsSource = async (url: string) => {
    try {
      const file = url.startsWith("data:")
        ? base64UrlToFile(url, `ai-source-${Date.now()}.png`)
        : await fetch(url).then(r => r.blob()).then(b => new File([b], `ai-source-${Date.now()}.png`, { type: "image/png" }));
      setActiveSourceFiles([file]);
      const b64 = await fileToBase64(file);
      await fetch(`/api/projects/${project.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b64Json: b64, type: "room_original" }),
      });
      toast.success("Đã đặt làm ảnh gốc cho lần tạo tiếp theo");
    } catch {
      toast.error("Không thể tải ảnh này");
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
    a.download = `viziont-${project.id}-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">

      {/* ── Persistent header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-stone-100 px-5 py-3 flex-shrink-0">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-stone-900 truncate">{project.clientName}</h1>
          {project.clientEmail && (
            <p className="text-xs text-stone-400 truncate">{project.clientEmail}</p>
          )}
        </div>
        <StepIndicator step={step} maxStep={maxStep} onStepClick={goToStep} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Upload                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Bước 1 / 3</p>
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
              <Button onClick={advanceToStep2} disabled={savingStep} className="gap-2">
                {savingStep
                  ? <><Loader2 className="size-4 animate-spin" /> Đang lưu...</>
                  : <><span>Tiếp tục</span> <ArrowRight className="size-4" /></>
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Style Selection                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Bước 2 / 3</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Chọn phong cách</h2>
            <p className="text-sm text-stone-400 mb-8">Chọn phong cách thiết kế nội thất cho dự án.</p>

            {/* Room type */}
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Loại phòng</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map(rt => {
                  const active = roomType?.id === rt.id;
                  return (
                    <button
                      key={rt.id}
                      onClick={() => toggle1(roomType, rt, setRoomType)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all select-none",
                        active
                          ? "border-stone-800 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
                      )}
                    >
                      <span>{rt.emoji}</span> {rt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style grid */}
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Phong cách {selectedStyle && <span className="text-stone-600 normal-case font-normal">— đã chọn: {selectedStyle.label}</span>}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {INTERIOR_STYLES.map(s => (
                  <StyleCard
                    key={s.id}
                    style={s}
                    selected={selectedStyle?.id === s.id}
                    onClick={() => toggle1(selectedStyle, s, setSelectedStyle)}
                  />
                ))}
              </div>
            </div>

            {/* Image size */}
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Tỉ lệ ảnh kết quả</p>
              <div className="flex flex-wrap gap-2">
                {/* Default: match source */}
                <button
                  onClick={() => setImageSize(ORIGINAL_SIZE)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-all select-none",
                    imageSize.id === "original"
                      ? "border-stone-800 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
                  )}
                >
                  <span
                    className={cn("rounded-[3px] border-2 block flex-shrink-0", imageSize.id === "original" ? "border-white/60" : "border-stone-300")}
                    style={{ width: 14, height: 14 }}
                  />
                  <div>
                    <p className="font-semibold text-xs">Kích thước gốc</p>
                    <p className={cn("text-[10px]", imageSize.id === "original" ? "text-white/60" : "text-stone-400")}>Mặc định</p>
                  </div>
                </button>

                {/* Separator */}
                <div className="flex items-center">
                  <div className="w-px h-8 bg-stone-100 mx-1" />
                </div>

                {IMAGE_SIZES.map(s => {
                  const active = imageSize.id === s.id;
                  const isPortrait = s.h > s.w;
                  const isLandscape = s.w > s.h;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setImageSize(s)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all select-none",
                        active
                          ? "border-stone-800 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
                      )}
                    >
                      <span
                        className={cn("rounded-[3px] border-2 block flex-shrink-0", active ? "border-white/60" : "border-stone-300")}
                        style={{
                          width:  isPortrait ? 10 : isLandscape ? 20 : 14,
                          height: isPortrait ? 20 : isLandscape ? 10 : 14,
                        }}
                      />
                      <div>
                        <p className="font-semibold text-xs">{s.ratio}</p>
                        <p className={cn("text-[10px]", active ? "text-white/60" : "text-stone-400")}>{s.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
              >
                <ArrowLeft className="size-4" /> Quay lại
              </button>
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
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: Generate & Refine                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left panel ─────────────────────────────────────────────────── */}
          <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-stone-100 bg-stone-50/40 px-4 py-4 space-y-3">

            {/* Back to style step */}
            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="size-3" /> Đổi phong cách
            </button>

            {/* Refine source OR original thumbnails */}
            {refineSource ? (
              <div className="border-b border-stone-100 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Đang chỉnh sửa</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Ảnh gốc</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Phong cách</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative overflow-hidden rounded-xl flex-1 min-w-0 h-10"
                    style={{ backgroundColor: STYLE_GRADIENTS[selectedStyle.id] ?? "#1a1a1a" }}>
                    <img
                      src={`/styles/${selectedStyle.id}.jpg`}
                      alt={selectedStyle.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative flex items-center gap-1.5 px-2.5 h-full">
                      <span className="text-sm flex-shrink-0">{selectedStyle.emoji}</span>
                      <span className="text-xs font-semibold text-white truncate">{selectedStyle.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => goToStep(2)}
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
                  >
                    Đổi →
                  </button>
                </div>
              </div>
            )}

            {/* Light sources */}
            <ChipGroup
              label="Nguồn sáng"
              chips={LIGHT_SOURCES}
              selected={lightSources}
              onToggle={chip => toggleSet(chip, setLightSources)}
              multi
            />

            {/* Kelvin */}
            <ChipGroup
              label="Nhiệt độ Kelvin"
              chips={KELVIN_TEMPS}
              selected={new Set(kelvin ? [kelvin.id] : [])}
              onToggle={chip => toggle1(kelvin, chip, setKelvin)}
            />

            {/* Materials */}
            <ChipGroup
              label="Vật liệu"
              chips={MATERIALS}
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">Ghi chú thêm</p>
              <Textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Yêu cầu cụ thể..."
                className="text-xs min-h-[60px]"
              />
            </div>

            {/* Generate button */}
            <Button className="w-full gap-2" onClick={triggerGenerate} disabled={generating}>
              {generating
                ? <><Loader2 className="size-4 animate-spin" /> {genProgress || "Đang tạo..."}</>
                : refineSource
                  ? <><Sparkles className="size-4" /> Tạo lại ảnh này</>
                  : <><Sparkles className="size-4" /> Tạo thêm ảnh</>
              }
            </Button>
          </aside>

          {/* ── Right panel: results ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* Generating animation */}
            {generating && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-5">
                  <div className="size-14 rounded-full border-4 border-stone-100 border-t-stone-800 animate-spin" />
                  <Sparkles className="size-5 text-stone-600 absolute inset-0 m-auto" />
                </div>
                <p className="font-semibold text-stone-700 mb-1">Đang tạo ảnh nội thất...</p>
                <p className="text-sm text-stone-400">{genProgress}</p>
              </div>
            )}

            {/* Error */}
            {genError && !generating && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 mb-4 flex items-start gap-3">
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

            {/* Results grid */}
            {results.length > 0 && (
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                  Kết quả ({results.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {results.map((r, i) => (
                    <ResultCard
                      key={r.savedId ?? i}
                      result={r}
                      isRefineSource={refineSource === r.url}
                      onDownload={() => download(r.url, i)}
                      onRefine={() => setRefineSource(prev => prev === r.url ? null : r.url)}
                      onUseAsSource={() => useAsSource(r.url)}
                      onDelete={() => deleteImage(r)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state (waiting for first generation) */}
            {results.length === 0 && !generating && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="size-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4">
                  <Sparkles className="size-7 text-stone-300" />
                </div>
                <p className="font-semibold text-stone-600 mb-1">Chưa có ảnh nào</p>
                <p className="text-sm text-stone-400 max-w-xs">
                  Nhấn <strong className="text-stone-600">Tạo thêm ảnh</strong> ở bên trái để bắt đầu.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
