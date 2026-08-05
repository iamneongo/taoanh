export type Chip = { id: string; label: string; emoji: string; prompt: string };
export type SizeOption = { id: string; label: string; ratio: string; value: string; w: number; h: number };

export const IMAGE_SIZES: SizeOption[] = [
  { id: "square",    label: "Vuông",  ratio: "1:1",  value: "1024x1024", w: 1024, h: 1024 },
  { id: "portrait",  label: "Dọc",   ratio: "9:16", value: "1024x1792", w: 1024, h: 1792 },
  { id: "landscape", label: "Ngang", ratio: "16:9", value: "1792x1024", w: 1792, h: 1024 },
];

export const INTERIOR_STYLES: Chip[] = [
  {
    id: "modern-luxury", label: "Modern Luxury", emoji: "🏙️",
    prompt: "ultra-modern luxury interior, Calacatta marble floors with gold veining, custom Italian furniture, brushed brass and matte black metal accents, floor-to-ceiling windows, integrated cove lighting, cashmere and silk textiles, statement sculptural art, bespoke millwork cabinetry, polished surfaces reflecting ambient light, rich layered materiality",
  },
  {
    id: "japandi", label: "Japandi", emoji: "🎋",
    prompt: "japandi interior design, wabi-sabi philosophy, hand-rubbed oak and walnut wood with visible grain, rice paper diffused light panels, deliberate asymmetric negative space, muted palette of sage, sand, and warm grey, hand-thrown ceramic vessels, undyed linen and cotton textiles, dried botanicals, shoji-inspired sliding partitions, balance of Japanese minimalism and Scandinavian warmth",
  },
  {
    id: "nordic", label: "Nordic", emoji: "🌿",
    prompt: "Scandinavian nordic interior, hygge atmosphere, light birch and pine wood floors, white-painted plaster walls, sheepskin throws, knitted wool cushions, pendant rattan and paper lights, indoor plants and greenery, soft layered textiles in cream and dusty rose, functional clean-lined furniture, cozy reading nooks with warm candlelight",
  },
  {
    id: "indochine", label: "Indochine", emoji: "🪷",
    prompt: "Indochine colonial tropical interior, aged terracotta tile floors, dark teak and rattan furniture with intricate carvings, sheer white linen curtains billowing in breeze, tropical foliage and orchids, vintage brass lanterns, hand-woven rush mats, warm amber toned walls, ceiling fans with carved wood blades, layered textile patterns of indigo and ochre",
  },
  {
    id: "neo-classic", label: "Neo Classic", emoji: "👑",
    prompt: "neo-classical interior, perfect symmetry and proportion, ornate plaster ceiling moldings and corbels, marble pilasters, Chesterfield velvet sofas in deep emerald or navy, crystal chandelier with cascading prisms, gilded mirror frames, parquet herringbone hardwood floors, silk damask drapery, oil paintings in gilded frames, refined luxury with historical gravitas",
  },
  {
    id: "minimalist", label: "Minimalist", emoji: "◻️",
    prompt: "pure minimalist interior, monochromatic white and warm grey palette, maximum negative space, furniture reduced to geometric essentials, concealed storage flush with walls, single dramatic art piece as focal point, polished concrete or large-format stone floors, materials expressed in their raw honest form, every object placed with intentional purpose",
  },
  {
    id: "mid-century", label: "Mid Century", emoji: "🛋️",
    prompt: "mid-century modern interior, 1950s-60s American design, organic curved silhouettes, teak and walnut statement furniture with tapered brass legs, Eames-era icons, mustard yellow and burnt sienna accent palette, geometric patterned wool rugs, sunburst wall clocks, globe pendant lights, exposed brick feature wall, rosewood credenza",
  },
  {
    id: "tropical-chic", label: "Tropical Chic", emoji: "🌴",
    prompt: "tropical chic resort interior, lush Monstera and palm fronds as living decor, hand-woven wicker and cane furniture, open-plan breezy layout blurring indoor and outdoor, botanical print textiles, raw jute and sisal flooring, bamboo ceiling, hand-painted ceramic tiles, rattan pendant lights, earthy greens and terracotta, plantation shutters filtering dappled light",
  },
  {
    id: "industrial", label: "Industrial", emoji: "🔩",
    prompt: "industrial loft interior, exposed structural concrete ceiling with visible ducts and pipes, bare brick feature wall, steel-framed windows, polished poured concrete floors, aged leather and canvas upholstery, Edison filament bulb pendant clusters, salvaged wood and black iron furniture, matte black metal accents, raw unfinished materiality with urban grit",
  },
  {
    id: "korean", label: "Korean", emoji: "🇰🇷",
    prompt: "Korean contemporary interior design, soft sculptural curves on sofas and chairs, powder pink and lavender pastel palette, bouclé and sherpa cloud-soft upholstery, glass and acrylic lucite accent furniture, gallery wall of framed line-art prints, arched doorways and window niches, terrazzo floors in pale tones, minimal clutter with decorative objects as sculpture",
  },
  {
    id: "cinematic", label: "Cinematic", emoji: "🎬",
    prompt: "cinematic editorial interior, dramatic chiaroscuro lighting with deep shadow pools and brilliant highlights, moody midnight blue and charcoal palette, velvet and satin surfaces that catch directional light, architectural volumes with sculptural presence, cinematic depth of field composition, atmospheric haze effect, rich textural contrast between matte and gloss, directorial tension in every corner",
  },
  {
    id: "commercial", label: "Commercial", emoji: "🏢",
    prompt: "contemporary commercial office interior, open-plan collaborative workspace, biophilic design with living green walls, acoustic felt ceiling baffles in geometric patterns, modular furniture systems with integrated power, polished terrazzo floors, branded accent colors in upholstery and partition screens, professional photography-ready staging, balanced natural and artificial lighting, ergonomic and functional layout",
  },
];

