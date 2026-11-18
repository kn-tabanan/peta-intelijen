/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Aplikasi Papan Peta Intelijen Kejaksaan Negeri Tabanan (D.IN.1 s.d. D.IN.11)
 * 
 * Fitur:
 * - Autentikasi Berbasis Peran (Admin, Penginput, Pembaca)
 * - Papan Tabel SIADIBIBAM (5W+1H) per Bidang Intelijen
 * - Peta Interaktif Leaflet Kabupaten Tabanan dengan Simbol Sektor Intelijen
 * - Form Validasi Zod dengan Generator Draf Otomatis "Bahwa pada hari..."
 * - Penerangan & Penyuluhan Hukum 4 Kolom Triwulan & Galeri Dokumentasi
 * - Grafik Target vs Realisasi Penkum/Luhkum (D.IN.9)
 * - Grafik Rekapitulasi Perkara 4 Kategori & Sebaran Kecamatan (D.IN.11)
 * - Ekspor Slide Presentasi PPTX Resmi
 */

import React, { useState, useEffect } from 'react';
import HeaderPapan from './components/HeaderPapan';
import DashboardOverview from './components/DashboardOverview';
import TabelSiadibibam from './components/TabelSiadibibam';
import PetaTabanan from './components/PetaTabanan';
import PenkumLuhkumView from './components/PenkumLuhkumView';
import GrafikPenkum from './components/GrafikPenkum';
import GrafikPerkara from './components/GrafikPerkara';
import FormKegiatan from './components/FormKegiatan';
import LoginPage from './components/LoginPage';

