/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dashboard Ringkasan Papan Peta Intelijen Kejaksaan Negeri Tabanan
 * Ringkasan jumlah kegiatan per bidang (D.IN.1 s.d. D.IN.6), per triwulan, dan per kecamatan
 */

import React from 'react';
import { KegiatanPeta, PeneranganHukum } from '../types';
import { BIDANG_CONFIG, BidangIntelijen, KECAMATAN_TABANAN } from '../config/symbols.config';
import { getTriwulan, formatTanggalIndonesia } from '../utils/formatters';
import {
  ShieldCheck,
  FileText,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Database
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isPerkaraMockMode } from '../services/perkaraProvider';

interface DashboardOverviewProps {
  kegiatanList: KegiatanPeta[];
  penkumList: PeneranganHukum[];
  onNavigateTab: (tab: string, extra?: any) => void;
  onSelectBidang: (bidang: BidangIntelijen) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  kegiatanList,
  penkumList,
  onNavigateTab,
  onSelectBidang
}) => {
  // Hitung jumlah per bidang
  const countsByBidang = Object.keys(BIDANG_CONFIG).map((bKey) => {
    const meta = BIDANG_CONFIG[bKey as BidangIntelijen];
    const total = kegiatanList.filter((k) => k.bidang === bKey).length;
    return {
      bidang: bKey as BidangIntelijen,
      meta,
      total
    };
  });

  // Hitung jumlah per triwulan
  const countsByTriwulan = [1, 2, 3, 4].map((tw) => {
    const total = kegiatanList.filter((k) => getTriwulan(k.tanggal) === tw).length;
    const penkumCount = penkumList.filter((p) => p.triwulan === tw).length;
    return { triwulan: tw, total, penkumCount };
  });

  // Hitung per kecamatan
  const countsByKecamatan = KECAMATAN_TABANAN.map((kec) => {
    const count = kegiatanList.filter((k) => k.kecamatan === kec).length;
    return { kecamatan: kec, count };
  });

  return (
    <div className="space-y-6">
      {/* 1. Hero Section: Welcome & Intelligence System Status */}
      <div className="bg-[#202D34] p-5 sm:p-6 rounded-xl border border-[#374853] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-[#8DC21F] text-[#1B292F] text-[11px] font-mono font-extrabold px-2 py-0.5 rounded">
              PETA INTELIJEN YUSTISIAL
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Format Standar D.IN.1 s.d. D.IN.11
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Papan Data Peta Intelijen Kejaksaan Negeri Tabanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sistem informasi register dan visualisasi pemetaan kerawanan wilayah, ketertiban umum, penelusuran aset, pengawalan proyek strategis, serta statistik perkara di wilayah hukum Kabupaten Tabanan, Bali.
          </p>
        </div>

        {/* Integration Status Badges */}
        <div className="bg-[#1A262D] p-3.5 rounded-lg border border-[#374853] space-y-2 shrink-0 text-xs w-full md:w-auto md:min-w-[220px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Database:</span>
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              isSupabaseConfigured
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}>
              {isSupabaseConfigured ? 'Supabase RLS Active' : 'Local Mock Store'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">API Perkara:</span>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CMS Publik Satker 22.08.00</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Peristiwa:</span>
            <span className="font-mono font-bold text-[#8DC21F]">
              {kegiatanList.length} Baris SIADIBIBAM
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid Jumlah Kegiatan per Bidang (Slide D.IN.1, D.IN.3, D.IN.4, D.IN.5, D.IN.6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8DC21F]" />
            <span>Rekapitulasi Kegiatan per Bidang Intelijen</span>
          </h2>
          <span className="text-xs text-slate-400">Klik kartu untuk membuka tabel papan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {countsByBidang.map(({ bidang, meta, total }) => (
            <button
              key={bidang}
              onClick={() => {
                onSelectBidang(bidang);
                onNavigateTab('tabel-bidang');
              }}
              className="bg-[#202D34] hover:bg-[#25363F] p-4 rounded-lg border border-[#374853] hover:border-[#8DC21F]/60 text-left transition-all group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-extrabold bg-[#8DC21F] text-[#1B292F] px-1.5 py-0.5 rounded">
                    {meta.kodeSlide}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {meta.sektorList.length} Sektor
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#8DC21F] transition-colors leading-tight line-clamp-2">
                  {meta.judulPapan.replace('BIDANG ', '')}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2B3A42] flex items-center justify-between">
                <span className="text-xl font-mono font-bold text-[#8DC21F]">
                  {total}{' '}
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    Kegiatan
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#8DC21F] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Dua Kolom: Rekap per Triwulan & Rekap per 10 Kecamatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Kolom Kiri: Rekapitulasi per Triwulan */}
        <div className="bg-[#202D34] p-5 rounded-lg border border-[#374853] shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B3A42]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8DC21F]" />
              <span>Rekapitulasi per Triwulan (TW 1 s.d. 4)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Tahun 2025</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {countsByTriwulan.map(({ triwulan, total, penkumCount }) => (
              <div
                key={triwulan}
                className="bg-[#2B3A42] p-3 rounded-md border border-[#3E525E] space-y-1 text-center"
              >
                <span className="text-[11px] font-bold text-[#8DC21F] uppercase font-mono">
                  Triwulan {triwulan}
                </span>
                <div className="text-2xl font-mono font-bold text-white">
                  {total}
                </div>
                <div className="text-[10px] text-slate-400">
                  SIADIBIBAM
                </div>
                <div className="pt-1 mt-1 border-t border-[#374853] text-[10px] text-sky-300 font-mono">
                  {penkumCount} Penkum/Luhkum
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#1A262D] p-3 rounded border border-[#2B3A42] flex items-center justify-between text-xs">
            <span className="text-slate-300">Penyuluhan dan Penerangan Hukum:</span>
            <button
              onClick={() => onNavigateTab('penkum')}
              className="text-[#8DC21F] hover:underline font-bold flex items-center gap-1"
            >
              <span>Buka Data Penkum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Rekapitulasi 10 Kecamatan Tabanan */}
        <div className="bg-[#202D34] p-5 rounded-lg border border-[#374853] shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B3A42]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8DC21F]" />
              <span>Sebaran Peristiwa di 10 Kecamatan</span>
            </h3>
            <button
              onClick={() => onNavigateTab('peta')}
              className="text-xs text-[#8DC21F] hover:underline font-bold flex items-center gap-1"
            >
              <span>Lihat di Peta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
            {countsByKecamatan.map(({ kecamatan, count }) => (
              <div
                key={kecamatan}
                className="flex items-center justify-between bg-[#2B3A42] px-3 py-2 rounded border border-[#3E525E]"
              >
                <span className="text-slate-200 truncate">Kec. {kecamatan}</span>
                <span className="font-mono font-bold text-[#8DC21F] bg-[#1A262D] px-2 py-0.5 rounded text-[11px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Rekap Catatan Peristiwa Terbaru */}
      <div className="bg-[#202D34] p-5 rounded-lg border border-[#374853] shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#2B3A42]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8DC21F]" />
            <span>Catatan SIADIBIBAM Terbaru Masuk Register</span>
          </h3>
          <button
            onClick={() => onNavigateTab('tabel-bidang')}
            className="text-xs text-[#8DC21F] hover:underline font-semibold"
          >
            Lihat Semua Tabel
          </button>
        </div>

        <div className="divide-y divide-[#2B3A42]">
          {kegiatanList.slice(0, 4).map((item) => (
            <div key={item.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#8DC21F] bg-[#8DC21F]/10 px-1.5 py-0.5 rounded">
                    {item.keterangan_sektor}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Kec. {item.kecamatan} · {formatTanggalIndonesia(item.tanggal)}
                  </span>
                </div>
                <p className="font-serif text-[12px] text-slate-200 line-clamp-2">
                  {item.uraian}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectBidang(item.bidang);
                  onNavigateTab('tabel-bidang');
                }}
                className="px-2.5 py-1 bg-[#2B3A42] hover:bg-[#344650] text-[#8DC21F] rounded text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                Buka
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
