"use client";

import { MapPin, X } from "lucide-react";
import type { PoiItem } from "@/lib/types/routingApi";

interface PoiPopupProps {
  poi: PoiItem;
  x: number;
  y: number;
  onClose: () => void;
}

export default function PoiPopup({ poi, x, y, onClose }: PoiPopupProps) {
  return (
    <div
      className="poi-popup"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      <div className="photo poi-photo-fallback">
        <div className="close" onClick={onClose} role="button" aria-label="Tutup">
          <X width={19} height={19} />
        </div>
      </div>
      <div className="body">
        <span className="cat-tag">{poi.category}</span>
        <h4>{poi.name}</h4>
        <div className="loc">
          <MapPin width={11} height={11} /> {poi.lat.toFixed(5)}, {poi.lon.toFixed(5)}
        </div>

        <p className="poi-description">{poi.description}</p>
      </div>
    </div>
  );
}
