"use client";

import { useEffect, useRef, useState } from "react";
import type * as maplibregl from "maplibre-gl";
import { categoryOf, places } from "@/lib/data";
import { iconMarkup } from "@/lib/icons";
import {
  fetchAksesibilitas,
  fetchFasilitasPendukung,
  fetchHeatmap,
  fetchKepadatan,
  fetchKondisiFasilitas,
  fetchPangkalanFeeders,
  fetchTitikTransfer,
  fetchTransportHubs,
  fetchWaktuTempuh,
} from "@/lib/api/routingClient";
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

// Field properties berbeda antara MAPID live ("Name") dan fallback lokal ("NAMA"/"nama") --
// lihat docs/PYTHON_API_CONTRACT.md Bagian 12b. Popup menampilkan apa adanya, jadi cukup
// coba beberapa nama field umum untuk judul kartu.
const NAME_FIELD_CANDIDATES = [
  "Name",
  "NAMA",
  "nama",
  "name",
  "layer_name",
  "title",
  "Lokasi Pangkalan",
  "Titik Amatan",
  "Lokasi Presisi",
  "Nama Segmen (Titik Awal - Titik Akhir)",
  "Jenis Fasilitas",
  "Objek yang Diamati",
];

function featureTitle(properties: Record<string, unknown> | null | undefined, fallback: string) {
  if (!properties) return fallback;
  for (const key of NAME_FIELD_CANDIDATES) {
    const value = properties[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return fallback;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface PopupField {
  label: string;
  format?: (value: unknown) => string;
}

// Field skor TOD granular (Comm_400, Access_sco, Hub_id, dst dari
// graphapp/mapid_sync.py "transport_hubs") SENGAJA tidak dimasukkan di sini --
// angka riset mentah tanpa acuan pembanding, tidak actionable bagi wisatawan.
// Hanya field yang punya arti langsung bagi pengguna yang ditampilkan.
const HALTE_POPUP_FIELDS: Record<string, PopupField> = {
  Type: { label: "Tipe" },
  TOD_Class: {
    label: "Tingkat Keramaian Kawasan",
    format: (v) => {
      const map: Record<string, string> = { Low: "Rendah", Medium: "Sedang", High: "Tinggi" };
      const s = String(v);
      return map[s] ?? s;
    },
  },
};

// Skema lama (MODA/HALTE_TERDEKAT/dst) dipertahankan sebagai fallback --
// pangkalan_feeders dan tarif_becak_andhong menunjuk ke layer_id MAPID yang
// sama (lihat docs/PYTHON_API_CONTRACT.md Bagian 12c), tapi kalau suatu saat
// sumbernya jatuh ke fallback lokal lama, field lama ini masih terbaca.
const BECAK_POPUP_FIELDS: Record<string, PopupField> = {
  "Moda": { label: "Moda" },
  MODA: { label: "Moda" },
  "Rute yang Ditanyakan": { label: "Rute yang Ditanyakan" },
  "Tarif Disepakati/Wajar": { label: "Tarif Disepakati" },
  "Narasi": { label: "Catatan", format: (v) => (v === "-" ? "Tidak ada catatan" : String(v)) },
  HALTE_TERDEKAT: { label: "Halte Terdekat" },
  JARAK_KE_HALTE_M: { label: "Jarak ke Halte", format: (v) => `${Math.round(Number(v))} m` },
  WAKTU_JALAN_SEC: {
    label: "Estimasi Jalan Kaki",
    format: (v) => {
      const sec = Number(v);
      return sec >= 60 ? `${Math.round(sec / 60)} menit` : `${Math.round(sec)} detik`;
    },
  },
  AKSESIBILITAS: { label: "Aksesibilitas", format: (v) => (v === "-" ? "Tidak ada catatan" : String(v)) },
  NARASI: { label: "Catatan", format: (v) => (v === "-" ? "Tidak ada catatan" : String(v)) },
};

// 7 dataset survei lapangan asli (MAPID GeoServer) -- lihat
// docs/PYTHON_API_CONTRACT.md Bagian 12c untuk skema lengkap tiap layer.
const WAKTU_TEMPUH_POPUP_FIELDS: Record<string, PopupField> = {
  "Jarak Segmen": { label: "Jarak Segmen" },
  "Total Waktu Tempuh": { label: "Waktu Tempuh" },
  "Kecepatan Jalan": { label: "Kecepatan Jalan" },
  "Narasi": { label: "Catatan" },
};

const TITIK_TRANSFER_POPUP_FIELDS: Record<string, PopupField> = {
  "Halte TransJogja/Terdekat": { label: "Halte Terdekat" },
  "Estimasi Waktu Jalan Kaki ke Halte": { label: "Estimasi Jalan Kaki ke Halte" },
  "Arah/Akses": { label: "Arah / Akses" },
};

const KONDISI_FASILITAS_POPUP_FIELDS: Record<string, PopupField> = {
  "Objek yang Diamati": { label: "Objek" },
  "Jenis Temuan": { label: "Temuan" },
  "Tingkat Keparahan": { label: "Tingkat Keparahan" },
  "Dampak bagi Pengguna": { label: "Dampak bagi Pengguna" },
  "Narasi": { label: "Catatan" },
};

const AKSESIBILITAS_POPUP_FIELDS: Record<string, PopupField> = {
  "Jenis Fasilitas": { label: "Jenis Fasilitas" },
  "Status": { label: "Status" },
  "Narasi": { label: "Catatan" },
};

const KEPADATAN_POPUP_FIELDS: Record<string, PopupField> = {
  "Estimasi Jumlah Orang": { label: "Estimasi Jumlah Orang" },
  "Kategori Kepadatan": { label: "Kategori Kepadatan" },
  "Narasi / Konteks Tambahan": { label: "Catatan" },
};

const FASILITAS_PENDUKUNG_POPUP_FIELDS: Record<string, PopupField> = {
  "Jenis Fasilitas": { label: "Jenis Fasilitas" },
  "Lokasi Presisi": { label: "Lokasi" },
  "Narasi": { label: "Catatan" },
};

function fieldsPopupHtml(
  properties: Record<string, unknown> | null | undefined,
  title: string,
  fieldDefs: Record<string, PopupField>
) {
  const rows = Object.entries(fieldDefs)
    .map(([key, def]) => {
      const raw = properties?.[key];
      if (raw === null || raw === undefined || raw === "") return null;
      const value = def.format ? def.format(raw) : String(raw);
      return `<div class="feature-popup-row"><span class="feature-popup-key">${escapeHtml(
        def.label
      )}</span><span class="feature-popup-value">${escapeHtml(value)}</span></div>`;
    })
    .filter(Boolean)
    .join("");
  return `<div class="feature-popup"><b>${escapeHtml(title)}</b>${rows}</div>`;
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

/**
 * Hitung meters-per-pixel di center peta pada zoom tertentu.
 * Rumus standar Web Mercator: 156543.03 * cos(lat) / 2^zoom.
 */
function metersPerPixelAt(zoom: number, lat: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

interface MapViewProps {
  layerDefs: LayerDef[];
  poiItems: PoiItem[];
  threadItems: ThreadItem[];
  onReady?: (handle: MapViewHandle) => void;
  onPoiClick?: (poi: PoiItem, x: number, y: number) => void;
  onPoiMove?: (x: number, y: number) => void;
  activePoiId?: string | null;
  onThreadClick?: (thread: ThreadItem) => void;
  /** Dipanggil tiap kali peta bergerak/zoom berubah dengan nilai meters-per-pixel
   * di pusat peta -- dipakai MapArea untuk render skala bar dinamis. */
  onScaleChange?: (metersPerPixel: number) => void;
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
  onPoiMove,
  activePoiId,
  onThreadClick,
  onScaleChange,
}: MapViewProps) {
  const onScaleChangeRef = useRef(onScaleChange);
  useEffect(() => { onScaleChangeRef.current = onScaleChange; }, [onScaleChange]);

  function emitScale(map: maplibregl.Map) {
    const center = map.getCenter();
    const mpp = metersPerPixelAt(map.getZoom(), center.lat);
    onScaleChangeRef.current?.(mpp);
  }
  const mapRef = useRef<HTMLDivElement>(null);
  const glMapRef = useRef<maplibregl.Map | null>(null);
  const glModuleRef = useRef<typeof maplibregl | null>(null);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const halteMarkersRef = useRef<maplibregl.Marker[]>([]);
  const becakMarkersRef = useRef<maplibregl.Marker[]>([]);
  const waktuTempuhMarkersRef = useRef<maplibregl.Marker[]>([]);
  const titikTransferMarkersRef = useRef<maplibregl.Marker[]>([]);
  const kondisiFasilitasMarkersRef = useRef<maplibregl.Marker[]>([]);
  const aksesibilitasMarkersRef = useRef<maplibregl.Marker[]>([]);
  const kepadatanMarkersRef = useRef<maplibregl.Marker[]>([]);
  const fasilitasPendukungMarkersRef = useRef<maplibregl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const layerVisibilityRef = useRef<Record<string, boolean>>({});
  const onPoiClickRef = useRef(onPoiClick);
  const onPoiMoveRef = useRef(onPoiMove);
  const activePoiIdRef = useRef(activePoiId);
  const poiItemsRef = useRef(poiItems);
  const onThreadClickRef = useRef(onThreadClick);
  const [activeRouteMode, setActiveRouteMode] = useState<"walk_only" | "accessible" | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [halteFeatures, setHalteFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [becakFeatures, setBecakFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [waktuTempuhFeatures, setWaktuTempuhFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [titikTransferFeatures, setTitikTransferFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [kondisiFasilitasFeatures, setKondisiFasilitasFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [aksesibilitasFeatures, setAksesibilitasFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [kepadatanFeatures, setKepadatanFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);
  const [fasilitasPendukungFeatures, setFasilitasPendukungFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([]);

  useEffect(() => {
    onPoiClickRef.current = onPoiClick;
  }, [onPoiClick]);

  useEffect(() => {
    onPoiMoveRef.current = onPoiMove;
  }, [onPoiMove]);

  useEffect(() => {
    activePoiIdRef.current = activePoiId;
  }, [activePoiId]);

  useEffect(() => {
    poiItemsRef.current = poiItems;
  }, [poiItems]);

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

      // Style basemap MAPID (vendor pihak ketiga) mereferensikan beberapa
      // ikon sprite (mis. "gate", "atm", "bollard") yang tidak ada di sprite
      // sheet-nya sendiri -- di luar kendali kode ini. Daripada MapLibre
      // mencetak warning "could not be loaded" berulang ke console, daftarkan
      // gambar transparan 1x1 sebagai fallback begitu ada yang hilang (pola
      // resmi yang disarankan lewat event ini) -- ikon itu memang tidak
      // dirender apa pun sebelumnya, jadi tidak ada perubahan visual.
      map.on("styleimagemissing", (e) => {
        const id = e.id;
        if (map.hasImage(id)) return;
        const size = 1;
        map.addImage(id, {
          width: size,
          height: size,
          data: new Uint8Array(size * size * 4),
        });
      });

      map.on("move", () => {
        const activeId = activePoiIdRef.current;
        if (!activeId) return;
        const poi = poiItemsRef.current.find((p) => p.id === activeId);
        if (!poi) return;
        const point = map.project([poi.lon, poi.lat]);
        onPoiMoveRef.current?.(point.x, point.y - 20);
      });

      map.on("move", () => emitScale(map));
      map.on("zoom", () => emitScale(map));

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

        // Kategori "Kategori Kepadatan" dari dataset survei "kepadatan" (Rendah/Sedang/Tinggi,
        // sama seperti /api/layers/heatmap) digabung sebagai bobot tambahan ke heatmap yang
        // sama -- bukan menggantikan /api/layers/heatmap, cuma melengkapi titiknya.
        Promise.allSettled([fetchHeatmap(), fetchKepadatan()])
          .then(([heatmapResult, kepadatanResult]) => {
            if (cancelled) return;
            const source = map.getSource(HEATMAP_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
            if (!source) return;

            const heatmapFeatures =
              heatmapResult.status === "fulfilled" ? heatmapResult.value.features ?? [] : [];
            if (heatmapResult.status === "rejected") {
              console.error("Gagal memuat heatmap dari backend:", heatmapResult.reason);
            }

            const kepadatanFeatures =
              kepadatanResult.status === "fulfilled"
                ? (kepadatanResult.value.features ?? [])
                : [];
            if (kepadatanResult.status === "rejected") {
              console.error("Gagal memuat dataset kepadatan dari backend:", kepadatanResult.reason);
            }

            const weighted: GeoJSON.FeatureCollection = {
              type: "FeatureCollection",
              features: [
                ...heatmapFeatures
                  .filter((f) => f.geometry?.type === "Point")
                  .map((f) => ({
                    ...f,
                    properties: {
                      ...f.properties,
                      weight: weightForHeatmapCategory(f.properties?.category),
                    },
                  })),
                ...kepadatanFeatures
                  .filter((f) => f.geometry?.type === "Point")
                  .map((f) => ({
                    ...f,
                    properties: {
                      ...f.properties,
                      weight: weightForHeatmapCategory(f.properties?.["Kategori Kepadatan"]),
                    },
                  })),
              ],
            };
            source.setData(weighted);
          });

        fetchTransportHubs()
          .then((fc) => {
            if (cancelled) return;
            setHalteFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat layer halte & transportasi dari backend:", err);
          });

        fetchPangkalanFeeders()
          .then((fc) => {
            if (cancelled) return;
            setBecakFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat layer pangkalan becak/andong dari backend:", err);
          });

        fetchWaktuTempuh()
          .then((fc) => {
            if (cancelled) return;
            setWaktuTempuhFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat dataset waktu tempuh jalan kaki dari backend:", err);
          });

        fetchTitikTransfer()
          .then((fc) => {
            if (cancelled) return;
            setTitikTransferFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat dataset titik transfer antarmoda dari backend:", err);
          });

        fetchKondisiFasilitas()
          .then((fc) => {
            if (cancelled) return;
            setKondisiFasilitasFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat dataset kondisi fasilitas (halte/trotoar) dari backend:", err);
          });

        fetchAksesibilitas()
          .then((fc) => {
            if (cancelled) return;
            setAksesibilitasFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat dataset aksesibilitas dari backend:", err);
          });

        fetchKepadatan()
          .then((fc) => {
            if (cancelled) return;
            setKepadatanFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat titik observasi kepadatan dari backend:", err);
          });

        fetchFasilitasPendukung()
          .then((fc) => {
            if (cancelled) return;
            setFasilitasPendukungFeatures((fc.features ?? []) as GeoJSON.Feature<GeoJSON.Point>[]);
          })
          .catch((err) => {
            console.error("Gagal memuat dataset fasilitas pendukung dari backend:", err);
          });

        layerDefs.forEach((d) => {
          layerVisibilityRef.current[d.key] = d.on;
        });

        if (map.getLayer(HEATMAP_LAYER_ID)) {
          map.setLayoutProperty(
            HEATMAP_LAYER_ID,
            "visibility",
            layerVisibilityRef.current.heatmap === false ? "none" : "visible"
          );
        }
        setMapReady(true);

        emitScale(map);
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
              aksesibilitasMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
              fasilitasPendukungMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            } else if (key === "reports") {
              reportMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            } else if (key === "halte") {
              halteMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
              titikTransferMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            } else if (key === "becak") {
              becakMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            } else if (key === "trotoar") {
              kondisiFasilitasMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
              waktuTempuhMarkersRef.current.forEach((m) => {
                m.getElement().style.display = visible ? "" : "none";
              });
            }
            if (key === "heatmap") {
              kepadatanMarkersRef.current.forEach((m) => {
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
      halteMarkersRef.current.forEach((m) => m.remove());
      halteMarkersRef.current = [];
      becakMarkersRef.current.forEach((m) => m.remove());
      becakMarkersRef.current = [];
      waktuTempuhMarkersRef.current.forEach((m) => m.remove());
      waktuTempuhMarkersRef.current = [];
      titikTransferMarkersRef.current.forEach((m) => m.remove());
      titikTransferMarkersRef.current = [];
      kondisiFasilitasMarkersRef.current.forEach((m) => m.remove());
      kondisiFasilitasMarkersRef.current = [];
      aksesibilitasMarkersRef.current.forEach((m) => m.remove());
      aksesibilitasMarkersRef.current = [];
      kepadatanMarkersRef.current.forEach((m) => m.remove());
      kepadatanMarkersRef.current = [];
      fasilitasPendukungMarkersRef.current.forEach((m) => m.remove());
      fasilitasPendukungMarkersRef.current = [];
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

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    halteMarkersRef.current.forEach((m) => m.remove());
    halteMarkersRef.current = [];

    halteFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Halte & Transportasi");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "34px";
      el.style.height = "34px";
      el.style.background = "#0ea5e9";
      el.innerHTML = `<span>${iconMarkup("bus", { width: 16, height: 16, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.halte === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, HALTE_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      halteMarkersRef.current.push(marker);
    });
  }, [halteFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    becakMarkersRef.current.forEach((m) => m.remove());
    becakMarkersRef.current = [];

    becakFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Pangkalan Becak/Andong");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "34px";
      el.style.height = "34px";
      el.style.background = "#9b5cf5";
      el.innerHTML = `<span>${iconMarkup("bike", { width: 16, height: 16, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.becak === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, BECAK_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      becakMarkersRef.current.push(marker);
    });
  }, [becakFeatures, mapReady]);

  // 7 dataset survei lapangan asli (MAPID GeoServer) -- dipetakan ke toggle
  // 6-layer PRD yang sudah ada (trotoar/halte/poi/heatmap), bukan toggle baru --
  // lihat docs/PYTHON_API_CONTRACT.md Bagian 12c.
  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    waktuTempuhMarkersRef.current.forEach((m) => m.remove());
    waktuTempuhMarkersRef.current = [];

    waktuTempuhFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Waktu Tempuh Jalan Kaki");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.background = "#0d9488";
      el.innerHTML = `<span>${iconMarkup("footprints", { width: 14, height: 14, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.trotoar === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, WAKTU_TEMPUH_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      waktuTempuhMarkersRef.current.push(marker);
    });
  }, [waktuTempuhFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    titikTransferMarkersRef.current.forEach((m) => m.remove());
    titikTransferMarkersRef.current = [];

    titikTransferFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Titik Transfer Antarmoda");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.background = "#2563eb";
      el.innerHTML = `<span>${iconMarkup("arrow-left-right", { width: 14, height: 14, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.halte === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, TITIK_TRANSFER_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      titikTransferMarkersRef.current.push(marker);
    });
  }, [titikTransferFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    kondisiFasilitasMarkersRef.current.forEach((m) => m.remove());
    kondisiFasilitasMarkersRef.current = [];

    kondisiFasilitasFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Kondisi Fasilitas");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "34px";
      el.style.height = "34px";
      el.style.background = "#f97316";
      el.innerHTML = `<span>${iconMarkup("triangle-alert", { width: 16, height: 16, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.trotoar === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, KONDISI_FASILITAS_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      kondisiFasilitasMarkersRef.current.push(marker);
    });
  }, [kondisiFasilitasFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    aksesibilitasMarkersRef.current.forEach((m) => m.remove());
    aksesibilitasMarkersRef.current = [];

    aksesibilitasFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Fasilitas Aksesibilitas");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.background = "#16a34a";
      el.innerHTML = `<span>${iconMarkup("accessibility", { width: 14, height: 14, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.poi === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, AKSESIBILITAS_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      aksesibilitasMarkersRef.current.push(marker);
    });
  }, [aksesibilitasFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    kepadatanMarkersRef.current.forEach((m) => m.remove());
    kepadatanMarkersRef.current = [];

    kepadatanFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Titik Observasi Kepadatan");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.background = "#dc2626";
      el.innerHTML = `<span>${iconMarkup("users", { width: 14, height: 14, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.heatmap === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, KEPADATAN_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      kepadatanMarkersRef.current.push(marker);
    });
  }, [kepadatanFeatures, mapReady]);

  useEffect(() => {
    const maplibregl = glModuleRef.current;
    const map = glMapRef.current;
    if (!maplibregl || !map || !mapReady) return;

    fasilitasPendukungMarkersRef.current.forEach((m) => m.remove());
    fasilitasPendukungMarkersRef.current = [];

    fasilitasPendukungFeatures.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const title = featureTitle(f.properties, "Fasilitas Pendukung");
      const el = document.createElement("div");
      el.className = "pin";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.background = "#64748b";
      el.innerHTML = `<span>${iconMarkup("wrench", { width: 14, height: 14, color: "#fff" })}</span>`;
      if (layerVisibilityRef.current.poi === false) el.style.display = "none";

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        fieldsPopupHtml(f.properties, title, FASILITAS_PENDUKUNG_POPUP_FIELDS)
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
      fasilitasPendukungMarkersRef.current.push(marker);
    });
  }, [fasilitasPendukungFeatures, mapReady]);

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