export const LIGHT_SOURCES: Chip[] = [
  { id: "downlight",   label: "Downlight",        emoji: "🔆", prompt: "recessed LED downlights creating clean pools of light on ceiling" },
  { id: "spotlight",   label: "Spotlight",        emoji: "🎯", prompt: "directional adjustable spotlights highlighting architectural features" },
  { id: "pendant",     label: "Đèn thả trần",    emoji: "💡", prompt: "statement pendant hanging lights as sculptural focal points" },
  { id: "floor-lamp",  label: "Đèn đứng",        emoji: "🪔", prompt: "tall arc floor lamp casting warm indirect ambient glow" },
  { id: "wall-lamp",   label: "Đèn tường",       emoji: "🔦", prompt: "decorative wall sconce lighting creating layered ambiance" },
  { id: "track-light", label: "Đèn ray",          emoji: "📐", prompt: "flexible track lighting rail system with multiple adjustable heads" },
  { id: "chandelier",  label: "Đèn chùm",        emoji: "✨", prompt: "grand statement chandelier as architectural centerpiece" },
  { id: "led-strip",   label: "Đèn dây LED",     emoji: "〰️", prompt: "integrated LED strip cove lighting creating floating ceiling effect" },
  { id: "window",      label: "Cửa sổ tự nhiên", emoji: "🪟", prompt: "abundant natural daylight streaming through large windows" },
];

export const KELVIN_TEMPS: Chip[] = [
  { id: "k2700", label: "2700K Vàng ấm",   emoji: "🕯️", prompt: "2700K ultra-warm candlelight golden glow, intimate and romantic ambiance" },
  { id: "k3000", label: "3000K Trắng ấm",  emoji: "🟡", prompt: "3000K warm white light, soft welcoming residential warmth" },
  { id: "k4000", label: "4000K Trung tính", emoji: "⚪", prompt: "4000K neutral white balanced light, clean and natural appearance" },
  { id: "k5000", label: "5000K Trắng sáng", emoji: "🔵", prompt: "5000K cool bright white light, crisp and energetic atmosphere" },
  { id: "k6500", label: "6500K Ban ngày",   emoji: "🌤️", prompt: "6500K full spectrum daylight color temperature, bright and airy" },
];

export const ATMOSPHERES: Chip[] = [
  { id: "luxury",   label: "Sang trọng",  emoji: "✨", prompt: "opulent luxurious atmosphere, premium bespoke materials, immaculate haute styling" },
  { id: "cozy",     label: "Ấm cúng",    emoji: "🕯️", prompt: "deeply cozy warm intimate hygge atmosphere, inviting soft textiles and candlelight" },
  { id: "airy",     label: "Thoáng đãng",emoji: "🌬️", prompt: "airy spacious open atmosphere, double-height ceilings, light-flooded and fresh" },
  { id: "tropical", label: "Nhiệt đới",  emoji: "🌺", prompt: "lush tropical Vietnamese atmosphere, dense greenery, warm humidity, natural materials" },
  { id: "dalat",    label: "Đà Lạt",     emoji: "🌸", prompt: "Da Lat highland mountain atmosphere, cool misty pine forest air, romantic fog, timber warmth" },
  { id: "hoian",    label: "Hội An",     emoji: "🏮", prompt: "Hoi An ancient town atmosphere, yellow ochre walls, silk lanterns, historical colonial charm" },
];

export const ROOM_TYPES: Chip[] = [
  { id: "living",   label: "Phòng khách", emoji: "🛋️", prompt: "living room and lounge area" },
  { id: "bedroom",  label: "Phòng ngủ",  emoji: "🛏️", prompt: "master bedroom" },
  { id: "kitchen",  label: "Bếp",        emoji: "🍳", prompt: "kitchen and dining area" },
  { id: "bathroom", label: "Phòng tắm",  emoji: "🚿", prompt: "bathroom and wet room" },
  { id: "office",   label: "Văn phòng",  emoji: "💻", prompt: "home office and study" },
  { id: "balcony",  label: "Ban công",   emoji: "🌿", prompt: "balcony terrace and outdoor living" },
];

