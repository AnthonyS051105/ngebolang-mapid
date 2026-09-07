"use client";

import {
  Bike,
  Bus,
  Footprints,
  Lightbulb,
  Share2,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { tripSteps } from "@/lib/data";

const stepIcons = { footprints: Footprints, bike: Bike } as const;

interface RightPanelProps {
  onPlanTrip: () => void;
}

export default function RightPanel({ onPlanTrip }: RightPanelProps) {
  return (
    <aside className="right-panel">
      <div className="rp-header">
        <div className="ic">
          <Sparkles width={17} height={17} />
        </div>
        <h2>AI Trip Planner</h2>
      </div>

      <div className="trip-summary">
        Dari <b>Tugu Yogyakarta</b> ke <b>Kraton Yogyakarta</b>
        <br />
        Budget: <b>Rp 50.000</b>
        <br />
        Preferensi: <b>Jalan kaki diutamakan</b>
      </div>

      <div className="best-route">
        <div className="lbl">Rekomendasi Rute Terbaik</div>
        <div className="eff-pill">Efisien</div>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="lab">Estimasi waktu</div>
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
          <b>Tips:</b> Rute ini melewati jalur trotoar terbaik dan menghindari
          area macet saat ini.
        </span>
      </div>

      <button className="btn-primary" onClick={onPlanTrip}>
        Lihat Detail Rute di Peta
      </button>
      <button
        className="btn-outline"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        <Share2 width={15} height={15} /> Bagikan Rute
      </button>

      <div className="info-title">Informasi Kawasan</div>
      <div className="info-grid">
        <div className="info-cell">
          <div className="ic">
            <Sun width={19} height={19} color="#f5820a" />
          </div>
          <div className="val">30°C</div>
          <div className="lab">Cerah</div>
        </div>
        <div className="info-cell">
          <div className="ic">
            <Users width={19} height={19} color="#9b5cf5" />
          </div>
          <div className="val">Tinggi</div>
          <div className="lab">Kepadatan Malioboro</div>
        </div>
        <div className="info-cell">
          <div className="ic">
            <Bus width={19} height={19} color="#2f7cf6" />
          </div>
          <div className="val">12</div>
          <div className="lab">Halte Aktif</div>
        </div>
        <div className="info-cell">
          <div className="ic">
            <Bike width={19} height={19} color="#2563eb" />
          </div>
          <div className="val">26</div>
          <div className="lab">Becak Tersedia</div>
        </div>
      </div>
    </aside>
  );
}
