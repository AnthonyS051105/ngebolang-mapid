"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import {
  CAT,
  heatSpots,
  places,
  reportPins,
  routeLine,
} from "@/lib/data";
import { iconMarkup } from "@/lib/icons";
import type { LayerDef } from "@/lib/types";
import type { PoiItem } from "@/lib/types/routingApi";

export interface MapViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  setLayerVisible: (key: string, visible: boolean) => void;
  flashRoute: () => void;
  locate: () => void;
}

interface MapViewProps {
  layerDefs: LayerDef[];
  poiItems: PoiItem[];
  onReady?: (handle: MapViewHandle) => void;
  onPoiClick?: (poi: PoiItem, x: number, y: number) => void;
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

export default function MapView({ layerDefs, poiItems, onReady, onPoiClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletModuleRef = useRef<typeof L | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const onPoiClickRef = useRef(onPoiClick);

  useEffect(() => {
    onPoiClickRef.current = onPoiClick;
  }, [onPoiClick]);

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
      heatSpots.forEach((h) => {
        L.circle([h.lat, h.lng], {
          radius: h.r,
          pane: "heatPane",
          color: h.c,
          fillColor: h.c,
          fillOpacity: 0.9,
          stroke: false,
        }).addTo(heatLayer);
      });
      heatLayer.addTo(map);

      const routeLayer = L.polyline(routeLine, {
        color: "#2f7cf6",
        weight: 5,
        dashArray: "2,10",
        lineCap: "round",
      }).addTo(map);
      routeLine.forEach((p, i) => {
        if (i === 0 || i === routeLine.length - 1) {
          L.circleMarker(p, {
            radius: 6,
            color: "#2f7cf6",
            weight: 3,
            fillColor: "#fff",
            fillOpacity: 1,
            pane: "markerPane",
          }).addTo(map);
        }
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
      reportPins.forEach((r) => {
        const c = CAT[r.cat];
        const icon = L.divIcon({
          className: "",
          iconAnchor: [17, 34],
          iconSize: [34, 34],
          html: `<div class="pin" style="width:34px;height:34px;background:${c.color}"><span>${iconMarkup(
            c.icon,
            { width: 16, height: 16, color: "#fff" }
          )}</span></div>`,
        });
        L.marker([r.lat, r.lng], { icon })
          .bindPopup(`<b>${r.title}</b><br><small>${r.loc} • ${r.time}</small>`)
          .addTo(reportLayer);
      });
      reportLayer.addTo(map);

      const poiLayer = L.layerGroup();
      poiLayer.addTo(map);
      poiLayerRef.current = poiLayer;

      const layerMap: Record<string, L.LayerGroup> = {
        heatmap: heatLayer,
        reports: reportLayer,
        poi: poiLayer,
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
        flashRoute: () => {
          routeLayer.setStyle({ color: "#1d4ed8" });
          setTimeout(() => routeLayer.setStyle({ color: "#2f7cf6" }), 700);
        },
        locate: () => {
          map.setView([-7.793, 110.365], 15);
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

  return <div id="map" ref={mapRef} />;
}
