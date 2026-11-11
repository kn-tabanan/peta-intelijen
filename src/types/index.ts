/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Model Data dan Tipe TypeScript
 * Papan Peta Intelijen Kejaksaan Negeri Tabanan
 */

import { BidangIntelijen, KeteranganSektor, KecamatanTabanan } from '../config/symbols.config';

export type { BidangIntelijen, KeteranganSektor, KecamatanTabanan };

export type UserRole = 'admin' | 'penginput' | 'pembaca';

export interface UserProfile {
  id: string;
  email: string;
  nama_lengkap: string;
  nip?: string;
  jabatan?: string;
  role: UserRole;
  avatar_url?: string;
}

export interface KegiatanPeta {
  id: string;
  bidang: BidangIntelijen;
  keterangan_sektor: KeteranganSektor;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:MM atau HH.MM WITA
  tempat: string;
  uraian: string; // Narasi formal intelijen diawali 'Bahwa...'
  poin_tambahan: string[]; // Poin bernomor tambahan
  kecamatan: KecamatanTabanan;
  lat?: number;
  lng?: number;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PeneranganHukum {
  id: string;
  jenis: 'Penkum' | 'Luhkum';
  triwulan: 1 | 2 | 3 | 4;
  tahun: number;
  tema: string[];
  tanggal: string;
  tempat: string;
  kecamatan: KecamatanTabanan;
  jumlah_peserta: number;
  target: number;
  foto_urls: { url: string; keterangan?: string }[];
  created_by?: string;
  created_at?: string;
}

// Model Statistik Perkara Berdasarkan D.IN.11
export interface PerkaraTahap {
  tahap: string;
  jumlah: number;
}

export interface PerkaraStatTahun {
  tahun: number;
  korupsi: {
    lid: number;
    dikKejaksaan: number;
    dikKepolisian: number;
    tut: number;
  };
  narkotika: {
    spdp: number;
    tahap1: number;
    tahap2: number;
    tut: number;
  };
  terorisme: {
    spdp: number;
    tahap1: number;
    tahap2: number;
    tut: number;
  };
  perhatianMasyarakat: {
    spdp: number;
    tahap1: number;
    tahap2: number;
    tut: number;
  };
}

export interface PenkumPerKecamatan {
  kecamatan: KecamatanTabanan;
  penkum: number;
  luhkum: number;
  totalPeserta: number;
}

export interface FilterKegiatanState {
  bidang?: BidangIntelijen | 'SEMUA';
  sektor?: KeteranganSektor | 'SEMUA';
  kecamatan?: KecamatanTabanan | 'SEMUA';
  triwulan?: number | 'SEMUA';
  tahun?: number | 'SEMUA';
  pencarian: string;
}
