"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Minus,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { categoryOf, tabKeyMap, tabs } from "@/lib/data";
import { fetchThreads } from "@/lib/api/routingClient";
import type { ThreadItem } from "@/lib/types/routingApi";

interface FeedPanelProps {
  onOpenThread: (thread: ThreadItem) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  minimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  onOpenPlanner: () => void;
}

const DRAG_OPEN_THRESHOLD = 40;

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

export default function FeedPanel({
  onOpenThread,
  expanded = false,
  onExpandedChange,
  minimized = false,
  onMinimizedChange,
  onOpenPlanner,
}: FeedPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [view, setView] = useState<"card" | "list">("card");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartExpanded = useRef(false);

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

  useEffect(() => {
    if (!sortMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [sortMenuOpen]);

  const list = threads
    .filter((t) => activeTab === "Semua" || t.category === tabKeyMap[activeTab])
    .sort((a, b) =>
      sort === "populer"
        ? b.upvotes - a.upvotes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  const handleSeeAll = () => {
    setActiveTab("Semua");
    setView("list");
    onExpandedChange?.(true);
    onMinimizedChange?.(false);
  };

  // Drag handle: hanya aktif di mobile bottom-sheet (CSS mengabaikan
  // transform ini di layar >768px karena .feed-panel tidak posisi bottom).
  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    dragStartExpanded.current = expanded;
  };
  const handleDragEnd = (clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY;
    dragStartY.current = null;
    if (Math.abs(delta) < DRAG_OPEN_THRESHOLD) {
      // Tap singkat pada handle = toggle
      onExpandedChange?.(!dragStartExpanded.current);
      return;
    }
    onExpandedChange?.(delta > 0);
  };

  if (minimized) {
    return (
      <button
        type="button"
        className="feed-panel-restore"
        onClick={() => onMinimizedChange?.(false)}
      >
        <MessageCircle width={16} height={16} />
        Feed Threads
      </button>
    );
  }

  return (
    <div className={`feed-panel${expanded ? " expanded" : ""}`}>
      <div
        className="feed-sheet-handle"
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientY)}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseUp={(e) => handleDragEnd(e.clientY)}
        role="button"
        aria-label={expanded ? "Ciutkan bottom sheet feed" : "Perluas bottom sheet feed"}
      >
        <div className="feed-sheet-handle-bar" />
      </div>
      <div className="feed-top">
        <h3>Feed Threads (Laporan Warga Terbaru)</h3>
        <div className="feed-top-actions">
          <button type="button" className="feed-planner-trigger" onClick={onOpenPlanner}>
            <Sparkles width={13} height={13} />
            <span>AI Trip Planner</span>
          </button>
          <button type="button" className="feed-see-all" onClick={handleSeeAll}>
            Lihat semua
          </button>
          {onMinimizedChange && (
            <button
              type="button"
              className="panel-action-btn"
              onClick={() => onMinimizedChange(true)}
              aria-label="Ciutkan panel feed"
              title="Ciutkan"
            >
              <Minus width={14} height={14} />
            </button>
          )}
        </div>
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
        <div className="sort" ref={sortMenuRef}>
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
