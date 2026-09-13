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

-- Komentar laporan warga. Backend Python tidak punya endpoint komentar sama
-- sekali, jadi ini murni fitur Next.js. report_id merujuk ke id dari Python
-- (bukan FK lokal), sama pola dengan upvote_tracking di atas.
CREATE TABLE IF NOT EXISTS laporan_komentar (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       VARCHAR(50) NOT NULL,
    pengguna_id     UUID NOT NULL REFERENCES pengguna(id),
    isi             TEXT NOT NULL,
    dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laporan_komentar_report_id
    ON laporan_komentar (report_id, dibuat_pada);

-- Riwayat chat AI, terikat akun. Backend Python hanya mengelola konteks
-- percakapan aktif per session_id, TIDAK menyediakan cara mengambil kembali
-- riwayat lama -- dua tabel ini murni milik Next.js.
CREATE TABLE IF NOT EXISTS chat_session (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengguna_id        UUID NOT NULL REFERENCES pengguna(id),
    judul              VARCHAR(120) NOT NULL DEFAULT 'Percakapan Baru',
    python_session_id  VARCHAR(64) NOT NULL,
    dibuat_pada        TIMESTAMPTZ NOT NULL DEFAULT now(),
    diperbarui_pada    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_session_pengguna_id
    ON chat_session (pengguna_id, diperbarui_pada DESC);

CREATE TABLE IF NOT EXISTS chat_message (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_session(id) ON DELETE CASCADE,
    peran           VARCHAR(16) NOT NULL, -- 'user' | 'assistant'
    isi             TEXT NOT NULL,
    metadata        JSONB, -- { suggestions?, routeData?, routeDisplayOptions? }
    dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_message_session_id
    ON chat_message (chat_session_id, dibuat_pada);
