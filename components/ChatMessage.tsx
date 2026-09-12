"use client";

import { ChevronRight, Sparkles, User } from "lucide-react";
import type { RouteResponse } from "@/lib/types/routingApi";
import { renderSimpleMarkdown } from "@/lib/simpleMarkdown";
import type { RouteDisplayOptions } from "./MapView";
import RouteResultCard from "./RouteResultCard";

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
}

export default function ChatMessage({
  message,
  onSuggestionClick,
  onViewRouteOnMap,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`chat-msg ${isUser ? "chat-msg-user" : "chat-msg-assistant"}`}>
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
    </div>
  );
}
