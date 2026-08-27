"use client";

import { useState } from "react";
import {
  Bus,
  Car,
  CircleHelp,
  Construction,
  Footprints,
  Info,
  Leaf,
  Map,
  MessageSquare,
  SquarePen,
  Sparkles,
} from "lucide-react";

const navItems = [
  { key: "peta", label: "Peta Utama", icon: Map },
  { key: "planner", label: "AI Trip Planner", icon: Sparkles },
  { key: "feed", label: "Feed Threads", icon: MessageSquare },
  { key: "lapor", label: "Buat Laporan", icon: SquarePen },
  { key: "about", label: "Tentang NGEBOLANG", icon: CircleHelp },
];

const legendItems = [
  { label: "Jalan Rusak", color: "var(--red)", icon: Construction },
  { label: "Kemacetan", color: "var(--orange)", icon: Car },
  { label: "Halte Penuh", color: "var(--blue)", icon: Bus },
  { label: "Trotoar Terhalang", color: "var(--purple)", icon: Footprints },
  { label: "Info Lainnya", color: "var(--gray)", icon: Info },
];

export default function Sidebar() {
  const [active, setActive] = useState("peta");

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <Leaf width={18} height={18} color="#ffffff" />
        </div>
        <div>
          <div className="brand-name">NGEBOLANG</div>
          <div className="brand-sub">Peta Sosial Mobilitas</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`nav-item${active === key ? " active" : ""}`}
            onClick={() => setActive(key)}
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
        <Info width={14} height={14} />
        <span>Tentang Aplikasi</span>
      </div>
    </aside>
  );
}
