"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleMore, Minus, Send, Sparkles, X } from "lucide-react";
import { fetchChat, fetchRoute } from "@/lib/api/routingClient";
import { getOrCreateChatSessionId } from "@/lib/api/chatSession";
import type { RouteResponse } from "@/lib/types/routingApi";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";
import type { RouteDisplayOptions } from "./MapView";
import RoutePreferencePanel, {
  toPreferenceRequestFields,
  type RoutePreferenceState,
} from "./RoutePreferencePanel";

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

interface ChatPanelProps {
  onViewRouteOnMap?: (routeData: RouteResponse, options?: RouteDisplayOptions) => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export default function ChatPanel({ onViewRouteOnMap, onMinimize, onClose }: ChatPanelProps) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [preference, setPreference] = useState<RoutePreferenceState>(DEFAULT_PREFERENCE);
  const [isRefetchingRoute, setIsRefetchingRoute] = useState(false);
  // id pesan asisten yang rutenya sedang tampil aktif di peta -- dipakai supaya
  // toggle checkbox bisa langsung re-fetch /api/route dan update pesan + peta
  // tanpa perlu user mengetik ulang pertanyaan.
  const activeRouteMessageIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateChatSessionId());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
        onViewRouteOnMap?.(updatedRoute, nextOptions);
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
    setInput("");
    setIsSending(true);

    try {
      // Preferensi rute (preset + 2 toggle) disisipkan sebagai konteks tekstual,
      // karena /api/chat menerima `message` bebas (bukan RouteRequestBody terstruktur) --
      // backend tetap mem-parsing niat lewat LLM, lihat llmapp/agent.py.
      const prefFields = toPreferenceRequestFields(preference);
      const prefNote = [
        `preferensi=${prefFields.preference}`,
        prefFields.walk_only ? "jalan_kaki_saja" : null,
        prefFields.ramah_aksesibilitas ? "ramah_aksesibilitas" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const messageWithPref = `${trimmed}\n\n[preferensi pengguna: ${prefNote}]`;

      // Simpan preferensi yang dipakai SAAT pesan ini dikirim (bukan preferensi
      // terkini di panel) supaya "Lihat di Peta" pada pesan lama tetap konsisten
      // dengan indikator jalur yang ditampilkan.
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
      // Rute baru dari chat otomatis jadi rute aktif -- toggle checkbox setelah
      // ini akan langsung memperbarui rute ini via /api/route, tanpa chat ulang.
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

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="ic">
          <Sparkles width={17} height={17} />
        </div>
        <h2>AI Trip Planner</h2>
        {(onMinimize || onClose) && (
          <div className="chat-panel-header-actions">
            {onMinimize && (
              <button
                type="button"
                className="panel-action-btn"
                onClick={onMinimize}
                aria-label="Ciutkan AI Trip Planner"
                title="Ciutkan"
              >
                <Minus width={15} height={15} />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className="panel-action-btn"
                onClick={onClose}
                aria-label="Tutup AI Trip Planner"
                title="Tutup"
              >
                <X width={15} height={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pref-panel-wrap">
        <RoutePreferencePanel value={preference} onChange={setPreference} />
        {isRefetchingRoute && (
          <div className="pref-refetch-hint">Memperbarui rute sesuai preferensi...</div>
        )}
      </div>

      <div className="chat-panel-scroll" ref={scrollRef}>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty-hint">
              <div className="ic">
                <MessageCircleMore width={20} height={20} />
              </div>
              <div className="title">Mulai rencanakan perjalananmu</div>
              <div className="sub">
                Coba ketik &quot;Dari Tugu ke Kraton&quot; untuk mulai merencanakan rute.
              </div>
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onSuggestionClick={sendMessage}
              onViewRouteOnMap={(routeData, options) => {
                activeRouteMessageIdRef.current = m.id;
                onViewRouteOnMap?.(routeData, options);
              }}
            />
          ))}
          {isSending && <div className="chat-typing-indicator">Mengetik...</div>}
        </div>
      </div>

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya rute, tarif, atau info kawasan..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !input.trim()}>
          <Send width={16} height={16} />
        </button>
      </form>
    </div>
  );
}
