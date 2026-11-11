/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Data Service untuk Papan Peta Intelijen Kejaksaan Negeri Tabanan
 * Mendukung Supabase dengan RLS dan fallback offline / mock data store.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { KegiatanPeta, PeneranganHukum, UserProfile, UserRole } from '../types';
import { KECAMATAN_COORDINATES } from '../config/symbols.config';

const STORAGE_KEY_KEGIATAN = 'kejari_tabanan_kegiatan_v1';
const STORAGE_KEY_PENKUM = 'kejari_tabanan_penkum_v1';
const STORAGE_KEY_USER = 'kejari_tabanan_current_user_v1';

// Pengguna default demo untuk testing role
export const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'usr-admin-001',
    email: 'kasi.intel.tabanan@kejaksaan.go.id',
    nama_lengkap: 'I Gusti Ngurah Bagus, S.H., M.H.',
    nip: '197908152003121002',
    jabatan: 'Kepala Seksi Intelijen (Admin Penuh)',
    role: 'admin'
  },
  penginput: {
    id: 'usr-penginput-002',
    email: 'staf.intel.tabanan@kejaksaan.go.id',
    nama_lengkap: 'Ni Putu Ayu Pradnya, S.H.',
    nip: '199204122018012001',
    jabatan: 'Jaksa Fungsional / Operator Papan Data',
    role: 'penginput'
  },
  pembaca: {
    id: 'usr-pembaca-003',
    email: 'pembaca.tamu@kejaksaan.go.id',
    nama_lengkap: 'I Wayan Darmawan, S.H.',
    nip: '198506202010121004',
    jabatan: 'Pemeriksa Intelijen (Hanya Baca)',
    role: 'pembaca'
  }
};

