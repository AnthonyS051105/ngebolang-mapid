"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { categoryOf, tabKeyMap, tabs } from "@/lib/data";
import { fetchThreads } from "@/lib/api/routingClient";
import type { ThreadItem } from "@/lib/types/routingApi";

interface FeedPanelProps {
  onOpenThread: (thread: ThreadItem) => void;
}

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function FeedPanel({ onOpenThread }: FeedPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [view, setView] = useState<"card" | "list">("card");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchThreads("APPROVED")
      .then((items) => {
        if (!cancelled) setThreads(items);
      })
      .catch((err) => {
        console.error("Gagal memuat laporan warga dari backend:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = threads.filter(
    (t) => activeTab === "Semua" || t.category === tabKeyMap[activeTab]
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

      {list.length === 0 ? (
        <div className="feed-empty" style={{ padding: "16px 4px", fontSize: 12.5, color: "#9aa2b1" }}>
          Belum ada laporan warga untuk kategori ini.
        </div>
      ) : view === "card" ? (
        <div className="feed-cards-wrap">
          <div className="feed-cards" ref={scrollRef}>
            {list.map((t) => {
              const c = categoryOf(t.category);
              return (
                <div
                  className="fcard"
                  key={t.id}
                  onClick={() => onOpenThread(t)}
                >
                  <div
                    className="thumb"
                    style={{ backgroundImage: `url(${t.photo_url ?? FALLBACK_PHOTO})` }}
                  >
                    <span className="cat" style={{ background: c.color }}>
                      {c.label}
                    </span>
                    <span className="time">{timeAgo(t.created_at)}</span>
                  </div>
                  <div className="body">
                    <div className="title">{t.description || "(Tanpa deskripsi)"}</div>
                    <div className="loc">
                      <MapPin width={11} height={11} /> {t.reporter_name || "Warga"}
                    </div>
                    <div className="stats">
                      <span>
                        <ThumbsUp width={12} height={12} /> {t.upvotes}
                      </span>
                      <span>
                        <MessageCircle width={12} height={12} /> 0
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
          {list.map((t) => (
            <div
              className="feed-list-row"
              key={t.id}
              onClick={() => onOpenThread(t)}
            >
              <div
                className="thumb-sm"
                style={{ backgroundImage: `url(${t.photo_url ?? FALLBACK_PHOTO})` }}
              />
              <div className="info">
                <div className="title">{t.description || "(Tanpa deskripsi)"}</div>
                <div className="loc">
                  <MapPin width={11} height={11} /> {t.reporter_name || "Warga"}
                </div>
              </div>
              <div className="likes">
                <ThumbsUp width={12} height={12} /> {t.upvotes}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
