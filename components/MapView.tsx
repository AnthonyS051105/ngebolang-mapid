"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { categoryOf, places } from "@/lib/data";
import { iconMarkup } from "@/lib/icons";
import { fetchHeatmap } from "@/lib/api/routingClient";
import type { LayerDef } from "@/lib/types";
import type { PoiItem, ThreadItem } from "@/lib/types/routingApi";

// Nilai category dari GET /api/layers/heatmap huruf kapital di awal
// ("Rendah"/"Sedang"/"Tinggi") -- lihat docs/PYTHON_API_CONTRACT.md Bagian 12.
const HEATMAP_CATEGORY_COLOR: Record<string, string> = {
  Rendah: "#22c55e",
  Sedang: "#f97316",
  Tinggi: "#ef4444",
};

function colorForHeatmapCategory(category: unknown) {
  if (typeof category === "string" && HEATMAP_CATEGORY_COLOR[category]) {
    return HEATMAP_CATEGORY_COLOR[category];
  }
  return "#6b7280";
}

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

export default function MapView({
  layerDefs,
  poiItems,
  threadItems,
  onReady,
  onPoiClick,
  onThreadClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletModuleRef = useRef<typeof L | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const reportLayerRef = useRef<L.LayerGroup | null>(null);
  const routeApiLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const onPoiClickRef = useRef(onPoiClick);
  const onThreadClickRef = useRef(onThreadClick);
  const [activeRouteMode, setActiveRouteMode] = useState<"walk_only" | "accessible" | null>(null);

  useEffect(() => {
    onPoiClickRef.current = onPoiClick;
  }, [onPoiClick]);

  useEffect(() => {
    onThreadClickRef.current = onThreadClick;
  }, [onThreadClick]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !mapRef.current) return;
      leafletModuleRef.current = L;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-7.793, 110.365], 15);
      leafletMapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      map.createPane("heatPane");
      const heatPane = map.getPane("heatPane")!;
      heatPane.style.filter = "blur(18px)";
      heatPane.style.opacity = "0.55";
      heatPane.style.zIndex = "350";
      const heatLayer = L.layerGroup();
      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;

      fetchHeatmap()
        .then((fc) => {
          if (cancelled) return;
          (fc.features ?? []).forEach((feature) => {
            const geometry = feature.geometry;
            if (!geometry || geometry.type !== "Point") return;
            const [lng, lat] = geometry.coordinates as [number, number];
            const color = colorForHeatmapCategory(feature.properties?.category);
            L.circle([lat, lng], {
              radius: 180,
              pane: "heatPane",
              color,
              fillColor: color,
              fillOpacity: 0.9,
              stroke: false,
            }).addTo(heatLayer);
          });
        })
        .catch((err) => {
          console.error("Gagal memuat heatmap dari backend:", err);
        });

      const placeLayer = L.layerGroup();
      places.forEach((p) => {
        if (p.isText) {
          L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              className: "",
              html: `<div class="place-label">${p.name}</div>`,
              iconSize: undefined,
            }),
          }).addTo(placeLayer);
          L.circleMarker([p.lat, p.lng], {
            radius: 6,
            color: "#2f7cf6",
            weight: 3,
            fillColor: "#fff",
            fillOpacity: 1,
          }).addTo(placeLayer);
        } else {
          L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="text-align:center;transform:translateY(-4px);">${iconMarkup(
                p.icon,
                { width: 26, height: 26, color: "#1c2230" }
              )}</div><div class="place-label" style="margin-top:-2px;">${p.name}</div>`,
              iconSize: undefined,
              iconAnchor: [0, 30],
            }),
          }).addTo(placeLayer);
        }
      });
      placeLayer.addTo(map);

      const reportLayer = L.layerGroup();
      reportLayer.addTo(map);
      reportLayerRef.current = reportLayer;

      const poiLayer = L.layerGroup();
      poiLayer.addTo(map);
      poiLayerRef.current = poiLayer;

      const routeApiLayer = L.layerGroup();
      routeApiLayer.addTo(map);
      routeApiLayerRef.current = routeApiLayer;

      // Belum ada endpoint/data untuk trotoar, halte, dan pangkalan becak/andong
      // (di luar cakupan permintaan saat ini) -- tetap dibuat sebagai LayerGroup
      // asli supaya toggle di LayerControl benar-benar menambah/menghapus layer
      // dari peta, bukan cuma mengubah state UI tanpa efek.
      const trotoarLayer = L.layerGroup();
      trotoarLayer.addTo(map);
      const halteLayer = L.layerGroup();
      halteLayer.addTo(map);
      const becakLayer = L.layerGroup();
      becakLayer.addTo(map);

      const layerMap: Record<string, L.LayerGroup> = {
        heatmap: heatLayer,
        reports: reportLayer,
        poi: poiLayer,
        trotoar: trotoarLayer,
        halte: halteLayer,
        becak: becakLayer,
      };
      layerDefs.forEach((d) => {
        const layer = layerMap[d.key];
        if (layer && !d.on) map.removeLayer(layer);
      });

      onReady?.({
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
        setLayerVisible: (key, visible) => {
          const layer = layerMap[key];
          if (!layer) return;
          if (visible) layer.addTo(map);
          else map.removeLayer(layer);
        },
        locate: () => {
          map.setView([-7.793, 110.365], 15);
        },
        showRoute: (routeGeojson, options) => {
          const layer = routeApiLayerRef.current;
          if (!layer) return;
          layer.clearLayers();

          const walkOnly = options?.walkOnly ?? false;
          const ramahAksesibilitas = options?.ramahAksesibilitas ?? false;
          setActiveRouteMode(walkOnly ? "walk_only" : ramahAksesibilitas ? "accessible" : null);

          const geoJsonLayer = L.geoJSON(routeGeojson, {
            style: (feature) => {
              const style = feature?.properties?.style as
                | { color?: string; weight?: number; opacity?: number; dashArray?: string | null }
                | undefined;
              // Indikator preferensi aktif menimpa gaya per-mode dari backend:
              // walk_only -> garis putus-putus (dashArray), ramah_aksesibilitas -> kuning + lebih tebal.
              if (ramahAksesibilitas) {
                return {
                  color: "#eab308",
                  weight: (style?.weight ?? 5) + 1,
                  opacity: style?.opacity ?? 0.9,
                  dashArray: undefined,
                  lineCap: "round",
                };
              }
              return {
                color: style?.color ?? "#2f7cf6",
                weight: style?.weight ?? 5,
                opacity: style?.opacity ?? 0.9,
                dashArray: walkOnly ? "6, 8" : style?.dashArray ?? undefined,
                lineCap: "round",
              };
            },
            pointToLayer: (feature, latlng) =>
              L.circleMarker(latlng, {
                radius: 6,
                color: ramahAksesibilitas
                  ? "#eab308"
                  : (feature?.properties?.color as string) ?? "#2f7cf6",
                weight: 3,
                fillColor: "#fff",
                fillOpacity: 1,
              }),
          });
          geoJsonLayer.addTo(layer);

          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
        },
        clearRoute: () => {
          routeApiLayerRef.current?.clearLayers();
          setActiveRouteMode(null);
        },
      });
    })();

    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = leafletMapRef.current;
    const poiLayer = poiLayerRef.current;
    if (!L || !map || !poiLayer) return;

    poiLayer.clearLayers();
    poiItems.forEach((p) => {
      const icon = L.divIcon({
        className: "",
        iconAnchor: [17, 34],
        iconSize: [34, 34],
        html: `<div class="pin" style="width:34px;height:34px;background:#ffffff;border-color:#d7dbe2"><span>${iconMarkup(
          iconForPoiCategory(p.category),
          { width: 16, height: 16, color: "#4b5563" }
        )}</span></div>`,
      });
      const marker = L.marker([p.lat, p.lon], { icon }).addTo(poiLayer);
      marker.on("click", (e) => {
        const point = map.latLngToContainerPoint(e.latlng);
        onPoiClickRef.current?.(p, point.x, point.y - 20);
      });
    });
  }, [poiItems]);

  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = leafletMapRef.current;
    const reportLayer = reportLayerRef.current;
    if (!L || !map || !reportLayer) return;

    reportLayer.clearLayers();
    threadItems.forEach((t) => {
      const c = categoryOf(t.category);
      const icon = L.divIcon({
        className: "",
        iconAnchor: [17, 34],
        iconSize: [34, 34],
        html: `<div class="pin" style="width:34px;height:34px;background:${c.color}"><span>${iconMarkup(
          c.icon,
          { width: 16, height: 16, color: "#fff" }
        )}</span></div>`,
      });
      const marker = L.marker([t.lat, t.lon], { icon })
        .bindPopup(`<b>${t.description}</b><br><small>${t.reporter_name || "Warga"}</small>`)
        .addTo(reportLayer);
      marker.on("click", () => onThreadClickRef.current?.(t));
    });
  }, [threadItems]);

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
