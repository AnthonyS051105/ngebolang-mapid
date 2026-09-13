"use client";

import { useEffect, useRef, useState } from "react";
import { fetchChat, fetchRoute } from "@/lib/api/routingClient";
import { getOrCreateChatSessionId, resetChatSessionId } from "@/lib/api/chatSession";
import {
  deleteChatSession,
  fetchChatSessionDetail,
  fetchChatSessions,
  postChatMessages,
  type ChatSessionSummary,
} from "@/lib/api/chatSessionsClient";
import type { RouteResponse } from "@/lib/types/routingApi";
import type { ChatMessageData } from "@/components/ChatMessage";
import type { RouteDisplayOptions } from "@/components/MapView";
import {
  toPreferenceRequestFields,
  type RoutePreferenceState,
} from "@/components/RoutePreferencePanel";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const DEFAULT_PREFERENCE: RoutePreferenceState = {
  preset: "seimbang",
  walkOnly: false,
  ramahAksesibilitas: false,
};

// Riwayat lama sebelum migrasi ke server tersimpan di sini -- dipakai satu
// kali untuk deteksi & tawaran impor, lalu dihapus. Lihat maybeOfferImport().
const LEGACY_HISTORY_STORAGE_KEY = "ngebolang_chat_saved_sessions";

interface LegacySavedSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessageData[];
}

function loadLegacySessions(): LegacySavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface ChatSessionState {
  messages: ChatMessageData[];
  isSending: boolean;
  preference: RoutePreferenceState;
  setPreference: (value: RoutePreferenceState) => void;
  isRefetchingRoute: boolean;
  sendMessage: (text: string) => Promise<void>;
  setActiveRouteMessageId: (id: string) => void;
  viewMode: "chat" | "history";
  setViewMode: (mode: "chat" | "history") => void;
  savedSessions: ChatSessionSummary[];
  loadingSessions: boolean;
  startNewChat: () => void;
  loadSession: (session: ChatSessionSummary) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  openHistoryView: () => void;
  openChatView: () => void;
  importPromptCount: number;
  importLegacyHistory: () => Promise<void>;
  dismissImportPrompt: () => void;
}

