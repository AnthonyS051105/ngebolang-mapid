"use client";

import { MessageSquare, Map, Plus } from "lucide-react";

interface MobileBottomNavProps {
  active: string;
  onNavigate: (key: string) => void;
  onFabClick: () => void;
}

// Navbar mobile sengaja hanya 3 item (Peta / Buat Laporan / Feed) -- AI Trip
// Planner dibuka dari search-card di top-bar peta, atau dari tombol khusus
// di atas panel Feed, bukan dari tab navbar (permintaan eksplisit user).
export default function MobileBottomNav({
  active,
  onNavigate,
  onFabClick,
}: MobileBottomNavProps) {
  return (
    <div className="mobile-bottom-nav">
      <div
        className={`mnav-item${active === "peta" ? " active" : ""}`}
        onClick={() => onNavigate("peta")}
      >
        <Map width={20} height={20} />
        Peta
      </div>
      <div className="mnav-fab" onClick={onFabClick} role="button" aria-label="Buat laporan baru">
        <Plus width={24} height={24} />
      </div>
      <div
        className={`mnav-item${active === "feed" ? " active" : ""}`}
        onClick={() => onNavigate("feed")}
      >
        <MessageSquare width={20} height={20} />
        Feed
      </div>
    </div>
  );
}
