/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Helper pemformatan Bahasa Indonesia & Generator Kalimat Narasi Intelijen
 */

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

/**
 * Format tanggal lengkap ke Bahasa Indonesia: "Selasa, 23 Desember 2025"
 */
export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hari = NAMA_HARI[d.getDay()];
    const tanggal = d.getDate();
    const bulan = NAMA_BULAN[d.getMonth()];
    const tahun = d.getFullYear();
    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
  } catch {
    return dateStr;
  }
}

/**
 * Mengambil nama hari saja: "Senin", "Selasa", dll.
 */
export function getNamaHariIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return NAMA_HARI[d.getDay()];
  } catch {
    return '';
  }
}

/**
 * Menghitung triwulan (1 s.d. 4) dari tanggal
 */
export function getTriwulan(dateStr: string): 1 | 2 | 3 | 4 {
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1; // 1-12
    if (month <= 3) return 1;
    if (month <= 6) return 2;
    if (month <= 9) return 3;
    return 4;
  } catch {
    return 1;
  }
}

/**
 * Otomatisasi draf kalimat narasi intelijen berstandar Kejaksaan RI:
 * "Bahwa pada hari [Hari], tanggal [Tanggal Bulan Tahun], bertempat di [Tempat], telah ..."
 */
export function generateDraftUraian(params: {
  tanggal: string;
  waktu?: string;
  tempat: string;
  sektor: string;
  kecamatan?: string;
  subjek?: string;
}): string {
  const { tanggal, tempat, sektor, kecamatan, subjek } = params;
  const d = tanggal ? new Date(tanggal) : new Date();
  const hari = isNaN(d.getTime()) ? 'Senin' : NAMA_HARI[d.getDay()];
  const tgl = isNaN(d.getTime()) ? 1 : d.getDate();
  const bln = isNaN(d.getTime()) ? 'Januari' : NAMA_BULAN[d.getMonth()];
  const thn = isNaN(d.getTime()) ? 2025 : d.getFullYear();

  const formattedDate = `${tgl} ${bln} ${thn}`;
  const lok = tempat || (kecamatan ? `Kecamatan ${kecamatan}, Kabupaten Tabanan` : 'Kabupaten Tabanan');
  const aktivitas = subjek
    ? subjek
    : `telah dilaksanakan kegiatan pemantauan dan pengumpulan bahan keterangan terkait sektor ${sektor}`;

  return `Bahwa pada hari ${hari}, tanggal ${formattedDate}, bertempat di ${lok}, Tim Intelijen Kejaksaan Negeri Tabanan ${aktivitas}. Situasi dan kondisi berlangsung tertib, aman, dan kondusif.`;
}

/**
 * Format angka ribuan dengan pemisah titik
 */
export function formatAngka(num: number): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}
