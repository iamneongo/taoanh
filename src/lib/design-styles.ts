export type DesignStyle = {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  emoji: string;
  promptTemplate: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  tags: string[];
};

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: "modern",
    name: "Modern",
    nameVi: "Hiện đại",
    description: "Đường nét gọn gàng, màu trung tính, vật liệu cao cấp",
    emoji: "🏙️",
    promptTemplate: "Transform this room into a modern interior design style. Use clean lines, neutral colors (white, gray, beige), minimal decoration, high-quality materials like marble and glass. Keep the room proportions and layout exactly the same.",
    priceRange: "80–150 triệu",
    priceMin: 80_000_000,
    priceMax: 150_000_000,
    tags: ["Tối giản", "Sang trọng", "Thực dụng"],
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    nameVi: "Bắc Âu",
    description: "Ấm áp, gỗ tự nhiên, màu pastel nhẹ nhàng",
    emoji: "🌿",
    promptTemplate: "Transform this room into a Scandinavian interior design style. Use warm wood tones, white walls, natural textures, cozy textiles, minimal but functional furniture. Keep the room proportions and layout exactly the same.",
    priceRange: "60–120 triệu",
    priceMin: 60_000_000,
    priceMax: 120_000_000,
    tags: ["Ấm cúng", "Tự nhiên", "Đơn giản"],
  },
  {
    id: "japandi",
    name: "Japandi",
    nameVi: "Nhật - Bắc Âu",
    description: "Hòa quyện thiên nhiên Nhật Bản và sự ấm áp Bắc Âu",
    emoji: "🎋",
    promptTemplate: "Transform this room into a Japandi interior design style. Combine Japanese minimalism with Scandinavian warmth. Use natural wood, muted earth tones, low furniture, zen elements, and natural materials. Keep the room proportions and layout exactly the same.",
    priceRange: "70–130 triệu",
    priceMin: 70_000_000,
    priceMax: 130_000_000,
    tags: ["Thiền", "Cân bằng", "Mộc mạc"],
  },
  {
    id: "industrial",
    name: "Industrial",
    nameVi: "Công nghiệp",
    description: "Thô, mạnh mẽ, kim loại và bê tông lộ thiên",
    emoji: "🔩",
    promptTemplate: "Transform this room into an industrial interior design style. Use exposed brick, concrete, metal pipes, dark iron fixtures, reclaimed wood, and Edison bulbs. Keep the room proportions and layout exactly the same.",
    priceRange: "50–100 triệu",
    priceMin: 50_000_000,
    priceMax: 100_000_000,
    tags: ["Mạnh mẽ", "Urban", "Độc đáo"],
  },
  {
    id: "luxury",
    name: "Luxury",
    nameVi: "Cổ điển sang trọng",
    description: "Vàng, đá cẩm thạch, đường cong hoàng gia",
    emoji: "👑",
    promptTemplate: "Transform this room into a luxury classical interior design style. Use marble floors, gold accents, crystal chandeliers, rich fabrics like velvet and silk, ornate moldings, and classical furniture. Keep the room proportions and layout exactly the same.",
    priceRange: "200–500 triệu",
    priceMin: 200_000_000,
    priceMax: 500_000_000,
    tags: ["Hoàng gia", "Quý phái", "Đẳng cấp"],
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    nameVi: "Địa Trung Hải",
    description: "Màu đất, gạch thủ công, rộng rãi và phóng khoáng",
    emoji: "🌊",
    promptTemplate: "Transform this room into a Mediterranean interior design style. Use terracotta tiles, whitewashed walls, blue accents, natural stone, rustic wood, and wrought iron. Keep the room proportions and layout exactly the same.",
    priceRange: "65–120 triệu",
    priceMin: 65_000_000,
    priceMax: 120_000_000,
    tags: ["Phóng khoáng", "Tự nhiên", "Màu sắc"],
  },
];
