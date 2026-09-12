"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
} from "lucide-react";
import { layerDefs as initialLayerDefs } from "@/lib/data";
import type { LayerDef, ReportPin } from "@/lib/types";
import { fetchPoi } from "@/lib/api/routingClient";
import type { PoiItem, RouteResponse } from "@/lib/types/routingApi";
import type { MapViewHandle, RouteDisplayOptions } from "./MapView";
import FeedPanel from "./FeedPanel";
import PoiPopup from "./PoiPopup";
import TripPlannerModal from "./TripPlannerModal";
import ThreadDetailModal from "./ThreadDetailModal";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export interface MapAreaHandle {
  showRoute: (routeData: RouteResponse, options?: RouteDisplayOptions) => void;
}

interface MapAreaProps {
  showPlanner: boolean;
  onClosePlanner: () => void;
}

function MapArea({ showPlanner, onClosePlanner }: MapAreaProps, ref: React.Ref<MapAreaHandle>) {
  const [layerDefs, setLayerDefs] = useState<LayerDef[]>(initialLayerDefs);
  const [poiItems, setPoiItems] = useState<PoiItem[]>([]);
  const [activePoi, setActivePoi] = useState<{ poi: PoiItem; x: number; y: number } | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<ReportPin | null>(null);
  const handleRef = useRef<MapViewHandle | null>(null);

  useImperativeHandle(ref, () => ({
    showRoute: (routeData: RouteResponse, options?: RouteDisplayOptions) => {
      handleRef.current?.showRoute(routeData.geojson, options);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    fetchPoi()
      .then((items) => {
        if (!cancelled) setPoiItems(items);
      })
      .catch((err) => {
        console.error("Gagal memuat POI dari backend:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        poiItems={poiItems}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
        onPoiClick={(poi, x, y) =>
          setActivePoi({ poi, x, y: Math.max(y, 220) })
        }
      />

      <div className="top-bar">
        <div className="search-card">
          <Search className="search-icon" width={17} height={17} />
          <div className="search-text">
            <div className="q">Cari tujuan &amp; budget...</div>
            <div className="hint">Contoh: Dari Tugu ke Kraton, budget 50rb</div>
          </div>
          <button className="plan-btn">
            <span>Rencanakan Trip</span> <Sparkles width={15} height={15} />
          </button>
        </div>
        <div className="top-right">
          <div className="pill">
            <Sun width={15} height={15} /> Siang hari
            <ChevronDown width={12} height={12} />
          </div>
          <div className="icon-btn">
            <Bell width={18} height={18} />
            <span className="badge">3</span>
          </div>
          <div
            className="avatar"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
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

      <div className="map-controls-cluster">
        <div
          className="ctrl-btn locate"
          onClick={() => handleRef.current?.locate()}
        >
          <LocateFixed width={16} height={16} />
        </div>
        <div className="ctrl-divider" />
        <div className="ctrl-btn" onClick={() => handleRef.current?.zoomIn()}>
          <Plus width={17} height={17} />
        </div>
        <div className="ctrl-btn" onClick={() => handleRef.current?.zoomOut()}>
          <Minus width={17} height={17} />
        </div>
        <div className="ctrl-divider" />
        <div className="ctrl-btn">
          <Layers width={16} height={16} />
        </div>
      </div>
      <div className="scale-tag">200 m</div>

      <FeedPanel onOpenThread={setActiveThread} />

      <div className="map-footer">
        <span>Sumber data: Survey Tim NGEBOLANG &amp; Open Data</span>
        <span className="brand-mini">NGEBOLANG</span>
      </div>

      {activePoi && (
        <PoiPopup
          poi={activePoi.poi}
          x={activePoi.x}
          y={activePoi.y}
          onClose={() => setActivePoi(null)}
        />
      )}

      {showPlanner && (
        <TripPlannerModal onClose={onClosePlanner} onViewOnMap={onClosePlanner} />
      )}

      {activeThread && (
        <ThreadDetailModal
          report={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}
    </main>
  );
}

export default forwardRef(MapArea);
