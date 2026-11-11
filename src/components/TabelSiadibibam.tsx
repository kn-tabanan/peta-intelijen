/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tabel SIADIBIBAM (5W+1H) Format Papan Peta D.IN.1 s.d. D.IN.6
 * Meniru papan peta asli Kejaksaan RI:
 * - Header kolom hijau dengan teks putih
 * - Baris tabel selang-seling hijau muda (#DCE9D0) dengan teks kontras tinggi
 * - Kolom: NO | SIMBOL SEKTOR | SIADIBIBAM / 5W+1H | KETERANGAN
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, MapPin, Calendar, Clock, ChevronDown } from 'lucide-react';
import { KegiatanPeta, UserProfile } from '../types';
import { BIDANG_CONFIG, BidangIntelijen, KECAMATAN_TABANAN, KeteranganSektor } from '../config/symbols.config';
import SimbolSektor from './SimbolSektor';
import { formatTanggalIndonesia, getTriwulan } from '../utils/formatters';

interface TabelSiadibibamProps {
  kegiatanList: KegiatanPeta[];
  currentUser: UserProfile;
  selectedBidang: BidangIntelijen;
  onSelectBidang: (bidang: BidangIntelijen) => void;
  onTambah: () => void;
  onUbah: (kegiatan: KegiatanPeta) => void;
  onHapus: (id: string) => void;
  onViewOnMap: (kegiatan: KegiatanPeta) => void;
}

