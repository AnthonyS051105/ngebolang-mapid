// Tipe sesuai respons Python asli (WebGIS-Backend). Field SENGAJA tidak diterjemahkan
// ke Bahasa Indonesia / camelCase konvensi lokal -- lihat docs/SDD.md Bagian 3.

// 3 preset (PRD 7.3), masing-masing dengan alias ID/EN -- lihat graphapp/router.py PRESET_BOBOT.
// "walk_only" dan "accessible" BUKAN preset preference lagi -- sudah jadi field boolean
// terpisah (walk_only, ramah_aksesibilitas) di RouteRequestBody, meski backend masih
// menerima kedua string itu sebagai alias lawas di preference untuk kompatibilitas.
export type Preference = "hemat" | "cheapest" | "cepat" | "fastest" | "seimbang" | "balanced";
export type FeederType = "any" | "andong" | "becak";

export interface WaypointItem {
  lat: number;
  lon: number;
  name?: string;
}

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
  walk_only?: boolean;
  ramah_aksesibilitas?: boolean;
  budget_max?: number;
  feeder_type?: FeederType;
  is_weekend?: boolean;
  waypoints?: WaypointItem[];
}

// Bentuk NYATA dari graphapp/formatter.py (bukan `type`/`instruction` seperti dulu
// ditulis di docs/PYTHON_API_CONTRACT.md) -- dikonfirmasi lewat panggilan langsung ke
// POST /api/route dan /api/chat (route_data), lihat mode_label & "step" (bukan array index).
export type RouteStepMode =
  | "walk"
  | "feeder"
  | "transfer_board"
  | "transfer_alight"
  | "ojol"
  | "bus"
  | "car"
  | "waypoint_stop"
  | string; // backend tidak memakai Literal -- nilai lain bisa muncul (mis. Trans Jogja)

export interface RouteStep {
  step: number;
  mode: RouteStepMode;
  mode_label: string;
  summary: string;
  distance_m?: number;
  time_min: number;
  cost_idr: number;
  pangkalan?: string;
}

export interface CostRange {
  min_idr: number;
  max_idr: number;
  expected_idr: number;
  model_source?: "trained_linear_regression" | "profile_heuristic" | "fallback" | string;
}

export interface RouteResponse {
  status: "success" | "error";
  parameters?: {
    preference: string;
    budget_max: number | null;
    feeder_type: string;
    is_weekend: boolean;
  };
  origin: { name: string; lat: number; lon: number };
  destination: { name: string; lat: number; lon: number };
  summary: {
    total_distance_m: number;
    total_time_min: number;
    total_cost_idr: number;
    has_feeder: boolean;
    feeder_type: string | null;
    is_weekend?: boolean;
    preference?: string;
    budget_max?: number | null;
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
  status: "success";
  session_id: string;
  reply: string;
  intent: string; // NILAI ASLI dari llmapp/agent.py, BUKAN 4 kategori PRD -- jangan diasumsikan
  route_data: RouteResponse | null;
  suggestions: string[];
  ui_card: { card_type: string; title?: string; [key: string]: unknown } | null;
  model: string;
}

export interface ChatErrorResponse {
  status: "error";
  session_id: string;
  message: string;
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
