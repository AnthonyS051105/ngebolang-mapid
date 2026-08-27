"use client";

import { useState } from "react";
import { MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CAT, reportPins, tabKeyMap, tabs } from "@/lib/data";

function getIcon(name: string): LucideIcon {
  const pascal = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as unknown as Record<string, LucideIcon>)[pascal] ?? Icons.Circle;
}

export default function FeedPanel() {
  const [activeTab, setActiveTab] = useState<string>("Semua");

  const list = reportPins.filter(
    (r) => activeTab === "Semua" || r.cat === tabKeyMap[activeTab]
  );

  return (
    <div className="feed-panel">
      <div className="feed-top">
        <h3>Feed Threads (Laporan Warga Terbaru)</h3>
        <a>Lihat semua</a>
      </div>
      <div className="feed-tabs">
        {tabs.map((t) => (
          <div
            key={t}
            className={`tab${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </div>
        ))}
        <div className="sort">Terbaru ▾</div>
      </div>
      <div className="feed-cards">
        {list.map((r, i) => {
          const c = CAT[r.cat];
          const CatIcon = getIcon(c.icon);
          return (
            <div className="fcard" key={i}>
              <div className="thumb" style={{ background: `${c.color}22` }}>
                <CatIcon width={28} height={28} color={c.color} />
                <span className="cat" style={{ background: c.color }}>
                  {c.label}
                </span>
                <span className="time">{r.time}</span>
              </div>
              <div className="body">
                <div className="title">{r.title}</div>
                <div className="loc">
                  <MapPin width={11} height={11} /> {r.loc}
                </div>
                <div className="stats">
                  <span>
                    <ThumbsUp width={12} height={12} /> {r.likes}
                  </span>
                  <span>
                    <MessageCircle width={12} height={12} /> {r.comments}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
