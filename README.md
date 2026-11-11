# Papan Peta Intelijen Kejaksaan Negeri Tabanan
### Data Peta Intelijen (Format D.IN.1 s.d. D.IN.11)

Aplikasi web modern berbasis **React, TypeScript, Tailwind CSS, Leaflet, dan Recharts** yang meniru papan peta fisik Seksi Intelijen Kejaksaan Negeri Tabanan dengan tema warna resmi Kejaksaan RI:
- **Latar belakang gelap kebiruan**: `#2B3A42`
- **Aksen hijau Kejaksaan**: `#8DC21F`
- **Baris tabel hijau muda**: `#DCE9D0` (selang-seling baris fisik)
- **Header tabel hijau dengan teks putih**
- **Logo Kejaksaan Negeri Tabanan**

---

## DAFTAR ISI
1. [Fitur Utama](#fitur-utama)
2. [Variabel Environment](#variabel-environment)
3. [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal)
4. [Cara Menjalankan Migrasi SQL di Supabase](#cara-menjalankan-migrasi-sql-di-supabase)
5. [Cara Deploy ke Vercel](#cara-deploy-ke-vercel)
6. [Cara Mengganti File Simbol Sektor](#cara-mengganti-file-simbol-sektor)
7. [Cara Mengganti File GeoJSON](#cara-mengganti-file-geojson)
8. [Adaptor Data Perkara (Mock vs API)](#adaptor-data-perkara-mock-vs-api)
9. [Hak Akses Pengguna (Role-Based Access Control)](#hak-akses-pengguna-role-based-access-control)

---

## 1. FITUR UTAMA
- **Halaman Login & RBAC**: Autentikasi dengan Supabase Auth (Email & Password), dilengkapi tombol simulasi peran (Admin, Penginput, Pembaca) untuk pengujian.
- **Papan Tabel SIADIBIBAM (5W+1H)**: Format slide D.IN.1, D.IN.3, D.IN.4, D.IN.5, D.IN.6 dengan kolom `NO | SIMBOL SEKTOR | SIADIBIBAM / 5W+1H | KETERANGAN`. Dilengkapi filter tanggal, triwulan, kecamatan, sektor, dan pencarian cepat.
- **Peta Interaktif Kabupaten Tabanan (D.IN.2 s.d. D.IN.6)**: Peta Leaflet dengan batas wilayah Tabanan dan 10 kecamatan, marker simbol sektor, dan popup ringkasan intelijen.
- **Form Input Terstandarisasi**: Validasi dengan Zod, generator draf otomatis kalimat narasi *"Bahwa pada hari ..., bertempat di ..., ..."*, dan peringatan keamanan data sensitif (anti-PII yang tidak perlu).
- **Penerangan & Penyuluhan Hukum (D.IN.7 - D.IN.8)**: Tampilan 4 kolom triwulan dan galeri dokumentasi foto per kegiatan.
- **Grafik Capaian Target (D.IN.9)**: Grafik batang Target vs Penkum vs Luhkum per triwulan.
- **Grafik Perkara (D.IN.11)**: Empat grafik batang tahunan (Tipikor, Narkotika, Terorisme, Perkara Menarik Perhatian Masyarakat) dan grafik horizontal sebaran per 10 kecamatan.
- **Ekspor Presentasi PPTX**: Tombol "Unduh PPTX" menghasilkan deck presentasi PowerPoint resmi lengkap (cover, slide tabel bidang, peta, grafik D.IN.9, dan grafik D.IN.11).

---

## 2. VARIABEL ENVIRONMENT
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi variabel-variabel berikut:
```env
# Kredensial Supabase (Dapatkan dari Project Settings -> API)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Data Perkara Adapter ('mock' untuk simulasi realistis, 'api' untuk API publik)
PERKARA_PROVIDER="mock"
PERKARA_API_URL="https://api.kejaksaan.go.id/v1/perkara"
PERKARA_API_KEY="your_secret_api_key_here"
VITE_PERKARA_PROVIDER="mock"

# URL Host Aplikasi
APP_URL="http://localhost:3000"
```

*Catatan: Jika kredensial Supabase belum diisi, aplikasi akan otomatis beralih ke mode penyimpanan lokal (Local Storage) dengan data seed fiktif lengkap sehingga seluruh fitur dapat langsung diuji.*

---

## 3. CARA MENJALANKAN SECARA LOKAL
1. Pastikan Node.js (versi 18+) telah terpasang.
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka browser pada alamat `http://localhost:3000`.

---

## 4. CARA MENJALANKAN MIGRASI SQL DI SUPABASE
1. Masuk ke dashboard proyek Supabase Anda: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor** pada navigasi sisi kiri.
3. Buka file `/supabase/migrations/20250101_initial_schema.sql` di proyek ini, lalu salin seluruh kodenya.
4. Tempel ke dalam SQL Editor Supabase, lalu klik tombol **Run**.
5. Script tersebut akan otomatis membuat:
   - Tipe enum `user_role` (`admin`, `penginput`, `pembaca`).
   - Tabel `profiles`, `kegiatan_peta`, dan `penerangan_hukum`.
   - Mengaktifkan **Row Level Security (RLS)** dengan aturan ketat:
     - `pembaca`: Hanya dapat membaca (SELECT).
     - `penginput`: Dapat menambah dan mengubah data miliknya.
     - `admin`: Hak akses penuh (SELECT, INSERT, UPDATE, DELETE).
   - Bucket Supabase Storage bernama `foto_dokumentasi`.

---

## 5. CARA DEPLOY KE VERCEL
Aplikasi ini sudah dipersiapkan dan dioptimalkan untuk di-deploy ke Vercel:
1. Hubungkan repositori GitHub/GitLab Anda ke Vercel.
2. Di dashboard Vercel, masuk ke **Settings > Environment Variables**, lalu tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `PERKARA_PROVIDER` (`mock` atau `api`)
   - `PERKARA_API_URL` (jika mode api)
   - `PERKARA_API_KEY` (jika mode api)
   - `VITE_PERKARA_PROVIDER` (`mock` atau `api`)
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Serverless Function `/api/perkara` berada di file `/api/perkara.ts` dan akan otomatis dijalankan oleh Vercel Serverless runtime.

---

## 6. CARA MENGGANTI FILE SIMBOL SEKTOR
Simbol sektor **tidak diunggah dari antarmuka**, melainkan dibaca dari aset tetap di folder `/public/symbols/`.

Untuk mengganti dengan gambar simbol resmi hasil ekstrak dari file PDF:
1. Ekstrak gambar dari PDF dan simpan dalam format **PNG transparan** (resolusi 256x256 atau 512x512).
2. Beri nama file persis sesuai daftar slug berikut dan letakkan di folder `/public/symbols/`:
   - `politik.png`
   - `pengamanan-sumber-daya-organisasi.png`
   - `pengawasan-wilayah-teritorial.png`
   - `pengawasan-ormas-lsm.png`
   - `ketertiban-dan-ketentraman-umum.png`
   - `pencegahan-konflik-sosial.png`
   - `pengawasan-aliran-kepercayaan-dan-keagamaan.png`
   - `perdagangan.png`
   - `penelusuran-aset.png`
   - `moneter.png`
   - `sektor-lainnya.png`
   - `produksi-intelijen.png`
3. Refresh browser. Gambar baru akan langsung tampil di papan tabel, peta Leaflet, form pratinjau, dan ekspor PPTX tanpa perlu mengubah kode sumber.
4. Selama file fisik belum diganti, sistem secara otomatis menampilkan fallback kotak taktis resmi bersandi sektor.

---

## 7. CARA MENGGANTI FILE GEOJSON
Peta memuat data poligon wilayah dari folder `/public/geo/`:
- `/public/geo/tabanan.geojson`: Garis batas luar Kabupaten Tabanan.
- `/public/geo/kecamatan.geojson`: Batas 10 kecamatan (dengan atribut `nama_kecamatan`).

Jika Anda memiliki data SHP/GeoJSON resmi dari Badan Informasi Geospasial (BIG) atau Bappeda Tabanan:
1. Konversikan ke format GeoJSON (koordinat EPSG:4326 / WGS84).
2. Pastikan file kecamatan memiliki properti `"nama_kecamatan"` dengan nilai salah satu dari:
   `Selemadeg Barat`, `Selemadeg`, `Selemadeg Timur`, `Kerambitan`, `Tabanan`, `Kediri`, `Marga`, `Penebel`, `Baturiti`, `Pupuan`.
3. Timpa file di `/public/geo/tabanan.geojson` dan `/public/geo/kecamatan.geojson`.
4. Jika file belum ditimpa, sistem tetap berjalan lancar menggunakan fallback poligon perkiraan dan titik tengah koordinat tanpa error.

---

## 8. ADAPTOR DATA PERKARA (MOCK VS API)
Aplikasi menggunakan antarmuka `PerkaraProvider` di `src/services/perkaraProvider.ts`:
- **MockPerkaraProvider**: Menghasilkan data simulasi realistis perkara Kejari Tabanan (Tipikor, Narkotika, Terorisme, dan Perkara Menarik Perhatian Masyarakat). Label *"Data dummy"* otomatis tampil di grafik perkara.
- **ApiPerkaraProvider**: Memanggil endpoint `/api/perkara` dengan sistem caching 1 jam untuk efisiensi beban server dan perlindungan CORS / API key.
- Untuk menyesuaikan skema data jika API publik Kejaksaan memiliki struktur khusus, sesuaikan blok komentar pemetaan di `src/services/perkaraProvider.ts` pada baris `mappedData`.

---

## 9. HAK AKSES PENGGUNA (ROLE-BASED ACCESS CONTROL)
Terdapat 3 peran pengguna:
1. **Admin (Kepala Seksi Intelijen)**:
   - Dapat melihat seluruh papan data dan peta.
   - Dapat menambah, mengubah, dan menghapus seluruh kegiatan intelijen dan penkum.
   - Mengunduh slide presentasi resmi PPTX.
2. **Penginput (Jaksa Fungsional / Operator Papan)**:
   - Dapat menambah kegiatan baru.
   - Dapat mengubah atau menghapus data kegiatan yang dibuatnya sendiri.
3. **Pembaca (Tamu / Pengamat)**:
   - Akses hanya baca (*Read-only*).
   - Tombol tambah, ubah, dan hapus disembunyikan.

---

*Kejaksaan Negeri Tabanan · Bidang Intelijen · Satya Adhi Wicaksana*
