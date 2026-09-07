"use client";

import { MessageSquare, Map, Plus, Sparkles } from "lucide-react";

interface MobileBottomNavProps {
  active: string;
  onNavigate: (key: string) => void;
  onFabClick: () => void;
}

export default function MobileBottomNav({
  active,
  onNavigate,
  onFabClick,
}: MobileBottomNavProps) {
  return (
    <div className="mobile-bottom-nav">
      <div
        className={`mnav-item${active === "peta" ? " active" : ""}`}
        onClick={() => onNavigate("peta")}
      >
        <Map width={19} height={19} />
        Peta
      </div>
      <div
        className={`mnav-item${active === "planner" ? " active" : ""}`}
        onClick={() => onNavigate("planner")}
      >
        <Sparkles width={19} height={19} />
        Planner
      </div>
      <div className="mnav-fab" onClick={onFabClick}>
        <Plus width={22} height={22} />
      </div>
      <div
        className={`mnav-item${active === "feed" ? " active" : ""}`}
        onClick={() => onNavigate("feed")}
      >
        <MessageSquare width={19} height={19} />
        Feed
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}
