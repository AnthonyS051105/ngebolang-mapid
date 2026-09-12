import type {
  Category,
  CategoryKey,
  HeatSpot,
  LayerDef,
  Place,
  TripStep,
} from "./types";

// 6 kategori ASLI dari backend Python -- lihat lib/types.ts CategoryKey dan
// docs/UI_UX_FLOW.md Bagian 5. "Lainnya" dipakai sebagai fallback tampilan
// kalau nilai category dari Python tidak cocok salah satu dari 6 nilai ini.
export const CAT: Record<CategoryKey, Category> = {
  Macet: { label: "Macet", color: "#f5820a", icon: "car" },
  "Banjir / Genangan": { label: "Banjir / Genangan", color: "#2f7cf6", icon: "waves" },
  "Jalan Rusak": { label: "Jalan Rusak", color: "#ef4444", icon: "construction" },
  "Parkir Liar": { label: "Parkir Liar", color: "#9b5cf5", icon: "circle-parking" },
  "Pasar Tumpah / Event": { label: "Pasar Tumpah / Event", color: "#22c55e", icon: "store" },
  Lainnya: { label: "Lainnya", color: "#6b7280", icon: "info" },
};

export function categoryOf(value: string): Category {
  return CAT[value as CategoryKey] ?? CAT.Lainnya;
}

export const places: Place[] = [
  { name: "TUGU YOGYAKARTA", lat: -7.783, lng: 110.3671, icon: "landmark" },
  { name: "TITIK NOL KILOMETER", lat: -7.8014, lng: 110.3644, icon: "map-pin" },
  { name: "MALIOBORO", lat: -7.7925, lng: 110.3655, icon: "", isText: true },
  { name: "KRATON YOGYAKARTA", lat: -7.8053, lng: 110.3642, icon: "landmark" },
];

export const routeLine: [number, number][] = [
  [-7.783, 110.3671],
  [-7.7895, 110.3661],
  [-7.7925, 110.3655],
  [-7.7963, 110.3651],
  [-7.8014, 110.3644],
  [-7.8053, 110.3642],
];

export const heatSpots: HeatSpot[] = [
  { lat: -7.7925, lng: 110.3655, r: 230, c: "#ef4444" },
  { lat: -7.796, lng: 110.3652, r: 190, c: "#f97316" },
  { lat: -7.8014, lng: 110.3644, r: 200, c: "#f97316" },
  { lat: -7.8053, lng: 110.3642, r: 170, c: "#eab308" },
  { lat: -7.783, lng: 110.3671, r: 160, c: "#eab308" },
  { lat: -7.7895, lng: 110.3675, r: 150, c: "#22c55e" },
  { lat: -7.8035, lng: 110.362, r: 170, c: "#22c55e" },
  { lat: -7.79, lng: 110.362, r: 150, c: "#22c55e" },
];

export const tripSteps: TripStep[] = [
  {
    icon: "footprints",
    label: "Jalan kaki",
    route: "Tugu Yogyakarta → Titik Nol Kilometer",
    dur: "10 menit (800 m)",
    fare: null,
  },
  {
    icon: "footprints",
    label: "Jalan kaki",
    route: "Titik Nol Kilometer → Malioboro",
    dur: "15 menit (1,1 km)",
    fare: null,
  },
  {
    icon: "bike",
    label: "Becak / Andong",
    route: "Malioboro → Alun-alun Utara (Kraton)",
    dur: "10 menit",
    fare: "Estimasi tarif: Rp 15.000 – 20.000",
  },
];

export const layerDefs: LayerDef[] = [
  { key: "heatmap", name: "Heatmap Kepadatan", on: true },
  { key: "reports", name: "Laporan Warga", on: true },
  { key: "trotoar", name: "Kondisi Trotoar", on: true },
  { key: "halte", name: "Halte & Transportasi", on: true },
  { key: "poi", name: "Fasilitas & POI", on: true },
  { key: "becak", name: "Pangkalan Becak/Andong", on: true },
];

export const tabs = [
  "Semua",
  "Macet",
  "Banjir / Genangan",
  "Jalan Rusak",
  "Parkir Liar",
  "Pasar Tumpah / Event",
  "Lainnya",
] as const;

export const tabKeyMap: Record<string, CategoryKey> = {
  Macet: "Macet",
  "Banjir / Genangan": "Banjir / Genangan",
  "Jalan Rusak": "Jalan Rusak",
  "Parkir Liar": "Parkir Liar",
  "Pasar Tumpah / Event": "Pasar Tumpah / Event",
  Lainnya: "Lainnya",
};
