"use client";

import { useEffect, useRef, useState } from "react";
import type * as maplibregl from "maplibre-gl";
import { categoryOf, places } from "@/lib/data";
import { iconMarkup } from "@/lib/icons";
import { fetchHeatmap } from "@/lib/api/routingClient";
import type { LayerDef } from "@/lib/types";
import type { PoiItem, ThreadItem } from "@/lib/types/routingApi";

declare global {
  interface Window {
    maplibregl?: typeof maplibregl;
  }
}

const MAPID_STYLE_URL = `https://basemap.mapid.io/styles/street-2d-building/style.json?key=${process.env.NEXT_PUBLIC_MAPID_API_KEY}`;

// MapLibre GL JS di-load lewat <script> CDN di app/layout.tsx, BUKAN lewat
// `import "maplibre-gl"` -- import npm membuat MapLibre menghitung URL Web
// Worker-nya sendiri lewat import.meta.url, yang dibungkus Turbopack/webpack
// menjadi URL non-http sehingga worker gagal dimuat secara diam-diam (map
// tidak pernah selesai "load", tanpa error apa pun). Lewat CDN, browser
// menjalankan file itu apa adanya sehingga import.meta.url tetap valid.
function waitForMaplibreGl(): Promise<typeof maplibregl> {
  return new Promise((resolve) => {
    if (window.maplibregl) {
      resolve(window.maplibregl);
      return;
    }
    const interval = setInterval(() => {
      if (window.maplibregl) {
        clearInterval(interval);
        resolve(window.maplibregl);
      }
    }, 50);
  });
}

// Nilai category dari GET /api/layers/heatmap huruf kapital di awal
// ("Rendah"/"Sedang"/"Tinggi") -- lihat docs/PYTHON_API_CONTRACT.md Bagian 12.
// Dipetakan ke bobot numerik untuk native heatmap layer MapLibre.
const HEATMAP_CATEGORY_WEIGHT: Record<string, number> = {
  Rendah: 0.3,
  Sedang: 0.6,
  Tinggi: 1,
};

function weightForHeatmapCategory(category: unknown) {
  if (typeof category === "string" && HEATMAP_CATEGORY_WEIGHT[category] !== undefined) {
    return HEATMAP_CATEGORY_WEIGHT[category];
  }
  return 0.4;
}

const HEATMAP_SOURCE_ID = "kepadatan-heatmap-source";
const HEATMAP_LAYER_ID = "kepadatan-heatmap-layer";

export interface RouteDisplayOptions {
  walkOnly?: boolean;
  ramahAksesibilitas?: boolean;
}

export interface MapViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  setLayerVisible: (key: string, visible: boolean) => void;
  locate: () => void;
  showRoute: (geojson: GeoJSON.FeatureCollection, options?: RouteDisplayOptions) => void;
  clearRoute: () => void;
}

interface MapViewProps {
  layerDefs: LayerDef[];
  poiItems: PoiItem[];
  threadItems: ThreadItem[];
  onReady?: (handle: MapViewHandle) => void;
  onPoiClick?: (poi: PoiItem, x: number, y: number) => void;
  onThreadClick?: (thread: ThreadItem) => void;
}

const POI_CATEGORY_ICON: Record<string, string> = {
  heritage: "landmark",
  landmark: "landmark",
  market: "store",
  museum: "building-2",
  attraction: "sparkles",
  shopping: "shopping-bag",
  culture: "theater",
  transit: "bus",
  education: "graduation-cap",
  public_space: "trees",
  facility: "circle-parking",
  toilet: "toilet",
  parking: "circle-parking",
  worship: "landmark",
  security: "shield",
};

function iconForPoiCategory(category: string) {
  return POI_CATEGORY_ICON[category.toLowerCase()] ?? "map-pin";
}

const ROUTE_SOURCE_ID = "route-api-source";
const ROUTE_LINE_LAYER_ID = "route-api-line";
const ROUTE_POINT_LAYER_ID = "route-api-point";

