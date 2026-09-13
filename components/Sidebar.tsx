"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Accessibility,
  Bike,
  Building2,
  Bus,
  Car,
  CircleParking,
  ChevronsLeft,
  Construction,
  Footprints,
  GraduationCap,
  Info,
  Landmark,
  Map,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SquarePen,
  Store,
  Theater,
  TriangleAlert,
  Trees,
  Users,
  Waves,
  Wrench,
} from "lucide-react";
import type { AppShellUser } from "./AppShell";

const navItems = [
  { key: "peta", label: "Peta Utama", icon: Map },
  { key: "planner", label: "AI Trip Planner", icon: Sparkles },
  { key: "feed", label: "Feed Threads", icon: MessageSquare },
  { key: "lapor", label: "Buat Laporan", icon: SquarePen },
];

// Laporan warga (report threads) — warna sesuai lib/data.ts CAT
const reportLegendItems = [
  { label: "Macet", color: "#f5820a", icon: Car },
  { label: "Banjir / Genangan", color: "#2f7cf6", icon: Waves },
  { label: "Jalan Rusak", color: "#ef4444", icon: Construction },
  { label: "Parkir Liar", color: "#9b5cf5", icon: CircleParking },
  { label: "Pasar Tumpah / Event", color: "#22c55e", icon: Store },
  { label: "Lainnya", color: "#6b7280", icon: Info },
];

// POI (fasilitas & tempat wisata) — putih background, sesuai MapView
const poiLegendItems = [
  { label: "Situs & Landmark", color: "#4b5563", icon: Landmark },
  { label: "Museum", color: "#4b5563", icon: Building2 },
  { label: "Pasar", color: "#4b5563", icon: Store },
  { label: "Atraksi", color: "#4b5563", icon: Sparkles },
  { label: "Belanja", color: "#4b5563", icon: ShoppingBag },
  { label: "Budaya / Seni", color: "#4b5563", icon: Theater },
  { label: "Halte Transit", color: "#0ea5e9", icon: Bus },
  { label: "Pangkalan Becak", color: "#9b5cf5", icon: Bike },
  { label: "Pendidikan", color: "#4b5563", icon: GraduationCap },
  { label: "Ruang Terbuka", color: "#4b5563", icon: Trees },
  { label: "Parkir / Fasilitas", color: "#4b5563", icon: CircleParking },
  { label: "Keamanan", color: "#4b5563", icon: ShieldCheck },
  { label: "Aksesibilitas Difabel", color: "#16a34a", icon: Accessibility },
  { label: "Fasilitas Pendukung", color: "#64748b", icon: Wrench },
];

// Survei kondisi trotoar (MAPID GeoServer, dataset 4 & 2) — lihat
// docs/PYTHON_API_CONTRACT.md Bagian 12c dan MapView.tsx KONDISI_FASILITAS_POPUP_FIELDS.
const trotoarLegendItems = [
  {
    label: "Kondisi Fasilitas (Halte/Trotoar)",
    color: "#f97316",
    icon: TriangleAlert,
  },
  { label: "Waktu Tempuh Jalan Kaki", color: "#0d9488", icon: Footprints },
];

// Survei tarif & titik transfer (MAPID GeoServer, dataset 1 & 3) — keduanya
// berisi pangkalan becak/andong (bukan titik halte independen), digabung ke
// toggle "Pangkalan Becak/Andong" yang sudah ada.
const becakLegendItems = [
  { label: "Pangkalan Becak/Andong", color: "#9b5cf5", icon: Bike },
  { label: "Pangkalan (Jarak ke Halte)", color: "#7c3aed", icon: Bike },
];

// Survei kepadatan (MAPID GeoServer, dataset 6) — titik observasi lapangan,
// pelengkap heatmap gradient yang sudah ada.
const kepadatanLegendItems = [
  { label: "Titik Observasi Kepadatan", color: "#dc2626", icon: Users },
];

interface SidebarProps {
  active: string;
  onNavigate: (key: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  user: AppShellUser;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  user,
}: SidebarProps) {
  const prefersReducedMotion = useReducedMotion();

  const labelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE };

  const labelVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -8 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <button
          type="button"
          className="brand-logo-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
          title={collapsed ? "Perluas menu" : "Ciutkan menu"}
        >
          <div className="brand-logo">
            <Image
              src="/ngebolang_mark.png"
              alt="NGEBOLANG"
              width={24}
              height={24}
              priority
            />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              className="brand-text"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={labelVariants}
              transition={labelTransition}
            >
              <div className="brand-name">NGEBOLANG</div>
              <div className="brand-sub">Peta Sosial Mobilitas</div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Saat collapsed, tombol ini disembunyikan supaya tidak menutupi
            logo -- untuk memperluas menu lagi, klik logo (brand-logo-btn). */}
        {!collapsed && (
          <button
            type="button"
            className="sidebar-collapse-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapsed();
            }}
            aria-label="Ciutkan menu"
            title="Ciutkan menu"
          >
            <motion.span
              className="sidebar-collapse-icon-wrap"
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={labelTransition}
            >
              <ChevronsLeft width={16} height={16} />
            </motion.span>
          </button>
        )}
      </div>

      <nav className="nav">
        {navItems.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`nav-item${active === key ? " active" : ""}`}
            onClick={() => onNavigate(key)}
            title={label}
          >
            <Icon width={17} height={17} />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  className="label"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={labelVariants}
                  transition={labelTransition}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <hr />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={labelVariants}
            transition={labelTransition}
          >
            <div className="side-title">Laporan Warga</div>
            <div className="legend-list">
              {reportLegendItems.map(({ label, color, icon: Icon }) => (
                <div className="legend-row" key={label}>
                  <div className="legend-dot" style={{ background: color }}>
                    <Icon width={12} height={12} color="#fff" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="side-title">Kepadatan Pengunjung</div>
            <div className="density-box">
              <div className="density-bar" />
              <div className="density-labels">
                <span>Rendah</span>
                <span>Tinggi</span>
              </div>
            </div>
            <div className="legend-list">
              {kepadatanLegendItems.map(({ label, color, icon: Icon }) => (
                <div className="legend-row" key={label}>
                  <div className="legend-dot" style={{ background: color }}>
                    <Icon width={12} height={12} color="#fff" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="side-title">Kondisi Trotoar</div>
            <div className="legend-list">
              {trotoarLegendItems.map(({ label, color, icon: Icon }) => (
                <div className="legend-row" key={label}>
                  <div className="legend-dot" style={{ background: color }}>
                    <Icon width={12} height={12} color="#fff" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="side-title">Pangkalan Becak/Andong</div>
            <div className="legend-list">
              {becakLegendItems.map(({ label, color, icon: Icon }) => (
                <div className="legend-row" key={label}>
                  <div className="legend-dot" style={{ background: color }}>
                    <Icon width={12} height={12} color="#fff" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="side-title">Fasilitas &amp; POI</div>
            <div className="legend-list">
              {poiLegendItems.map(({ label, color, icon: Icon }) => (
                <div className="legend-row" key={label}>
                  <div
                    className="legend-dot"
                    style={{
                      background: color === "#4b5563" ? "#fff" : color,
                      border:
                        color === "#4b5563" ? "1.5px solid #d7dbe2" : "none",
                    }}
                  >
                    <Icon width={12} height={12} color={color} />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">
          {user.namaTampilan.charAt(0).toUpperCase()}
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              className="sidebar-user-info"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={labelVariants}
              transition={labelTransition}
            >
              <span className="sidebar-user-name">{user.namaTampilan}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
