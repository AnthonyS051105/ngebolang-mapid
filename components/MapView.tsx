"use client";

import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type L from "leaflet";
import {
  CAT,
  heatSpots,
  places,
  poiPins,
  reportPins,
  routeLine,
} from "@/lib/data";
import type { LayerDef } from "@/lib/types";

function getIcon(name: string): LucideIcon {
  const pascal = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as unknown as Record<string, LucideIcon>)[pascal] ?? Icons.Circle;
}

function iconMarkup(name: string, props: Record<string, unknown>) {
  const Icon = getIcon(name);
  return renderToStaticMarkup(<Icon {...props} />);
}

export interface MapViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  setLayerVisible: (key: string, visible: boolean) => void;
  flashRoute: () => void;
}

interface MapViewProps {
  layerDefs: LayerDef[];
  onReady?: (handle: MapViewHandle) => void;
}

export default function MapView({ layerDefs, onReady }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !mapRef.current) return;

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
        weight: 4,
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
          iconAnchor: [15, 30],
          iconSize: [30, 30],
          html: `<div class="pin" style="background:${c.color}"><span>${iconMarkup(
            c.icon,
            { width: 14, height: 14, color: "#fff" }
          )}</span></div>`,
        });
        L.marker([r.lat, r.lng], { icon })
          .bindPopup(`<b>${r.title}</b><br><small>${r.loc} • ${r.time}</small>`)
          .addTo(reportLayer);
      });
      reportLayer.addTo(map);

      const poiLayer = L.layerGroup();
      poiPins.forEach((p) => {
        const icon = L.divIcon({
          className: "",
          iconAnchor: [15, 30],
          iconSize: [30, 30],
          html: `<div class="pin" style="background:#ffffff;border-color:#d7dbe2"><span>${iconMarkup(
            p.icon,
            { width: 14, height: 14, color: "#4b5563" }
          )}</span></div>`,
        });
        L.marker([p.lat, p.lng], { icon }).bindPopup(p.label).addTo(poiLayer);
      });
      poiLayer.addTo(map);

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
          routeLayer.setStyle({ color: "#1ea34c" });
          setTimeout(() => routeLayer.setStyle({ color: "#2f7cf6" }), 700);
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

  return <div id="map" ref={mapRef} />;
}
