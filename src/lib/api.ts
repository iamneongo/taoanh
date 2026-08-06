const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const AUTH_KEY = process.env.NEXT_PUBLIC_BACKEND_AUTH_KEY ?? "chatgpt2api";

function authHeaders() {
  return { Authorization: `Bearer ${AUTH_KEY}` };
}

export type ImageTask = {
  id: string;
  status: "queued" | "running" | "success" | "error";
  mode: "generate" | "edit";
  data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
  error?: string;
  progress?: string;
  elapsed_secs?: number;
  duration_ms?: number;
};

export type ImageModel = string;

export async function fetchModels(): Promise<string[]> {
  const res = await fetch(`${BACKEND_URL}/v1/models`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Không lấy được danh sách model");
  const data = await res.json();
  return (data.data as Array<{ id: string }>)
    .map((m) => m.id)
    .filter((id) => id.toLowerCase().includes("image"));
}

export async function createGenerationTask(
  clientTaskId: string,
  prompt: string,
  model: string,
  size: string,
  quality = "auto",
): Promise<ImageTask> {
  const res = await fetch(`${BACKEND_URL}/api/image-tasks/generations`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ client_task_id: clientTaskId, prompt, model, size, quality }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Lỗi tạo task sinh ảnh");
  }
  return res.json();
}

export async function createEditTask(
  clientTaskId: string,
  files: File[],
  prompt: string,
  model: string,
  size: string,
  quality = "auto",
): Promise<ImageTask> {
  const form = new FormData();
  files.forEach((f) => form.append("image", f));
  form.append("client_task_id", clientTaskId);
  form.append("prompt", prompt);
  form.append("model", model);
  form.append("size", size);
  form.append("quality", quality);

  const res = await fetch(`${BACKEND_URL}/api/image-tasks/edits`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Lỗi tạo task chỉnh sửa ảnh");
  }
  return res.json();
}

export async function pollTasks(ids: string[]): Promise<{ items: ImageTask[]; missing_ids: string[] }> {
  const params = new URLSearchParams({ ids: ids.join(","), _t: String(Date.now()) });
  const res = await fetch(`${BACKEND_URL}/api/image-tasks?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Lỗi poll task");
  return res.json();
}

function parseFurnitureList(content: string): string[] {
  if (!content) return [];
  const dedupe = (arr: string[]) => [...new Set(arr.map(s => s.trim()).filter(Boolean))];
  const text = content.trim().replace(/```json/gi, "").replace(/```/g, "").trim();

  // 1) Clean single JSON array of strings
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(arr) && arr.every(x => typeof x === "string")) {
        return dedupe(arr as string[]).slice(0, 6);
      }
    } catch { /* fall through */ }
  }

  // 2) Extract every double-quoted string (handles multiple arrays / stray brackets)
  const quoted = [...text.matchAll(/"([^"\n]{3,})"/g)].map(m => m[1]);
  if (quoted.length) return dedupe(quoted).slice(0, 6);

  // 3) Last resort: split lines, strip brackets / quotes / bullets
  return dedupe(
    text.split(/\r?\n/).map(l =>
      l.replace(/^[\s\-*\d.)[\]"]+/, "").replace(/[\s"\],]+$/, ""),
    ),
  ).slice(0, 6);
}

/** Analyze a room photo with a vision model and suggest furniture combos (Vietnamese). */
export async function suggestFurniture(imageDataUrl: string, styleHint?: string): Promise<string[]> {
  const instruction =
    `Bạn là chuyên gia thiết kế nội thất. Phân tích kỹ ảnh căn phòng này` +
    (styleHint ? ` (phong cách mong muốn: ${styleHint})` : "") +
    `. Dựa vào bố cục, kích thước và ánh sáng thực tế trong ảnh, hãy gợi ý đúng 4 combo đồ nội thất phù hợp nhất. ` +
    `Mỗi combo là một câu ngắn gọn bằng tiếng Việt (dưới 14 từ), liệt kê các món đồ chính. ` +
    `CHỈ trả về một mảng JSON gồm đúng 4 chuỗi, không kèm giải thích hay markdown.`;

  const res = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5-5-instant",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("Không phân tích được ảnh");
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return parseFurnitureList(typeof content === "string" ? content : JSON.stringify(content));
}
