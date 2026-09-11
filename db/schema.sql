-- Skema basis data milik Next.js (ngebolang-mapid) -- hanya untuk autentikasi (F-12)
-- dan pelacakan upvote (F-07). Laporan warga sendiri TIDAK disimpan di sini --
-- itu tetap hidup di memori proses WebGIS-Backend (Python). Lihat docs/SDD.md Bagian 2
-- dan docs/ARCHITECTURE.md Bagian 3.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pengguna (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_tampilan   VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    kata_sandi_hash TEXT NOT NULL,
    dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- report_id merujuk ke id laporan yang dikembalikan Python (misal "rep_a1b2c3d4"),
-- BUKAN foreign key ke tabel lokal manapun.
CREATE TABLE IF NOT EXISTS upvote_tracking (
    pengguna_id     UUID NOT NULL REFERENCES pengguna(id),
    report_id       VARCHAR(50) NOT NULL,
    dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (pengguna_id, report_id)
);
