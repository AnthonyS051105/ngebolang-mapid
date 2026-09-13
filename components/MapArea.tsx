"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import {
  fetchPoi,
  fetchThreads,
  getExportReportsUrl,
} from "@/lib/api/routingClient";
import type {
  PoiItem,
  RouteResponse,
  ThreadItem,
} from "@/lib/types/routingApi";
import { useDockablePanel } from "@/lib/hooks/useDockablePanel";
import type { MapViewHandle, RouteDisplayOptions } from "./MapView";
import DockablePanel from "./DockablePanel";
import FeedPanel from "./FeedPanel";
import FeedFullScreen from "./FeedFullScreen";
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
  onComposerSubmit?: (text: string) => void;
  feedExpanded?: boolean;
  onFeedExpandedChange?: (expanded: boolean) => void;
  feedMinimized?: boolean;
  onFeedMinimizedChange?: (minimized: boolean) => void;
  isMobile?: boolean;
  feedReservedRightInset?: number;
  user: AppShellUser;
}

function MapArea(
  {
    onOpenPlanner,
    onComposerSubmit,
    feedExpanded,
    onFeedExpandedChange,
    feedMinimized,
    onFeedMinimizedChange,
    isMobile = false,
    feedReservedRightInset = 0,
    user,
  }: MapAreaProps,
  ref: React.Ref<MapAreaHandle>,
) {
  const [layerDefs, setLayerDefs] = useState<LayerDef[]>(initialLayerDefs);
  const [poiItems, setPoiItems] = useState<PoiItem[]>([]);
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([]);
  const [activePoi, setActivePoi] = useState<{
    poi: PoiItem;
    x: number;
    y: number;
  } | null>(null);
  const [activeThread, setActiveThread] = useState<ThreadItem | null>(null);
  const [feedFullScreen, setFeedFullScreen] = useState(false);
  const [layerCardMinimized, setLayerCardMinimized] = useState(false);
  const [composerText, setComposerText] = useState("");
  const mapAreaElRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MapViewHandle | null>(null);

  const layerPanel = useDockablePanel({
    id: "layer-card",
    initialDock: "float",
    initialPosition: { x: 18, y: 106 },
    initialSize: { width: 222, height: 280 },
    minSize: { width: 190, height: 160 },
    maxSize: { width: 360, height: 520 },
    dockable: false,
    getBounds: () =>
      mapAreaElRef.current?.getBoundingClientRect() ??
      new DOMRect(0, 0, 1200, 800),
    disabled: isMobile,
  });

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
      }),
    );
  };

  return (
    <main className="map-area" ref={mapAreaElRef}>
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
        onPoiMove={(x, y) =>
          setActivePoi((prev) =>
            prev ? { ...prev, x, y: Math.max(y, 220) } : prev,
          )
        }
        activePoiId={activePoi?.poi.id ?? null}
        onThreadClick={setActiveThread}
      />

      <div className="top-bar">
        <form
          className="search-card"
          onSubmit={(e) => {
            e.preventDefault();
            const text = composerText.trim();
            if (!text) {
              onOpenPlanner();
              return;
            }
            setComposerText("");
            onComposerSubmit?.(text);
          }}
        >
          <Search className="search-icon" width={17} height={17} />
          <input
            type="text"
            className="search-input"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Dari Tugu ke Kraton, budget 50rb"
            onFocus={onOpenPlanner}
          />
          <button type="submit" className="plan-btn">
            <span>Rencanakan Trip</span> <Sparkles width={15} height={15} />
          </button>
        </form>
        <div className="top-right">
          <UserMenu user={user} />
        </div>
      </div>

      {layerCardMinimized ? (
        <button
          type="button"
          className="panel-minimized-btn layer-card-minimized-btn"
          onClick={() => setLayerCardMinimized(false)}
          aria-label="Perluas kontrol layer"
          title="Kontrol Layer"
        >
          <Layers width={18} height={18} />
        </button>
      ) : isMobile ? (
        <div className="layer-card">
          <div className="floating-panel-head">
            <h4>
              <Layers width={15} height={15} color="#1c2230" /> Kontrol Layer
            </h4>
            <button
              type="button"
              className="panel-action-btn"
              onClick={() => setLayerCardMinimized(true)}
              aria-label="Ciutkan kontrol layer"
              title="Ciutkan"
            >
              <Minus width={14} height={14} />
            </button>
          </div>
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
        </div>
      ) : (
        <DockablePanel panel={layerPanel} className="layer-card">
          <div
            className="floating-panel-head panel-drag-handle"
            {...layerPanel.dragHandleProps}
          >
            <h4>
              <Layers width={15} height={15} color="#1c2230" /> Kontrol Layer
            </h4>
            <button
              type="button"
              className="panel-action-btn"
              onClick={() => setLayerCardMinimized(true)}
              aria-label="Ciutkan kontrol layer"
              title="Ciutkan"
            >
              <Minus width={14} height={14} />
            </button>
          </div>
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
        </DockablePanel>
      )}

      <div className="map-controls-cluster">
        <div
          className="ctrl-btn locate"
          onClick={() => handleRef.current?.locate()}
          title="Lokasi saya"
        >
          <LocateFixed width={16} height={16} />
        </div>
        <div className="ctrl-divider" />
        <div
          className="ctrl-btn"
          onClick={() => handleRef.current?.zoomIn()}
          title="Perbesar"
        >
          <Plus width={17} height={17} />
        </div>
        <div
          className="ctrl-btn"
          onClick={() => handleRef.current?.zoomOut()}
          title="Perkecil"
        >
          <Minus width={17} height={17} />
        </div>
      </div>
      <div className="scale-tag">200 m</div>

      <FeedPanel
        onOpenThread={setActiveThread}
        onSeeAll={() => setFeedFullScreen(true)}
        expanded={feedExpanded}
        onExpandedChange={onFeedExpandedChange}
        minimized={feedMinimized}
        onMinimizedChange={onFeedMinimizedChange}
        isMobile={isMobile}
        reservedRightInset={feedReservedRightInset}
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

      {feedFullScreen && (
        <FeedFullScreen
          onOpenThread={setActiveThread}
          onClose={() => setFeedFullScreen(false)}
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
