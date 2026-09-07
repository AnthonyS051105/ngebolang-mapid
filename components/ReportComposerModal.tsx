"use client";

import { useState } from "react";
import { Camera, MapPin, SquarePen, X } from "lucide-react";
import { CAT } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import type { CategoryKey } from "@/lib/types";

interface ReportComposerModalProps {
  onClose: () => void;
  onSubmit: (payload: { cat: CategoryKey; description: string }) => void;
}

const catKeys = Object.keys(CAT) as CategoryKey[];

export default function ReportComposerModal({
  onClose,
  onSubmit,
}: ReportComposerModalProps) {
  const [selectedCat, setSelectedCat] = useState<CategoryKey>("jalan_rusak");
  const [description, setDescription] = useState("");

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

          <button
            className="btn-primary"
            onClick={() => onSubmit({ cat: selectedCat, description })}
          >
            Kirim Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
