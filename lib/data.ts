import type {
  Category,
  CategoryKey,
  HeatSpot,
  LayerDef,
  Place,
  PoiPin,
  ReportPin,
  TripStep,
} from "./types";

export const CAT: Record<CategoryKey, Category> = {
  jalan_rusak: { label: "Jalan Rusak", color: "#ef4444", icon: "construction" },
  kemacetan: { label: "Kemacetan", color: "#f5820a", icon: "car" },
  halte_penuh: { label: "Halte Penuh", color: "#2f7cf6", icon: "bus" },
  trotoar_terhalang: {
    label: "Trotoar Terhalang",
    color: "#9b5cf5",
    icon: "footprints",
  },
  info: { label: "Info Lainnya", color: "#6b7280", icon: "info" },
};

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

export const reportPins: ReportPin[] = [
  {
    cat: "jalan_rusak",
    lat: -7.7965,
    lng: 110.3653,
    title: "Trotoar rusak di depan Pasar Beringharjo",
    loc: "Jl. Malioboro",
    time: "15 menit lalu",
    likes: 32,
    comments: 5,
  },
  {
    cat: "kemacetan",
    lat: -7.801,
    lng: 110.3648,
    title: "Kemacetan di simpang Titik Nol",
    loc: "Titik Nol Kilometer",
    time: "30 menit lalu",
    likes: 24,
    comments: 3,
  },
  {
    cat: "halte_penuh",
    lat: -7.7935,
    lng: 110.366,
    title: "Halte Trans Jogja penuh di Malioboro 2",
    loc: "Halte Malioboro 2",
    time: "45 menit lalu",
    likes: 18,
    comments: 2,
  },
  {
    cat: "trotoar_terhalang",
    lat: -7.794,
    lng: 110.3648,
    title: "PKL menghalangi trotoar depan Bank BNI",
    loc: "Jl. Malioboro",
    time: "1 jam lalu",
    likes: 15,
    comments: 1,
  },
  {
    cat: "info",
    lat: -7.8035,
    lng: 110.3636,
    title: "Toilet umum bersih di dekat Alun-alun Utara",
    loc: "Alun-alun Utara",
    time: "1 jam lalu",
    likes: 8,
    comments: 0,
  },
  {
    cat: "jalan_rusak",
    lat: -7.7845,
    lng: 110.368,
    title: "Lubang trotoar dekat simpang Tugu",
    loc: "Jl. Margo Utomo",
    time: "2 jam lalu",
    likes: 11,
    comments: 2,
  },
  {
    cat: "halte_penuh",
    lat: -7.79,
    lng: 110.3665,
    title: "Antrean panjang Halte Malioboro 1",
    loc: "Halte Malioboro 1",
    time: "2 jam lalu",
    likes: 9,
    comments: 1,
  },
  {
    cat: "trotoar_terhalang",
    lat: -7.8,
    lng: 110.366,
    title: "Parkir liar menutup jalur pejalan kaki",
    loc: "Titik Nol Kilometer",
    time: "3 jam lalu",
    likes: 14,
    comments: 4,
  },
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

export const poiPins: PoiPin[] = [
  { icon: "circle-parking", lat: -7.791, lng: 110.3675, label: "Parkir" },
  { icon: "toilet", lat: -7.7975, lng: 110.366, label: "Toilet" },
  { icon: "bike", lat: -7.7935, lng: 110.3648, label: "Pangkalan Becak" },
  { icon: "bike", lat: -7.8, lng: 110.363, label: "Pangkalan Andong" },
  { icon: "bus", lat: -7.793, lng: 110.3662, label: "Halte Malioboro 2" },
  { icon: "bus", lat: -7.79, lng: 110.3663, label: "Halte Malioboro 1" },
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
  "Jalan Rusak",
  "Kemacetan",
  "Halte Penuh",
  "Trotoar Terhalang",
  "Info Lainnya",
] as const;

export const tabKeyMap: Record<string, CategoryKey> = {
  "Jalan Rusak": "jalan_rusak",
  Kemacetan: "kemacetan",
  "Halte Penuh": "halte_penuh",
  "Trotoar Terhalang": "trotoar_terhalang",
  "Info Lainnya": "info",
};
