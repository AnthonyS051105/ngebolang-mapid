"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;

const screenVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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
  const prefersReducedMotion = useReducedMotion();
  // Kartu yang ID-nya sudah pernah dirender sebelumnya tidak perlu memutar
  // ulang animasi entrance saat tab/sort berubah atau ada re-render lain --
  // hanya kartu yang benar-benar baru (id belum pernah terlihat) yang
  // dianimasikan masuk. Dihitung & disesuaikan SELAMA render (pola "adjust
  // state during render" ala React docs) berdasarkan identitas `threads`,
  // bukan lewat ref (dilarang diakses saat render) atau effect terpisah.
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [seenForThreads, setSeenForThreads] = useState<ThreadItem[] | null>(null);
  if (seenForThreads !== threads) {
    setSeenForThreads(threads);
    setSeenIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const t of threads) {
        if (!next.has(t.id)) {
          next.add(t.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  const list = threads
    .filter((t) => activeTab === "Semua" || t.category === tabKeyMap[activeTab])
    .sort((a, b) =>
      sort === "populer"
        ? b.upvotes - a.upvotes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const screenTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: EASE };

  return (
    <motion.div
      className="feed-fullscreen"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={screenVariants}
      transition={screenTransition}
    >
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
          <button
            key={t}
            type="button"
            className={`tab${activeTab === t ? " active" : ""}`}
            aria-pressed={activeTab === t}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
        <div className="sort">
          <button
            type="button"
            className="sort-trigger"
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            onClick={() => setSortMenuOpen((v) => !v)}
          >
            {sort === "terbaru" ? "Terbaru" : "Terpopuler"}
            <ChevronDown width={12} height={12} />
          </button>
          {sortMenuOpen && (
            <div className="sort-menu" role="listbox">
              <button
                type="button"
                className={`sort-menu-item${sort === "terbaru" ? " active" : ""}`}
                role="option"
                aria-selected={sort === "terbaru"}
                onClick={() => {
                  setSort("terbaru");
                  setSortMenuOpen(false);
                }}
              >
                Terbaru
              </button>
              <button
                type="button"
                className={`sort-menu-item${sort === "populer" ? " active" : ""}`}
                role="option"
                aria-selected={sort === "populer"}
                onClick={() => {
                  setSort("populer");
                  setSortMenuOpen(false);
                }}
              >
                Terpopuler
              </button>
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
              const isNew = !seenIds.has(t.id);
              return (
                <motion.div
                  className="fcard"
                  key={t.id}
                  onClick={() => onOpenThread(t)}
                  initial={isNew && !prefersReducedMotion ? "hidden" : false}
                  animate="visible"
                  variants={cardVariants}
                  transition={{ duration: 0.22, ease: EASE }}
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
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
