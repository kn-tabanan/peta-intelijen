/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Konfigurasi Pemetaan Simbol Sektor Intelijen Kejaksaan Negeri Tabanan
 * Sesuai Standar Format D.IN.1 s.d. D.IN.6 Papan Peta Intelijen Kejaksaan RI
 */

export type BidangIntelijen =
  | 'Ideologi, Politik, Pertahanan dan Keamanan'
  | 'Sosial, Budaya dan Kemasyarakatan'
  | 'Ekonomi dan Keuangan'
  | 'Pengamanan dan Pembangunan Strategis'
  | 'Teknologi Informasi dan Produksi Intelijen';

export type SlideKodeBidang = 'D.IN.1' | 'D.IN.3' | 'D.IN.4' | 'D.IN.5' | 'D.IN.6';

export interface BidangMetadata {
  id: BidangIntelijen;
  kodeSlide: SlideKodeBidang;
  judulPapan: string;
  deskripsi: string;
  sektorList: KeteranganSektor[];
  warnaAksen: string;
}

export type KeteranganSektor =
  // Ideologi, Politik, Pertahanan dan Keamanan (D.IN.1)
  | 'Politik'
  | 'Pengamanan Sumber Daya Organisasi'
  | 'Pengawasan wilayah teritorial'
  // Sosial, Budaya dan Kemasyarakatan (D.IN.3)
  | 'Pengawasan Organisasi masyarakat dan Lembaga swadaya masyarakat'
  | 'Ketertiban dan Ketentraman umum'
  | 'Pencegahan Konflik Sosial'
  | 'Pengawasan Aliran Kepercayaan dan Keagamaan Dalam Masyarakat'
  // Ekonomi dan Keuangan (D.IN.4)
  | 'Perdagangan'
  | 'Penelusuran Aset'
  | 'Moneter'
  // Pengamanan dan Pembangunan Strategis (D.IN.5)
  | 'Sektor lainnya'
  // Teknologi Informasi dan Produksi Intelijen (D.IN.6)
  | 'Produksi Intelijen';

export interface SektorConfig {
  keterangan: KeteranganSektor;
  bidang: BidangIntelijen;
  slug: string;
  fileName: string; // File yang dicari di /public/symbols/{fileName}
  labelPendek: string;
  kodeHuruf: string;
  warnaBadge: string;
  warnaTeks: string;
  warnaBorder: string;
  bgHex: string;
  svgIconPath: string; // Path SVG untuk placeholder ikonik
}

export const BIDANG_CONFIG: Record<BidangIntelijen, BidangMetadata> = {
  'Ideologi, Politik, Pertahanan dan Keamanan': {
    id: 'Ideologi, Politik, Pertahanan dan Keamanan',
    kodeSlide: 'D.IN.1',
    judulPapan: 'BIDANG IDEOLOGI, POLITIK, PERTAHANAN DAN KEAMANAN',
    deskripsi: 'Peta permasalahan ideologi, politik, ormas politik, serta pertahanan dan keamanan wilayah Kabupaten Tabanan.',
    warnaAksen: '#8DC21F',
    sektorList: [
      'Politik',
      'Pengamanan Sumber Daya Organisasi',
      'Pengawasan wilayah teritorial'
    ]
  },
  'Sosial, Budaya dan Kemasyarakatan': {
    id: 'Sosial, Budaya dan Kemasyarakatan',
    kodeSlide: 'D.IN.3',
    judulPapan: 'BIDANG SOSIAL, BUDAYA DAN KEMASYARAKATAN',
    deskripsi: 'Peta dinamika ormas, LSM, ketertiban umum, pencegahan konflik horizontal, serta aliran kepercayaan/keagamaan.',
    warnaAksen: '#38BDF8',
    sektorList: [
      'Pengawasan Organisasi masyarakat dan Lembaga swadaya masyarakat',
      'Ketertiban dan Ketentraman umum',
      'Pencegahan Konflik Sosial',
      'Pengawasan Aliran Kepercayaan dan Keagamaan Dalam Masyarakat'
    ]
  },
  'Ekonomi dan Keuangan': {
    id: 'Ekonomi dan Keuangan',
    kodeSlide: 'D.IN.4',
    judulPapan: 'BIDANG EKONOMI DAN KEUANGAN',
    deskripsi: 'Peta pemantauan inflasi, perdagangan, distribusi bahan pokok, pelacakan aset hasil tindak pidana, serta moneter perbankan.',
    warnaAksen: '#F59E0B',
    sektorList: [
      'Perdagangan',
      'Penelusuran Aset',
      'Moneter'
    ]
  },
  'Pengamanan dan Pembangunan Strategis': {
    id: 'Pengamanan dan Pembangunan Strategis',
    kodeSlide: 'D.IN.5',
    judulPapan: 'BIDANG PENGAMANAN DAN PEMBANGUNAN STRATEGIS (PPS)',
    deskripsi: 'Pengawalan dan pengamanan proyek strategis daerah (PSD) dan proyek vital nasional di wilayah Tabanan.',
    warnaAksen: '#EC4899',
    sektorList: [
      'Sektor lainnya'
    ]
  },
  'Teknologi Informasi dan Produksi Intelijen': {
    id: 'Teknologi Informasi dan Produksi Intelijen',
    kodeSlide: 'D.IN.6',
    judulPapan: 'BIDANG TEKNOLOGI INFORMASI DAN PRODUKSI INTELIJEN',
    deskripsi: 'Pemantauan ruang siber, media sosial, disinformasi/hoaks, serta produk intelijen berkala Kejaksaan.',
    warnaAksen: '#A855F7',
    sektorList: [
      'Produksi Intelijen'
    ]
  }
};