export default function MapView({
  layerDefs,
  poiItems,
  threadItems,
  onReady,
  onPoiClick,
  onThreadClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const glMapRef = useRef<maplibregl.Map | null>(null);
  const glModuleRef = useRef<typeof maplibregl | null>(null);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const layerVisibilityRef = useRef<Record<string, boolean>>({});
  const onPoiClickRef = useRef(onPoiClick);
  const onThreadClickRef = useRef(onThreadClick);
  const [activeRouteMode, setActiveRouteMode] = useState<"walk_only" | "accessible" | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onPoiClickRef.current = onPoiClick;
  }, [onPoiClick]);

  useEffect(() => {
    onThreadClickRef.current = onThreadClick;
  }, [onThreadClick]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibregl = await waitForMaplibreGl();
      if (cancelled || !mapRef.current) return;
      glModuleRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: MAPID_STYLE_URL,
        center: [110.365, -7.793],
        zoom: 15,
        attributionControl: false,
      });
      glMapRef.current = map;

      map.on("error", (e) => {
        console.error("Gagal memuat basemap MAPID:", e?.error ?? e);
      });

      requestAnimationFrame(() => map.resize());
      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(mapRef.current);
      resizeObserverRef.current = resizeObserver;

      map.on("load", () => {
        if (cancelled) return;

        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: ROUTE_LINE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          filter: ["==", ["geometry-type"], "LineString"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#2f7cf6"],
            "line-width": ["coalesce", ["get", "weight"], 5],
            "line-opacity": ["coalesce", ["get", "opacity"], 0.9],
          },
        });
        map.addLayer({
          id: ROUTE_POINT_LAYER_ID,
          type: "circle",
          source: ROUTE_SOURCE_ID,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#fff",
            "circle-stroke-width": 3,
            "circle-stroke-color": ["coalesce", ["get", "color"], "#2f7cf6"],
          },
        });

        // Titik nama tempat statis (Tugu, Titik Nol, Malioboro, Kraton).
        places.forEach((p) => {
          const el = document.createElement("div");
          if (p.isText) {
            el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #2f7cf6;"></div>
              <div class="place-label">${p.name}</div>
            </div>`;
          } else {
            el.innerHTML = `<div style="text-align:center;">${iconMarkup(p.icon, {
              width: 26,
              height: 26,
              color: "#1c2230",
            })}</div><div class="place-label" style="margin-top:-2px;">${p.name}</div>`;
          }
          const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
          placeMarkersRef.current.push(marker);
        });

        map.addSource(HEATMAP_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: HEATMAP_LAYER_ID,
          type: "heatmap",
          source: HEATMAP_SOURCE_ID,
          paint: {
            "heatmap-weight": ["coalesce", ["get", "weight"], 0.4],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 12, 1, 17, 2.2],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 12, 30, 17, 90],
            "heatmap-opacity": 0.7,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(34,197,94,0)",
              0.2, "rgba(34,197,94,0.5)",
              0.5, "rgba(249,115,22,0.65)",
              0.8, "rgba(239,68,68,0.75)",
              1, "rgba(185,28,28,0.85)",
            ],
          },
        });

        fetchHeatmap()
          .then((fc) => {
            if (cancelled) return;
            const source = map.getSource(HEATMAP_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
            if (!source) return;
            const weighted: GeoJSON.FeatureCollection = {
              type: "FeatureCollection",
              features: (fc.features ?? [])
                .filter((f) => f.geometry?.type === "Point")
                .map((f) => ({
                  ...f,
                  properties: {
                    ...f.properties,
                    weight: weightForHeatmapCategory(f.properties?.category),
                  },
                })),
            };
            source.setData(weighted);
          })
          .catch((err) => {
            console.error("Gagal memuat heatmap dari backend:", err);
          });

        layerDefs.forEach((d) => {
          layerVisibilityRef.current[d.key] = d.on;
        });

        setMapReady(true);

        onReady?.({
          zoomIn: () => map.zoomIn(),
          zoomOut: () => map.zoomOut(),
          setLayerVisible: (key, visible) => {
            layerVisibilityRef.current[key] = visible;
            if (key === "heatmap") {
              if (map.getLayer(HEATMAP_LAYER_ID)) {
                map.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", visible ? "visible" : "none");
              }
            } else if (key === "poi") {
              poiMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            } else if (key === "reports") {
              reportMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            }
          },
          locate: () => {
            map.flyTo({ center: [110.365, -7.793], zoom: 15 });
          },
          showRoute: (routeGeojson, options) => {
            const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
            if (!source) return;

            const walkOnly = options?.walkOnly ?? false;
            const ramahAksesibilitas = options?.ramahAksesibilitas ?? false;
            setActiveRouteMode(walkOnly ? "walk_only" : ramahAksesibilitas ? "accessible" : null);

            source.setData(routeGeojson);

            if (ramahAksesibilitas) {
              map.setPaintProperty(ROUTE_LINE_LAYER_ID, "line-color", "#eab308");
              map.setPaintProperty(ROUTE_LINE_LAYER_ID, "line-width", [
                "+",
                ["coalesce", ["get", "weight"], 5],
                1,
              ]);
              map.setPaintProperty(ROUTE_LINE_LAYER_ID, "line-dasharray", undefined);
              map.setPaintProperty(ROUTE_POINT_LAYER_ID, "circle-stroke-color", "#eab308");
            } else {
              map.setPaintProperty(ROUTE_LINE_LAYER_ID, "line-color", [
                "coalesce",
                ["get", "color"],
                "#2f7cf6",
              ]);
              map.setPaintProperty(ROUTE_LINE_LAYER_ID, "line-width", [
                "coalesce",
                ["get", "weight"],
                5,
              ]);
              map.setPaintProperty(
                ROUTE_LINE_LAYER_ID,
                "line-dasharray",
                walkOnly ? [2, 2] : undefined
              );
              map.setPaintProperty(
                ROUTE_POINT_LAYER_ID,
                "circle-stroke-color",
                ["coalesce", ["get", "color"], "#2f7cf6"]
              );
            }

            const bounds = new maplibregl.LngLatBounds();
            let hasCoords = false;
            const extend = (coords: unknown): void => {
              if (
                Array.isArray(coords) &&
                coords.length >= 2 &&
                typeof coords[0] === "number" &&
                typeof coords[1] === "number"
              ) {
                bounds.extend(coords as [number, number]);
                hasCoords = true;
              } else if (Array.isArray(coords)) {
                coords.forEach(extend);
              }
            };
            (routeGeojson.features ?? []).forEach((f) => {
              const geometry = f.geometry as { coordinates?: unknown } | undefined;
              extend(geometry?.coordinates);
            });
            if (hasCoords) map.fitBounds(bounds, { padding: 60 });
          },
          clearRoute: () => {
            const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
            source?.setData({ type: "FeatureCollection", features: [] });
            setActiveRouteMode(null);
          },
        });
      });
    })();

    return () => {
      cancelled = true;
      placeMarkersRef.current.forEach((m) => m.remove());
      placeMarkersRef.current = [];
      poiMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current = [];
      reportMarkersRef.current.forEach((m) => m.remove());
      reportMarkersRef.current = [];
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      glMapRef.current?.remove();
      glMapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    poiItems.forEach((p) => {
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "34px";
      el.style.height = "34px";
      el.style.background = "#ffffff";
      el.style.borderColor = "#d7dbe2";
      el.innerHTML = `<span>${iconMarkup(iconForPoiCategory(p.category), {
        width: 16,
        height: 16,
        color: "#4b5563",
      })}</span>`;
      if (layerVisibilityRef.current.poi === false) el.style.display = "none";
      el.addEventListener("click", () => {
        const point = map.project([p.lon, p.lat]);
        onPoiClickRef.current?.(p, point.x, point.y - 20);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lon, p.lat])
        .addTo(map);
      poiMarkersRef.current.push(marker);
    });
  }, [poiItems, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    reportMarkersRef.current.forEach((m) => m.remove());
    reportMarkersRef.current = [];

    threadItems.forEach((t) => {
      const c = categoryOf(t.category);
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "34px";
      el.style.height = "34px";
      el.style.background = c.color;
      el.innerHTML = `<span>${iconMarkup(c.icon, { width: 16, height: 16, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.reports === false) el.style.display = "none";
      el.addEventListener("click", () => onThreadClickRef.current?.(t));

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `<b>${t.description}</b><br><small>${t.reporter_name || "Warga"}</small>`
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([t.lon, t.lat])
        .setPopup(popup)
        .addTo(map);
      reportMarkersRef.current.push(marker);
    });
  }, [threadItems, mapReady]);

  return (
    <>
      <div id="map" ref={mapRef} />
      {activeRouteMode && (
        <div className={`route-mode-badge route-mode-badge-${activeRouteMode}`}>
          {activeRouteMode === "walk_only" ? "Mode: Jalan Kaki Saja" : "Mode: Ramah Aksesibilitas"}
        </div>
      )}
    </>
  );
}
