export type CategoryKey =
  | "jalan_rusak"
  | "kemacetan"
  | "halte_penuh"
  | "trotoar_terhalang"
  | "info";

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

export interface ReportPin {
  id: string;
  cat: CategoryKey;
  lat: number;
  lng: number;
  title: string;
  loc: string;
  time: string;
  likes: number;
  comments: number;
  photo: string;
  description: string;
  commentList: Comment[];
}

export interface HeatSpot {
  lat: number;
  lng: number;
  r: number;
  c: string;
}

export interface PoiPin {
  id: string;
  icon: string;
  lat: number;
  lng: number;
  label: string;
  photo: string;
  category: string;
  routes?: string[];
  condition: "Normal" | "Ramai" | "Tutup";
  facilities: string[];
  updatedAt: string;
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
