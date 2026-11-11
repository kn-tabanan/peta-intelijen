-- ==============================================================================
-- SKEMA BASIS DATA PAPAN PETA INTELIJEN KEJAKSAAN NEGERI TABANAN
-- File Migrasi: 20250101_initial_schema.sql
-- Kompatibel dengan Supabase Postgres + Row Level Security (RLS)
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipe Enum Peran Pengguna
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'penginput', 'pembaca');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Profil Pengguna (Tersinkron dengan Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT DEFAULT 'Staf Intelijen',
  role user_role NOT NULL DEFAULT 'pembaca',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Kegiatan Peta Intelijen (Baris Papan SIADIBIBAM D.IN.1 s.d. D.IN.6)
CREATE TABLE IF NOT EXISTS public.kegiatan_peta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang TEXT NOT NULL,
  keterangan_sektor TEXT NOT NULL,
  tanggal DATE NOT NULL,
  waktu TEXT NOT NULL,
  tempat TEXT NOT NULL,
  uraian TEXT NOT NULL, -- Format narasi diawali dengan 'Bahwa...'
  poin_tambahan TEXT[] DEFAULT ARRAY[]::TEXT[],
  kecamatan TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa pencarian & filter
CREATE INDEX IF NOT EXISTS idx_kegiatan_bidang ON public.kegiatan_peta(bidang);
CREATE INDEX IF NOT EXISTS idx_kegiatan_tanggal ON public.kegiatan_peta(tanggal);
CREATE INDEX IF NOT EXISTS idx_kegiatan_kecamatan ON public.kegiatan_peta(kecamatan);
CREATE INDEX IF NOT EXISTS idx_kegiatan_sektor ON public.kegiatan_peta(keterangan_sektor);

-- 5. Tabel Penerangan dan Penyuluhan Hukum (D.IN.7 s.d. D.IN.8)
CREATE TABLE IF NOT EXISTS public.penerangan_hukum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis TEXT NOT NULL CHECK (jenis IN ('Penkum', 'Luhkum')),
  triwulan INTEGER NOT NULL CHECK (triwulan BETWEEN 1 AND 4),
  tahun INTEGER NOT NULL,
  tema TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  tanggal DATE NOT NULL,
  tempat TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  jumlah_peserta INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  foto_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_penkum_tahun_triwulan ON public.penerangan_hukum(tahun, triwulan);

-- 6. Fungsi Otomatis update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_kegiatan ON public.kegiatan_peta;
CREATE TRIGGER set_updated_at_kegiatan
  BEFORE UPDATE ON public.kegiatan_peta
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_penkum ON public.penerangan_hukum;
CREATE TRIGGER set_updated_at_penkum
  BEFORE UPDATE ON public.penerangan_hukum
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. PENGATURAN ROW LEVEL SECURITY (RLS) - WAJIB & KETAT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_peta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penerangan_hukum ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: cek apakah user saat ini minimal penginput
CREATE OR REPLACE FUNCTION public.is_penginput_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'penginput')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kebijakan RLS Tabel Profiles
CREATE POLICY "Pengguna dapat melihat profil sendiri"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin dapat mengelola seluruh profil"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Kebijakan RLS Tabel kegiatan_peta
-- A. Pembaca: Hanya boleh SELECT
CREATE POLICY "Semua pengguna terotentikasi dapat melihat data kegiatan"
  ON public.kegiatan_peta FOR SELECT
  TO authenticated
  USING (true);

-- B. Penginput: Boleh INSERT jika memiliki role penginput/admin
CREATE POLICY "Penginput dan admin dapat menambahkan data kegiatan"
  ON public.kegiatan_peta FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_penginput_or_admin() AND
    (created_by IS NULL OR created_by = auth.uid())
  );

-- C. Penginput: Boleh UPDATE data miliknya sendiri
CREATE POLICY "Penginput dapat mengubah data miliknya"
  ON public.kegiatan_peta FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- D. Penginput: Boleh DELETE data miliknya sendiri, Admin boleh menghapus semua
CREATE POLICY "Penginput dan admin dapat menghapus data"
  ON public.kegiatan_peta FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- Kebijakan RLS Tabel penerangan_hukum
CREATE POLICY "Semua pengguna terotentikasi dapat melihat data penkum"
  ON public.penerangan_hukum FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Penginput dan admin dapat menambahkan data penkum"
  ON public.penerangan_hukum FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_penginput_or_admin() AND
    (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Penginput dan admin dapat mengubah data penkum"
  ON public.penerangan_hukum FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Penginput dan admin dapat menghapus data penkum"
  ON public.penerangan_hukum FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- ==============================================================================
-- BUCKET STORAGE UNTUK FOTO DOKUMENTASI (PENKUM / LUHKUM)
-- Jalankan di SQL Editor jika belum dibuat lewat UI Dashboard Supabase Storage
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('foto_dokumentasi', 'foto_dokumentasi', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Pengguna terotentikasi dapat melihat foto dokumentasi"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'foto_dokumentasi');

CREATE POLICY "Penginput dan admin dapat mengunggah foto dokumentasi"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'foto_dokumentasi' AND public.is_penginput_or_admin());
