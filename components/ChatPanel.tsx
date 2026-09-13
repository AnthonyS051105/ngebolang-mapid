"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clock, History, MessageCircleMore, Minus, Plus, Send, Sparkles, X } from "lucide-react";
import type { RouteResponse } from "@/lib/types/routingApi";
import type { ChatSessionState } from "@/lib/hooks/useChatSession";
import ChatMessage from "./ChatMessage";
import type { RouteDisplayOptions } from "./MapView";
import RoutePreferencePanel from "./RoutePreferencePanel";

interface ChatPanelProps {
  session: ChatSessionState;
  onViewRouteOnMap?: (routeData: RouteResponse, options?: RouteDisplayOptions) => void;
  onMinimize?: () => void;
  onClose?: () => void;
  /** Dipasang di header supaya panel bisa di-drag lewat DockablePanel (desktop). */
  dragHandleProps?: { onPointerDown: (e: React.PointerEvent) => void };
}

export default function ChatPanel({
  session,
  onViewRouteOnMap,
  onMinimize,
  onClose,
  dragHandleProps,
}: ChatPanelProps) {
  const {
    messages,
    isSending,
    preference,
    setPreference,
    isRefetchingRoute,
    sendMessage,
    setActiveRouteMessageId,
    viewMode,
    openHistoryView,
    openChatView,
    savedSessions,
    startNewChat,
    loadSession,
  } = session;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === "chat") {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, viewMode]);

  if (viewMode === "history") {
    return (
      <div className="chat-panel">
        <div
          className={`chat-panel-header${dragHandleProps ? " panel-drag-handle" : ""}`}
          {...dragHandleProps}
        >
          <div className="ic">
            <Sparkles width={17} height={17} />
          </div>
          <h2>Riwayat Chat AI</h2>
          <div className="chat-panel-header-actions">
            <button
              type="button"
              className="chat-header-pill-btn"
              onClick={startNewChat}
              title="Mulai Chat Baru"
            >
              <Plus width={14} height={14} />
              <span>Chat Baru</span>
            </button>
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
        </div>

        <div className="chat-history-container">
          <button
            type="button"
            className="start-new-chat-btn"
            onClick={startNewChat}
          >
            <div className="start-new-chat-ic">
              <Plus width={18} height={18} />
            </div>
            <div className="start-new-chat-text">
              <span className="title">+ Mulai Percakapan Baru</span>
              <span className="sub">Tanyakan rute, lokasi, atau rekomendasi perjalanan</span>
            </div>
          </button>

          <div className="chat-history-section-title">
            <Clock width={14} height={14} />
            <span>Sesi Percakapan Sebelumnya</span>
          </div>

          {savedSessions.length === 0 ? (
            <div className="chat-empty-hint" style={{ padding: "30px 0" }}>
              <MessageCircleMore width={24} height={24} />
              <div className="title">Belum ada riwayat percakapan</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                Klik &quot;Mulai Percakapan Baru&quot; di atas untuk mulai berinteraksi dengan AI Trip Planner.
              </div>
            </div>
          ) : (
            <div className="chat-history-list">
              {savedSessions.map((s) => (
                <div
                  key={s.id}
                  className="chat-history-card"
                  onClick={() => loadSession(s)}
                >
                  <div className="chat-history-card-main">
                    <div className="chat-history-title">{s.title}</div>
                    <div className="chat-history-meta">
                      <span>{s.messages.length} pesan</span> • <span>{s.timestamp}</span>
                    </div>
                  </div>
                  <ChevronRight width={16} height={16} color="#9aa0ac" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-history-footer">
          <button
            type="button"
            className="chat-back-to-active-btn"
            onClick={openChatView}
          >
            Kembali ke Percakapan Aktif
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div
        className={`chat-panel-header${dragHandleProps ? " panel-drag-handle" : ""}`}
        {...dragHandleProps}
      >
        <div className="ic">
          <Sparkles width={17} height={17} />
        </div>
        <h2>AI Trip Planner</h2>
        {(onMinimize || onClose) && (
          <div className="chat-panel-header-actions">
            <button
              type="button"
              className="chat-header-pill-btn"
              onClick={startNewChat}
              title="Mulai Chat Baru"
            >
              <Plus width={14} height={14} />
              <span>Chat Baru</span>
            </button>
            <button
              type="button"
              className="panel-action-btn"
              onClick={openHistoryView}
              aria-label="Riwayat Percakapan AI"
              title="Riwayat Percakapan"
            >
              <History width={15} height={15} />
            </button>
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
              <div className="title">Rencanakan rute pertamamu</div>
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onSuggestionClick={sendMessage}
              onViewRouteOnMap={(routeData, options) => {
                setActiveRouteMessageId(m.id);
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
          const text = input;
          setInput("");
          sendMessage(text);
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