// Seed Data Fiktif Realistis untuk Papan Peta Intelijen
const INITIAL_KEGIATAN: KegiatanPeta[] = [
  {
    id: 'keg-001',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    keterangan_sektor: 'Politik',
    tanggal: '2025-10-15',
    waktu: '09.30 WITA',
    tempat: 'Kantor Camat Kediri, Jl. Raya Kediri-Tanah Lot',
    uraian: 'Bahwa pada hari Rabu, tanggal 15 Oktober 2025, bertempat di Kantor Camat Kediri, Tim Intelijen Kejaksaan Negeri Tabanan telah melakukan pemantauan dan koordinasi terkait kesiapan pengamanan logistik wilayah. Koordinasi berjalan aman dan tertib.',
    poin_tambahan: [
      'Gudang penyimpanan dinilai memenuhi standar keamanan cuaca dan aksesibilitas.',
      'Aparat keamanan gabungan telah menyiapkan pos pemantauan 24 jam.'
    ],
    kecamatan: 'Kediri',
    lat: -8.5724,
    lng: 115.1481,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-10-15T11:00:00Z',
    updated_at: '2025-10-15T11:00:00Z'
  },
  {
    id: 'keg-002',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    keterangan_sektor: 'Pengamanan Sumber Daya Organisasi',
    tanggal: '2025-11-10',
    waktu: '08.00 WITA',
    tempat: 'Halaman Kantor Kejaksaan Negeri Tabanan, Jl. Pahlawan No. 1',
    uraian: 'Bahwa pada hari Senin, tanggal 10 November 2025, bertempat di Kantor Kejari Tabanan, telah dilaksanakan apel integritas internal dan pemeriksaan fisik kelayakan sarana operasional pengamanan intelijen.',
    poin_tambahan: [
      'Seluruh kendaraan dinas dan alat komunikasi taktis diperiksa kondisinya.',
      'Penguatan disiplin personil intelijen dalam menjaga kerahasiaan informasi intelijen yustisial.'
    ],
    kecamatan: 'Tabanan',
    lat: -8.5385,
    lng: 115.1252,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-11-10T09:30:00Z',
    updated_at: '2025-11-10T09:30:00Z'
  },
  {
    id: 'keg-003',
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    keterangan_sektor: 'Pengawasan wilayah teritorial',
    tanggal: '2025-11-28',
    waktu: '14.15 WITA',
    tempat: 'Pesisir Pantai Yeh Gangga, Desa Sudimara',
    uraian: 'Bahwa pada hari Jumat, tanggal 28 November 2025, bertempat di Pesisir Pantai Yeh Gangga Tabanan, petugas intelijen melakukan pemantauan jalur pesisir dan koordinasi bersama kelompok nelayan setempat guna memitigasi penyelundupan logistik ilegal lintas pulau.',
    poin_tambahan: [
      'Situasi perairan dan dermaga rakyat terpantau kondusif tanpa aktivitas mencurigakan.',
      'Disepakati kontak cepat aparat penegak hukum jika ditemukan kapal nelayan asing.'
    ],
    kecamatan: 'Tabanan',
    lat: -8.5680,
    lng: 115.0920,
    created_by: 'usr-penginput-002',
    created_by_name: 'Ni Putu Ayu Pradnya, S.H.',
    created_at: '2025-11-28T16:00:00Z',
    updated_at: '2025-11-28T16:00:00Z'
  },
  {
    id: 'keg-004',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    keterangan_sektor: 'Pengawasan Organisasi masyarakat dan Lembaga swadaya masyarakat',
    tanggal: '2025-09-02',
    waktu: '10.00 WITA',
    tempat: 'Aula Bakesbangpol Kabupaten Tabanan',
    uraian: 'Bahwa pada hari Selasa, tanggal 2 September 2025, bertempat di Kantor Bakesbangpol Tabanan, Seksi Intelijen Kejaksaan Negeri Tabanan menghadiri rapat koordinasi sinkronisasi data kepengurusan dan legalitas formal 18 Ormas dan LSM di Kabupaten Tabanan.',
    poin_tambahan: [
      'Inventarisasi dokumen Surat Keterangan Terdaftar (SKT) dan pelaporan kegiatan tahunan.',
      'Edukasi kepatuhan hukum ormas agar tidak terlibat aksi pungli maupun konflik horizontal.'
    ],
    kecamatan: 'Tabanan',
    lat: -8.5360,
    lng: 115.1220,
    created_by: 'usr-penginput-002',
    created_by_name: 'Ni Putu Ayu Pradnya, S.H.',
    created_at: '2025-09-02T12:00:00Z',
    updated_at: '2025-09-02T12:00:00Z'
  },
  {
    id: 'keg-005',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    keterangan_sektor: 'Ketertiban dan Ketentraman umum',
    tanggal: '2025-12-21',
    waktu: '11.00 WITA',
    tempat: 'Kawasan Wisata Danau Beratan, Desa Candikuning',
    uraian: 'Bahwa pada hari Minggu, tanggal 21 Desember 2025, bertempat di Kawasan DTW Danau Beratan Baturiti, intelijen kejaksaan melakukan monitoring situasi ketertiban wisatawan dan kesiapan rekayasa lalu lintas menjelang libur Natal dan Tahun Baru.',
    poin_tambahan: [
      'Peningkatan koordinasi posko bersama Satpol PP dan Dinas Perhubungan Tabanan.',
      'Kondisi kamtibmas dan toleransi antarwarga di desa wisata berjalan sangat harmonis.'
    ],
    kecamatan: 'Baturiti',
    lat: -8.3358,
    lng: 115.1789,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-12-21T14:00:00Z',
    updated_at: '2025-12-21T14:00:00Z'
  },
  {
    id: 'keg-006',
    bidang: 'Sosial, Budaya dan Kemasyarakatan',
    keterangan_sektor: 'Pengawasan Aliran Kepercayaan dan Keagamaan Dalam Masyarakat',
    tanggal: '2025-08-14',
    waktu: '13.30 WITA',
    tempat: 'Ruang Rapat Utama Kejari Tabanan',
    uraian: 'Bahwa pada hari Kamis, tanggal 14 Agustus 2025, bertempat di Kejari Tabanan, Tim Pengawasan Aliran Kepercayaan dan Aliran Keagamaan Dalam Masyarakat (PAKEM) menyelenggarakan rapat koordinasi evaluasi kerukunan umat beragama bersama FKUB dan Kemenag Tabanan.',
    poin_tambahan: [
      'Tidak terdeteksi adanya ajaran menyimpang atau potensi gesekan antaraliran di 10 kecamatan.',
      'Rekomendasi penguatan kearifan lokal Tri Hita Karana dalam menjaga toleransi masyarakat.'
    ],
    kecamatan: 'Tabanan',
    lat: -8.5385,
    lng: 115.1252,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-08-14T15:30:00Z',
    updated_at: '2025-08-14T15:30:00Z'
  },
  {
    id: 'keg-007',
    bidang: 'Ekonomi dan Keuangan',
    keterangan_sektor: 'Perdagangan',
    tanggal: '2025-09-17',
    waktu: '06.30 WITA',
    tempat: 'Pasar Tradisional Dauh Pala, Jl. Melati',
    uraian: 'Bahwa pada hari Rabu, tanggal 17 September 2025, bertempat di Pasar Dauh Pala Tabanan, Tim Satgas Ketahanan Pangan Kejaksaan Negeri Tabanan bersama Diskoperindag melaksanakan pemantauan rantai pasok dan stabilitas harga bahan pokok penting (Bapokting).',
    poin_tambahan: [
      'Pasokan beras, minyak goreng, dan cabai merah terpantau stabil dalam rentang Harga Eceran Tertinggi (HET).',
      'Tidak ditemukan indikasi penimbunan atau spekulasi komoditas pangan pokok.'
    ],
    kecamatan: 'Tabanan',
    lat: -8.5410,
    lng: 115.1290,
    created_by: 'usr-penginput-002',
    created_by_name: 'Ni Putu Ayu Pradnya, S.H.',
    created_at: '2025-09-17T08:30:00Z',
    updated_at: '2025-09-17T08:30:00Z'
  },
  {
    id: 'keg-008',
    bidang: 'Ekonomi dan Keuangan',
    keterangan_sektor: 'Penelusuran Aset',
    tanggal: '2025-11-06',
    waktu: '10.30 WITA',
    tempat: 'Kantor Desa Kukuh, Kecamatan Kerambitan',
    uraian: 'Bahwa pada hari Kamis, tanggal 6 November 2025, bertempat di wilayah Desa Kukuh Kerambitan, Tim Intelijen melakukan penelusuran aset dan pencocokan buku register pertanahan terkait aset barang bukti pemulihan kerugian keuangan negara.',
    poin_tambahan: [
      'Identifikasi fisik tanah darat seluas 1.250 m² berlangsung lancar didampingi aparat desa.',
      'Data kepemilikan telah dicocokkan dengan basis data kantor pertanahan BPN Tabanan.'
    ],
    kecamatan: 'Kerambitan',
    lat: -8.5458,
    lng: 115.0805,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-11-06T12:00:00Z',
    updated_at: '2025-11-06T12:00:00Z'
  },
  {
    id: 'keg-009',
    bidang: 'Pengamanan dan Pembangunan Strategis',
    keterangan_sektor: 'Sektor lainnya',
    tanggal: '2025-10-21',
    waktu: '13.00 WITA',
    tempat: 'Lokasi Proyek Infrastruktur Jembatan Desa Marga Dajan Puri',
    uraian: 'Bahwa pada hari Selasa, tanggal 21 Oktober 2025, bertempat di Desa Marga Dajan Puri, Tim Pengamanan Pembangunan Strategis (PPS) Kejaksaan Negeri Tabanan melakukan peninjauan lapangan atas progres pekerjaan rekonstruksi jembatan penghubung antar-kecamatan.',
    poin_tambahan: [
      'Realisasi fisik konstruksi jembatan mencapai 82,4% dengan deviasi positif 2,1%.',
      'Tim memberikan arahan yuridis preventif guna mengantisipasi keterlambatan akibat cuaca hujan.'
    ],
    kecamatan: 'Marga',
    lat: -8.4852,
    lng: 115.1853,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-10-21T15:30:00Z',
    updated_at: '2025-10-21T15:30:00Z'
  },
  {
    id: 'keg-010',
    bidang: 'Teknologi Informasi dan Produksi Intelijen',
    keterangan_sektor: 'Produksi Intelijen',
    tanggal: '2025-12-08',
    waktu: '11.00 WITA',
    tempat: 'Ruang Sandi Intelijen Kejari Tabanan',
    uraian: 'Bahwa pada hari Senin, tanggal 8 Desember 2025, Seksi Intelijen Kejaksaan Negeri Tabanan telah merampungkan penyusunan Telaahan Intelijen (Telintel) dan Laporan Informasi Khusus terkait pemetaan tata kelola penyaluran pupuk bersubsidi sektor hortikultura di Kecamatan Pupuan.',
    poin_tambahan: [
      'Dokumen produk intelijen dikirimkan secara tertutup kepada Pimpinan Kejaksaan Tinggi Bali.',
      'Rekomendasi pencegahan kebocoran kuota pupuk pada kelompok tani terdaftar.'
    ],
    kecamatan: 'Pupuan',
    lat: -8.3551,
    lng: 115.0152,
    created_by: 'usr-admin-001',
    created_by_name: 'I Gusti Ngurah Bagus, S.H., M.H.',
    created_at: '2025-12-08T13:00:00Z',
    updated_at: '2025-12-08T13:00:00Z'
  }
];

