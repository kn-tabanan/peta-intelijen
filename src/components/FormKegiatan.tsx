/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Form Input & Edit Kegiatan Intelijen (SIADIBIBAM 5W+1H)
 * Sesuai format standar intelijen Kejaksaan RI:
 * - Pratinjau Simbol Sektor Otomatis (Read-Only)
 * - Pemilihan Bidang & Sektor Terikat
 * - Generator Otomatis Draf Kalimat Narasi Intelijen "Bahwa pada hari..."
 * - Peringatan Keamanan Data Sensitif (Anti-PII yang tidak perlu)
 * - Pemilihan Titik Koordinat dari Kecamatan atau Klik Peta
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { KegiatanPeta } from '../types';
import {
  BIDANG_CONFIG,
  SEKTOREN_CONFIG,
  BidangIntelijen,
  KeteranganSektor,
  KECAMATAN_TABANAN,
  KecamatanTabanan,
  KECAMATAN_COORDINATES
} from '../config/symbols.config';
import SimbolSektor from './SimbolSektor';
import { formatTanggalIndonesia, generateDraftUraian } from '../utils/formatters';
import { kegiatanFormSchema } from '../utils/formValidation';

interface FormKegiatanProps {
  initialData?: KegiatanPeta | null;
  defaultBidang?: BidangIntelijen;
  onSave: (data: Omit<KegiatanPeta, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  onClose: () => void;
}

export const FormKegiatan: React.FC<FormKegiatanProps> = ({
  initialData,
  defaultBidang = 'Ideologi, Politik, Pertahanan dan Keamanan',
  onSave,
  onClose
}) => {
  const [bidang, setBidang] = useState<BidangIntelijen>(
    initialData?.bidang || defaultBidang
  );

  // Keterangan sektor default berdasarkan bidang yang dipilih
  const availableSektors = BIDANG_CONFIG[bidang].sektorList;
  const [keteranganSektor, setKeteranganSektor] = useState<KeteranganSektor>(
    initialData?.keterangan_sektor || availableSektors[0]
  );

  const [tanggal, setTanggal] = useState<string>(
    initialData?.tanggal || new Date().toISOString().split('T')[0]
  );
  const [waktu, setWaktu] = useState<string>(
    initialData?.waktu || '09.00 WITA'
  );
  const [tempat, setTempat] = useState<string>(
    initialData?.tempat || ''
  );
  const [kecamatan, setKecamatan] = useState<KecamatanTabanan>(
    initialData?.kecamatan || 'Tabanan'
  );
  const [lat, setLat] = useState<number | undefined>(
    initialData?.lat ?? KECAMATAN_COORDINATES['Tabanan'].lat
  );
  const [lng, setLng] = useState<number | undefined>(
    initialData?.lng ?? KECAMATAN_COORDINATES['Tabanan'].lng
  );
  const [uraian, setUraian] = useState<string>(
    initialData?.uraian || ''
  );
  const [poinTambahan, setPoinTambahan] = useState<string[]>(
    initialData?.poin_tambahan || []
  );
  const [newPoinText, setNewPoinText] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sinkronkan sektor jika bidang berganti
  const handleBidangChange = (newBidang: BidangIntelijen) => {
    setBidang(newBidang);
    const newSektors = BIDANG_CONFIG[newBidang].sektorList;
    setKeteranganSektor(newSektors[0]);
  };

  // Sinkronkan koordinat ketika kecamatan berganti
  const handleKecamatanChange = (newKec: KecamatanTabanan) => {
    setKecamatan(newKec);
    const coord = KECAMATAN_COORDINATES[newKec];
    if (coord) {
      setLat(coord.lat);
      setLng(coord.lng);
    }
  };

  // Generator otomatis draf narasi intelijen
  const handleGenerateDraft = () => {
    const draft = generateDraftUraian({
      tanggal,
      tempat,
      sektor: keteranganSektor,
      kecamatan
    });
    setUraian(draft);
  };

  const handleAddPoin = () => {
    if (newPoinText.trim()) {
      setPoinTambahan([...poinTambahan, newPoinText.trim()]);
      setNewPoinText('');
    }
  };

  const handleRemovePoin = (index: number) => {
    setPoinTambahan(poinTambahan.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi dengan Zod
    const result = kegiatanFormSchema.safeParse({
      bidang,
      keterangan_sektor: keteranganSektor,
      tanggal,
      waktu,
      tempat,
      uraian,
      poin_tambahan: poinTambahan,
      kecamatan,
      lat,
      lng
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      id: initialData?.id,
      bidang,
      keterangan_sektor: keteranganSektor,
      tanggal,
      waktu,
      tempat,
      uraian: uraian.trim(),
      poin_tambahan: poinTambahan,
      kecamatan,
      lat,
      lng
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#202D34] border border-[#3E525E] rounded-xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#1A262D] px-6 py-4 border-b border-[#2B3A42] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#8DC21F] text-[#1B292F] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                SIADIBIBAM (5W+1H)
              </span>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Ubah Data Kegiatan Intelijen' : 'Input Kegiatan Peta Intelijen'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Standar Format Register Papan Peta Kejaksaan Negeri Tabanan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#2B3A42]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-200">
          
          {/* Peringatan Keamanan & Kerahasiaan Data (Anti-PII) */}
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200 leading-relaxed">
              <strong className="font-semibold text-amber-300">PEMBERITAHUAN KERAHASIAAN INTELIJEN:</strong>
              <p className="mt-0.5">
                Data peta intelijen bersifat rahasia/terbatas. Sesuai regulasi, identitas pihak/sasaran dimasukkan berupa inisial atau teks bebas dalam uraian narasi. <strong>Dilarang mencantumkan NIK, alamat pribadi spesifik, atau data pribadi yang tidak perlu.</strong>
              </p>
            </div>
          </div>

          {/* 1. Bidang & Keterangan Sektor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Bidang Intelijen (Sesuai Slide D.IN) <span className="text-rose-400">*</span>
              </label>
              <select
                value={bidang}
                onChange={(e) => handleBidangChange(e.target.value as BidangIntelijen)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              >
                {Object.keys(BIDANG_CONFIG).map((b) => (
                  <option key={b} value={b}>
                    {BIDANG_CONFIG[b as BidangIntelijen].kodeSlide} - {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Keterangan Sektor <span className="text-rose-400">*</span>
              </label>
              <select
                value={keteranganSektor}
                onChange={(e) => setKeteranganSektor(e.target.value as KeteranganSektor)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              >
                {availableSektors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Pratinjau Simbol Sektor (READ-ONLY SESUAI SPESIFIKASI) */}
          <div className="bg-[#1A262D] border border-[#374853] rounded-lg p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SimbolSektor keterangan={keteranganSektor} ukuran="lg" />
              <div>
                <span className="text-[10px] font-mono text-[#8DC21F] uppercase font-bold tracking-wider">
                  Pratinjau Simbol Sektor (Read-Only)
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {keteranganSektor}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aset tetap: <code className="font-mono text-slate-300">/public/symbols/{SEKTOREN_CONFIG[keteranganSektor]?.fileName}</code>
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block">Sandi Sektor</span>
              <span className="font-mono font-bold text-sm text-[#8DC21F]">
                {SEKTOREN_CONFIG[keteranganSektor]?.kodeHuruf}
              </span>
            </div>
          </div>

          {/* 3. Waktu & Lokasi Peristiwa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Tanggal Peristiwa <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              />
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {formatTanggalIndonesia(tanggal)}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Waktu Pelaksanaan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="09.30 WITA"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              />
              {errors.waktu && <p className="text-[10px] text-rose-400 mt-0.5">{errors.waktu}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Kecamatan (Kab. Tabanan) <span className="text-rose-400">*</span>
              </label>
              <select
                value={kecamatan}
                onChange={(e) => handleKecamatanChange(e.target.value as KecamatanTabanan)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              >
                {KECAMATAN_TABANAN.map((k) => (
                  <option key={k} value={k}>
                    Kecamatan {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Lokasi Spesifik & Titik Koordinat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Tempat / Lokasi Spesifik <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kantor Camat Kediri, Jl. Raya Kediri-Tanah Lot"
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              />
              {errors.tempat && <p className="text-[10px] text-rose-400 mt-0.5">{errors.tempat}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Koordinat Peta (Lat, Lng)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  value={lat ?? ''}
                  onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-1/2 bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-1.5 rounded text-[11px] font-mono focus:outline-none focus:border-[#8DC21F]"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  value={lng ?? ''}
                  onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-1/2 bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-1.5 rounded text-[11px] font-mono focus:outline-none focus:border-[#8DC21F]"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Otomatis dari titik tengah kecamatan</p>
            </div>
          </div>

          {/* 5. Uraian Narasi SIADIBIBAM (5W+1H) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Uraian Narasi SIADIBIBAM (Awalan wajib "Bahwa ...") <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateDraft}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#8DC21F]/15 hover:bg-[#8DC21F]/25 text-[#8DC21F] rounded text-[11px] font-semibold transition-colors"
                title="Buat draf kalimat otomatis berdasarkan tanggal, tempat, dan sektor"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buat Draf Kalimat Kejaksaan</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Bahwa pada hari ..., tanggal ..., bertempat di ..., telah dilaksanakan ..."
              className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-3 rounded-md font-serif text-[13px] leading-relaxed focus:outline-none focus:border-[#8DC21F]"
            />
            {errors.uraian && <p className="text-[10px] text-rose-400">{errors.uraian}</p>}
          </div>

          {/* 6. Poin-poin Tambahan Bernomor */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 block">
              Poin-poin Tambahan Bernomor (Opsional untuk butir kesimpulan / rekomendasi)
            </label>

            {poinTambahan.length > 0 && (
              <div className="space-y-1.5 bg-[#1A262D] p-3 rounded-md border border-[#2B3A42]">
                {poinTambahan.map((pt, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                    <span className="font-mono text-[#8DC21F] font-bold shrink-0">{idx + 1}.</span>
                    <span className="flex-1 text-slate-200">{pt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoin(idx)}
                      className="text-slate-400 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tambahkan butir keterangan bernomor..."
                value={newPoinText}
                onChange={(e) => setNewPoinText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPoin();
                  }
                }}
                className="flex-1 bg-[#2B3A42] border border-[#3E525E] text-slate-100 p-2 rounded-md focus:outline-none focus:border-[#8DC21F]"
              />
              <button
                type="button"
                onClick={handleAddPoin}
                className="px-3 py-2 bg-[#344650] hover:bg-[#3E525E] text-slate-200 rounded-md font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Poin</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-[#2B3A42] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2B3A42] hover:bg-[#344650] text-slate-300 rounded-md font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#8DC21F] hover:bg-[#9dd824] active:bg-[#7db019] text-[#1B292F] font-bold rounded-md shadow-md transition-colors"
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan ke Papan Peta'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormKegiatan;
