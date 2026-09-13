"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Minus,
  ThumbsUp,
} from "lucide-react";
import { categoryOf, tabKeyMap, tabs } from "@/lib/data";
import type { ThreadItem } from "@/lib/types/routingApi";

interface FeedPanelProps {
  threads: ThreadItem[];
  onOpenThread: (thread: ThreadItem) => void;
  /** Buka tampilan "Lihat semua" (halaman penuh satu layar), bukan hanya
   * memperluas panel kecil ini. */
  onSeeAll: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  minimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  isMobile?: boolean;
  /** Lebar (px) yang harus disisakan di sisi kanan -- dipakai saat AI Trip
   * Planner docked-right, supaya kedua panel bersisian, bukan tumpang tindih.
   * Feed Threads sendiri statis (tidak dockable), hanya lebarnya yang menyusut. */
  reservedRightInset?: number;
  /** Apakah AI Trip Planner sedang terbuka dan tidak minimized? */
  plannerOpen?: boolean;
  /** Lebar panel AI (px) -- restore-button feed digeser ke kirinya. */
  plannerPanelWidth?: number;
  /** Mobile only -- dipanggil tiap kali tinggi bottom sheet yang terlihat
   * berubah (termasuk real-time selama drag), supaya tombol AI Trip Planner
   * mengambang bisa ikut mengikuti tepi atas sheet. `dragging` true selama
   * gestur drag berlangsung -- dipakai supaya AppShell bisa menonaktifkan
   * transisi CSS tombol saat itu (tombol harus mengikuti jari persis,
   * transisi cuma untuk perpindahan diskrit seperti lepas jari / snap). */
  onSheetVisibleChange?: (
    visiblePx: number,
    viewportHeight: number,
    dragging: boolean
  ) => void;
}

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80";

