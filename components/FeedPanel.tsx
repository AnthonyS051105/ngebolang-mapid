"use client";

import { useRef, useState } from "react";
import {
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { CAT, reportPins, tabKeyMap, tabs } from "@/lib/data";
import type { ReportPin } from "@/lib/types";

interface FeedPanelProps {
  onOpenThread: (report: ReportPin) => void;
}

export default function FeedPanel({ onOpenThread }: FeedPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [view, setView] = useState<"card" | "list">("card");
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = reportPins.filter(
    (r) => activeTab === "Semua" || r.cat === tabKeyMap[activeTab]
  );

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

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
        <div className="feed-view-toggle">
          <div
            className={`vt-btn${view === "card" ? " active" : ""}`}
            onClick={() => setView("card")}
          >
            <LayoutGrid width={14} height={14} />
          </div>
          <div
            className={`vt-btn${view === "list" ? " active" : ""}`}
            onClick={() => setView("list")}
          >
            <List width={14} height={14} />
          </div>
        </div>
      </div>

      {view === "card" ? (
        <div className="feed-cards-wrap">
          <div className="feed-cards" ref={scrollRef}>
            {list.map((r) => {
              const c = CAT[r.cat];
              return (
                <div
                  className="fcard"
                  key={r.id}
                  onClick={() => onOpenThread(r)}
                >
                  <div
                    className="thumb"
                    style={{ backgroundImage: `url(${r.photo})` }}
                  >
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
          <div className="feed-scroll-btn" onClick={scrollNext}>
            <ChevronRight width={16} height={16} />
          </div>
        </div>
      ) : (
        <div className="feed-list">
          {list.map((r) => (
            <div
              className="feed-list-row"
              key={r.id}
              onClick={() => onOpenThread(r)}
            >
              <div
                className="thumb-sm"
                style={{ backgroundImage: `url(${r.photo})` }}
              />
              <div className="info">
                <div className="title">{r.title}</div>
                <div className="loc">
                  <MapPin width={11} height={11} /> {r.loc}
                </div>
              </div>
              <div className="likes">
                <ThumbsUp width={12} height={12} /> {r.likes}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