export const SEKTOREN_CONFIG: Record<KeteranganSektor, SektorConfig> = {
  'Politik': {
    keterangan: 'Politik',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    slug: 'politik',
    fileName: 'politik.png',
    labelPendek: 'POLITIK',
    kodeHuruf: 'POL',
    warnaBadge: 'bg-red-950/80 text-red-300 border-red-500/50',
    warnaTeks: '#EF4444',
    warnaBorder: '#DC2626',
    bgHex: '#3B1818',
    svgIconPath: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9'
  },
  'Pengamanan Sumber Daya Organisasi': {
    keterangan: 'Pengamanan Sumber Daya Organisasi',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    slug: 'pengamanan-sumber-daya-organisasi',
    fileName: 'pengamanan-sumber-daya-organisasi.png',
    labelPendek: 'PAM SDO',
    kodeHuruf: 'SDO',
    warnaBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    warnaTeks: '#10B981',
    warnaBorder: '#059669',
    bgHex: '#133526',
    svgIconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
  'Pengawasan wilayah teritorial': {
    keterangan: 'Pengawasan wilayah teritorial',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    slug: 'pengawasan-wilayah-teritorial',
    fileName: 'pengawasan-wilayah-teritorial.png',
    labelPendek: 'TERITORIAL',
    kodeHuruf: 'TER',
    warnaBadge: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    warnaTeks: '#3B82F6',
    warnaBorder: '#2563EB',
    bgHex: '#172744',
    svgIconPath: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
  },
  'Pengawasan Organisasi masyarakat dan Lembaga swadaya masyarakat': {
    keterangan: 'Pengawasan Organisasi masyarakat dan Lembaga swadaya masyarakat',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    slug: 'pengawasan-ormas-lsm',
    fileName: 'pengawasan-ormas-lsm.png',
    labelPendek: 'WAS ORMAS/LSM',
    kodeHuruf: 'ORM',
    warnaBadge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
    warnaTeks: '#06B6D4',
    warnaBorder: '#0891B2',
    bgHex: '#14313B',
    svgIconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
  },
  'Ketertiban dan Ketentraman umum': {
    keterangan: 'Ketertiban dan Ketentraman umum',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    slug: 'ketertiban-dan-ketentraman-umum',
    fileName: 'ketertiban-dan-ketentraman-umum.png',
    labelPendek: 'TIBUM/TRANUM',
    kodeHuruf: 'TIB',
    warnaBadge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    warnaTeks: '#F59E0B',
    warnaBorder: '#D97706',
    bgHex: '#382613',
    svgIconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  },
  'Pencegahan Konflik Sosial': {
    keterangan: 'Pencegahan Konflik Sosial',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    slug: 'pencegahan-konflik-sosial',
    fileName: 'pencegahan-konflik-sosial.png',
    labelPendek: 'CEGAH KONFLIK',
    kodeHuruf: 'KFL',
    warnaBadge: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
    warnaTeks: '#FB923C',
    warnaBorder: '#EA580C',
    bgHex: '#392116',
    svgIconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
  },
  'Pengawasan Aliran Kepercayaan dan Keagamaan Dalam Masyarakat': {
    keterangan: 'Pengawasan Aliran Kepercayaan dan Keagamaan Dalam Masyarakat',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    slug: 'pengawasan-aliran-kepercayaan-dan-keagamaan',
    fileName: 'pengawasan-aliran-kepercayaan-dan-keagamaan.png',
    labelPendek: 'PAKEM',
    kodeHuruf: 'PKM',
    warnaBadge: 'bg-teal-950/80 text-teal-300 border-teal-500/50',
    warnaTeks: '#14B8A6',
    warnaBorder: '#0D9488',
    bgHex: '#12332E',
    svgIconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  'Perdagangan': {
    keterangan: 'Perdagangan',
    bidang: 'Ekonomi dan Keuangan',
    slug: 'perdagangan',
    fileName: 'perdagangan.png',
    labelPendek: 'PERDAGANGAN',
    kodeHuruf: 'DAG',
    warnaBadge: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50',
    warnaTeks: '#EAB308',
    warnaBorder: '#CA8A04',
    bgHex: '#342D13',
    svgIconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
  },
  'Penelusuran Aset': {
    keterangan: 'Penelusuran Aset',
    bidang: 'Ekonomi dan Keuangan',
    slug: 'penelusuran-aset',
    fileName: 'penelusuran-aset.png',
    labelPendek: 'TELUSUR ASET',
    kodeHuruf: 'AST',
    warnaBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    warnaTeks: '#10B981',
    warnaBorder: '#059669',
    bgHex: '#143525',
    svgIconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7'
  },
  'Moneter': {
    keterangan: 'Moneter',
    bidang: 'Ekonomi dan Keuangan',
    slug: 'moneter',
    fileName: 'moneter.png',
    labelPendek: 'MONETER',
    kodeHuruf: 'MNT',
    warnaBadge: 'bg-lime-950/80 text-lime-300 border-lime-500/50',
    warnaTeks: '#84CC16',
    warnaBorder: '#65A30D',
    bgHex: '#253512',
    svgIconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  'Sektor lainnya': {
    keterangan: 'Sektor lainnya',
    bidang: 'Pengamanan dan Pembangunan Strategis',
    slug: 'sektor-lainnya',
    fileName: 'sektor-lainnya.png',
    labelPendek: 'PPS LAINNYA',
    kodeHuruf: 'PPS',
    warnaBadge: 'bg-pink-950/80 text-pink-300 border-pink-500/50',
    warnaTeks: '#F472B6',
    warnaBorder: '#DB2777',
    bgHex: '#381627',
    svgIconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  },
  'Produksi Intelijen': {
    keterangan: 'Produksi Intelijen',
    bidang: 'Teknologi Informasi dan Produksi Intelijen',
    slug: 'produksi-intelijen',
    fileName: 'produksi-intelijen.png',
    labelPendek: 'PROD INTEL',
    kodeHuruf: 'PRD',
    warnaBadge: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    warnaTeks: '#C084FC',
    warnaBorder: '#9333EA',
    bgHex: '#2F1A3F',
    svgIconPath: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
  }
};

export const KECAMATAN_TABANAN = [
  'Selemadeg Barat',
  'Selemadeg',
  'Selemadeg Timur',
  'Kerambitan',
  'Tabanan',
  'Kediri',
  'Marga',
  'Penebel',
  'Baturiti',
  'Pupuan'
] as const;

export type KecamatanTabanan = (typeof KECAMATAN_TABANAN)[number];

export interface KecamatanCoordinate {
  nama: KecamatanTabanan;
  lat: number;
  lng: number;
  kodePos: string;
  kantorCamat: string;
}

export const KECAMATAN_COORDINATES: Record<KecamatanTabanan, KecamatanCoordinate> = {
  'Selemadeg Barat': {
    nama: 'Selemadeg Barat',
    lat: -8.4682,
    lng: 114.9785,
    kodePos: '82162',
    kantorCamat: 'Jl. Denpasar-Gilimanuk, Surabrata'
  },
  'Selemadeg': {
    nama: 'Selemadeg',
    lat: -8.4951,
    lng: 115.0253,
    kodePos: '82162',
    kantorCamat: 'Jl. Raya Bajera, Selemadeg'
  },
  'Selemadeg Timur': {
    nama: 'Selemadeg Timur',
    lat: -8.5255,
    lng: 115.0754,
    kodePos: '82162',
    kantorCamat: 'Megati, Selemadeg Timur'
  },
  'Kerambitan': {
    nama: 'Kerambitan',
    lat: -8.5458,
    lng: 115.0805,
    kodePos: '82161',
    kantorCamat: 'Jl. Raya Kerambitan'
  },
  'Tabanan': {
    nama: 'Tabanan',
    lat: -8.5385,
    lng: 115.1252,
    kodePos: '82111',
    kantorCamat: 'Jl. Pahlawan No. 1, Kota Tabanan (Kejari Tabanan)'
  },
  'Kediri': {
    nama: 'Kediri',
    lat: -8.5724,
    lng: 115.1481,
    kodePos: '82121',
    kantorCamat: 'Jl. Raya Kediri-Tanah Lot'
  },
  'Marga': {
    nama: 'Marga',
    lat: -8.4852,
    lng: 115.1853,
    kodePos: '82181',
    kantorCamat: 'Jl. Wisnu Marga (Taman Makam Margarana)'
  },
  'Penebel': {
    nama: 'Penebel',
    lat: -8.4452,
    lng: 115.1425,
    kodePos: '82152',
    kantorCamat: 'Penebel (Jatiluwih)'
  },
  'Baturiti': {
    nama: 'Baturiti',
    lat: -8.3358,
    lng: 115.1789,
    kodePos: '82191',
    kantorCamat: 'Jl. Raya Denpasar-Singaraja, Bedugul'
  },
  'Pupuan': {
    nama: 'Pupuan',
    lat: -8.3551,
    lng: 115.0152,
    kodePos: '82163',
    kantorCamat: 'Jl. Raya Pupuan'
  }
};
