"use client";

import { Bike, Footprints, Lightbulb, Car, Bus, TriangleAlert, ArrowLeftRight } from "lucide-react";
import type { RouteResponse } from "@/lib/types/routingApi";

const STEP_ICON: Record<string, typeof Footprints> = {
  walk: Footprints,
  feeder: Bike,
  transfer_board: ArrowLeftRight,
  transfer_alight: ArrowLeftRight,
  waypoint_stop: ArrowLeftRight,
  ojol: Bike,
  bus: Bus,
  car: Car,
};

// MAE aktual per moda feeder (graphapp/data/tarif_model.json) -- becak jauh lebih
// tidak akurat (27,47%) dibanding andong (15,44%), keduanya di atas target PRD 15%
// untuk becak. Selalu tampilkan sebagai "estimasi kasar", dengan penekanan ekstra utk becak.
const FARE_ACCURACY_NOTE: Record<string, string> = {
  andong: "Estimasi kasar (rata-rata meleset ~15%) — bisa beda dari tarif riil di lapangan.",
  becak:
    "Estimasi kasar dan kurang akurat (rata-rata meleset ~27%) — selalu tawar & konfirmasi tarif ke kusir becak sebelum naik.",
};

function formatIdr(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatDuration(min: number) {
  return min < 1 ? "< 1 menit" : `${Math.round(min)} menit`;
}

interface RouteResultCardProps {
  route: RouteResponse;
  onViewOnMap?: () => void;
}

export default function RouteResultCard({ route, onViewOnMap }: RouteResultCardProps) {
  const { origin, destination, summary, steps } = route;
  const feederKey = summary.feeder_type?.toLowerCase() ?? null;
  const accuracyNote = feederKey ? FARE_ACCURACY_NOTE[feederKey] : null;

  return (
    <div className="route-result-card">
      <div className="trip-summary">
        Rute: <b>{origin.name}</b> &rarr; <b>{destination.name}</b>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="lab">Estimasi total waktu</div>
          <div className="val">{formatDuration(summary.total_time_min)}</div>
        </div>
        <div className="stat-box money">
          <div className="lab">Estimasi biaya {summary.has_feeder ? "(kasar)" : ""}</div>
          <div className="val">
            {summary.has_feeder
              ? `${formatIdr(summary.cost_range.min_idr)}–${formatIdr(summary.cost_range.max_idr)}`
              : formatIdr(summary.total_cost_idr)}
          </div>
        </div>
      </div>

      <div className="steps">
        {steps.map((step) => {
          const Icon = STEP_ICON[step.mode] ?? Footprints;
          return (
            <div className="step" key={step.step}>
              <div className="num">
                <Icon width={15} height={15} />
              </div>
              <div className="info">
                <div className="top">
                  <span className="lbl">
                    {step.step}. {step.mode_label}
                  </span>
                  <span className="dur">{formatDuration(step.time_min)}</span>
                </div>
                <div className="route">{step.summary}</div>
                {step.cost_idr > 0 && <div className="fare">{formatIdr(step.cost_idr)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {summary.has_feeder && (
        <div className="tip-box fare-accuracy-box">
          <TriangleAlert width={16} height={16} />
          <span>
            <b>Estimasi kasar:</b> {accuracyNote ?? "Tarif hanya perkiraan, tidak dijamin akurat."}
            {summary.bargaining_tip && (
              <>
                {" "}
                {summary.bargaining_tip}
              </>
            )}
          </span>
        </div>
      )}

      {summary.recommendation && (
        <div className="tip-box">
          <Lightbulb width={16} height={16} />
          <span>{summary.recommendation}</span>
        </div>
      )}

      {onViewOnMap && (
        <button className="btn-primary" onClick={onViewOnMap}>
          Lihat di Peta
        </button>
      )}
    </div>
  );
}