export const TabelSiadibibam: React.FC<TabelSiadibibamProps> = ({
  kegiatanList,
  currentUser,
  selectedBidang,
  onSelectBidang,
  onTambah,
  onUbah,
  onHapus,
  onViewOnMap
}) => {
  const [filterKecamatan, setFilterKecamatan] = useState<string>('SEMUA');
  const [filterTriwulan, setFilterTriwulan] = useState<string>('SEMUA');
  const [filterSektor, setFilterSektor] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const bidangMeta = BIDANG_CONFIG[selectedBidang];

  const daftarBidangKeys = Object.keys(BIDANG_CONFIG) as BidangIntelijen[];

  // Filter data sesuai bidang, filter, dan search
  const filteredData = useMemo(() => {
    return kegiatanList
      .filter((k) => k.bidang === selectedBidang)
      .filter((k) => {
        if (filterKecamatan !== 'SEMUA' && k.kecamatan !== filterKecamatan) return false;
        if (filterTriwulan !== 'SEMUA') {
          const tw = getTriwulan(k.tanggal);
          if (tw !== Number(filterTriwulan)) return false;
        }
        if (filterSektor !== 'SEMUA' && k.keterangan_sektor !== filterSektor) return false;
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchUraian = k.uraian.toLowerCase().includes(q);
          const matchTempat = k.tempat.toLowerCase().includes(q);
          const matchKecamatan = k.kecamatan.toLowerCase().includes(q);
          const matchSektor = k.keterangan_sektor.toLowerCase().includes(q);
          const matchPoin = (k.poin_tambahan || []).some((p) => p.toLowerCase().includes(q));
          if (!matchUraian && !matchTempat && !matchKecamatan && !matchSektor && !matchPoin) return false;
        }
        return true;
      });
  }, [kegiatanList, selectedBidang, filterKecamatan, filterTriwulan, filterSektor, searchTerm]);

  // Hak akses RBAC
  const canAdd = currentUser.role === 'admin' || currentUser.role === 'penginput';
  const canEditRow = (item: KegiatanPeta) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'penginput' && item.created_by === currentUser.id) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* 1. Bidang Tabs (D.IN.1 s.d. D.IN.6) - Responsive Grid Tanpa Scroll */}
      <div className="bg-[#202D34] p-3 rounded-lg border border-[#374853] shadow-sm">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Pilih Papan Bidang Intelijen:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {daftarBidangKeys.map((bidangKey) => {
            const b = BIDANG_CONFIG[bidangKey];
            const isActive = selectedBidang === bidangKey;
            const count = kegiatanList.filter((k) => k.bidang === bidangKey).length;

            return (
              <button
                key={bidangKey}
                onClick={() => {
                  onSelectBidang(bidangKey);
                  setFilterSektor('SEMUA');
                }}
                className={`flex flex-col justify-between p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                  isActive
                    ? 'bg-[#8DC21F] text-[#1B292F] border-[#8DC21F] shadow-md ring-2 ring-[#8DC21F]/40'
                    : 'bg-[#2B3A42] text-slate-300 border-[#3E525E] hover:text-white hover:bg-[#344650] hover:border-[#8DC21F]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                    isActive ? 'bg-[#1B292F] text-[#8DC21F]' : 'bg-[#1A262D] text-[#8DC21F]'
                  }`}>
                    {b.kodeSlide}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-[#1B292F]/20 text-[#1B292F]' : 'bg-[#1F2B32] text-slate-300'
                  }`}>
                    {count} Baris
                  </span>
                </div>
                <span className="text-[11px] leading-tight line-clamp-2">
                  {bidangKey}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Papan Header & Filter Toolbar */}
      <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] space-y-4 shadow-sm">
        {/* Title banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#2B3A42]">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#8DC21F] text-[#1B292F] text-xs font-mono font-extrabold px-2 py-0.5 rounded">
                SLIDE {bidangMeta.kodeSlide}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#8DC21F] uppercase">
                {bidangMeta.judulPapan}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              {bidangMeta.deskripsi}
            </p>
          </div>

          {canAdd && (
            <button
              onClick={onTambah}
              className="flex items-center gap-2 px-4 py-2 bg-[#8DC21F] hover:bg-[#9dd824] active:bg-[#7db019] text-[#1B292F] font-bold text-xs rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kegiatan SIADIBIBAM</span>
            </button>
          )}
        </div>

        {/* Filter Bar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari narasi SIADIBIBAM, tempat, poin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-200 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
            />
          </div>

          {/* Kecamatan Filter */}
          <div>
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
            >
              <option value="SEMUA">Semua Kecamatan (10 Wilayah)</option>
              {KECAMATAN_TABANAN.map((kec) => (
                <option key={kec} value={kec}>
                  Kecamatan {kec}
                </option>
              ))}
            </select>
          </div>

          {/* Triwulan Filter */}
          <div>
            <select
              value={filterTriwulan}
              onChange={(e) => setFilterTriwulan(e.target.value)}
              className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
            >
              <option value="SEMUA">Semua Triwulan (TW 1 - 4)</option>
              <option value="1">Triwulan 1 (Januari - Maret)</option>
              <option value="2">Triwulan 2 (April - Juni)</option>
              <option value="3">Triwulan 3 (Juli - September)</option>
              <option value="4">Triwulan 4 (Oktober - Desember)</option>
            </select>
          </div>

          {/* Sektor Filter */}
          <div>
            <select
              value={filterSektor}
              onChange={(e) => setFilterSektor(e.target.value)}
              className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-3 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
            >
              <option value="SEMUA">Semua Sektor Bidang</option>
              {bidangMeta.sektorList.map((sek) => (
                <option key={sek} value={sek}>
                  {sek}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tabel Format Papan Peta Asli (100% Responsif Tanpa Horizontal Scroll) */}
      <div className="bg-[#202D34] rounded-lg border border-[#374853] overflow-hidden shadow-lg w-full">
        
        {/* A. Tampilan Tabel Desktop & Tablet (md ke atas, 100% Fluid Tanpa Scroll Horizontal) */}
        <div className="hidden md:block w-full">
          <table className="w-full text-left border-collapse">
            {/* Header Kolom Hijau Kejaksaan */}
            <thead>
              <tr className="bg-[#8DC21F] text-[#1B292F] font-extrabold text-xs tracking-wider border-b-2 border-[#7db019]">
                <th className="py-3 px-2 text-center w-10 border-r border-[#7db019]">NO</th>
                <th className="py-3 px-3 w-56 lg:w-60 border-r border-[#7db019]">SIMBOL SEKTOR</th>
                <th className="py-3 px-4 border-r border-[#7db019]">
                  SIADIBIBAM / 5W+1H (URAIAN PERISTIWA INTELIJEN)
                </th>
                <th className="py-3 px-3 w-52 border-r border-[#7db019]">KETERANGAN & WAKTU</th>
                <th className="py-3 px-2 text-center w-16">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#374853]/60 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 bg-[#25333B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-500" />
                      <p className="font-semibold text-slate-300">Tidak ada data kegiatan yang cocok dengan kriteria filter.</p>
                      <p className="text-[11px] text-slate-500">
                        {canAdd ? 'Klik tombol "Input Kegiatan SIADIBIBAM" di atas untuk menambahkan catatan.' : 'Belum ada data untuk bidang ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const isLightRow = index % 2 === 0;
                  const rowClass = isLightRow
                    ? 'bg-[#DCE9D0] text-[#1B292F]'
                    : 'bg-[#25333B] text-slate-100 hover:bg-[#2B3A42]';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${rowClass}`}
                    >
                      {/* NO */}
                      <td className="py-3 px-2 text-center font-mono font-bold align-top border-r border-slate-300/40">
                        {index + 1}
                      </td>

                      {/* SIMBOL SEKTOR */}
                      <td className="py-3 px-3 align-top border-r border-slate-300/40">
                        <SimbolSektor
                          keterangan={item.keterangan_sektor}
                          ukuran="md"
                          tampilkanLabel
                        />
                      </td>

                      {/* SIADIBIBAM / 5W+1H */}
                      <td className="py-3 px-4 align-top border-r border-slate-300/40 space-y-2 leading-relaxed">
                        <p className={`font-serif text-[12.5px] leading-relaxed text-justify ${isLightRow ? 'text-[#142025]' : 'text-slate-100'}`}>
                          {item.uraian}
                        </p>

                        {/* Poin bernomor tambahan */}
                        {item.poin_tambahan && item.poin_tambahan.length > 0 && (
                          <div className={`mt-2 pt-2 border-t ${isLightRow ? 'border-emerald-800/20 text-[#1B292F]' : 'border-slate-700/60 text-slate-200'} text-[11.5px] space-y-1`}>
                            {item.poin_tambahan.map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-1.5">
                                <span className="font-mono font-bold shrink-0">{pIdx + 1}.</span>
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* KETERANGAN & WAKTU */}
                      <td className="py-3 px-3 align-top border-r border-slate-300/40 space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#8DC21F] shrink-0" />
                          <span className="font-bold">Kec. {item.kecamatan}</span>
                        </div>

                        <div className={`text-[11px] ${isLightRow ? 'text-slate-800' : 'text-slate-300'} line-clamp-2`} title={item.tempat}>
                          {item.tempat}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-300/30">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-mono text-[10.5px]">{formatTanggalIndonesia(item.tanggal)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-mono text-[10.5px]">{item.waktu}</span>
                        </div>

                        {item.lat && item.lng && (
                          <button
                            onClick={() => onViewOnMap(item)}
                            className={`mt-1 text-[10px] font-semibold flex items-center gap-1 hover:underline ${
                              isLightRow ? 'text-emerald-900 font-bold' : 'text-[#8DC21F]'
                            }`}
                          >
                            <span>Lihat di Peta</span>
                          </button>
                        )}
                      </td>

                      {/* AKSI */}
                      <td className="py-3 px-2 text-center align-top space-y-1">
                        {canEditRow(item) ? (
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              onClick={() => onUbah(item)}
                              className={`p-1.5 rounded transition-colors ${
                                isLightRow
                                  ? 'bg-slate-800/10 hover:bg-slate-800/20 text-[#1B292F]'
                                  : 'bg-[#202D34] hover:bg-[#344650] text-[#8DC21F]'
                              }`}
                              title="Ubah Data Kegiatan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus data kegiatan intelijen ini?')) {
                                  onHapus(item.id);
                                }
                              }}
                              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"
                              title="Hapus Data Kegiatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Baca</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* B. Tampilan Kartu Responsif untuk Layar Sempit / Mobile (Zero Horizontal Scroll) */}
        <div className="md:hidden divide-y divide-[#374853]/60">
          {filteredData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-[#25333B] p-4 text-xs">
              <Filter className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p>Tidak ada data kegiatan yang cocok dengan kriteria filter.</p>
            </div>
          ) : (
            filteredData.map((item, index) => {
              const isLightRow = index % 2 === 0;
              const cardBg = isLightRow ? 'bg-[#DCE9D0] text-[#1B292F]' : 'bg-[#25333B] text-slate-100';

              return (
                <div key={item.id} className={`p-4 space-y-3 ${cardBg}`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-400/30">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8DC21F] text-[#1B292F] font-mono font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <SimbolSektor keterangan={item.keterangan_sektor} ukuran="sm" tampilkanLabel />
                    </div>

                    {canEditRow(item) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUbah(item)}
                          className="p-1.5 rounded bg-slate-800/10 hover:bg-slate-800/20"
                          title="Ubah"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Hapus data kegiatan?')) onHapus(item.id);
                          }}
                          className="p-1.5 rounded bg-rose-500/20 text-rose-700"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Narrative */}
                  <p className="font-serif text-xs leading-relaxed text-justify">
                    {item.uraian}
                  </p>

                  {/* Card Points */}
                  {item.poin_tambahan && item.poin_tambahan.length > 0 && (
                    <div className="pt-2 border-t border-slate-400/20 space-y-1 text-[11px]">
                      {item.poin_tambahan.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-1">
                          <span className="font-mono font-bold">{pIdx + 1}.</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Footer Info */}
                  <div className="pt-2 border-t border-slate-400/30 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Kec. {item.kecamatan}</span>
                      <span>·</span>
                      <span>{formatTanggalIndonesia(item.tanggal)}</span>
                    </div>
                    {item.lat && item.lng && (
                      <button
                        onClick={() => onViewOnMap(item)}
                        className="font-bold underline text-[#8DC21F]"
                      >
                        Lihat di Peta
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tabel Footer Info */}
        <div className="bg-[#1A262D] px-4 py-2.5 border-t border-[#374853] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Menampilkan <span className="font-mono font-bold text-white">{filteredData.length}</span> baris peristiwa untuk{' '}
            <span className="font-semibold text-[#8DC21F]">{selectedBidang}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Standar Format D.IN Kejaksaan RI · Baris hijau muda menandakan tampilan papan peta fisik
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabelSiadibibam;
