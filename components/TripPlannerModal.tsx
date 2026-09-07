"use client";

import {
  Bike,
  Footprints,
  Lightbulb,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { tripSteps } from "@/lib/data";

const stepIcons = { footprints: Footprints, bike: Bike } as const;

interface TripPlannerModalProps {
  onClose: () => void;
  onViewOnMap: () => void;
}

export default function TripPlannerModal({
  onClose,
  onViewOnMap,
}: TripPlannerModalProps) {
  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-head">
          <Sparkles width={17} height={17} color="var(--green)" />
          <h3>AI Trip Planner — Hasil Rute</h3>
          <div className="overlay-close" onClick={onClose}>
            <X width={16} height={16} />
          </div>
        </div>
        <div className="overlay-body">
          <div className="trip-summary">
            Rute: <b>Tugu Yogyakarta → Kraton Yogyakarta</b>
          </div>

          <div className="stat-row">
            <div className="stat-box">
              <div className="lab">Estimasi total waktu</div>
              <div className="val">35 menit</div>
            </div>
            <div className="stat-box money">
              <div className="lab">Estimasi biaya</div>
              <div className="val">Rp 15.000–20.000</div>
            </div>
          </div>

          <div className="steps">
            {tripSteps.map((s, i) => {
              const Icon = stepIcons[s.icon as keyof typeof stepIcons];
              return (
                <div className="step" key={i}>
                  <div className="num">
                    <Icon width={15} height={15} />
                  </div>
                  <div className="info">
                    <div className="top">
                      <span className="lbl">
                        {i + 1}. {s.label}
                      </span>
                      <span className="dur">{s.dur}</span>
                    </div>
                    <div className="route">{s.route}</div>
                    {s.fare && <div className="fare">{s.fare}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tip-box">
            <Lightbulb width={16} height={16} />
            <span>
              <b>Tips:</b> Rute ini melewati jalur trotoar terbaik dan
              menghindari area macet saat ini.
            </span>
          </div>

          <button className="btn-primary" onClick={onViewOnMap}>
            Lihat di Peta
          </button>
          <button
            className="btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              marginBottom: 0,
            }}
          >
            <Share2 width={15} height={15} /> Bagikan Rute
          </button>
        </div>
      </div>
    </div>
  );
}
