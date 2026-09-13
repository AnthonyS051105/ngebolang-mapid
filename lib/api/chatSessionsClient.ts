// Klien untuk riwayat chat AI yang tersimpan di database Next.js sendiri --
// backend Python hanya kelola konteks percakapan aktif per session_id, tidak
// pernah menyediakan cara mengambil kembali riwayat lama. Lihat db/schema.sql
// (chat_session, chat_message) dan app/api/chat-sessions/**.
import { ProxyApiError, type ApiErrorBody } from "@/lib/api/threadsClient";
import type { ChatMessageData } from "@/components/ChatMessage";
import type { RouteResponse } from "@/lib/types/routingApi";
import type { RouteDisplayOptions } from "@/components/MapView";

export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  pythonSessionId: string;
  messages: ChatMessageData[];
}

export interface PostChatMessagesBody {
  pythonSessionId: string;
  title?: string;
  userMessage: { text: string };
  assistantMessage: {
    text: string;
    suggestions?: string[];
    routeData?: RouteResponse | null;
    routeDisplayOptions?: RouteDisplayOptions;
  };
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

export const fetchChatSessions = () =>
  callProxy<{ sessions: ChatSessionSummary[] }>("/api/chat-sessions");

export const fetchChatSessionDetail = (id: string) =>
  callProxy<ChatSessionDetail>(`/api/chat-sessions/${encodeURIComponent(id)}`);

export const postChatMessages = (id: string, body: PostChatMessagesBody) =>
  callProxy<{ chatSessionId: string; userMessageId: string; assistantMessageId: string }>(
    `/api/chat-sessions/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: JSON.stringify(body) }
  );

export const deleteChatSession = (id: string) =>
  callProxy<{ status: string }>(`/api/chat-sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
