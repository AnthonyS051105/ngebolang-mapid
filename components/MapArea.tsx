"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bell,
  ChevronDown,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Plus,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { layerDefs as initialLayerDefs } from "@/lib/data";
import type { LayerDef } from "@/lib/types";
import type { MapViewHandle } from "./MapView";
import FeedPanel from "./FeedPanel";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapArea() {
  const [layerDefs, setLayerDefs] = useState<LayerDef[]>(initialLayerDefs);
  const handleRef = useRef<MapViewHandle | null>(null);

  const toggleLayer = (key: string) => {
    setLayerDefs((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const on = !d.on;
        handleRef.current?.setLayerVisible(key, on);
        return { ...d, on };
      })
    );
  };

  return (
    <main className="map-area">
      <MapView
        layerDefs={initialLayerDefs}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />

      <div className="top-bar">
        <div className="search-card">
          <Search className="search-icon" width={17} height={17} />
          <div className="search-text">
            <div className="q">Cari tujuan &amp; budget...</div>
            <div className="hint">Contoh: Dari Tugu ke Kraton, budget 50rb</div>
          </div>
          <button
            className="plan-btn"
            onClick={() => handleRef.current?.flashRoute()}
          >
            <Sparkles width={15} height={15} /> Rencanakan Trip
          </button>
        </div>
        <div className="top-right">
          <div className="pill">
            <Sun width={15} height={15} /> Siang hari
          </div>
          <div className="icon-btn">
            <Bell width={18} height={18} />
            <span className="badge">3</span>
          </div>
          <div className="avatar">
            <User width={19} height={19} />
          </div>
        </div>
      </div>

      <div className="layer-card">
        <h4 style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Layers width={15} height={15} color="#1c2230" /> Kontrol Layer
        </h4>
        <div>
          {layerDefs.map((d) => (
            <div className="layer-row" key={d.key}>
              <span>{d.name}</span>
              <div
                className={`switch${d.on ? "" : " off"}`}
                onClick={() => toggleLayer(d.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="basemap-pill">
        <MapIcon width={14} height={14} /> Peta dasar{" "}
        <ChevronDown width={13} height={13} />
      </div>

      <div className="zoom-ctrl">
        <div className="zoom-btn" onClick={() => handleRef.current?.zoomIn()}>
          <Plus width={17} height={17} />
        </div>
        <div className="zoom-btn" onClick={() => handleRef.current?.zoomOut()}>
          <Minus width={17} height={17} />
        </div>
        <div className="zoom-btn">
          <LocateFixed width={16} height={16} />
        </div>
      </div>
      <div className="scale-tag">200 m</div>

      <FeedPanel />
    </main>
  );
}