const INITIAL_PENKUM: PeneranganHukum[] = [
  {
    id: 'ph-001',
    jenis: 'Penkum',
    triwulan: 1,
    tahun: 2025,
    tema: ['Pencegahan Tindak Pidana Korupsi dalam Pengelolaan Alokasi Dana Desa (ADD)'],
    tanggal: '2025-02-18',
    tempat: 'Aula Kantor Camat Penebel',
    kecamatan: 'Penebel',
    jumlah_peserta: 85,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80', keterangan: 'Pemaparan materi oleh Jaksa Narasumber kepada Kepala Desa' },
      { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', keterangan: 'Sesi tanya jawab pengelolaan keuangan desa' }
    ]
  },
  {
    id: 'ph-002',
    jenis: 'Luhkum',
    triwulan: 1,
    tahun: 2025,
    tema: ['Program Jaksa Masuk Sekolah (JMS) - Bahaya Narkotika & Cyberbullying'],
    tanggal: '2025-03-05',
    tempat: 'Aula SMAN 1 Tabanan',
    kecamatan: 'Tabanan',
    jumlah_peserta: 150,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80', keterangan: 'Antusiasme siswa SMA Negeri 1 Tabanan mengikuti materi hukum' }
    ]
  },
  {
    id: 'ph-003',
    jenis: 'Penkum',
    triwulan: 2,
    tahun: 2025,
    tema: ['Ketaatan Regulasi Pengadaan Barang dan Jasa Pemerintah Daerah'],
    tanggal: '2025-05-14',
    tempat: 'Gedung Kesenian I Ketut Maria Tabanan',
    kecamatan: 'Tabanan',
    jumlah_peserta: 110,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80', keterangan: 'Penerangan hukum kepada Pejabat Pembuat Komitmen (PPK) Pemkab Tabanan' }
    ]
  },
  {
    id: 'ph-004',
    jenis: 'Luhkum',
    triwulan: 2,
    tahun: 2025,
    tema: ['Jaksa Sahabat Guru - Penguatan Perlindungan Hukum Tenaga Pendidik'],
    tanggal: '2025-06-11',
    tempat: 'Aula Dinas Pendidikan Tabanan',
    kecamatan: 'Kediri',
    jumlah_peserta: 95,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80', keterangan: 'Dialog hukum interaktif bersama para kepala sekolah se-Kabupaten Tabanan' }
    ]
  },
  {
    id: 'ph-005',
    jenis: 'Penkum',
    triwulan: 3,
    tahun: 2025,
    tema: ['Penguatan Tata Kelola Usaha dan Transparansi BUMDes'],
    tanggal: '2025-08-20',
    tempat: 'Aula Desa Candikuning, Baturiti',
    kecamatan: 'Baturiti',
    jumlah_peserta: 75,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80', keterangan: 'Sosialisasi mitigasi risiko tindak pidana korupsi pada unit BUMDes' }
    ]
  },
  {
    id: 'ph-006',
    jenis: 'Luhkum',
    triwulan: 3,
    tahun: 2025,
    tema: ['Jaksa Menyapa - Perlindungan Konsumen & Bahaya Judi Online'],
    tanggal: '2025-09-09',
    tempat: 'Studio Siaran LPP Radio Suara Tabanan',
    kecamatan: 'Tabanan',
    jumlah_peserta: 250,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', keterangan: 'Siaran langsung interaktif Jaksa Menyapa via frekuensi radio dan media sosial' }
    ]
  },
  {
    id: 'ph-007',
    jenis: 'Penkum',
    triwulan: 4,
    tahun: 2025,
    tema: ['Pendampingan Yuridis Pengamanan Pembangunan Strategis'],
    tanggal: '2025-11-12',
    tempat: 'Ruang Rapat Dinas PUPRPKP Kabupaten Tabanan',
    kecamatan: 'Tabanan',
    jumlah_peserta: 60,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80', keterangan: 'Penerangan hukum pengawasan proyek strategis daerah tahun anggaran 2025' }
    ]
  },
  {
    id: 'ph-008',
    jenis: 'Luhkum',
    triwulan: 4,
    tahun: 2025,
    tema: ['Sosialisasi Keadilan Restoratif (Restorative Justice) di Rumah RJ'],
    tanggal: '2025-12-04',
    tempat: 'Rumah Restorative Justice Desa Sudimara',
    kecamatan: 'Tabanan',
    jumlah_peserta: 120,
    target: 1,
    foto_urls: [
      { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', keterangan: 'Penyuluhan penyelesaian perkara ringan melalui pendekatan damai kearifan lokal' }
    ]
  }
];

