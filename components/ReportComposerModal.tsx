"use client";

import { useState } from "react";
import { Camera, MapPin, SquarePen, X } from "lucide-react";
import { CAT } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { ProxyApiError, submitThread, type SubmitThreadResult } from "@/lib/api/threadsClient";
import type { CategoryKey } from "@/lib/types";

interface ReportComposerModalProps {
  onClose: () => void;
  onSubmit: (payload: { cat: CategoryKey; description: string }) => void;
}

const catKeys = Object.keys(CAT) as CategoryKey[];

// Pusat koridor MVP (Kraton-Titik Nol-Malioboro-Tugu), dipakai sebagai lokasi
// laporan sampai geolokasi pengguna sungguhan tersedia di peta.
const DEFAULT_LAT = -7.793;
const DEFAULT_LON = 110.365;

const STATUS_COPY: Record<
  SubmitThreadResult["status"],
  { title: string; tone: "success" | "info" | "warning" | "error" }
> = {
  APPROVED: {
    title: "Laporan berhasil dikirim dan langsung tayang di feed.",
    tone: "success",
  },
  MERGED_DUPLICATE: {
    title: "Laporan serupa sudah ada di lokasi ini — suaramu ditambahkan ke laporan itu.",
    tone: "info",
  },
  FLAGGED_REVIEW: {
    title: "Laporan diterima dan sedang ditinjau moderator sebelum tayang.",
    tone: "warning",
  },
  REJECTED: {
    title: "Laporan ditolak. Periksa kembali deskripsi laporanmu.",
    tone: "error",
  },
};

export default function ReportComposerModal({
  onClose,
  onSubmit,
}: ReportComposerModalProps) {
  const [selectedCat, setSelectedCat] = useState<CategoryKey>("Jalan Rusak");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: SubmitThreadResult["status"]; reason?: string } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting || !description.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const res = await submitThread({
        category: selectedCat,
        description: description.trim(),
        lat: DEFAULT_LAT,
        lon: DEFAULT_LON,
      });
      setResult({ status: res.status, reason: res.moderation_reason });
      if (res.status === "APPROVED" || res.status === "MERGED_DUPLICATE") {
        onSubmit({ cat: selectedCat, description: description.trim() });
      }
    } catch (err) {
      if (err instanceof ProxyApiError && err.status === 401) {
        setErrorMessage("Kamu harus masuk terlebih dahulu untuk membuat laporan.");
      } else {
        setErrorMessage("Gagal mengirim laporan. Coba lagi nanti.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-head">
          <SquarePen width={16} height={16} color="var(--green)" />
          <h3>Buat Laporan Baru</h3>
          <div className="overlay-close" onClick={onClose}>
            <X width={16} height={16} />
          </div>
        </div>
        <div className="overlay-body">
          <span className="composer-label">Kategori</span>
          <div className="composer-cat-grid">
            {catKeys.map((key) => {
              const c = CAT[key];
              const Icon = getIcon(c.icon);
              const selected = selectedCat === key;
              return (
                <div
                  key={key}
                  className={`composer-cat${selected ? " selected" : ""}`}
                  onClick={() => setSelectedCat(key)}
                >
                  <div
                    className="ic"
                    style={{
                      background: selected ? "#fff" : `${c.color}18`,
                    }}
                  >
                    <Icon width={16} height={16} color={c.color} />
                  </div>
                  {c.label}
                </div>
              );
            })}
          </div>

          <span className="composer-label">Foto</span>
          <div className="composer-photo-row">
            <div className="composer-photo-add">
              <Camera width={18} height={18} />
              Tambah Foto
            </div>
          </div>

          <span className="composer-label">Deskripsi</span>
          <textarea
            className="composer-textarea"
            placeholder="Ceritakan kondisi yang kamu lihat..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <span className="composer-label">Lokasi</span>
          <div className="composer-location">
            <MapPin width={16} height={16} color="var(--green-dark)" />
            Menggunakan lokasi saat ini di peta
          </div>

          {result && (
            <div
              style={{
                marginTop: 10,
                marginBottom: 4,
                fontSize: 12.5,
                fontWeight: 600,
                color:
                  STATUS_COPY[result.status].tone === "success"
                    ? "#15803d"
                    : STATUS_COPY[result.status].tone === "info"
                      ? "#1d4ed8"
                      : STATUS_COPY[result.status].tone === "warning"
                        ? "#b45309"
                        : "#b91c1c",
              }}
            >
              {STATUS_COPY[result.status].title}
              {result.reason ? ` (${result.reason})` : ""}
            </div>
          )}

          {errorMessage && (
            <div style={{ marginTop: 10, marginBottom: 4, fontSize: 12.5, fontWeight: 600, color: "#b91c1c" }}>
              {errorMessage}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            style={{ opacity: submitting || !description.trim() ? 0.6 : 1 }}
          >
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </div>
      </div>
    </div>
  );
}
