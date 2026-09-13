// Klien untuk DUA endpoint tulis laporan warga -- WAJIB lewat proksi Next.js
// sendiri (app/api/threads/route.ts, app/api/threads/[id]/upvote/route.ts),
// TIDAK PERNAH langsung ke Python. Lihat docs/ARCHITECTURE.md Bagian 4.
// Untuk baca (GET /api/threads) tetap pakai fetchThreads() di routingClient.ts.
import type { CategoryKey } from "@/lib/types";

export interface SubmitThreadPayload {
  category: CategoryKey;
  description: string;
  lat: number;
  lon: number;
  photo_url?: string;
  reporter_name?: string;
}

export interface SubmitThreadResult {
  status: "APPROVED" | "MERGED_DUPLICATE" | "FLAGGED_REVIEW" | "REJECTED";
  report_id: string | null;
  parent_report_id?: string;
  moderation_reason?: string;
  upvotes?: number;
  confidence?: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ProxyApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function callProxy<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as Partial<ApiErrorBody>;
    throw new ProxyApiError(
      res.status,
      err.error?.code ?? "UNKNOWN",
      err.error?.message ?? "Terjadi kesalahan tidak diketahui."
    );
  }
  return body as T;
}

export const submitThread = (payload: SubmitThreadPayload) =>
  callProxy<SubmitThreadResult>("/api/threads", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const upvoteThread = (threadId: string) =>
  callProxy<{ status: string; report_id: string; upvotes: number }>(
    `/api/threads/${encodeURIComponent(threadId)}/upvote`,
    { method: "POST" }
  );

export interface CommentItem {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export const fetchComments = (threadId: string) =>
  callProxy<{ comments: CommentItem[] }>(
    `/api/threads/${encodeURIComponent(threadId)}/comments`
  );

export const submitComment = (threadId: string, text: string) =>
  callProxy<CommentItem>(`/api/threads/${encodeURIComponent(threadId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
