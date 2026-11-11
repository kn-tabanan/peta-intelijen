/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Penerangan dan Penyuluhan Hukum (Slide D.IN.7 s.d. D.IN.8)
 * - Tampilan 4 kolom triwulan (Tema, Waktu, Tempat, Jumlah Peserta)
 * - Galeri Foto Dokumentasi per Triwulan dengan Keterangan Foto
 * - Form Tambah/Ubah Kegiatan Penkum & Luhkum
 */

import React, { useState } from 'react';
import { Plus, Users, Calendar, MapPin, Image as ImageIcon, Trash2, Edit3, X, Eye } from 'lucide-react';
import { PeneranganHukum, UserProfile } from '../types';
import { KECAMATAN_TABANAN, KecamatanTabanan } from '../config/symbols.config';
import { formatTanggalIndonesia, formatAngka } from '../utils/formatters';

interface PenkumLuhkumViewProps {
  penkumList: PeneranganHukum[];
  currentUser: UserProfile;
  onSavePenkum: (data: Omit<PeneranganHukum, 'id' | 'created_at'> & { id?: string }) => void;
  onDeletePenkum: (id: string) => void;
}

export const PenkumLuhkumView: React.FC<PenkumLuhkumViewProps> = ({
  penkumList,
  currentUser,
  onSavePenkum,
  onDeletePenkum
}) => {
  const [selectedTriwulan, setSelectedTriwulan] = useState<number | 'SEMUA'>('SEMUA');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PeneranganHukum | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; keterangan?: string } | null>(null);

  // Form states
  const [jenis, setJenis] = useState<'Penkum' | 'Luhkum'>('Penkum');
  const [triwulan, setTriwulan] = useState<1 | 2 | 3 | 4>(1);
  const [tahun, setTahun] = useState<number>(2025);
  const [temaInput, setTemaInput] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tempat, setTempat] = useState<string>('');
  const [kecamatan, setKecamatan] = useState<KecamatanTabanan>('Tabanan');
  const [jumlahPeserta, setJumlahPeserta] = useState<number>(50);
  const [target, setTarget] = useState<number>(1);
  const [fotoUrlInput, setFotoUrlInput] = useState<string>('');
  const [fotoKetInput, setFotoKetInput] = useState<string>('');
  const [fotoList, setFotoList] = useState<{ url: string; keterangan?: string }[]>([]);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'penginput';

  const openAddModal = (tw?: number) => {
    setEditingItem(null);
    setJenis('Penkum');
    setTriwulan((tw as 1 | 2 | 3 | 4) || 1);
    setTahun(2025);
    setTemaInput('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setTempat('');
    setKecamatan('Tabanan');
    setJumlahPeserta(50);
    setTarget(1);
    setFotoList([]);
    setShowModal(true);
  };

  const openEditModal = (item: PeneranganHukum) => {
    setEditingItem(item);
    setJenis(item.jenis);
    setTriwulan(item.triwulan);
    setTahun(item.tahun);
    setTemaInput((item.tema || []).join('; '));
    setTanggal(item.tanggal);
    setTempat(item.tempat);
    setKecamatan(item.kecamatan);
    setJumlahPeserta(item.jumlah_peserta);
    setTarget(item.target);
    setFotoList(item.foto_urls || []);
    setShowModal(true);
  };

  const handleAddFoto = () => {
    if (fotoUrlInput.trim()) {
      setFotoList([...fotoList, { url: fotoUrlInput.trim(), keterangan: fotoKetInput.trim() || undefined }]);
      setFotoUrlInput('');
      setFotoKetInput('');
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFotoList(fotoList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempat || !temaInput) return;

    const temaArray = temaInput.split(';').map(t => t.trim()).filter(Boolean);

    onSavePenkum({
      id: editingItem?.id,
      jenis,
      triwulan,
      tahun,
      tema: temaArray.length > 0 ? temaArray : [temaInput],
      tanggal,
      tempat,
      kecamatan,
      jumlah_peserta: Number(jumlahPeserta) || 0,
      target: Number(target) || 1,
      foto_urls: fotoList
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="bg-[#202D34] p-4 rounded-lg border border-[#374853] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#8DC21F] text-[#1B292F] text-xs font-mono font-extrabold px-2 py-0.5 rounded">
              SLIDE D.IN.7 s.d. D.IN.8
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#8DC21F] uppercase">
              PENERANGAN DAN PENYULUHAN HUKUM (PENKUM / LUHKUM)
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Data pembinaan masyarakat taat hukum, program Jaksa Masuk Sekolah (JMS), dan Jaksa Menyapa se-Kabupaten Tabanan.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#8DC21F] hover:bg-[#9dd824] text-[#1B292F] font-bold text-xs rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Penkum/Luhkum</span>
          </button>
        )}
      </div>

      {/* Triwulan Segmented Selector (Flex Wrap Tanpa Scroll) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setSelectedTriwulan('SEMUA')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            selectedTriwulan === 'SEMUA'
              ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm'
              : 'bg-[#202D34] text-slate-300 hover:text-white'
          }`}
        >
          Semua Triwulan (4 Kolom)
        </button>
        {[1, 2, 3, 4].map((tw) => (
          <button
            key={tw}
            onClick={() => setSelectedTriwulan(tw)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              selectedTriwulan === tw
                ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm'
                : 'bg-[#202D34] text-slate-300 hover:text-white'
            }`}
          >
            Triwulan {tw}
          </button>
        ))}
      </div>

      {/* 4 Kolom Triwulan Standar Papan Peta */}
      <div className={`grid grid-cols-1 ${selectedTriwulan === 'SEMUA' ? 'md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
        {[1, 2, 3, 4]
          .filter((tw) => selectedTriwulan === 'SEMUA' || selectedTriwulan === tw)
          .map((tw) => {
            const items = penkumList.filter((p) => p.triwulan === tw);
            const totalPeserta = items.reduce((acc, curr) => acc + curr.jumlah_peserta, 0);

            return (
              <div
                key={tw}
                className="bg-[#202D34] rounded-lg border border-[#374853] flex flex-col overflow-hidden shadow-md"
              >
                {/* Column Header */}
                <div className="bg-[#8DC21F] text-[#1B292F] px-4 py-2.5 font-bold flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider">
                    TRIWULAN {tw}
                  </span>
                  <span className="text-[11px] font-mono font-extrabold bg-[#1B292F] text-[#8DC21F] px-2 py-0.5 rounded">
                    {items.length} Kegiatan
                  </span>
                </div>

                {/* Sub-header metric */}
                <div className="bg-[#1A262D] px-4 py-2 border-b border-[#2B3A42] flex items-center justify-between text-[11px] text-slate-300">
                  <span>Total Peserta:</span>
                  <span className="font-mono font-bold text-[#8DC21F]">
                    {formatAngka(totalPeserta)} orang
                  </span>
                </div>

                {/* Column Content List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Belum ada data pada Triwulan {tw}
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#2B3A42] p-3 rounded-md border border-[#3E525E] space-y-2 text-xs relative group"
                      >
                        {/* Jenis Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              item.jenis === 'Penkum'
                                ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {item.jenis === 'Penkum' ? 'Penerangan Hukum' : 'Penyuluhan Hukum'}
                          </span>

                          {canEdit && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 hover:text-[#8DC21F] text-slate-400"
                                title="Ubah data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Hapus kegiatan ini?')) {
                                    onDeletePenkum(item.id);
                                  }
                                }}
                                className="p-1 hover:text-rose-400 text-slate-400"
                                title="Hapus data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Tema */}
                        <div className="font-semibold text-slate-100 leading-tight">
                          {(item.tema || []).map((t, idx) => (
                            <p key={idx}>{t}</p>
                          ))}
                        </div>

                        {/* Metadata: Waktu & Lokasi */}
                        <div className="pt-2 border-t border-[#374853] space-y-1 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{formatTanggalIndonesia(item.tanggal)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.tempat} (Kec. {item.kecamatan})</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-[#8DC21F]">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-mono">{formatAngka(item.jumlah_peserta)} Peserta</span>
                          </div>
                        </div>

                        {/* Galeri Foto Dokumentasi */}
                        {item.foto_urls && item.foto_urls.length > 0 && (
                          <div className="pt-2 border-t border-[#374853]">
                            <span className="text-[10px] text-slate-400 font-medium block mb-1">
                              Dokumentasi ({item.foto_urls.length} Foto):
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {item.foto_urls.map((foto, fIdx) => (
                                <div
                                  key={fIdx}
                                  onClick={() => setViewingPhoto(foto)}
                                  className="relative aspect-video rounded overflow-hidden cursor-pointer border border-[#3E525E] hover:border-[#8DC21F] group/foto"
                                >
                                  <img
                                    src={foto.url}
                                    alt={foto.keterangan || 'Dokumentasi Penkum'}
                                    className="w-full h-full object-cover transition-transform group-hover/foto:scale-105"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/foto:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Column Action Footer */}
                {canEdit && (
                  <div className="p-2.5 bg-[#1A262D] border-t border-[#374853]">
                    <button
                      onClick={() => openAddModal(tw)}
                      className="w-full py-1.5 text-xs text-center text-[#8DC21F] hover:bg-[#202D34] rounded transition-colors font-semibold"
                    >
                      + Tambah di TW {tw}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Modal Lightbox Foto Dokumentasi */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-[#202D34] rounded-lg border border-[#374853] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#2B3A42] flex items-center justify-between">
              <span className="text-xs font-bold text-white">Dokumentasi Kegiatan Intelijen</span>
              <button
                onClick={() => setViewingPhoto(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-black/60 p-2">
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.keterangan || 'Foto Dokumentasi'}
                className="max-h-[65vh] max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {viewingPhoto.keterangan && (
              <div className="p-3 bg-[#1A262D] text-xs text-slate-200">
                <span className="font-semibold text-[#8DC21F]">Keterangan:</span> {viewingPhoto.keterangan}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Input/Edit Penkum Luhkum */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#202D34] border border-[#3E525E] rounded-xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
            <div className="bg-[#1A262D] px-6 py-4 border-b border-[#2B3A42] flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Ubah Data Penerangan/Penyuluhan Hukum' : 'Tambah Kegiatan Penkum / Luhkum'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jenis Kegiatan</label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as 'Penkum' | 'Luhkum')}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                  >
                    <option value="Penkum">Penkum (Penerangan Hukum)</option>
                    <option value="Luhkum">Luhkum (Penyuluhan Hukum)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Triwulan Pelaksanaan</label>
                  <select
                    value={triwulan}
                    onChange={(e) => setTriwulan(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                  >
                    <option value={1}>Triwulan 1</option>
                    <option value={2}>Triwulan 2</option>
                    <option value={3}>Triwulan 3</option>
                    <option value={4}>Triwulan 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Tema / Materi Hukum</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pencegahan Korupsi Dana Desa; Penguatan BUMDes"
                  value={temaInput}
                  onChange={(e) => setTemaInput(e.target.value)}
                  className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Kecamatan</label>
                  <select
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value as KecamatanTabanan)}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                  >
                    {KECAMATAN_TABANAN.map((k) => (
                      <option key={k} value={k}>
                        Kecamatan {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tempat / Lokasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Aula Kantor Camat Penebel"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Jumlah Peserta Hadir (Orang)</label>
                  <input
                    type="number"
                    min={0}
                    value={jumlahPeserta}
                    onChange={(e) => setJumlahPeserta(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Foto Dokumentasi Upload / URL */}
              <div className="space-y-2 pt-2 border-t border-[#2B3A42]">
                <label className="block font-semibold">Foto Dokumentasi Kegiatan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL foto (atau simpan dari Supabase Storage)..."
                    value={fotoUrlInput}
                    onChange={(e) => setFotoUrlInput(e.target.value)}
                    className="flex-1 bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Keterangan foto..."
                    value={fotoKetInput}
                    onChange={(e) => setFotoKetInput(e.target.value)}
                    className="w-48 bg-[#2B3A42] border border-[#3E525E] p-2 rounded text-slate-100 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFoto}
                    className="px-3 py-2 bg-[#8DC21F] text-[#1B292F] font-bold rounded"
                  >
                    Tambah
                  </button>
                </div>

                {fotoList.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {fotoList.map((f, i) => (
                      <div key={i} className="relative rounded border border-[#3E525E] p-1 bg-[#1A262D]">
                        <img src={f.url} alt="Pratinjau" className="h-16 w-full object-cover rounded" />
                        <p className="text-[10px] text-slate-300 truncate mt-1">{f.keterangan || 'Foto'}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFoto(i)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#2B3A42] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#2B3A42] text-slate-300 rounded font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8DC21F] text-[#1B292F] font-bold rounded shadow-md"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenkumLuhkumView;