type SortKey = "terbaru" | "populer";
// Bottom sheet mobile bisa di-drag bebas ke tinggi berapa pun (tidak lagi
// dikunci ke 3 titik tetap) -- "collapsed" & "peek" di bawah cuma dipakai
// sebagai titik snap AWAL/hasil ketuk navbar, bukan satu-satunya posisi valid.
// "full" berarti benar-benar menutup seluruh layar (top:0, tanpa gap).
type SnapPoint = "collapsed" | "peek" | "full";
const SNAP_VISIBLE_PX: Record<SnapPoint, number> = {
  collapsed: 96,
  peek: 320,
  full: 0, // "full" dihitung relatif terhadap viewport, lihat snapVisiblePx()
};
// Seberapa dekat (px) ke titik collapsed/full sebelum drag "menempel" ke sana
// saat dilepas -- di luar rentang ini, sheet tetap di posisi bebas hasil drag.
const EDGE_SNAP_THRESHOLD = 40;

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
  threads,
  onOpenThread,
  onSeeAll,
  expanded = false,
  onExpandedChange,
  minimized = false,
  onMinimizedChange,
  isMobile = false,
  reservedRightInset = 0,
  plannerOpen = false,
  plannerPanelWidth = 0,
  onSheetVisibleChange,
}: FeedPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [view, setView] = useState<"card" | "list">("card");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Tinggi sheet yang terlihat (px dari bawah layar) -- state kontinu, bukan
  // dikunci ke 3 titik tetap, supaya sheet bisa berhenti di posisi bebas
  // sesuai preferensi drag pengguna. `snap` di bawah hanya label titik
  // terakhir yang "ditempeli" (dipakai utamanya oleh navbar "Feed").
  const [visiblePx, setVisiblePx] = useState<number>(SNAP_VISIBLE_PX.peek);
  const [snap, setSnap] = useState<SnapPoint>("peek");
  const [dragVisiblePx, setDragVisiblePx] = useState<number | null>(null);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const sheetDragRef = useRef<{ startY: number; startVisible: number } | null>(null);
  // Lacak transisi prop `expanded` (dikendalikan navigasi eksternal, mis. tab
  // "Feed" mobile) untuk menyesuaikan snap-point saat render, bukan lewat
  // efek terpisah -- pola "adjust state during render" ala React docs.
  const [prevExpanded, setPrevExpanded] = useState(expanded);
  if (isMobile && prevExpanded !== expanded) {
    setPrevExpanded(expanded);
    setSnap(expanded ? "full" : "peek");
    setVisiblePx(
      expanded
        ? typeof window !== "undefined"
          ? window.innerHeight
          : SNAP_VISIBLE_PX.full
        : SNAP_VISIBLE_PX.peek
    );
  }

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
    onSeeAll();
  };

  // ---- Mobile bottom-sheet: drag bebas mengikuti jari secara real-time,
  // berhenti di posisi manapun saat dilepas -- hanya "menempel" ke
  // collapsed/full kalau dilepas cukup dekat (EDGE_SNAP_THRESHOLD) dengan
  // salah satu ujung itu, mirip bottom sheet Google Maps versi longgar.
  const fullVisiblePx = useCallback(() => {
    if (typeof window === "undefined") return SNAP_VISIBLE_PX.full;
    return window.innerHeight;
  }, []);

  const handleSheetPointerDown = (e: React.PointerEvent) => {
    if (!isMobile) return;
    // setPointerCapture bisa gagal (mis. event bukan pointer aktif yang
    // sesungguhnya, terjadi di sebagian alat testing/emulasi) -- drag tetap
    // jalan lewat listener pointermove/up di window, jadi aman diabaikan.
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // sengaja diabaikan
    }
    sheetDragRef.current = { startY: e.clientY, startVisible: visiblePx };
    setIsDraggingSheet(true);
  };

  const handleSheetPointerMove = (e: React.PointerEvent) => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const maxVisible = fullVisiblePx();
    const nextVisible = Math.min(
      maxVisible,
      Math.max(SNAP_VISIBLE_PX.collapsed, drag.startVisible - dy)
    );
    setDragVisiblePx(nextVisible);
    onSheetVisibleChange?.(nextVisible, maxVisible, true);
  };

  const handleSheetPointerUp = () => {
    if (!sheetDragRef.current) return;
    sheetDragRef.current = null;
    setIsDraggingSheet(false);
    const current = dragVisiblePx ?? visiblePx;
    setDragVisiblePx(null);

    const maxVisible = fullVisiblePx();
    let resolved = current;
    let resolvedSnap: SnapPoint = "peek";
    if (Math.abs(current - SNAP_VISIBLE_PX.collapsed) <= EDGE_SNAP_THRESHOLD) {
      resolved = SNAP_VISIBLE_PX.collapsed;
      resolvedSnap = "collapsed";
    } else if (Math.abs(current - maxVisible) <= EDGE_SNAP_THRESHOLD) {
      resolved = maxVisible;
      resolvedSnap = "full";
    }
    setVisiblePx(resolved);
    setSnap(resolvedSnap);
    onExpandedChange?.(resolvedSnap === "full");
    onSheetVisibleChange?.(resolved, maxVisible, false);
  };

  const sheetVisiblePx = dragVisiblePx ?? visiblePx;
  const sheetHeight = fullVisiblePx();
  const sheetTranslateY = isMobile ? Math.max(0, sheetHeight - sheetVisiblePx) : undefined;

  useEffect(() => {
    if (!isMobile) return;
    onSheetVisibleChange?.(sheetVisiblePx, sheetHeight, isDraggingSheet);
  }, [isMobile, sheetVisiblePx, sheetHeight, isDraggingSheet, onSheetVisibleChange]);

  if (minimized) {
    // Kalau planner terbuka di kanan, geser tombol restore ke kirinya
    const restoreRight = plannerOpen && plannerPanelWidth > 0
      ? 18 + plannerPanelWidth
      : 18;
    return (
      <button
        type="button"
        className="feed-panel-restore"
        style={{ right: restoreRight }}
        onClick={() => onMinimizedChange?.(false)}
      >
        <MessageCircle width={16} height={16} />
        Feed Threads
      </button>
    );
  }

  const body = (
    <>
      <div className="feed-top">
        <h3>Feed Threads (Laporan Warga Terbaru)</h3>
        <div className="feed-top-actions">
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
      {/* feed-tabs: tab pills scroll horizontal. Sort + toggle dikunci di kanan (tidak ikut scroll). */}
      <div className="feed-tabs">
        <div className="feed-tabs-scroll">
          {tabs.map((t) => (
            <div
              key={t}
              className={`tab${activeTab === t ? " active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="feed-tabs-actions">
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
          <div className="feed-scroll-btn" onClick={scrollNext}>
            <ChevronRight width={16} height={16} />
          </div>
        </div>
      ) : (
        <div className="feed-list">
          {list.map((t) => (
            <div className="feed-list-row" key={t.id} onClick={() => onOpenThread(t)}>
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
    </>
  );

  if (isMobile) {
    return (
      <div
        className={`feed-panel mobile-sheet${snap === "full" ? " expanded" : ""}${
          isDraggingSheet ? " sheet-no-transition" : ""
        }`}
        style={{ transform: `translateY(${sheetTranslateY}px)`, height: sheetHeight }}
      >
        <div
          className="feed-sheet-handle"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
          role="button"
          aria-label={snap === "full" ? "Ciutkan bottom sheet feed" : "Perluas bottom sheet feed"}
        >
          <div className="feed-sheet-handle-bar" />
        </div>
        {body}
      </div>
    );
  }

  return (
    <div
      className="feed-panel"
      style={reservedRightInset > 0 ? { right: 18 + reservedRightInset } : undefined}
    >
      {body}
    </div>
  );
}
