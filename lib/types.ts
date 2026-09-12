// 6 nilai kategori ASLI dari backend Python (community/moderator.py via /api/threads) --
// lihat docs/UI_UX_FLOW.md Bagian 5. Jangan menggantinya dengan 4-5 kategori lama.
export type CategoryKey =
  | "Macet"
  | "Banjir / Genangan"
  | "Jalan Rusak"
  | "Parkir Liar"
  | "Pasar Tumpah / Event"
  | "Lainnya";

export interface Category {
  label: string;
  color: string;
  icon: string;
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
  icon: string;
  isText?: boolean;
}

export interface Comment {
  author: string;
  text: string;
  time: string;
}

export interface HeatSpot {
  lat: number;
  lng: number;
  r: number;
  c: string;
}

export interface TripStep {
  icon: string;
  label: string;
  route: string;
  dur: string;
  fare: string | null;
}

export interface LayerDef {
  key: string;
  name: string;
  on: boolean;
}
