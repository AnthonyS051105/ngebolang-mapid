"use client";

import { useState } from "react";
import { ChevronDown, MapPin, ThumbsUp, X } from "lucide-react";
import { categoryOf, tabKeyMap, tabs } from "@/lib/data";
import type { ThreadItem } from "@/lib/types/routingApi";

interface FeedFullScreenProps {
  threads: ThreadItem[];
  onOpenThread: (thread: ThreadItem) => void;
  onClose: () => void;
}

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80";

type SortKey = "terbaru" | "populer";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// Halaman penuh satu layar untuk membaca semua laporan warga dengan nyaman --
// dibuka dari "Lihat semua" di FeedPanel, menggantikan perilaku lama yang
// cuma memperluas panel kecil di tempat.
export default function FeedFullScreen({ threads, onOpenThread, onClose }: FeedFullScreenProps) {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const list = threads
    .filter((t) => activeTab === "Semua" || t.category === tabKeyMap[activeTab])
    .sort((a, b) =>
      sort === "populer"
        ? b.upvotes - a.upvotes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <div className="feed-fullscreen">
      <div className="feed-fullscreen-head">
        <h2>Feed Threads</h2>
        <button
          type="button"
          className="panel-action-btn"
          onClick={onClose}
          aria-label="Tutup"
          title="Tutup"
        >
          <X width={18} height={18} />
        </button>
      </div>
      <div className="feed-fullscreen-tabs">
        {tabs.map((t) => (
          <div
            key={t}
            className={`tab${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </div>
        ))}
        <div className="sort">
          <div className="sort-trigger" onClick={() => setSortMenuOpen((v) => !v)}>
            {sort === "terbaru" ? "Terbaru" : "Terpopuler"}
            <ChevronDown width={12} height={12} />
          </div>
          {sortMenuOpen && (
            <div className="sort-menu">
              <div
                className={`sort-menu-item${sort === "terbaru" ? " active" : ""}`}
                onClick={() => {
                  setSort("terbaru");
                  setSortMenuOpen(false);
                }}
              >
                Terbaru
              </div>
              <div
                className={`sort-menu-item${sort === "populer" ? " active" : ""}`}
                onClick={() => {
                  setSort("populer");
                  setSortMenuOpen(false);
                }}
              >
                Terpopuler
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="feed-fullscreen-scroll">
        {list.length === 0 ? (
          <div className="feed-empty" style={{ padding: "40px 4px", fontSize: 13, color: "#9aa2b1", textAlign: "center" }}>
            Belum ada laporan warga untuk kategori ini.
          </div>
        ) : (
          <div className="feed-fullscreen-grid">
            {list.map((t) => {
              const c = categoryOf(t.category);
              return (
                <div className="fcard" key={t.id} onClick={() => onOpenThread(t)}>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
