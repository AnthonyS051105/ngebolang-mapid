"use client";

import { Accessibility, Footprints, Gauge, Wallet } from "lucide-react";
import type { Preference } from "@/lib/types/routingApi";

// 3 preset PRD 7.3 (graphapp/router.py PRESET_BOBOT). "hemat"/"cepat"/"seimbang" adalah
// alias ID; backend juga menerima "cheapest"/"fastest"/"balanced" -- kita kirim alias ID.
export type PresetKey = "hemat" | "cepat" | "seimbang";

const PRESETS: { key: PresetKey; label: string; icon: typeof Wallet }[] = [
  { key: "hemat", label: "Hemat", icon: Wallet },
  { key: "cepat", label: "Cepat", icon: Gauge },
  { key: "seimbang", label: "Seimbang", icon: Gauge },
];

export interface RoutePreferenceState {
  preset: PresetKey;
  walkOnly: boolean;
  ramahAksesibilitas: boolean;
}

export function toPreferenceRequestFields(state: RoutePreferenceState): {
  preference: Preference;
  walk_only: boolean;
  ramah_aksesibilitas: boolean;
} {
  return {
    preference: state.preset,
    walk_only: state.walkOnly,
    ramah_aksesibilitas: state.ramahAksesibilitas,
  };
}

interface RoutePreferencePanelProps {
  value: RoutePreferenceState;
  onChange: (value: RoutePreferenceState) => void;
}

export default function RoutePreferencePanel({ value, onChange }: RoutePreferencePanelProps) {
  return (
    <div className="pref-panel">
      <div className="pref-panel-label">Prioritas rute</div>
      <div className="pref-preset-row">
        {PRESETS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`pref-preset-btn${value.preset === key ? " active" : ""}`}
            onClick={() => onChange({ ...value, preset: key })}
          >
            <Icon width={14} height={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="pref-panel-label">Preferensi tambahan</div>
      <label className="pref-toggle-row">
        <input
          type="checkbox"
          checked={value.walkOnly}
          onChange={(e) => onChange({ ...value, walkOnly: e.target.checked })}
        />
        <Footprints width={14} height={14} />
        <span>Jalan kaki saja (tanpa feeder)</span>
      </label>
      <label className="pref-toggle-row">
        <input
          type="checkbox"
          checked={value.ramahAksesibilitas}
          onChange={(e) => onChange({ ...value, ramahAksesibilitas: e.target.checked })}
        />
        <Accessibility width={14} height={14} />
        <span>Ramah aksesibilitas (hindari tangga/trotoar rusak)</span>
      </label>
    </div>
  );
}
