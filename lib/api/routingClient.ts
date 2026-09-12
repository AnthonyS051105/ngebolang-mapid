import type {
  ChatResponse,
  PoiItem,
  RouteRequestBody,
  RouteResponse,
  TarifRequestBody,
  TarifResponse,
  ThreadItem,
} from "@/lib/types/routingApi";

const BASE_URL = process.env.NEXT_PUBLIC_ROUTING_API_URL!;

export class RoutingApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function callPython<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Galat tidak diketahui" }));
    throw new RoutingApiError(
      res.status,
      typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)
    );
  }
  return res.json();
}

export const fetchRoute = (body: RouteRequestBody) =>
  callPython<RouteResponse>("/api/route", { method: "POST", body: JSON.stringify(body) });

export const fetchTarifEstimate = (body: TarifRequestBody) =>
  callPython<TarifResponse>("/api/tarif/estimate", { method: "POST", body: JSON.stringify(body) });

export const fetchChat = (message: string, sessionId: string) =>
  callPython<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId }),
  });

export const clearChatSession = (sessionId: string) =>
  callPython<{ status: string }>(
    `/api/chat/clear?session_id=${encodeURIComponent(sessionId)}`,
    { method: "POST" }
  );

export const fetchThreads = (status = "APPROVED") =>
  callPython<ThreadItem[]>(`/api/threads?status=${status}`);

export const fetchPoi = (category?: string) =>
  callPython<PoiItem[]>(`/api/poi${category ? `?category=${category}` : ""}`);

export const fetchHeatmap = (timeSlot?: string) =>
  callPython<GeoJSON.FeatureCollection>(
    `/api/layers/heatmap${timeSlot ? `?time_slot=${timeSlot}` : ""}`
  );

// Layer MAPID GeoServer -- di luar cakupan PRD tapi tersedia di backend, lihat
// docs/PYTHON_API_CONTRACT.md Bagian 12b. Respons bisa berisi source "fallback"
// kalau MAPID API gagal/kosong -- struktur GeoJSON tetap sama.
export const fetchTransportHubs = () =>
  callPython<GeoJSON.FeatureCollection>("/api/layers/transport-hubs");

export const fetchPangkalanFeeders = () =>
  callPython<GeoJSON.FeatureCollection>("/api/layers/pangkalan-feeders");

export const getExportReportsUrl = (format: "geojson" | "csv" = "geojson", category?: string) => {
  const params = new URLSearchParams({ format });
  if (category) params.set("category", category);
  return `${BASE_URL}/api/export/reports?${params.toString()}`;
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};

// CATATAN: fetchSubmitThread dan fetchUpvote SENGAJA TIDAK ADA DI SINI.
// Dua aksi tulis itu HARUS lewat /api/threads dan /api/threads/[id]/upvote MILIK NEXT.JS SENDIRI
// (lihat app/api/threads/route.ts), bukan langsung ke Python -- lihat docs/ARCHITECTURE.md Bagian 4.
