"use client";

import {
  Bus,
  Car,
  ChevronsLeft,
  Construction,
  Footprints,
  Info,
  Leaf,
  Map,
  MessageSquare,
  SquarePen,
  Sparkles,
} from "lucide-react";
import type { AppShellUser } from "./AppShell";

const navItems = [
  { key: "peta", label: "Peta Utama", icon: Map },
  { key: "planner", label: "AI Trip Planner", icon: Sparkles },
  { key: "feed", label: "Feed Threads", icon: MessageSquare },
  { key: "lapor", label: "Buat Laporan", icon: SquarePen },
];

const legendItems = [
  { label: "Jalan Rusak", color: "var(--red)", icon: Construction },
  { label: "Kemacetan", color: "var(--orange)", icon: Car },
  { label: "Halte Penuh", color: "var(--blue)", icon: Bus },
  { label: "Trotoar Terhalang", color: "var(--purple)", icon: Footprints },
  { label: "Info Lainnya", color: "var(--gray)", icon: Info },
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

      <div className="side-title">Legenda Laporan</div>
      <div className="legend-list">
        {legendItems.map(({ label, color, icon: Icon }) => (
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
