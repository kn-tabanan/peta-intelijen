/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Grafik Rekapitulasi Perkara Kejaksaan Negeri Tabanan (Slide D.IN.11)
 * Terhubung ke CMS Publik Kejaksaan RI (Satker 22.08.00)
 * Endpoint: https://cms-publik.kejaksaan.go.id/api/pidum/filtered?tahun=2026&satker=22.08.00
 * Dilengkapi proteksi Anti-Downtime, Caching, Health Check, dan Tabel Register Kasus Nyata
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PerkaraStatTahun, PenkumPerKecamatan, PeneranganHukum } from '../types';
import {
  getPerkaraProvider,
  CmsStatusInfo,
  CmsCaseItem
} from '../services/perkaraProvider';
import { KECAMATAN_TABANAN, KecamatanTabanan } from '../config/symbols.config';
import {
  ShieldAlert,
  Scale,
  RefreshCw,
  Info,
  Database,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Table as TableIcon,
  BarChart3,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatTanggalIndonesia } from '../utils/formatters';

interface GrafikPerkaraProps {
  penkumList?: PeneranganHukum[];
}

export const GrafikPerkara: React.FC<GrafikPerkaraProps> = ({ penkumList = [] }) => {
  const [activeTab, setActiveTab] = useState<'grafik' | 'register'>('grafik');
  const [perkaraData, setPerkaraData] = useState<PerkaraStatTahun[]>([]);
  const [kecamatanData, setKecamatanData] = useState<PenkumPerKecamatan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [healthChecking, setHealthChecking] = useState<boolean>(false);
  const [sumberDataKecamatan, setSumberDataKecamatan] = useState<'aplikasi' | 'rekap'>('aplikasi');
  const [tahunFilter, setTahunFilter] = useState<{ mulai: number; selesai: number }>({
    mulai: 2023,
    selesai: 2026
  });

  // Status integrasi CMS
  const [cmsStatus, setCmsStatus] = useState<CmsStatusInfo>({
    source: 'cached_cms',
    isDown: false,
    message: 'Memuat data...',
    satker: '22.08.00',
    satkerName: 'Kejaksaan Negeri Tabanan',
    totalCases: 242
  });

  // Data Kasus Register Nyata CMS Tabanan
  const [caseList, setCaseList] = useState<CmsCaseItem[]>([]);
  const [caseSearch, setCaseSearch] = useState<string>('');
  const [caseKecamatanFilter, setCaseKecamatanFilter] = useState<string>('SEMUA');
  const [caseLoading, setCaseLoading] = useState<boolean>(false);
  const [totalCasesCount, setTotalCasesCount] = useState<number>(242);

  // Health feedback
  const [healthResult, setHealthResult] = useState<{ online: boolean; latencyMs: number; message: string } | null>(null);

  const provider = useMemo(() => getPerkaraProvider(), []);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [resPerkara, kec] = await Promise.all([
        provider.getPerkara(tahunFilter.mulai, tahunFilter.selesai, forceRefresh),
        provider.getPenkumKecamatan()
      ]);

      setPerkaraData(resPerkara.data);
      setCmsStatus(resPerkara.statusInfo);
      setKecamatanData(kec);
    } catch (err) {
      console.error('Gagal memuat data perkara:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    setCaseLoading(true);
    try {
      const res = await provider.getCases({
        q: caseSearch,
        kecamatan: caseKecamatanFilter,
        limit: 100
      });
      setCaseList(res.cases);
      setTotalCasesCount(res.total);
    } catch (err) {
      console.error('Gagal memuat register kasus:', err);
    } finally {
      setCaseLoading(false);
    }
  };

  const handleTestHealth = async () => {
    setHealthChecking(true);
    try {
      const res = await provider.checkHealth();
      setHealthResult(res);
      if (res.online) {
        // Refresh data jika ternyata server sudah pulih online
        loadData(true);
      }
    } finally {
      setHealthChecking(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tahunFilter.mulai, tahunFilter.selesai]);

  useEffect(() => {
    if (activeTab === 'register') {
      loadCases();
    }
  }, [activeTab, caseSearch, caseKecamatanFilter]);

  // Transform data untuk 4 kategori grafik
  const chartKorupsi = perkaraData.map((d) => ({
    tahun: String(d.tahun),
    'Lid': d.korupsi.lid,
    'Dik Kejaksaan': d.korupsi.dikKejaksaan,
    'Dik Kepolisian': d.korupsi.dikKepolisian,
    'Penuntutan': d.korupsi.tut
  }));

  const chartNarkotika = perkaraData.map((d) => ({
    tahun: String(d.tahun),
    'SPDP': d.narkotika.spdp,
    'Tahap I': d.narkotika.tahap1,
    'Tahap II': d.narkotika.tahap2,
    'Penuntutan': d.narkotika.tut
  }));

  const chartTerorisme = perkaraData.map((d) => ({
    tahun: String(d.tahun),
    'SPDP': d.terorisme.spdp,
    'Tahap I': d.terorisme.tahap1,
    'Tahap II': d.terorisme.tahap2,
    'Penuntutan': d.terorisme.tut
  }));

  const chartPerhatian = perkaraData.map((d) => ({
    tahun: String(d.tahun),
    'SPDP': d.perhatianMasyarakat.spdp,
    'Tahap I': d.perhatianMasyarakat.tahap1,
    'Tahap II': d.perhatianMasyarakat.tahap2,
    'Penuntutan': d.perhatianMasyarakat.tut
  }));

  // Agregasi otomatis dari data tabel Penerangan & Penyuluhan Hukum yang diinput di aplikasi
  const appKecamatanData = useMemo(() => {
    return KECAMATAN_TABANAN.map((kec) => {
      const items = penkumList.filter((p) => p.kecamatan === kec);
      const penkum = items.filter((p) => p.jenis === 'Penkum').length;
      const luhkum = items.filter((p) => p.jenis === 'Luhkum').length;
      const totalPeserta = items.reduce((sum, curr) => sum + curr.jumlah_peserta, 0);
      return {
        kecamatan: kec,
        penkum,
        luhkum,
        totalPeserta
      };
    });
  }, [penkumList]);

  // Dataset aktif berdasarkan pilihan sumber data
  const hasAppData = penkumList && penkumList.length > 0;
  const activeKecamatanChartData = (sumberDataKecamatan === 'aplikasi' && hasAppData)
    ? appKecamatanData
    : kecamatanData;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner D.IN.11 & Status Koneksi CMS */}
      <div className="bg-[#202D34] p-4 sm:p-5 rounded-lg border border-[#374853] shadow-sm space-y-4">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#2B3A42]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#8DC21F] text-[#1B292F] text-xs font-mono font-extrabold px-2 py-0.5 rounded">
                SLIDE D.IN.11
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#8DC21F] uppercase tracking-wide">
                GRAFIK REKAPITULASI PENANGANAN PERKARA KEJARI TABANAN
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Terintegrasi dengan <strong>CMS Publik Kejaksaan RI</strong> (Satker 22.08.00). Menampilkan statistik 4 kategori tindak pidana, sebaran kewilayahan 10 kecamatan, dan register perkara terbuka.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Periode filter */}
            <div className="flex items-center gap-1.5 bg-[#2B3A42] border border-[#3E525E] px-2.5 py-1.5 rounded-md">
              <span className="text-slate-400">Periode:</span>
              <select
                value={tahunFilter.mulai}
                onChange={(e) => setTahunFilter({ ...tahunFilter, mulai: Number(e.target.value) })}
                className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none"
              >
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
              </select>
              <span className="text-slate-400">s/d</span>
              <select
                value={tahunFilter.selesai}
                onChange={(e) => setTahunFilter({ ...tahunFilter, selesai: Number(e.target.value) })}
                className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            {/* Tombol Refresh / Sinkronisasi Ulang */}
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B3A42] hover:bg-[#344650] text-slate-200 border border-[#3E525E] rounded-md transition-colors"
              title="Sinkronkan Ulang Data dengan CMS Kejaksaan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8DC21F]' : ''}`} />
              <span className="font-semibold">Sinkronkan CMS</span>
            </button>

            {/* Tombol Health Check */}
            <button
              onClick={handleTestHealth}
              disabled={healthChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A262D] hover:bg-[#25353F] text-[#8DC21F] border border-[#8DC21F]/40 rounded-md transition-colors font-mono font-bold"
              title="Cek apakah server upstream cms-publik.kejaksaan.go.id sedang aktif atau down"
            >
              <Activity className={`w-3.5 h-3.5 ${healthChecking ? 'animate-pulse' : ''}`} />
              <span>Tes Status Server</span>
            </button>
          </div>
        </div>

        {/* 2. Banner Status Ketahanan Anti-Downtime */}
        {cmsStatus.isDown ? (
          <div className="bg-amber-950/40 border border-amber-600/50 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">
                    PROTEKSI ANTI-DOWNTIME AKTIF: Server CMS Publik Kejaksaan RI Sedang Offline / Down
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-900/80 text-amber-200 border border-amber-500/50">
                    Fallback Cache Aktif
                  </span>
                </div>
                <p className="text-[11.5px] text-amber-200/90">
                  Karena server pusat Kejaksaan sering mengalami kendala jaringan/down, sistem secara otomatis mengamankan dan menyajikan <strong>Data Arsip Resmi Satker 22.08.00 ({cmsStatus.totalCases} Kasus Terdaftar)</strong>. Papan intelijen tetap dapat beroperasi normal 100% tanpa gangguan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-amber-300/80">Satker 22.08.00 (Tabanan)</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="space-y-0.5 text-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <strong className="text-emerald-300">Terhubung Langsung ke CMS Publik Kejaksaan RI:</strong>
                  <span className="font-mono text-[11px] bg-emerald-900/60 px-1.5 py-0.2 rounded text-emerald-300 border border-emerald-500/30">
                    Satker {cmsStatus.satker} · {cmsStatus.satkerName}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90">
                  {cmsStatus.latencyMs ? `Respons: ${cmsStatus.latencyMs} ms · ` : ''}
                  Total {cmsStatus.totalCases} berkas perkara PIDUM tahun 2026 berhasil disinkronkan secara aman melalui serverless proxy.
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-emerald-300/70 shrink-0">
              Koneksi Aman Tanpa Masalah CORS
            </span>
          </div>
        )}

        {/* Feedback Health Check Test (jika tombol tes diklik) */}
        {healthResult && (
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            healthResult.online
              ? 'bg-emerald-900/30 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {healthResult.online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                <strong>Hasil Uji Koneksi CMS:</strong> {healthResult.message} ({healthResult.latencyMs} ms)
              </span>
            </div>
            <button
              onClick={() => setHealthResult(null)}
              className="text-[10px] font-mono underline hover:text-white"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Mode Tab Switcher: [Grafik D.IN.11] vs [Register Kasus Terbuka CMS] */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#2B3A42]">
          <button
            type="button"
            onClick={() => setActiveTab('grafik')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'grafik'
                ? 'bg-[#8DC21F] text-[#1B292F] shadow-md'
                : 'bg-[#2B3A42] text-slate-300 hover:text-white border border-[#3E525E]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik Statistik Rekapitulasi (Slide D.IN.11)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#8DC21F] text-[#1B292F] shadow-md'
                : 'bg-[#2B3A42] text-slate-300 hover:text-white border border-[#3E525E]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Register Kasus Nyata PIDUM ({cmsStatus.totalCases} Perkara Tabanan)</span>
          </button>
        </div>

      </div>

      {/* 3. TAMPILAN TAB 1: EMPAT GRAFIK BATANG D.IN.11 & HORIZONTAL PER KECAMATAN */}
      {activeTab === 'grafik' && (
        <div className="space-y-6">
          {/* 4 Grouped Bar Charts Grid (2x2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. Grafik Korupsi */}
            <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3A42]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  1. Tindak Pidana Korupsi (Tipikor)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Lid · Dik Kejaksaan · Dik Polri · Tut</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartKorupsi} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.5} />
                    <XAxis dataKey="tahun" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#EF4444', borderRadius: '6px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Lid" fill="#F87171" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Dik Kejaksaan" fill="#DC2626" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Dik Kepolisian" fill="#FB923C" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Penuntutan" fill="#8DC21F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Grafik Narkotika (Data Riil dari CMS Kejaksaan Satker 22.08.00) */}
            <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3A42]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Narkotika dan Zat Adiktif Lainnya
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                    CMS Riil
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">SPDP · Tahap I · Tahap II · Tut</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartNarkotika} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.5} />
                    <XAxis dataKey="tahun" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#10B981', borderRadius: '6px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="SPDP" fill="#34D399" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap I" fill="#059669" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap II" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Penuntutan" fill="#8DC21F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Grafik Terorisme */}
            <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3A42]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  3. Tindak Pidana Terorisme
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Wilayah Kondusif (Nihil)</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTerorisme} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.5} />
                    <XAxis dataKey="tahun" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} domain={[0, 4]} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#A855F7', borderRadius: '6px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="SPDP" fill="#C084FC" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap I" fill="#9333EA" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap II" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Penuntutan" fill="#8DC21F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Grafik Perkara Menarik Perhatian Masyarakat */}
            <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3A42]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  4. Perkara Menarik Perhatian Masyarakat
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">SPDP · Tahap I · Tahap II · Tut</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPerhatian} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.5} />
                    <XAxis dataKey="tahun" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#F59E0B', borderRadius: '6px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="SPDP" fill="#FCD34D" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap I" fill="#D97706" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tahap II" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Penuntutan" fill="#8DC21F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 5. Grafik Batang Horizontal Penkum/Luhkum per Kecamatan */}
          <div className="bg-[#202D34] p-5 rounded-lg border border-[#374853] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B3A42]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Sebaran Kegiatan Penkum & Luhkum per 10 Kecamatan (Grafik Horizontal)
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#8DC21F] bg-[#8DC21F]/10 px-2 py-0.5 rounded border border-[#8DC21F]/30">
                    10 Wilayah
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distribusi intensitas pembinaan kesadaran hukum masyarakat pada masing-masing kecamatan di Kabupaten Tabanan.
                </p>
              </div>

              {/* Selector Sumber Data */}
              <div className="flex items-center gap-1.5 bg-[#1B292F] p-1 rounded-md border border-[#374853] text-xs">
                <button
                  type="button"
                  onClick={() => setSumberDataKecamatan('aplikasi')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                    sumberDataKecamatan === 'aplikasi'
                      ? 'bg-[#8DC21F] text-[#1B292F] font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Data agregasi real-time dari input tabel Penkum & Luhkum di aplikasi"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Input Aplikasi ({penkumList.length} Kegiatan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSumberDataKecamatan('rekap')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                    sumberDataKecamatan === 'rekap'
                      ? 'bg-[#8DC21F] text-[#1B292F] font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Data sebaran kewilayahan dari rekapitulasi CMS Tabanan"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Rekap CMS Kejaksaan</span>
                </button>
              </div>
            </div>

            {/* Informasi Asal Data */}
            <div className="bg-[#1A262D] p-3 rounded-lg border border-[#32434D] flex items-start gap-2.5 text-[11px] text-slate-300">
              <Info className="w-4 h-4 text-[#8DC21F] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p>
                  <strong className="text-white">Asal Sumber Data: </strong>
                  {sumberDataKecamatan === 'aplikasi'
                    ? `Dihitung secara otomatis dari data tabel Penerangan & Penyuluhan Hukum (Slide D.IN.7 s.d. D.IN.8) berdasarkan kolom 'Kecamatan' yang diinput oleh petugas (${penkumList.length} data tersimpan).`
                    : 'Diambil dari provider data resmi CMS Tabanan (Satker 22.08.00) dan dianalisis berdasarkan yurisdiksi kepolisian sektor di 10 kecamatan Kabupaten Tabanan.'}
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={activeKecamatanChartData}
                  margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.5} horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="kecamatan"
                    stroke="#94A3B8"
                    tick={{ fill: '#CBD5E1', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderColor: '#8DC21F',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="penkum" fill="#8DC21F" name="Penerangan Hukum" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="luhkum" fill="#38BDF8" name="Penyuluhan Hukum" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAMPILAN TAB 2: TABEL REGISTER KASUS NYATA CMS TABANAN (242 KASUS) */}
      {activeTab === 'register' && (
        <div className="bg-[#202D34] rounded-lg border border-[#374853] p-4 sm:p-5 shadow-lg space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B3A42]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#8DC21F]" />
                <span>Register Perkara Tindak Pidana Umum (Satker 22.08.00 Kejari Tabanan)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Data resmi dari endpoint CMS Publik Kejaksaan RI. Menampilkan {totalCasesCount} berkas perkara terdaftar.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No SPDP, pasal, polsek..."
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  className="bg-[#2B3A42] border border-[#3E525E] text-slate-200 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F] w-48 sm:w-64"
                />
              </div>

              <select
                value={caseKecamatanFilter}
                onChange={(e) => setCaseKecamatanFilter(e.target.value)}
                className="bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
              >
                <option value="SEMUA">Semua Kecamatan (10 Wilayah)</option>
                {KECAMATAN_TABANAN.map((k) => (
                  <option key={k} value={k}>
                    Kec. {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Kasus */}
          <div className="overflow-x-auto rounded-md border border-[#374853]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#8DC21F] text-[#1B292F] font-extrabold border-b-2 border-[#7db019]">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#7db019]">NO</th>
                  <th className="py-2.5 px-3 w-48 border-r border-[#7db019]">NOMOR SPDP & TANGGAL</th>
                  <th className="py-2.5 px-3 w-36 border-r border-[#7db019]">ASAL PENYIDIK</th>
                  <th className="py-2.5 px-3 w-56 border-r border-[#7db019]">PASAL / UNDANG-UNDANG</th>
                  <th className="py-2.5 px-3 border-r border-[#7db019]">TEMPAT KEJADIAN PERKARA</th>
                  <th className="py-2.5 px-3 w-28 text-center">TAHAPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374853]/60">
                {caseLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 bg-[#25333B]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#8DC21F]" />
                      <span>Memuat register perkara CMS Kejaksaan...</span>
                    </td>
                  </tr>
                ) : caseList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 bg-[#25333B]">
                      Tidak ada perkara yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  caseList.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={item.id_perkara || idx}
                        className={`transition-colors ${
                          isEven ? 'bg-[#25333B] text-slate-100 hover:bg-[#2B3A42]' : 'bg-[#1E2B32] text-slate-200 hover:bg-[#25363F]'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold align-top border-r border-[#374853]/50">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 align-top border-r border-[#374853]/50">
                          <span className="font-mono font-bold text-white block text-[11px] leading-tight">
                            {item.no_surat}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            Terima SPDP: {item.terima_spdp || item.tgl_surat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 align-top border-r border-[#374853]/50">
                          <span className="font-semibold text-slate-200 block text-[11px]">
                            {item.ur_ipp}
                          </span>
                          {item.kecamatan && (
                            <span className="inline-block mt-1 font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-[#1A262D] text-[#8DC21F] border border-[#8DC21F]/30">
                              Kec. {item.kecamatan}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top border-r border-[#374853]/50">
                          <span className="font-mono text-[11px] text-amber-300 font-bold block leading-tight">
                            {item.undang_pasal}
                          </span>
                          {item.tdw && item.tdw !== 'DALAM LIDIK' && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Tersangka: <strong className="text-slate-300">{item.tdw}</strong>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top border-r border-[#374853]/50">
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans">
                            {item.tempat_kejadian}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 align-top text-center">
                          {item.tahap_2 ? (
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                              Tahap II
                            </span>
                          ) : item.tgl_p21 ? (
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-950 text-sky-300 border border-sky-500/50">
                              P.21 (Lengkap)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-600">
                              Pra-Penuntutan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-2">
            <span>
              Menampilkan <span className="font-bold text-white">{caseList.length}</span> dari {totalCasesCount} berkas perkara terfilter.
            </span>
            <span className="text-[11px] font-mono text-[#8DC21F]">
              Sumber: CMS Publik Kejaksaan RI (Satker 22.08.00)
            </span>
          </div>

        </div>
      )}

    </div>
  );
};

export default GrafikPerkara;
