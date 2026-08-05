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