// Diangkat dari ChatPanel supaya sesi (histori + status kirim) tetap hidup
// meski komponen panelnya belum/tidak sedang di-mount -- dipakai bersama oleh
// composer di top-bar dan ChatPanel itu sendiri (lihat AppShell.tsx).
// AppShell hanya dirender untuk pengguna yang sudah login (lihat
// app/page.tsx), jadi riwayat di sini selalu boleh diasumsikan terikat akun.
export function useChatSession(
  onViewRouteOnMap?: (routeData: RouteResponse, options?: RouteDisplayOptions) => void
): ChatSessionState {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [preference, setPreference] = useState<RoutePreferenceState>(DEFAULT_PREFERENCE);
  const [isRefetchingRoute, setIsRefetchingRoute] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [savedSessions, setSavedSessions] = useState<ChatSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [importPromptCount, setImportPromptCount] = useState(0);
  const activeRouteMessageIdRef = useRef<string | null>(null);
  const onViewRouteOnMapRef = useRef(onViewRouteOnMap);
  // ID chat_session di database Next.js -- null berarti belum ada row (sesi
  // baru dibuat lazy oleh endpoint messages saat pesan pertama terkirim).
  const chatSessionDbIdRef = useRef<string | null>(null);
  // Guard ref (bukan cuma state isSending) supaya dua sendMessage() yang
  // dipanggil di tick yang sama tidak lolos berbarengan -- state React baru
  // ter-update setelah re-render, ref langsung sinkron.
  const isSendingRef = useRef(false);
  // Menandai sendMessage() sedang berjalan supaya loadSession()/startNewChat()
  // tidak menukar sessionId/chatSessionDbIdRef di tengah persist yang masih
  // in-flight (hasil persist yang telat akan salah sasaran sesi).
  const sendGenerationRef = useRef(0);

  useEffect(() => {
    onViewRouteOnMapRef.current = onViewRouteOnMap;
  }, [onViewRouteOnMap]);

  const refreshSavedSessions = () => {
    setLoadingSessions(true);
    return fetchChatSessions()
      .then((res) => setSavedSessions(res.sessions))
      .catch((err) => {
        console.error("Gagal memuat riwayat chat:", err);
        setSavedSessions([]);
      })
      .finally(() => setLoadingSessions(false));
  };

  useEffect(() => {
    setSessionId(getOrCreateChatSessionId());
    refreshSavedSessions();
    // LocalStorage lama dihapus begitu impor selesai (lihat
    // importLegacyHistory), jadi keberadaannya di sini sudah cukup sebagai
    // penanda "belum pernah diimpor" -- tidak perlu digantungkan ke jumlah
    // sesi server, supaya tetap ditawarkan meski user sudah punya sesi lain
    // dari device/browser berbeda.
    const legacy = loadLegacySessions();
    if (legacy.length > 0) {
      setImportPromptCount(legacy.length);
    }
  }, []);

  const startNewChat = () => {
    sendGenerationRef.current += 1;
    const freshId = resetChatSessionId();
    setSessionId(freshId);
    setMessages([]);
    setViewMode("chat");
    chatSessionDbIdRef.current = null;
  };

  const loadSession = async (sessionItem: ChatSessionSummary) => {
    try {
      const detail = await fetchChatSessionDetail(sessionItem.id);
      sendGenerationRef.current += 1;
      chatSessionDbIdRef.current = detail.id;
      setSessionId(detail.pythonSessionId);
      setMessages(detail.messages);
      setViewMode("chat");
    } catch (err) {
      console.error("Gagal memuat sesi percakapan:", err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await deleteChatSession(id);
      setSavedSessions((prev) => prev.filter((s) => s.id !== id));
      if (chatSessionDbIdRef.current === id) {
        startNewChat();
      }
    } catch (err) {
      console.error("Gagal menghapus sesi percakapan:", err);
    }
  };

  const importLegacyHistory = async () => {
    const legacy = loadLegacySessions();
    for (const item of legacy) {
      // Format lama menyimpan riwayat per sesi sebagai satu array kronologis
      // (user, assistant, user, assistant, ...) -- impor sebagai pasangan
      // berurutan sesuai posisi asli, BUKAN dikelompokkan per role (urutan
      // asli bisa tidak selalu alternating rapi kalau ada error message dsb).
      let dbId = "new";
      const msgs = item.messages;
      let i = 0;
      while (i < msgs.length) {
        const userMsg = msgs[i]?.role === "user" ? msgs[i] : null;
        if (!userMsg) {
          i += 1;
          continue;
        }
        const assistantMsg = msgs[i + 1]?.role === "assistant" ? msgs[i + 1] : null;
        try {
          const res = await postChatMessages(dbId, {
            pythonSessionId: item.id,
            title: dbId === "new" ? item.title.slice(0, 120) : undefined,
            userMessage: { text: userMsg.text },
            assistantMessage: {
              text: assistantMsg?.text ?? "",
              suggestions: assistantMsg?.suggestions,
              routeData: assistantMsg?.routeData,
              routeDisplayOptions: assistantMsg?.routeDisplayOptions,
            },
          });
          dbId = res.chatSessionId;
        } catch (err) {
          console.error("Gagal mengimpor riwayat lama:", err);
          break;
        }
        i += assistantMsg ? 2 : 1;
      }
    }
    try {
      window.localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setImportPromptCount(0);
    await refreshSavedSessions();
  };

  const dismissImportPrompt = () => setImportPromptCount(0);

  useEffect(() => {
    const activeId = activeRouteMessageIdRef.current;
    if (!activeId) return;

    const activeMessage = messages.find((m) => m.id === activeId);
    const activeRoute = activeMessage?.routeData;
    if (!activeRoute) return;

    const nextOptions: RouteDisplayOptions = {
      walkOnly: preference.walkOnly,
      ramahAksesibilitas: preference.ramahAksesibilitas,
    };

    let cancelled = false;
    setIsRefetchingRoute(true);

    fetchRoute({
      orig_lat: activeRoute.origin.lat,
      orig_lon: activeRoute.origin.lon,
      orig_name: activeRoute.origin.name,
      dest_lat: activeRoute.destination.lat,
      dest_lon: activeRoute.destination.lon,
      dest_name: activeRoute.destination.name,
      preference: preference.preset,
      walk_only: preference.walkOnly,
      ramah_aksesibilitas: preference.ramahAksesibilitas,
    })
      .then((updatedRoute) => {
        if (cancelled) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeId
              ? { ...m, routeData: updatedRoute, routeDisplayOptions: nextOptions }
              : m
          )
        );
        onViewRouteOnMapRef.current?.(updatedRoute, nextOptions);
      })
      .catch((err) => {
        console.error("Gagal memperbarui rute dengan preferensi baru:", err);
      })
      .finally(() => {
        if (!cancelled) setIsRefetchingRoute(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference.walkOnly, preference.ramahAksesibilitas, preference.preset]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSendingRef.current || !sessionId) return;
    isSendingRef.current = true;
    const generation = sendGenerationRef.current;
    const dbIdAtStart = chatSessionDbIdRef.current;
    const sessionIdAtStart = sessionId;

    setMessages((prev) => [...prev, { id: newId(), role: "user", text: trimmed }]);
    setIsSending(true);

    try {
      const prefFields = toPreferenceRequestFields(preference);
      const prefNote = [
        `preferensi=${prefFields.preference}`,
        prefFields.walk_only ? "jalan_kaki_saja" : null,
        prefFields.ramah_aksesibilitas ? "ramah_aksesibilitas" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const messageWithPref = `${trimmed}\n\n[preferensi pengguna: ${prefNote}]`;

      const routeDisplayOptions: RouteDisplayOptions = {
        walkOnly: prefFields.walk_only,
        ramahAksesibilitas: prefFields.ramah_aksesibilitas,
      };

      const res = await fetchChat(messageWithPref, sessionId);
      if (res.status === "error") {
        // Python selalu balas HTTP 200 di sini, jadi error (mis. API key
        // LLM tidak dikonfigurasi) hanya bisa dideteksi lewat field status,
        // bukan lewat try/catch fetch biasa.
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            text: `Gagal menghubungi asisten: ${res.message}`,
            isError: true,
          },
        ]);
        return;
      }

      const assistantMessageId = newId();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          text: res.reply,
          suggestions: res.suggestions,
          routeData: res.route_data,
          routeDisplayOptions,
        },
      ]);
      if (res.route_data) {
        activeRouteMessageIdRef.current = assistantMessageId;
      }

      // Persist SETELAH balasan diterima -- satu request mencakup pasangan
      // user+assistant sekaligus, bukan 2x panggilan API per giliran chat.
      // Pakai id/session yang di-capture di awal supaya kalau loadSession()/
      // startNewChat() dipanggil sebelum persist ini selesai, hasilnya tidak
      // salah ditulis ke chatSessionDbIdRef sesi yang sudah berbeda.
      try {
        const persistRes = await postChatMessages(dbIdAtStart ?? "new", {
          pythonSessionId: sessionIdAtStart,
          title: dbIdAtStart ? undefined : trimmed.slice(0, 40),
          userMessage: { text: trimmed },
          assistantMessage: {
            text: res.reply,
            suggestions: res.suggestions,
            routeData: res.route_data,
            routeDisplayOptions,
          },
        });
        if (sendGenerationRef.current === generation) {
          const isNewSession = !dbIdAtStart;
          chatSessionDbIdRef.current = persistRes.chatSessionId;
          if (isNewSession) {
            refreshSavedSessions();
          } else {
            setSavedSessions((prev) =>
              prev.map((s) =>
                s.id === persistRes.chatSessionId
                  ? { ...s, updatedAt: new Date().toISOString(), messageCount: s.messageCount + 2 }
                  : s
              )
            );
          }
        } else {
          // Sesi sudah diganti (loadSession/startNewChat) sebelum persist
          // ini selesai -- tetap refresh daftar sesi supaya sesi lama yang
          // baru saja ditulis ini tetap terlihat di riwayat.
          refreshSavedSessions();
        }
      } catch (persistErr) {
        // Kegagalan simpan tidak boleh memblokir UI chat -- pesan tetap
        // tampil di state lokal meski gagal tersimpan ke server.
        console.error("Gagal menyimpan riwayat chat:", persistErr);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          text:
            err instanceof Error
              ? `Gagal menghubungi asisten: ${err.message}`
              : "Gagal menghubungi asisten. Coba lagi.",
          isError: true,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  return {
    messages,
    isSending,
    preference,
    setPreference,
    isRefetchingRoute,
    sendMessage,
    setActiveRouteMessageId: (id: string) => {
      activeRouteMessageIdRef.current = id;
    },
    viewMode,
    setViewMode,
    savedSessions,
    loadingSessions,
    startNewChat,
    loadSession,
    deleteSession,
    openHistoryView: () => setViewMode("history"),
    openChatView: () => setViewMode("chat"),
    importPromptCount,
    importLegacyHistory,
    dismissImportPrompt,
  };
}
