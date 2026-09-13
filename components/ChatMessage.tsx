"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Sparkles, User } from "lucide-react";
import type { RouteResponse } from "@/lib/types/routingApi";
import { renderSimpleMarkdown } from "@/lib/simpleMarkdown";
import type { RouteDisplayOptions } from "./MapView";
import RouteResultCard from "./RouteResultCard";

const EASE = [0.22, 1, 0.36, 1] as const;

const bubbleVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
  routeData?: RouteResponse | null;
  routeDisplayOptions?: RouteDisplayOptions;
  isError?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onSuggestionClick?: (suggestion: string) => void;
  onViewRouteOnMap?: (routeData: RouteResponse, options?: RouteDisplayOptions) => void;
  /** true kalau pesan ini baru saja ditambahkan (belum pernah dirender
   * sebelumnya) -- dipakai supaya entrance animation hanya main sekali untuk
   * pesan baru, bukan replay untuk seluruh riwayat tiap kali ChatPanel
   * re-render (mis. saat mengetik atau state lain berubah). Default true
   * supaya pemanggil yang belum diperbarui tetap dapat animasi wajar. */
  animateIn?: boolean;
}

export default function ChatMessage({
  message,
  onSuggestionClick,
  onViewRouteOnMap,
  animateIn = true,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`chat-msg ${isUser ? "chat-msg-user" : "chat-msg-assistant"}`}
      initial={animateIn && !prefersReducedMotion ? "hidden" : false}
      animate="visible"
      variants={bubbleVariants}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <div className="chat-msg-avatar">
        {isUser ? <User width={14} height={14} /> : <Sparkles width={14} height={14} />}
      </div>
      <div className="chat-msg-body">
        <div className={`chat-msg-bubble${message.isError ? " chat-msg-bubble-error" : ""}`}>
          {isUser ? message.text : renderSimpleMarkdown(message.text)}
        </div>

        {message.routeData && (
          <div className="chat-msg-route">
            <RouteResultCard
              route={message.routeData}
              onViewOnMap={() =>
                onViewRouteOnMap?.(message.routeData!, message.routeDisplayOptions)
              }
            />
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="chat-suggestions">
            <div className="chat-suggestions-label">Mungkin ingin ditanyakan</div>
            {message.suggestions.map((s) => (
              <button
                key={s}
                className="chat-suggestion-chip"
                onClick={() => onSuggestionClick?.(s)}
              >
                <span>{s}</span>
                <ChevronRight width={14} height={14} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
