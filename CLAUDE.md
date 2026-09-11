# CLAUDE.md — ngebolang-mapid (WebGIS Developer)

@AGENTS.md

> Baris di atas otomatis dari Next.js, jangan dihapus.

## Status dokumen: SUDAH direkonsiliasi dengan kode backend asli

Seluruh dokumen di `docs/` sudah dibaca ulang dan disesuaikan berdasarkan kode sungguhan di repo `WebGIS-Backend` (dibaca langsung dari `server.py`, `graphapp/*.py`, `community/moderator.py`, `graphapp/data/tarif_model.json`, `schema.sql`). Ini **bukan** lagi proposal — kalau ada perbedaan antara dokumen ini dan backend, backend adalah sumber kebenaran (kecuali dinyatakan lain).

## Apa proyek ini

NGEBOLANG — WebGIS trip planner multi-moda Yogyakarta. Repo ini (`ngebolang-mapid`) adalah **frontend Next.js + backend ringan Next.js**.

## Hal paling penting yang perlu dipahami tentang backend Python (`WebGIS-Backend`)

1. **Backend Python SUDAH mengimplementasikan penuh laporan warga (F-05, F-06, F-09) dan _upvote_ (F-07)** — kamu **tidak perlu membangun CRUD laporan dari nol**. Tugasmu untuk fitur ini adalah menampilkan data dari Python, dan membangun **proksi berpenjaga** di Next.js untuk dua _endpoint_ tulis (`POST /api/threads`, `POST /api/threads/[id]/upvote`) supaya ada pemeriksaan login dan anti-vote-ganda — karena Python sendiri **tidak** memeriksa keduanya. Lihat `docs/ARCHITECTURE.md` Bagian 4 untuk kerangka kodenya.
2. **Backend Python tidak menyimpan data secara permanen.** Laporan warga dan graf ada di memori, hilang setiap _restart_. Ini bukan sesuatu yang bisa diperbaiki dari repo ini.
3. **Struktur respons `/api/route` berbeda dari yang mungkin kamu bayangkan** — pakai `steps` (instruksi siap tampil) dan `geojson` (siap _render_ langsung), bukan array `segments` sederhana. Baca `docs/PYTHON_API_CONTRACT.md` sebelum membangun `RouteResultCard.tsx`.
4. **`/api/chat` memakai `session_id`, bukan riwayat percakapan yang dikirim ulang oleh klien.** Simpan `session_id` yang konsisten di _state_ klien, jangan bangun ulang mekanisme kirim-riwayat.
5. **Nilai `intent` dari `/api/chat` bukan 4 kategori yang tertulis di PRD** (`rencana_rute`/`info_kawasan`/dst.) — nilai aslinya berbeda (`lookup_poi`, `plan_trip`, dll.). Jangan menyalin daftar dari PRD ke logika percabangan di frontend.
6. **Backend teknisnya mendukung wilayah jauh lebih luas dari PRD** (seluruh Provinsi DIY, termasuk Trans Jogja/Ojek Online/Mobil sebagai moda). Untuk MVP sesuai PRD, **jangan menampilkan fitur di luar koridor Kraton-Titik Nol-Malioboro-Tugu di UI utama** kecuali diinstruksikan lain oleh pengguna — kemampuan backend yang lebih luas boleh ada, tapi produk yang ditunjukkan ke juri sebaiknya tetap konsisten dengan PRD.

## Baca berkas ini secara berurutan

1. `docs/ARCHITECTURE.md` — arsitektur terkini, pola proksi auth.
2. `docs/PYTHON_API_CONTRACT.md` — kontrak _endpoint_ backend, sudah direkonsiliasi, **rujukan wajib**.
3. `docs/SRS.md` — kebutuhan F-01 s.d. F-12 dengan status implementasi terkini.
4. `docs/SDD.md` — struktur modul, skema tabel kecil milik Next.js, pola proksi.
5. `docs/API_CONTRACT.md` — _endpoint_ `/api/*` milik Next.js sendiri (sekarang cuma auth + 2 proksi).
6. `docs/UI_UX_FLOW.md` — alur layar, disesuaikan dengan _field_ respons asli.
7. `docs/TASK_BREAKDOWN.md` — tugas per minggu.

## Aturan kerja untuk Claude Code

- Jangan membangun ulang logika CRUD laporan warga — itu sudah ada di Python. Fokus ke tampilan + proksi auth.
- Selalu proksi `POST /api/threads` dan `POST /api/threads/[id]/upvote` lewat _route handler_ Next.js sendiri, **jangan pernah** memanggil dua _endpoint_ Python ini langsung dari komponen klien — itu akan melewati pemeriksaan login sama sekali.
- Untuk _endpoint_ baca (`POST /api/route`, `/api/chat`, `/api/poi`, `/api/layers/heatmap`, `GET /api/threads`, `/api/export/reports`) boleh panggil langsung dari klien ke Python, tidak perlu proksi.
- Nama _field_ JSON di respons Python pakai bahasa Inggris (`category`, `description`, `total_time_min`, dst.) — **jangan** mengubahnya jadi bahasa Indonesia dengan asumsi itu skema PRD; tampilkan apa adanya atau petakan di satu tempat (`lib/api/routingClient.ts`) kalau ingin konsisten dengan istilah Indonesia di UI.
- Kalau menemukan fitur backend yang tidak disebutkan di dokumen manapun di sini, cek dulu `docs/PYTHON_API_CONTRACT.md` Bagian 17 (daftar _endpoint_ di luar cakupan PRD) sebelum memutuskan menampilkannya di UI.

## Perintah yang sering dipakai

```bash
npm run dev
npm run build
npm run lint
```

## Status implementasi

- Backend Python: **jauh lebih matang dari perkiraan awal**, 12/12 skenario uji AI Trip Planner lolos, tapi punya beberapa celah (lihat `docs/ARCHITECTURE.md` Bagian 6): data tidak persisten, rumus bobot rute berbeda dari PRD, MAE tarif ~24% (target 15%), cakupan lebih luas dari PRD.
- Frontend Next.js: desain visual & komponen UI sudah banyak jadi, integrasi API dan proksi auth belum ada.
