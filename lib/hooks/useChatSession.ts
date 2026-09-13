"use client";

import { useEffect, useRef, useState } from "react";
import { fetchChat, fetchRoute } from "@/lib/api/routingClient";
import { getOrCreateChatSessionId, resetChatSessionId } from "@/lib/api/chatSession";
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

export interface SavedChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessageData[];
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
  savedSessions: SavedChatSession[];
  startNewChat: () => void;
  loadSession: (session: SavedChatSession) => void;
  openHistoryView: () => void;
  openChatView: () => void;
}

const HISTORY_STORAGE_KEY = "ngebolang_chat_saved_sessions";

function loadSavedSessions(): SavedChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedSessions(sessions: SavedChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {
    // Ignore storage errors
  }
}

// Diangkat dari ChatPanel supaya sesi (histori + status kirim) tetap hidup
// meski komponen panelnya belum/tidak sedang di-mount -- dipakai bersama oleh
// composer di top-bar dan ChatPanel itu sendiri (lihat AppShell.tsx).
export function useChatSession(
  onViewRouteOnMap?: (routeData: RouteResponse, options?: RouteDisplayOptions) => void
): ChatSessionState {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [preference, setPreference] = useState<RoutePreferenceState>(DEFAULT_PREFERENCE);
  const [isRefetchingRoute, setIsRefetchingRoute] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const activeRouteMessageIdRef = useRef<string | null>(null);
  const onViewRouteOnMapRef = useRef(onViewRouteOnMap);

  useEffect(() => {
    onViewRouteOnMapRef.current = onViewRouteOnMap;
  }, [onViewRouteOnMap]);

  useEffect(() => {
    setSessionId(getOrCreateChatSessionId());
    setSavedSessions(loadSavedSessions());
  }, []);

  // Simpan sesi aktif ke daftar savedSessions tiap ada pesan baru
  useEffect(() => {
    if (messages.length === 0 || !sessionId) return;
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg ? firstUserMsg.text.slice(0, 40) : "Rute Perjalanan";
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    setSavedSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      const updatedItem: SavedChatSession = { id: sessionId, title, timestamp, messages };
      let next: SavedChatSession[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedItem;
      } else {
        next = [updatedItem, ...prev];
      }
      persistSavedSessions(next);
      return next;
    });
  }, [messages, sessionId]);

  const startNewChat = () => {
    const freshId = resetChatSessionId();
    setSessionId(freshId);
    setMessages([]);
    setViewMode("chat");
  };

  const loadSession = (sessionItem: SavedChatSession) => {
    setSessionId(sessionItem.id);
    setMessages(sessionItem.messages);
    setViewMode("chat");
  };

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
    if (!trimmed || isSending || !sessionId) return;

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
    startNewChat,
    loadSession,
    openHistoryView: () => setViewMode("history"),
    openChatView: () => setViewMode("chat"),
  };
}