import { dataService } from './services/dataService';
import { exportToPptx } from './services/pptxExportService';
import { getPerkaraProvider } from './services/perkaraProvider';
import { KegiatanPeta, PeneranganHukum, UserProfile, UserRole } from './types';
import { BidangIntelijen } from './config/symbols.config';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return dataService.getStoredSessionUser();
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBidang, setSelectedBidang] = useState<BidangIntelijen>(
    'Ideologi, Politik, Pertahanan dan Keamanan'
  );

  const [kegiatanList, setKegiatanList] = useState<KegiatanPeta[]>([]);
  const [penkumList, setPenkumList] = useState<PeneranganHukum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form modal states
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingKegiatan, setEditingKegiatan] = useState<KegiatanPeta | null>(null);

  // Peta focus state
  const [highlightedKegiatan, setHighlightedKegiatan] = useState<KegiatanPeta | null>(null);

  // PPTX export state
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Muat data kegiatan dan penkum
  const refreshData = async () => {
    try {
      const [kList, pList] = await Promise.all([
        dataService.getKegiatanList(),
        dataService.getPeneranganHukumList()
      ]);
      setKegiatanList(kList);
      setPenkumList(pList);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handler CRUD Kegiatan Peta
  const handleSaveKegiatan = async (data: Omit<KegiatanPeta, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    try {
      await dataService.saveKegiatan(data);
      setShowFormModal(false);
      setEditingKegiatan(null);
      await refreshData();
      showToast(data.id ? 'Perubahan kegiatan berhasil disimpan' : 'Kegiatan baru berhasil dicatat dalam papan');
    } catch (err: any) {
      alert('Gagal menyimpan kegiatan: ' + err.message);
    }
  };

  const handleDeleteKegiatan = async (id: string) => {
    try {
      await dataService.deleteKegiatan(id);
      await refreshData();
      showToast('Data kegiatan intelijen berhasil dihapus', 'info');
    } catch (err: any) {
      alert('Gagal menghapus kegiatan: ' + err.message);
    }
  };

  // Handler CRUD Penkum
  const handleSavePenkum = async (data: Omit<PeneranganHukum, 'id' | 'created_at'> & { id?: string }) => {
    try {
      await dataService.savePeneranganHukum(data);
      await refreshData();
      showToast('Data Penerangan/Penyuluhan Hukum berhasil disimpan');
    } catch (err: any) {
      alert('Gagal menyimpan penkum: ' + err.message);
    }
  };

  const handleDeletePenkum = async (id: string) => {
    try {
      await dataService.deletePeneranganHukum(id);
      await refreshData();
      showToast('Data Penkum/Luhkum dihapus', 'info');
    } catch (err: any) {
      alert('Gagal menghapus penkum: ' + err.message);
    }
  };

  // Handler Ekspor PPTX
  const handleExportPptx = async () => {
    try {
      setIsExporting(true);
      const provider = getPerkaraProvider();
      const perkaraRes = await provider.getPerkara(2023, 2026);
      const perkaraList = Array.isArray(perkaraRes) ? perkaraRes : perkaraRes.data;

      const fileName = await exportToPptx({
        kegiatanList,
        penkumList,
        perkaraList,
        tahun: 2025
      });

      showToast(`Slide PPTX berhasil diunduh: ${fileName}`);
    } catch (err: any) {
      console.error('Gagal mengekspor PPTX:', err);
      alert('Gagal mengekspor PPTX: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handler navigasi dari tabel ke peta
  const handleViewOnMap = (kegiatan: KegiatanPeta) => {
    setHighlightedKegiatan(kegiatan);
    setActiveTab('peta');
  };

  // Handler ganti peran
  const handleRoleSwitch = (newRole: UserRole) => {
    const updated = dataService.setCurrentUser(newRole);
    setCurrentUser(updated);
    showToast(`Peran dialihkan ke: ${newRole.toUpperCase()}`);
  };

  const handleLogout = () => {
    dataService.clearSessionUser();
    setCurrentUser(null);
  };

  // Jika belum login, tampilkan halaman Login
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          dataService.saveSessionUser(user);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#2B3A42] text-slate-100 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      
      {/* 1. Header Papan Tiga Zona */}
      <HeaderPapan
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Viewport (Overflow-x Hidden) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A262D] border border-[#8DC21F] text-slate-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#8DC21F] shrink-0" />
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            kegiatanList={kegiatanList}
            penkumList={penkumList}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectBidang={(b) => setSelectedBidang(b)}
          />
        )}

        {activeTab === 'tabel-bidang' && (
          <TabelSiadibibam
            kegiatanList={kegiatanList}
            currentUser={currentUser}
            selectedBidang={selectedBidang}
            onSelectBidang={setSelectedBidang}
            onTambah={() => {
              setEditingKegiatan(null);
              setShowFormModal(true);
            }}
            onUbah={(k) => {
              setEditingKegiatan(k);
              setShowFormModal(true);
            }}
            onHapus={handleDeleteKegiatan}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {activeTab === 'peta' && (
          <PetaTabanan
            kegiatanList={kegiatanList}
            selectedKegiatan={highlightedKegiatan}
            onSelectKegiatan={(k) => setHighlightedKegiatan(k)}
          />
        )}

        {activeTab === 'penkum' && (
          <PenkumLuhkumView
            penkumList={penkumList}
            currentUser={currentUser}
            onSavePenkum={handleSavePenkum}
            onDeletePenkum={handleDeletePenkum}
          />
        )}

        {activeTab === 'grafik-penkum' && (
          <GrafikPenkum penkumList={penkumList} />
        )}

        {activeTab === 'grafik-perkara' && (
          <GrafikPerkara penkumList={penkumList} />
        )}
      </main>

      {/* 3. Modal Form Tambah/Ubah Kegiatan SIADIBIBAM */}
      {showFormModal && (
        <FormKegiatan
          initialData={editingKegiatan}
          defaultBidang={selectedBidang}
          onSave={handleSaveKegiatan}
          onClose={() => {
            setShowFormModal(false);
            setEditingKegiatan(null);
          }}
        />
      )}

      {/* 4. Footer Resmi Kejaksaan */}
      <footer className="bg-[#1F2B32] border-t border-[#374853] py-4 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">KEJAKSAAN NEGERI TABANAN</span>
            <span>·</span>
            <span>Seksi Intelijen</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Papan Data Peta Intelijen (D.IN.1 s.d. D.IN.11) · Hak Cipta Terpelihara © {new Date().getFullYear()}
          </div>
        </div>
      </footer>

    </div>
  );
}
