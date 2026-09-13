"use client";

import {
  Bike,
  Building2,
  Bus,
  Car,
  CircleParking,
  ChevronsLeft,
  Construction,
  GraduationCap,
  Info,
  Landmark,
  Leaf,
  Map,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SquarePen,
  Store,
  Theater,
  Trees,
  Waves,
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
];

interface SidebarProps {
  active: string;
  onNavigate: (key: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  user: AppShellUser;
}

export default function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  user,
}: SidebarProps) {
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
            <Leaf width={18} height={18} color="#ffffff" />
          </div>
        </button>
        <div className="brand-text">
          <div className="brand-name">NGEBOLANG</div>
          <div className="brand-sub">Peta Sosial Mobilitas</div>
        </div>
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
            <ChevronsLeft width={16} height={16} />
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
            <span className="label">{label}</span>
          </div>
        ))}
      </nav>

      <hr />

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

      <div className="side-title">Kepadatan Pengunjung (Real-time)</div>
      <div className="density-box">
        <div className="density-bar" />
        <div className="density-labels">
          <span>Rendah</span>
          <span>Tinggi</span>
        </div>
      </div>

      <div className="side-title">Fasilitas &amp; POI</div>
      <div className="legend-list">
        {poiLegendItems.map(({ label, color, icon: Icon }) => (
          <div className="legend-row" key={label}>
            <div
              className="legend-dot"
              style={{
                background: color === "#4b5563" ? "#fff" : color,
                border: color === "#4b5563" ? "1.5px solid #d7dbe2" : "none",
              }}
            >
              <Icon width={12} height={12} color={color} />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">{user.namaTampilan.charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.namaTampilan}</span>
          <span className="sidebar-user-email">{user.email}</span>
        </div>
      </div>
    </aside>
  );
}
