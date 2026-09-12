"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Download,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { layerDefs as initialLayerDefs } from "@/lib/data";
import type { LayerDef } from "@/lib/types";
import { fetchPoi, fetchThreads, getExportReportsUrl } from "@/lib/api/routingClient";
import type { PoiItem, RouteResponse, ThreadItem } from "@/lib/types/routingApi";
import type { MapViewHandle, RouteDisplayOptions } from "./MapView";
import FeedPanel from "./FeedPanel";
import PoiPopup from "./PoiPopup";
import ThreadDetailModal from "./ThreadDetailModal";
import UserMenu from "./UserMenu";
import type { AppShellUser } from "./AppShell";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export interface MapAreaHandle {
  showRoute: (routeData: RouteResponse, options?: RouteDisplayOptions) => void;
}

interface MapAreaProps {
  onOpenPlanner: () => void;
  onOpenPlannerFromFeed: () => void;
  feedExpanded?: boolean;
  onFeedExpandedChange?: (expanded: boolean) => void;
  feedMinimized?: boolean;
  onFeedMinimizedChange?: (minimized: boolean) => void;
  user: AppShellUser;
}

function MapArea(
  {
    onOpenPlanner,
    onOpenPlannerFromFeed,
    feedExpanded,
    onFeedExpandedChange,
    feedMinimized,
    onFeedMinimizedChange,
    user,
  }: MapAreaProps,
  ref: React.Ref<MapAreaHandle>
) {
  const [layerDefs, setLayerDefs] = useState<LayerDef[]>(initialLayerDefs);
  const [poiItems, setPoiItems] = useState<PoiItem[]>([]);
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([]);
  const [activePoi, setActivePoi] = useState<{ poi: PoiItem; x: number; y: number } | null>(
    null
  );
  const [activeThread, setActiveThread] = useState<ThreadItem | null>(null);
  const [layerCardMinimized, setLayerCardMinimized] = useState(false);
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
    fetchThreads("APPROVED")
      .then((items) => {
        if (!cancelled) setThreadItems(items);
      })
      .catch((err) => {
        console.error("Gagal memuat laporan warga dari backend:", err);
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
        layerDefs={layerDefs}
        poiItems={poiItems}
        threadItems={threadItems}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
        onPoiClick={(poi, x, y) =>
          setActivePoi({ poi, x, y: Math.max(y, 220) })
        }
        onThreadClick={setActiveThread}
      />

      <div className="top-bar">
        <button type="button" className="search-card" onClick={onOpenPlanner}>
          <Search className="search-icon" width={17} height={17} />
          <div className="search-text">
            <div className="q">Cari tujuan &amp; budget...</div>
            <div className="hint">Contoh: Dari Tugu ke Kraton, budget 50rb</div>
          </div>
          <span
            className="plan-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPlanner();
            }}
          >
            <span>Rencanakan Trip</span> <Sparkles width={15} height={15} />
          </span>
        </button>
        <div className="top-right">
          <UserMenu user={user} />
        </div>
      </div>

      <div className={`layer-card${layerCardMinimized ? " minimized" : ""}`}>
        <div className="floating-panel-head">
          <h4>
            <Layers width={15} height={15} color="#1c2230" /> Kontrol Layer
          </h4>
          <button
            type="button"
            className="panel-action-btn"
            onClick={() => setLayerCardMinimized((v) => !v)}
            aria-label={layerCardMinimized ? "Perluas kontrol layer" : "Ciutkan kontrol layer"}
            title={layerCardMinimized ? "Perluas" : "Ciutkan"}
          >
            <Minus width={14} height={14} />
          </button>
        </div>
        {!layerCardMinimized && (
          <>
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
            <a
              className="layer-export-link"
              href={getExportReportsUrl("geojson")}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download width={14} height={14} /> Unduh Laporan (GeoJSON)
            </a>
          </>
        )}
      </div>

      <div className="map-controls-cluster">
        <div
          className="ctrl-btn locate"
          onClick={() => handleRef.current?.locate()}
          title="Lokasi saya"
        >
          <LocateFixed width={16} height={16} />
        </div>
        <div className="ctrl-divider" />
        <div className="ctrl-btn" onClick={() => handleRef.current?.zoomIn()} title="Perbesar">
          <Plus width={17} height={17} />
        </div>
        <div className="ctrl-btn" onClick={() => handleRef.current?.zoomOut()} title="Perkecil">
          <Minus width={17} height={17} />
        </div>
      </div>
      <div className="scale-tag">200 m</div>

      <FeedPanel
        onOpenThread={setActiveThread}
        expanded={feedExpanded}
        onExpandedChange={onFeedExpandedChange}
        minimized={feedMinimized}
        onMinimizedChange={onFeedMinimizedChange}
        onOpenPlanner={onOpenPlannerFromFeed}
      />

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
