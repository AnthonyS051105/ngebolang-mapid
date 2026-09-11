// Tipe sesuai respons Python asli (WebGIS-Backend). Field SENGAJA tidak diterjemahkan
// ke Bahasa Indonesia / camelCase konvensi lokal -- lihat docs/SDD.md Bagian 3.

export type Preference = "balanced" | "fastest" | "cheapest" | "walk_only" | "accessible";
export type FeederType = "any" | "andong" | "becak";

export interface RouteRequestBody {
  orig_lat?: number;
  orig_lon?: number;
  dest_lat?: number;
  dest_lon?: number;
  orig_poi?: string;
  dest_poi?: string;
  orig_name?: string;
  dest_name?: string;
  preference?: Preference;
  budget_max?: number;
  feeder_type?: FeederType;
  is_weekend?: boolean;
  waypoints?: unknown[];
}

export interface RouteStep {
  type: "walk" | "feeder" | "ojol" | "bus" | "car";
  instruction: string;
  distance_m: number;
  time_min: number;
}

export interface CostRange {
  min_idr: number;
  max_idr: number;
  expected_idr: number;
}

export interface RouteResponse {
  status: "success" | "error";
  origin: { name: string; lat: number; lon: number };
  destination: { name: string; lat: number; lon: number };
  summary: {
    total_distance_m: number;
    total_time_min: number;
    total_cost_idr: number;
    has_feeder: boolean;
    feeder_type: string | null;
    cost_range: CostRange;
    bargaining_tip: string;
    recommendation: string;
  };
  steps: RouteStep[];
  geojson: GeoJSON.FeatureCollection;
}

export interface TarifRequestBody {
  orig_lat?: number;
  orig_lon?: number;
  dest_lat?: number;
  dest_lon?: number;
  orig_poi?: string;
  dest_poi?: string;
  feeder_type?: FeederType;
  is_weekend?: boolean;
}

export interface TarifResponse {
  status: "success" | "error";
  feeder_type: string;
  is_weekend: boolean;
  total_distance_m: number;
  cost_range: CostRange;
  bargaining_tip: string;
}

export interface ChatResponse {
  reply: string;
  intent: string; // NILAI ASLI dari llmapp/agent.py, BUKAN 4 kategori PRD -- jangan diasumsikan
  route_data: RouteResponse | null;
  suggestions: string[];
  ui_card: { card_type: string; title?: string; [key: string]: unknown } | null;
  model: string;
}

export interface ThreadItem {
  id: string;
  category: string;
  description: string;
  lat: number;
  lon: number;
  photo_url?: string;
  reporter_name: string;
  created_at: string;
  status: "APPROVED" | "MERGED_DUPLICATE" | "FLAGGED_REVIEW" | "REJECTED";
  upvotes: number;
}

export interface PoiItem {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  description: string;
  aliases?: string[];
}

export interface HealthResponse {
  status: string;
  nodes: number;
  edges: number;
  pangkalan: number;
  gateway_hubs: number;
  pois: number;
}
