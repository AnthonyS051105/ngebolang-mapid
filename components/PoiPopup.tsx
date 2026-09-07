"use client";

import { MapPin, X } from "lucide-react";
import type { PoiPin } from "@/lib/types";

interface PoiPopupProps {
  poi: PoiPin;
  x: number;
  y: number;
  onClose: () => void;
}

const statusClass: Record<PoiPin["condition"], string> = {
  Normal: "normal",
  Ramai: "ramai",
  Tutup: "tutup",
};

export default function PoiPopup({ poi, x, y, onClose }: PoiPopupProps) {
  return (
    <div
      className="poi-popup"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      <div className="photo" style={{ backgroundImage: `url(${poi.photo})` }}>
        <div className="close" onClick={onClose}>
          <X width={14} height={14} />
        </div>
      </div>
      <div className="body">
        <span className="cat-tag">{poi.category}</span>
        <h4>{poi.label}</h4>
        <div className="loc">
          <MapPin width={11} height={11} /> Jl. Malioboro, Yogyakarta
        </div>

        {poi.routes && (
          <div className="fac-row">
            {poi.routes.map((r) => (
              <span className="fac-pill" key={r}>
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="fac-row">
          {poi.facilities.map((f) => (
            <span className="fac-pill" key={f}>
              {f}
            </span>
          ))}
        </div>

        <div className="status-row">
          <span>Update terakhir: {poi.updatedAt}</span>
          <span className={`status-pill ${statusClass[poi.condition]}`}>
            {poi.condition}
          </span>
        </div>

        <button className="btn-primary" style={{ marginBottom: 0 }}>
          Lihat Detail Halte
        </button>
      </div>
    </div>
  );
}
