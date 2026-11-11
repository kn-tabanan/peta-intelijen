/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Grafik Penerangan dan Penyuluhan Hukum (Slide D.IN.9)
 * Grafik Batang Target vs Realisasi Penkum vs Realisasi Luhkum per Triwulan
 * Dihitung otomatis dari data tabel penerangan_hukum
 */

import React, { useMemo } from 'react';
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
import { PeneranganHukum } from '../types';
import { Award, Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatAngka } from '../utils/formatters';

interface GrafikPenkumProps {
  penkumList: PeneranganHukum[];
}

export const GrafikPenkum: React.FC<GrafikPenkumProps> = ({ penkumList }) => {
  // Hitung agregasi per triwulan
  const chartData = useMemo(() => {
    return [1, 2, 3, 4].map((tw) => {
      const items = penkumList.filter((p) => p.triwulan === tw);
      const realisasiPenkum = items.filter((p) => p.jenis === 'Penkum').length;
      const realisasiLuhkum = items.filter((p) => p.jenis === 'Luhkum').length;
      const targetPerTW = 1; // Target standar D.IN.9: 1 per triwulan per jenis
      const totalPeserta = items.reduce((acc, curr) => acc + curr.jumlah_peserta, 0);

      return {
        triwulan: `Triwulan ${tw}`,
        shortTW: `TW ${tw}`,
        Target: targetPerTW,
        Penkum: realisasiPenkum,
        Luhkum: realisasiLuhkum,
        totalPeserta
      };
    });
  }, [penkumList]);

  // Total capaian tahunan
  const totalTargetPenkum = 4;
  const totalTargetLuhkum = 4;
  const totalRealisasiPenkum = penkumList.filter((p) => p.jenis === 'Penkum').length;
  const totalRealisasiLuhkum = penkumList.filter((p) => p.jenis === 'Luhkum').length;
  const totalPesertaAll = penkumList.reduce((acc, curr) => acc + curr.jumlah_peserta, 0);

  const persenPenkum = Math.round((totalRealisasiPenkum / totalTargetPenkum) * 100);
  const persenLuhkum = Math.round((totalRealisasiLuhkum / totalTargetLuhkum) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner D.IN.9 */}
      <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#8DC21F] text-[#1B292F] text-xs font-mono font-extrabold px-2 py-0.5 rounded">
              SLIDE D.IN.9
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#8DC21F] uppercase">
              GRAFIK TARGET VS REALISASI PENERANGAN & PENYULUHAN HUKUM
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Visualisasi capaian pelaksanaan kegiatan intelijen yustisial bidang hukum Kejaksaan Negeri Tabanan per Triwulan.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status Akumulasi:</span>
          <span className="bg-emerald-950 text-emerald-300 font-bold px-2 py-1 rounded border border-emerald-500/40">
            Target Tercapai 100%
          </span>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Tahunan */}
        <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Target Tahunan</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            8 <span className="text-xs font-sans text-slate-400 font-normal">Kegiatan</span>
          </div>
          <p className="text-[11px] text-slate-400">
            4 Penkum & 4 Luhkum (1/TW)
          </p>
        </div>

        {/* Card 2: Realisasi Penkum */}
        <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Realisasi Penkum</span>
            <Award className="w-4 h-4 text-[#8DC21F]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#8DC21F]">
            {totalRealisasiPenkum} <span className="text-xs font-sans text-slate-400 font-normal">Kegiatan</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Capaian: <strong className="text-emerald-400 font-mono">{persenPenkum}%</strong> dari target
          </p>
        </div>

        {/* Card 3: Realisasi Luhkum */}
        <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Realisasi Luhkum</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {totalRealisasiLuhkum} <span className="text-xs font-sans text-slate-400 font-normal">Kegiatan</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Capaian: <strong className="text-amber-400 font-mono">{persenLuhkum}%</strong> dari target
          </p>
        </div>

        {/* Card 4: Total Masyarakat Terjangkau */}
        <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Peserta Terbina</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-teal-400">
            {formatAngka(totalPesertaAll)} <span className="text-xs font-sans text-slate-400 font-normal">Orang</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Masyarakat, Pelajar, Kepala Desa & Guru
          </p>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="bg-[#202D34] p-5 rounded-lg border border-[#374853] shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2B3A42]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Grafik Batang Perbandingan per Triwulan (Target vs Penkum vs Luhkum)
          </h3>
          <span className="text-xs font-mono text-slate-400">Tahun Anggaran 2025</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374853" opacity={0.6} />
              <XAxis
                dataKey="triwulan"
                stroke="#94A3B8"
                tick={{ fill: '#CBD5E1', fontSize: 12 }}
              />
              <YAxis
                stroke="#94A3B8"
                tick={{ fill: '#CBD5E1', fontSize: 12 }}
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#8DC21F',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(val) => <span className="text-slate-200 text-xs">{val}</span>}
              />
              <Bar dataKey="Target" fill="#38BDF8" name="Target Per TW" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Penkum" fill="#8DC21F" name="Realisasi Penkum" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Luhkum" fill="#F59E0B" name="Realisasi Luhkum" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[11px] text-slate-400 bg-[#1A262D] p-3 rounded border border-[#2B3A42] flex items-center justify-between">
          <span>* Target standar operasional Kejaksaan Negeri: minimal 1 kegiatan Penerangan Hukum dan 1 kegiatan Penyuluhan Hukum per Triwulan.</span>
          <span className="font-mono text-[#8DC21F]">D.IN.9 Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};

export default GrafikPenkum;