class DataService {
  // Session / User saat ini
  getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return DEMO_USERS.admin; // Default demo: Admin Kejari Tabanan
  }

  setCurrentUser(role: UserRole): UserProfile {
    const user = DEMO_USERS[role];
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  }

  // =========================================================================
  // KEGIATAN PETA (SIADIBIBAM D.IN.1 s.d. D.IN.6)
  // =========================================================================
  async getKegiatanList(): Promise<KegiatanPeta[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('kegiatan_peta')
          .select('*')
          .order('tanggal', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as KegiatanPeta[];
        }
      } catch (err) {
        console.warn('Supabase fetch error, fallback ke penyimpanan lokal:', err);
      }
    }

    // Local / In-memory storage
    try {
      const local = localStorage.getItem(STORAGE_KEY_KEGIATAN);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      // ignore
    }
    // Set seed
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(INITIAL_KEGIATAN));
    return INITIAL_KEGIATAN;
  }

  async saveKegiatan(kegiatan: Omit<KegiatanPeta, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<KegiatanPeta> {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    // Default koordinat jika belum diisi: ambil dari kecamatan
    let lat = kegiatan.lat;
    let lng = kegiatan.lng;
    if ((lat === undefined || lng === undefined) && kegiatan.kecamatan) {
      const coords = KECAMATAN_COORDINATES[kegiatan.kecamatan];
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    // Pastikan narasi diawali dengan kata "Bahwa"
    let uraian = kegiatan.uraian.trim();
    if (!uraian.toLowerCase().startsWith('bahwa')) {
      uraian = 'Bahwa ' + uraian;
    }

    const payload: KegiatanPeta = {
      id: kegiatan.id || `keg-${Date.now()}`,
      bidang: kegiatan.bidang,
      keterangan_sektor: kegiatan.keterangan_sektor,
      tanggal: kegiatan.tanggal,
      waktu: kegiatan.waktu,
      tempat: kegiatan.tempat,
      uraian: uraian,
      poin_tambahan: kegiatan.poin_tambahan || [],
      kecamatan: kegiatan.kecamatan,
      lat: lat,
      lng: lng,
      created_by: kegiatan.id ? (kegiatan as any).created_by || currentUser.id : currentUser.id,
      created_by_name: currentUser.nama_lengkap,
      created_at: (kegiatan as any).created_at || now,
      updated_at: now
    };

    if (isSupabaseConfigured && supabase) {
      try {
        if (kegiatan.id) {
          const { data, error } = await supabase
            .from('kegiatan_peta')
            .update({
              bidang: payload.bidang,
              keterangan_sektor: payload.keterangan_sektor,
              tanggal: payload.tanggal,
              waktu: payload.waktu,
              tempat: payload.tempat,
              uraian: payload.uraian,
              poin_tambahan: payload.poin_tambahan,
              kecamatan: payload.kecamatan,
              lat: payload.lat,
              lng: payload.lng,
              updated_at: now
            })
            .eq('id', kegiatan.id)
            .select()
            .single();
          if (!error && data) return data as KegiatanPeta;
        } else {
          const { data, error } = await supabase
            .from('kegiatan_peta')
            .insert([{
              bidang: payload.bidang,
              keterangan_sektor: payload.keterangan_sektor,
              tanggal: payload.tanggal,
              waktu: payload.waktu,
              tempat: payload.tempat,
              uraian: payload.uraian,
              poin_tambahan: payload.poin_tambahan,
              kecamatan: payload.kecamatan,
              lat: payload.lat,
              lng: payload.lng,
              created_by: currentUser.id
            }])
            .select()
            .single();
          if (!error && data) return data as KegiatanPeta;
        }
      } catch (err) {
        console.warn('Supabase save error, fallback ke local:', err);
      }
    }

    // Local storage fallback
    const list = await this.getKegiatanList();
    const index = list.findIndex(k => k.id === payload.id);
    if (index >= 0) {
      list[index] = payload;
    } else {
      list.unshift(payload);
    }
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(list));
    return payload;
  }

  async deleteKegiatan(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('kegiatan_peta').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    const list = await this.getKegiatanList();
    const filtered = list.filter(k => k.id !== id);
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(filtered));
    return true;
  }

  // =========================================================================
  // PENERANGAN DAN PENYULUHAN HUKUM (D.IN.7 s.d. D.IN.8)
  // =========================================================================
  async getPeneranganHukumList(): Promise<PeneranganHukum[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('penerangan_hukum')
          .select('*')
          .order('tanggal', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as PeneranganHukum[];
        }
      } catch (err) {
        console.warn('Supabase Penkum fetch error, fallback ke local:', err);
      }
    }

    try {
      const local = localStorage.getItem(STORAGE_KEY_PENKUM);
      if (local) return JSON.parse(local);
    } catch (e) {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY_PENKUM, JSON.stringify(INITIAL_PENKUM));
    return INITIAL_PENKUM;
  }

  async savePeneranganHukum(penkum: Omit<PeneranganHukum, 'id' | 'created_at'> & { id?: string }): Promise<PeneranganHukum> {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    const payload: PeneranganHukum = {
      id: penkum.id || `ph-${Date.now()}`,
      jenis: penkum.jenis,
      triwulan: penkum.triwulan,
      tahun: penkum.tahun,
      tema: penkum.tema,
      tanggal: penkum.tanggal,
      tempat: penkum.tempat,
      kecamatan: penkum.kecamatan,
      jumlah_peserta: penkum.jumlah_peserta,
      target: penkum.target || 1,
      foto_urls: penkum.foto_urls || [],
      created_by: currentUser.id,
      created_at: now
    };

    if (isSupabaseConfigured && supabase) {
      try {
        if (penkum.id) {
          const { data, error } = await supabase
            .from('penerangan_hukum')
            .update(payload)
            .eq('id', penkum.id)
            .select()
            .single();
          if (!error && data) return data as PeneranganHukum;
        } else {
          const { data, error } = await supabase
            .from('penerangan_hukum')
            .insert([payload])
            .select()
            .single();
          if (!error && data) return data as PeneranganHukum;
        }
      } catch (err) {
        console.warn('Supabase save penkum error:', err);
      }
    }

    const list = await this.getPeneranganHukumList();
    const index = list.findIndex(p => p.id === payload.id);
    if (index >= 0) {
      list[index] = payload;
    } else {
      list.unshift(payload);
    }
    localStorage.setItem(STORAGE_KEY_PENKUM, JSON.stringify(list));
    return payload;
  }

  async deletePeneranganHukum(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('penerangan_hukum').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete penkum error:', err);
      }
    }
    const list = await this.getPeneranganHukumList();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PENKUM, JSON.stringify(filtered));
    return true;
  }

  // Reset database lokal ke kondisi awal
  resetLocalData(): void {
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(INITIAL_KEGIATAN));
    localStorage.setItem(STORAGE_KEY_PENKUM, JSON.stringify(INITIAL_PENKUM));
  }
}

export const dataService = new DataService();