export const MATERIALS: Chip[] = [
  { id: "marble",   label: "Đá cẩm thạch", emoji: "⬜", prompt: "Calacatta and Carrara marble with dramatic natural veining on surfaces" },
  { id: "wood",     label: "Gỗ tự nhiên",  emoji: "🪵", prompt: "rich natural wood with visible grain — oak, walnut, or teak" },
  { id: "metal",    label: "Kim loại",     emoji: "⚙️", prompt: "brushed brass, satin gold, and matte black metal accents" },
  { id: "rattan",   label: "Mây tre",      emoji: "🧺", prompt: "handwoven rattan, cane, and bamboo organic elements" },
  { id: "velvet",   label: "Nhung",        emoji: "🎀", prompt: "plush velvet and bouclé upholstery in rich saturated tones" },
  { id: "concrete", label: "Bê tông",      emoji: "🧱", prompt: "polished micro-cement and raw concrete surfaces" },
];

// ── Prompt builder ────────────────────────────────────────────────────────────
// Uses Template I (Visual Descriptor) and Template J (Reference Image Editing)
// from prompt-master for gpt-image-2 (DALL-E 3 compatible prose model)

export function buildPrompt(opts: {
  roomType?: Chip | null;
  style?: Chip | null;
  lightSources: Chip[];
  kelvin?: Chip | null;
  materials?: Chip[];
  catalogItems?: { name: string; description: string | null }[];
  customNote?: string;
  hasReferenceImage?: boolean;
}): string {
  const room  = opts.roomType?.prompt ?? "interior room";
  const style = opts.style?.prompt    ?? "contemporary interior";

  const lightingParts: string[] = [];
  if (opts.lightSources.length) {
    lightingParts.push(opts.lightSources.map(s => s.prompt).join(", "));
  }
  if (opts.kelvin) lightingParts.push(opts.kelvin.prompt);
  const lighting = lightingParts.length
    ? lightingParts.join(", ")
    : "balanced natural and artificial lighting";

  const materialsPart = opts.materials?.length
    ? opts.materials.map(m => m.prompt).join(", ")
    : null;

  const catalogPart = opts.catalogItems?.length
    ? `Include these specific furniture pieces prominently: ${opts.catalogItems.map(i => i.description ? `${i.name} (${i.description})` : i.name).join(", ")}.`
    : null;

  const customPart = opts.customNote?.trim() || null;

  if (opts.hasReferenceImage) {
    // Template J — Reference Image Editing
    // Focus on the DELTA only: what changes, what stays exactly the same
    const changes: string[] = [`Apply ${style} to every surface, material, and furnishing`];
    if (materialsPart) changes.push(`Replace materials with: ${materialsPart}`);
    if (lightingParts.length) changes.push(`Restyle the lighting using: ${lighting}`);
    if (catalogPart) changes.push(catalogPart);
    if (customPart) changes.push(customPart);

    return [
      `Redesign this ${room} interior completely while preserving the exact room architecture: same floor plan, ceiling height, window positions, door openings, and room proportions. Do not alter the structural shell.`,
      `What to change: ${changes.join(". ")}.`,
      `Style target: ${style}.`,
      `Lighting: ${lighting}.`,
      `Output quality: ultra-photorealistic, 4K UHD resolution, professional architectural interior photography, sharp focus across entire frame, perfect perspective with no lens distortion, every material texture rendered in crisp microscopic detail, magazine-quality HDR lighting with balanced highlights and shadows.`,
      `Do not include any people, text, watermarks, or unrealistic proportions. No blurriness, no noise, no overexposure.`,
    ].join(" ");
  } else {
    // Template I — Visual Descriptor (pure generation)
    const parts: string[] = [];

    parts.push(`Subject: A beautifully designed ${room} interior space.`);
    parts.push(`Style: ${style}.`);
    if (materialsPart) parts.push(`Materials and surfaces: ${materialsPart}.`);
    parts.push(`Lighting: ${lighting}.`);
    if (catalogPart) parts.push(catalogPart);
    if (customPart) parts.push(customPart);
    parts.push(`Composition: wide-angle architectural interior shot, perfect symmetrical perspective, slight elevated viewpoint showing full room depth and spatial volume.`);
    parts.push(`Mood: aspirational, serene, professionally staged for luxury real estate or design magazine editorial.`);
    parts.push(`Quality: ultra-photorealistic 4K UHD, professional architectural interior photography, tack-sharp focus throughout entire frame, every texture and surface rendered in microscopic detail, perfect exposure with rich HDR tonal range, no lens distortion, award-winning interior design photography.`);
    parts.push(`Do not include any people, text, watermarks, or objects floating in space. No blurriness, pixelation, or unrealistic proportions.`);

    return parts.join(" ");
  }
}
