# Product

## Register

product

## Users

Warga dan wisatawan di Yogyakarta yang bergerak di koridor Kraton–Titik Nol–Malioboro–Tugu, dari HP mereka di jalan (bukan meja kantor) atau dari laptop saat merencanakan sebelum berangkat. Dua kebutuhan utama:

- **Mencari rute** multi-moda (jalan kaki, becak, andong, dan moda lain di luar koridor MVP) lengkap dengan estimasi waktu dan tarif kasar — sering dalam kondisi buru-buru atau saat sedang di jalan dengan koneksi tidak stabil.
- **Melaporkan kondisi jalan** (macet, jalan rusak, banjir, trotoar terhalang, dll.) dan melihat laporan warga lain di feed publik untuk menghindari titik masalah.

Konteks pemakaian: layar kecil (mobile-first di lapangan), sering satu tangan, kadang sambil jalan kaki — bukan sesi duduk lama seperti dashboard kantor.

## Product Purpose

NGEBOLANG adalah WebGIS trip planner multi-moda untuk Yogyakarta: AI Trip Planner (chat) menghasilkan rute dengan instruksi antar-moda siap tampil, dan sistem laporan warga (crowd-sourced) menjaga info kondisi jalan tetap segar. Sukses = pengguna dapat rute yang bisa langsung dipakai (bukan cuma jarak lurus), dan laporan warga yang mereka kirim benar-benar membantu pengguna lain menghindari masalah di lapangan.

## Brand Personality

Membantu, Lokal, Terpercaya. Terasa seperti dibuat oleh warga untuk warga Yogyakarta — membumi, bukan korporat atau generic-SaaS. Kejelasan informasi (rute, tarif, status laporan) diprioritaskan di atas kesan mewah atau dekoratif berlebihan.

## Anti-references

- Dashboard analytics/SaaS generik dengan kartu metrik besar dan gradient dekoratif — produk ini bukan alat analisis, ini alat bantu perjalanan sehari-hari.
- Peta wisata "brosur" yang penuh ilustrasi tapi minim data real-time — kredibilitas datang dari data (laporan warga, estimasi tarif) yang jujur soal ketidakpastiannya (lihat catatan akurasi tarif di UI), bukan dari tampilan yang terlalu dipoles.
- UI padat ala aplikasi peta profesional (GIS desktop) yang mengasumsikan pengguna ahli — target pengguna adalah warga/wisatawan awam, bukan analis GIS.

## Design Principles

1. **Satu fokus per layar, bukan semua info sekaligus** — terutama di mobile: peta, feed, dan AI planner adalah tiga mode terpisah yang bisa diakses cepat, bukan tiga panel yang harus muat bersamaan.
2. **Kejujuran atas kepastian** — data yang tidak pasti (tarif becak/andong, status laporan yang masih ditinjau) ditandai jelas sebagai perkiraan, bukan disamarkan seolah pasti.
3. **Aksi utama harus jelas dan dekat jempol** — di mobile, aksi yang paling sering dipakai (buat laporan, lihat rute) harus dalam jangkauan satu tangan, bukan terkubur di menu.
4. **Progresif, bukan default ramai** — panel sekunder (kontrol layer, feed, hasil rute) tersedia saat dibutuhkan dan bisa disembunyikan/diciutkan, bukan selalu terbuka penuh menutupi peta.
5. **Konsisten dengan data asli backend** — istilah dan struktur data di UI mengikuti field asli dari backend Python (lihat AGENTS.md/CLAUDE.md), tidak diterjemahkan diam-diam ke asumsi PRD lama.

## Accessibility & Inclusion

- Target sentuh minimum 44×44px di semua kontrol mobile (standar kenyamanan sentuh).
- Kontras teks memenuhi WCAG AA (≥4.5:1 body text, ≥3:1 teks besar) — termasuk teks di atas peta/overlay yang berubah warna latar.
- Mendukung `prefers-reduced-motion` untuk semua animasi/transisi baru.
- Tidak bergantung pada warna saja untuk membedakan status (contoh: status laporan APPROVED/FLAGGED_REVIEW/REJECTED harus punya label teks, bukan cuma warna).
