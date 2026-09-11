import type {
  Category,
  CategoryKey,
  HeatSpot,
  LayerDef,
  Place,
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
    id: "r1",
    cat: "jalan_rusak",
    lat: -7.7965,
    lng: 110.3653,
    title: "Trotoar rusak di depan Pasar Beringharjo",
    loc: "Jl. Malioboro",
    time: "2 jam lalu",
    likes: 32,
    comments: 5,
    photo:
      "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80",
    description:
      "Trotoar berlubang dan tidak rata, menyulitkan pejalan kaki, terutama lansia dan pengguna kursi roda.",
    commentList: [
      { author: "Dewi A.", text: "Setuju, saya juga hampir kepeleset di sini.", time: "1 jam lalu" },
      { author: "Rizal P.", text: "Sudah lama begini, semoga cepat diperbaiki.", time: "40 menit lalu" },
    ],
  },
  {
    id: "r2",
    cat: "kemacetan",
    lat: -7.801,
    lng: 110.3648,
    title: "Kemacetan di simpang Titik Nol",
    loc: "Titik Nol Kilometer",
    time: "30 menit lalu",
    likes: 24,
    comments: 3,
    photo:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80",
    description:
      "Kemacetan cukup parah saat jam pulang kerja, kendaraan menumpuk hingga ke persimpangan.",
    commentList: [
      { author: "Anton S.", text: "Mending lewat jalur alternatif dulu.", time: "15 menit lalu" },
    ],
  },
  {
    id: "r3",
    cat: "halte_penuh",
    lat: -7.7935,
    lng: 110.366,
    title: "Halte Trans Jogja penuh di Malioboro 2",
    loc: "Halte Malioboro 2",
    time: "45 menit lalu",
    likes: 18,
    comments: 2,
    photo:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80",
    description:
      "Antrean penumpang mengular hingga keluar halte, disarankan menunggu di halte berikutnya.",
    commentList: [
      { author: "Nadia K.", text: "Iya tadi saya nunggu 20 menit lebih.", time: "20 menit lalu" },
    ],
  },
  {
    id: "r4",
    cat: "trotoar_terhalang",
    lat: -7.794,
    lng: 110.3648,
    title: "PKL menghalangi trotoar depan Bank BNI",
    loc: "Jl. Malioboro",
    time: "1 jam lalu",
    likes: 15,
    comments: 1,
    photo:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80",
    description:
      "Lapak pedagang kaki lima menutup separuh badan trotoar sehingga pejalan kaki harus turun ke jalan raya.",
    commentList: [
      { author: "Yusuf H.", text: "Perlu ditertibkan Satpol PP.", time: "35 menit lalu" },
    ],
  },
  {
    id: "r5",
    cat: "info",
    lat: -7.8035,
    lng: 110.3636,
    title: "Toilet umum bersih di dekat Alun-alun Utara",
    loc: "Alun-alun Utara",
    time: "1 jam lalu",
    likes: 8,
    comments: 0,
    photo:
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
    description: "Fasilitas toilet umum terawat baik dan gratis untuk wisatawan.",
    commentList: [],
  },
  {
    id: "r6",
    cat: "jalan_rusak",
    lat: -7.7845,
    lng: 110.368,
    title: "Lubang trotoar dekat simpang Tugu",
    loc: "Jl. Margo Utomo",
    time: "2 jam lalu",
    likes: 11,
    comments: 2,
    photo:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    description: "Lubang cukup dalam, berisiko bagi pengendara motor saat malam hari.",
    commentList: [
      { author: "Sari M.", text: "Sudah ada yang jatuh gara-gara ini.", time: "1 jam lalu" },
    ],
  },
  {
    id: "r7",
    cat: "halte_penuh",
    lat: -7.79,
    lng: 110.3665,
    title: "Antrean panjang Halte Malioboro 1",
    loc: "Halte Malioboro 1",
    time: "2 jam lalu",
    likes: 9,
    comments: 1,
    photo:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
    description: "Antrean panjang terutama pada akhir pekan dan jam sibuk.",
    commentList: [
      { author: "Budi T.", text: "Perlu tambahan armada di jam sibuk.", time: "1 jam lalu" },
    ],
  },
  {
    id: "r8",
    cat: "trotoar_terhalang",
    lat: -7.8,
    lng: 110.366,
    title: "Parkir liar menutup jalur pejalan kaki",
    loc: "Titik Nol Kilometer",
    time: "3 jam lalu",
    likes: 14,
    comments: 4,
    photo:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    description: "Motor parkir sembarangan di atas trotoar, memaksa pejalan kaki turun ke jalan.",
    commentList: [
      { author: "Lia W.", text: "Setiap akhir pekan selalu begini.", time: "2 jam lalu" },
    ],
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
