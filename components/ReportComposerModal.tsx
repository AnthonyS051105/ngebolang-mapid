"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, RefreshCw, SquarePen, X } from "lucide-react";
import { CAT } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { ProxyApiError, submitThread, type SubmitThreadResult } from "@/lib/api/threadsClient";
import type { CategoryKey } from "@/lib/types";

interface ReportComposerModalProps {
  user: { namaTampilan: string };
  onClose: () => void;
  onSubmit: (payload: { cat: CategoryKey; description: string }) => void;
}

const catKeys = Object.keys(CAT) as CategoryKey[];

// Pusat koridor MVP (Kraton-Titik Nol-Malioboro-Tugu) -- dipakai sebagai
// fallback kalau geolokasi browser ditolak/gagal, BUKAN default utama.
const DEFAULT_LAT = -7.793;
const DEFAULT_LON = 110.365;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

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
  user,
  onClose,
  onSubmit,
}: ReportComposerModalProps) {
  const [selectedCat, setSelectedCat] = useState<CategoryKey>("Jalan Rusak");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: SubmitThreadResult["status"]; reason?: string } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });
  const [locationSource, setLocationSource] = useState<"gps" | "default" | "loading">("loading");
  // Guard supaya hasil getCurrentPosition yang telat (mis. dari permintaan
  // awal saat mount) tidak menimpa hasil yang lebih baru dari klik "Coba
  // lagi" yang sempat dipanggil di antaranya.
  const locationRequestIdRef = useRef(0);

  const requestLocation = () => {
    const requestId = ++locationRequestIdRef.current;
    setLocationSource("loading");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationSource("default");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (locationRequestIdRef.current !== requestId) return;
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationSource("gps");
      },
      () => {
        if (locationRequestIdRef.current !== requestId) return;
        setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
        setLocationSource("default");
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    // getCurrentPosition selalu resolve secara async (callback), jadi
    // requestLocation() di sini tidak melanggar aturan "no setState sinkron
    // dalam effect" -- KECUALI cabang unsupported yang setState langsung.
    // Tunda satu microtask supaya konsisten async di semua jalur.
    Promise.resolve().then(requestLocation);
  }, []);

  const handleSubmit = async () => {
    if (submitting || !description.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const res = await submitThread({
        category: selectedCat,
        description: description.trim(),
        lat: location.lat,
        lon: location.lon,
        reporter_name: user.namaTampilan,
        ...(photoDataUrl ? { photo_url: photoDataUrl } : {}),
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
            {photoDataUrl && (
              <div className="composer-photo-thumb-wrap">
                <div
                  className="composer-photo-thumb"
                  style={{ backgroundImage: `url(${photoDataUrl})` }}
                />
                <button
                  type="button"
                  className="composer-photo-remove"
                  onClick={() => {
                    setPhotoDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Hapus foto"
                >
                  <X width={12} height={12} />
                </button>
              </div>
            )}
            {!photoDataUrl && (
              <div
                className="composer-photo-add"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <Camera width={18} height={18} />
                Tambah Foto
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > MAX_PHOTO_BYTES) {
                  setPhotoError("Ukuran foto maksimal 2MB. Pilih foto lain.");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  return;
                }
                setPhotoError(null);
                const reader = new FileReader();
                reader.onload = () => setPhotoDataUrl(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>
          {photoError && (
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#b91c1c", marginTop: -4, marginBottom: 8 }}>
              {photoError}
            </div>
          )}

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
            {locationSource === "loading" && "Mendeteksi lokasi GPS..."}
            {locationSource === "gps" && "Menggunakan lokasi GPS saat ini"}
            {locationSource === "default" && "Lokasi GPS tidak tersedia — memakai lokasi default (Titik Nol Yogyakarta)"}
            {locationSource === "default" && (
              <button
                type="button"
                onClick={requestLocation}
                style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  border: "none",
                  background: "none",
                  color: "var(--green-dark)",
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: "pointer",
                }}
              >
                <RefreshCw width={12} height={12} /> Coba lagi
              </button>
            )}
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
