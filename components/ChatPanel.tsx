"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleMore, Minus, Send, Sparkles, X } from "lucide-react";
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
  } = session;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
