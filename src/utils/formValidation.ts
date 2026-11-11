/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Validasi Form dengan Zod
 */

import { z } from 'zod';
import { KECAMATAN_TABANAN } from '../config/symbols.config';

export const kegiatanFormSchema = z.object({
  bidang: z.enum([
    'Ideologi, Politik, Pertahanan dan Keamanan',
    'Sosial, Budaya dan Kemasyarakatan',
    'Ekonomi dan Keuangan',
    'Pengamanan dan Pembangunan Strategis',
    'Teknologi Informasi dan Produksi Intelijen'
  ] as const, { message: 'Bidang intelijen wajib dipilih' }),

  keterangan_sektor: z.string().min(1, 'Keterangan sektor wajib dipilih'),

  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),

  waktu: z.string().min(2, 'Waktu pelaksanaan wajib diisi (contoh: 09.00 WITA)'),

  tempat: z.string().min(3, 'Lokasi / Tempat kegiatan wajib diisi'),

  uraian: z.string()
    .min(10, 'Uraian narasi intelijen minimal 10 karakter')
    .refine((val) => val.trim().toLowerCase().startsWith('bahwa'), {
      message: 'Uraian narasi intelijen standar Kejaksaan wajib diawali dengan kata "Bahwa..."'
    }),

  poin_tambahan: z.array(z.string()).default([]),

  kecamatan: z.enum(KECAMATAN_TABANAN, {
    message: 'Kecamatan harus salah satu dari 10 kecamatan Kabupaten Tabanan'
  }),

  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable()
});

export type KegiatanFormData = z.infer<typeof kegiatanFormSchema>;

export const penkumFormSchema = z.object({
  jenis: z.enum(['Penkum', 'Luhkum'], {
    message: 'Pilih jenis: Penkum (Penerangan Hukum) atau Luhkum (Penyuluhan Hukum)'
  }),
  triwulan: z.number().int().min(1).max(4, 'Triwulan bernilai 1 s.d. 4'),
  tahun: z.number().int().min(2020, 'Tahun minimal 2020').max(2030, 'Tahun maksimal 2030'),
  tema: z.array(z.string()).min(1, 'Minimal satu tema/materi hukum harus diisi'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  tempat: z.string().min(3, 'Lokasi kegiatan wajib diisi'),
  kecamatan: z.enum(KECAMATAN_TABANAN, {
    message: 'Pilih salah satu dari 10 kecamatan Tabanan'
  }),
  jumlah_peserta: z.number().int().min(0, 'Jumlah peserta tidak boleh negatif'),
  target: z.number().int().min(1, 'Target kegiatan minimal 1')
});

export type PenkumFormData = z.infer<typeof penkumFormSchema>;
