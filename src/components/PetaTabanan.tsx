/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Peta Papan Intelijen Kabupaten Tabanan (Slide D.IN.2 s.d. D.IN.6)
 * Menampilkan:
 * 1. Mode Papan Peta Asli (Sesuai Gambar):
 *    - Peta 10 kecamatan berwarna dengan garis penunjuk hijau ke 3 kartu (Peta Wilayah, Lambang Kejaksaan, Peristiwa Sektor)
 *    - Interaktif: Klik kecamatan untuk mengarahkan garis penunjuk & melihat detail kegiatan SIADIBIBAM
 * 2. Mode Peta Digital Geospasial (GeoJSON Tabanan Resmi):
 *    - Peta Leaflet dengan batas resmi GeoJSON dari Pemkab Tabanan & 100% bebas API Key (OpenStreetMap & ESRI)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { KegiatanPeta } from '../types';
import {
  BIDANG_CONFIG,
  SEKTOREN_CONFIG,
  KECAMATAN_TABANAN,
  KECAMATAN_COORDINATES,
  KecamatanTabanan,
  BidangIntelijen
} from '../config/symbols.config';
import { formatTanggalIndonesia, getTriwulan } from '../utils/formatters';
import { Filter, Layers, Navigation, RotateCcw, MapPin, Eye, Shield, CheckCircle2, Maximize2, X } from 'lucide-react';
import SimbolSektor from './SimbolSektor';

interface PetaTabananProps {
  kegiatanList: KegiatanPeta[];
  selectedKegiatan?: KegiatanPeta | null;
  onSelectKegiatan?: (kegiatan: KegiatanPeta) => void;
  onPickCoordinate?: (lat: number, lng: number) => void;
  isPickingCoordinate?: boolean;
}

// Koordinat relatif (persentase X, Y) untuk 10 kecamatan pada gambar peta resmi Tabanan (image_237736ac.png, 658x742)
const KECAMATAN_MAP_HOTSPOTS: Record<KecamatanTabanan, { x: number; y: number; color: string; labelPos?: string }> = {
  'Pupuan': { x: 33, y: 25, color: '#38BDF8' },
  'Baturiti': { x: 80, y: 25, color: '#F59E0B' },
  'Penebel': { x: 67, y: 45, color: '#EAB308' },
  'Marga': { x: 77, y: 57, color: '#EC4899' },
  'Selemadeg Barat': { x: 23, y: 58, color: '#84CC16' },
  'Selemadeg': { x: 42, y: 56, color: '#F97316' },
  'Selemadeg Timur': { x: 48, y: 62, color: '#94A3B8' },
  'Kerambitan': { x: 53, y: 74, color: '#3B82F6' },
  'Tabanan': { x: 67.5, y: 74, color: '#A855F7' }, // Pusat Kota Tabanan & Kantor Kejari Tabanan
  'Kediri': { x: 65, y: 83, color: '#22C55E' }
};

// 100% Free Tile Layers (Tidak Memerlukan API Key)
const TILE_PROVIDERS = {
  osm: {
    nama: 'OpenStreetMap Standar (Gratis)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors (100% Bebas API Key)',
    maxZoom: 19
  },
  satelit: {
    nama: 'Citra Satelit ESRI (Gratis)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar (Bebas API Key)',
    maxZoom: 18
  }
};

type TileType = keyof typeof TILE_PROVIDERS;
type MapMode = 'gambar' | 'digital';

export const PetaTabanan: React.FC<PetaTabananProps> = ({
  kegiatanList,
  selectedKegiatan,
  onSelectKegiatan,
  onPickCoordinate,
  isPickingCoordinate = false
}) => {
  // Mode tampilan: 'gambar' (Sesuai Gambar Papan Asli) atau 'digital' (Leaflet OpenStreetMap)
  const [mapMode, setMapMode] = useState<MapMode>('gambar');

  const [activeKecamatan, setActiveKecamatan] = useState<KecamatanTabanan>('Tabanan');
  const [filterBidang, setFilterBidang] = useState<string>('SEMUA');
  const [filterTriwulan, setFilterTriwulan] = useState<string>('SEMUA');
  const [filterKecamatan, setFilterKecamatan] = useState<string>('SEMUA');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  // Leaflet refs untuk mode digital
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geojsonLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeTile, setActiveTile] = useState<TileType>('osm');

  // Filter kegiatan berdasarkan bidang, triwulan, kecamatan
  const filteredKegiatan = useMemo(() => {
    return kegiatanList.filter((k) => {
      if (filterBidang !== 'SEMUA' && k.bidang !== filterBidang) return false;
      if (filterKecamatan !== 'SEMUA' && k.kecamatan !== filterKecamatan) return false;
      if (filterTriwulan !== 'SEMUA') {
        const tw = getTriwulan(k.tanggal);
        if (tw !== Number(filterTriwulan)) return false;
      }
      return true;
    });
  }, [kegiatanList, filterBidang, filterKecamatan, filterTriwulan]);

  // Kegiatan pada kecamatan yang sedang aktif dipilih di papan gambar
  const activeKecamatanKegiatan = useMemo(() => {
    return filteredKegiatan.filter((k) => k.kecamatan === activeKecamatan);
  }, [filteredKegiatan, activeKecamatan]);

  // Sektor dominan atau peristiwa aktif
  const currentEvent = activeKecamatanKegiatan[0] || filteredKegiatan[0] || null;

  // Sync jika ada selectedKegiatan dari luar
  useEffect(() => {
    if (selectedKegiatan) {
      setActiveKecamatan(selectedKegiatan.kecamatan);
    }
  }, [selectedKegiatan]);

  // Mode tampilan kolom kanan: 'asli' (3 Panel Simbol Besar D.IN.2 sesuai screenshot user) atau 'siadibibam' (Kartu Narasi 5W+1H)
  const [rightPanelMode, setRightPanelMode] = useState<'asli' | 'siadibibam'>('asli');

  // Dynamic continuous leader line calculations (bebas terputus & presisi pixel)
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const activeHotspotRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [leaderLines, setLeaderLines] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>>([]);

  const updateLeaderLines = () => {
    if (!boardContainerRef.current || !activeHotspotRef.current) {
      setLeaderLines([]);
      return;
    }

    const parentRect = boardContainerRef.current.getBoundingClientRect();
    const hotspotRect = activeHotspotRef.current.getBoundingClientRect();

    const startX = hotspotRect.left + hotspotRect.width / 2 - parentRect.left;
    const startY = hotspotRect.top + hotspotRect.height / 2 - parentRect.top;

    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];

    if (rightPanelMode === 'asli') {
      // Menghubungkan titik hotspot ke 3 panel grafis besar (sesuai format asli screenshot papan intelijen)
      [0, 1, 2].forEach((idx) => {
        const cardEl = cardRefs.current[idx];
        if (cardEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const endX = cardRect.left - parentRect.left;
          const endY = cardRect.top + cardRect.height / 2 - parentRect.top;

          lines.push({
            id: `asli-panel-${idx}`,
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY
          });
        }
      });
    } else {
      // Mode SIADIBIBAM: jumlah garis persis sama dengan jumlah kartu (0 jika nihil kegiatan)
      if (activeKecamatanKegiatan.length === 0) {
        setLeaderLines([]);
        return;
      }

      activeKecamatanKegiatan.slice(0, 3).forEach((item, idx) => {
        const cardEl = cardRefs.current[idx];
        if (cardEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const endX = cardRect.left - parentRect.left;
          const endY = cardRect.top + cardRect.height / 2 - parentRect.top;

          lines.push({
            id: item.id,
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY
          });
        }
      });
    }

    setLeaderLines(lines);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateLeaderLines();
    }, 60);

    const handleResize = () => {
      updateLeaderLines();
    };

    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (boardContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateLeaderLines();
      });
      resizeObserver.observe(boardContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [activeKecamatan, activeKecamatanKegiatan, mapMode, rightPanelMode]);

  // =========================================================================
  // LEAFLET DIGITAL MAP ENGINE (Untuk Mode Digital)
  // =========================================================================
  useEffect(() => {
    if (mapMode !== 'digital') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Koordinat tengah Kabupaten Tabanan, Bali (~ -8.465, 115.085)
    const map = L.map(mapContainerRef.current, {
      center: [-8.465, 115.085],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false
    });

    const baseTile = L.tileLayer(TILE_PROVIDERS.osm.url, {
      attribution: TILE_PROVIDERS.osm.attribution,
      maxZoom: TILE_PROVIDERS.osm.maxZoom
    }).addTo(map);

    activeTileLayerRef.current = baseTile;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const geoLayer = L.layerGroup().addTo(map);
    const markLayer = L.layerGroup().addTo(map);

    geojsonLayerRef.current = geoLayer;
    markersLayerRef.current = markLayer;
    mapInstanceRef.current = map;

    // Muat GeoJSON Tabanan resmi dari file /geo/tabanan.geojson yang baru diperbarui
    fetch('/geo/tabanan.geojson')
      .then((res) => res.json())
      .then((data) => {
        L.geoJSON(data, {
          style: {
            color: '#8DC21F',
            weight: 3.5,
            opacity: 0.95,
            fillColor: '#8DC21F',
            fillOpacity: 0.08,
            dashArray: '5, 5'
          }
        }).addTo(geoLayer);
      })
      .catch((err) => console.warn('GeoJSON load error:', err));

    // Pasang label 10 kecamatan
    Object.values(KECAMATAN_COORDINATES).forEach((coord) => {
      const labelIcon = L.divIcon({
        className: 'custom-kecamatan-label',
        html: `<div class="bg-[#1B292F]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-[#8DC21F]/70 whitespace-nowrap shadow-md">Kec. ${coord.nama}</div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      });
      L.marker([coord.lat, coord.lng], { icon: labelIcon, interactive: false }).addTo(geoLayer);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onPickCoordinate) {
        onPickCoordinate(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapMode, onPickCoordinate]);

  // Update marker di peta digital
  useEffect(() => {
    if (mapMode !== 'digital' || !markersLayerRef.current) return;
    const markLayer = markersLayerRef.current;
    markLayer.clearLayers();

    filteredKegiatan.forEach((item) => {
      const lat = item.lat ?? KECAMATAN_COORDINATES[item.kecamatan]?.lat;
      const lng = item.lng ?? KECAMATAN_COORDINATES[item.kecamatan]?.lng;
      if (!lat || !lng) return;

      const sCfg = SEKTOREN_CONFIG[item.keterangan_sektor];
      const kode = sCfg?.kodeHuruf || 'INT';
      const borderCol = sCfg?.warnaBorder || '#8DC21F';
      const bgCol = sCfg?.bgHex || '#1E293B';
      const fileName = sCfg?.fileName || 'politik.png';

      const customIcon = L.divIcon({
        className: 'custom-sector-marker',
        html: `
          <div style="background-color: ${bgCol}; border: 2px solid ${borderCol};"
               class="w-9 h-9 rounded-lg flex flex-col items-center justify-center p-0.5 relative cursor-pointer shadow-lg hover:scale-110 transition-transform">
            <img src="/symbols/${fileName}" alt="${item.keterangan_sektor}" class="w-6 h-6 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <span style="display:none; color:${borderCol};" class="font-mono font-bold text-[9px]">${kode}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markLayer);
      marker.bindPopup(`
        <div class="p-2.5 text-xs space-y-1 font-sans">
          <strong class="text-[#8DC21F] block text-sm">${item.keterangan_sektor}</strong>
          <p class="text-slate-200">${item.uraian}</p>
          <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-700">Kec. ${item.kecamatan} · ${formatTanggalIndonesia(item.tanggal)}</div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectKegiatan) onSelectKegiatan(item);
        setActiveKecamatan(item.kecamatan);
      });
    });
  }, [filteredKegiatan, mapMode, onSelectKegiatan]);

  // Titik hotspot terpilih pada gambar
  const activeHotspot = KECAMATAN_MAP_HOTSPOTS[activeKecamatan] || KECAMATAN_MAP_HOTSPOTS['Tabanan'];

  return (
    <div className="space-y-4 w-full">
      
      {/* 1. Toolbar Kontrol Peta & Mode Switcher */}
      <div className="bg-[#202D34] p-3.5 rounded-lg border border-[#374853] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
        
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold pr-2 border-r border-[#374853]">
            <Filter className="w-3.5 h-3.5 text-[#8DC21F]" />
            <span>Filter Papan:</span>
          </div>

          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value)}
            className="bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
          >
            <option value="SEMUA">Semua Bidang Intelijen</option>
            {Object.keys(BIDANG_CONFIG).map((b) => (
              <option key={b} value={b}>
                {BIDANG_CONFIG[b as BidangIntelijen].kodeSlide} - {b}
              </option>
            ))}
          </select>

          <select
            value={filterTriwulan}
            onChange={(e) => setFilterTriwulan(e.target.value)}
            className="bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
          >
            <option value="SEMUA">Semua Triwulan</option>
            <option value="1">Triwulan 1</option>
            <option value="2">Triwulan 2</option>
            <option value="3">Triwulan 3</option>
            <option value="4">Triwulan 4</option>
          </select>

          <select
            value={filterKecamatan}
            onChange={(e) => {
              setFilterKecamatan(e.target.value);
              if (e.target.value !== 'SEMUA') {
                setActiveKecamatan(e.target.value as KecamatanTabanan);
              }
            }}
            className="bg-[#2B3A42] border border-[#3E525E] text-slate-200 px-2.5 py-1.5 rounded-md focus:outline-none focus:border-[#8DC21F]"
          >
            <option value="SEMUA">Semua Kecamatan (10 Wilayah)</option>
            {KECAMATAN_TABANAN.map((k) => (
              <option key={k} value={k}>
                Kec. {k}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex p-1 bg-[#1A262D] rounded-lg border border-[#374853]">
            <button
              onClick={() => setMapMode('gambar')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                mapMode === 'gambar'
                  ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Papan Peta Resmi (Sesuai Gambar)</span>
            </button>
            <button
              onClick={() => setMapMode('digital')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                mapMode === 'digital'
                  ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Peta Digital (GeoJSON Resmi)</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. MODE 1: PAPAN PETA RESMI SESUAI GAMBAR ASLI D.IN.2 */}
      {mapMode === 'gambar' && (
        <div className="bg-[#2B3A42] border-2 border-[#374853] rounded-xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
          
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#374853] pb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#8DC21F] text-[#1B292F] text-xs font-mono font-extrabold px-2 py-0.5 rounded">
                SLIDE D.IN.2
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                PETA SEBARAN POTENSI INTELIJEN WILAYAH KABUPATEN TABANAN
              </h3>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">Wilayah Aktif:</span>
              <span className="font-bold text-[#8DC21F] bg-[#202D34] px-2 py-0.5 rounded border border-[#8DC21F]/40 font-mono">
                Kecamatan {activeKecamatan} ({activeKecamatanKegiatan.length} Kegiatan)
              </span>
            </div>
          </div>

          {/* Kecamatan Quick Selector Pills (Tanpa Scroll) */}
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Klik Kecamatan:</span>
            {KECAMATAN_TABANAN.map((kec) => {
              const isCurrent = activeKecamatan === kec;
              const count = kegiatanList.filter((k) => k.kecamatan === kec).length;
              return (
                <button
                  key={kec}
                  onClick={() => setActiveKecamatan(kec)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'bg-[#8DC21F] text-[#1B292F] border-[#8DC21F] font-bold shadow'
                      : 'bg-[#202D34] text-slate-300 border-[#3E525E] hover:text-white hover:bg-[#344650]'
                  }`}
                >
                  <span>{kec}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1 rounded-full font-bold ${
                      isCurrent ? 'bg-[#1B292F] text-[#8DC21F]' : 'bg-[#1A262D] text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Display: Map on the Left + Matching Leader Line Cards on the Right */}
          <div ref={boardContainerRef} className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px]">
            
            {/* SVG Continuous Solid Leader Lines (Menghubungkan titik kecamatan ke kartu secara solid, kontinu, tanpa terpotong) */}
            {leaderLines.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 hidden lg:block overflow-visible">
                <defs>
                  <filter id="solidLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#8DC21F" floodOpacity="0.85" />
                  </filter>
                </defs>
                {leaderLines.map((line) => (
                  <g key={line.id}>
                    {/* Ambient halo glow line */}
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#8DC21F"
                      strokeWidth="5"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                    />
                    {/* Solid continuous leader line (garis utuh, tebal, tidak terputus) */}
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#8DC21F"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      filter="url(#solidLineGlow)"
                    />
                    {/* Origin dot di pusat hotspot kecamatan */}
                    <circle
                      cx={line.x1}
                      cy={line.y1}
                      r="4.5"
                      fill="#8DC21F"
                      stroke="#1B292F"
                      strokeWidth="1.5"
                    />
                    {/* Target anchor dot di tepi kiri kartu peristiwa */}
                    <circle
                      cx={line.x2}
                      cy={line.y2}
                      r="5"
                      fill="#8DC21F"
                      stroke="#1B292F"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>
            )}

            {/* Left Section (col-span-7): The Tabanan Map */}
            <div className="lg:col-span-7 relative bg-[#202D34] rounded-lg border border-[#374853] overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 shadow-inner">
              <div className="relative w-full max-w-[540px] aspect-[658/742] flex items-center justify-center bg-[#182329] rounded-lg border border-[#32434D] shadow-md overflow-hidden">
                
                {/* Official Tabanan Map Image */}
                <img
                  src="/peta_tabanan_resmi.png"
                  alt="Peta Wilayah Kabupaten Tabanan"
                  className="w-full h-full object-contain select-none"
                  onError={(e) => {
                    // Fallback to asset path if needed
                    e.currentTarget.src = '/assets/aistudio/image_237736ac.png';
                  }}
                />

                {/* Zoom / Full Preview Button */}
                <button
                  type="button"
                  onClick={() => setIsZoomModalOpen(true)}
                  className="absolute bottom-2.5 right-2.5 z-20 bg-[#1B292F]/90 hover:bg-[#8DC21F] text-slate-200 hover:text-[#1B292F] p-1.5 rounded-md border border-[#3E525E] shadow transition-colors flex items-center gap-1 text-[10px] font-semibold"
                  title="Lihat Peta Resolusi Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perbesar Peta HD</span>
                </button>

                {/* Interactive Hotspot Overlay for the 10 Kecamatan */}
                {Object.entries(KECAMATAN_MAP_HOTSPOTS).map(([kecName, spot]) => {
                  const isCurrent = activeKecamatan === kecName;
                  const kecEvents = kegiatanList.filter((k) => k.kecamatan === kecName);
                  const hasEvents = kecEvents.length > 0;

                  return (
                    <button
                      key={kecName}
                      ref={isCurrent ? activeHotspotRef : undefined}
                      onClick={() => setActiveKecamatan(kecName as KecamatanTabanan)}
                      style={{
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="absolute z-20 group focus:outline-none"
                      title={`Kecamatan ${kecName} (${kecEvents.length} Kegiatan)`}
                    >
                      {/* Tactical Node Indicator */}
                      <div className="relative flex items-center justify-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform shadow-lg ${
                            isCurrent
                              ? 'scale-125 bg-[#8DC21F] border-white ring-4 ring-[#8DC21F]/50 animate-pulse'
                              : hasEvents
                              ? 'bg-slate-900 border-[#8DC21F] hover:scale-110'
                              : 'bg-slate-800/80 border-slate-400 hover:scale-110'
                          }`}
                        >
                          {hasEvents ? (
                            <span className="font-mono font-bold text-[9px] text-white">
                              {kecEvents.length}
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          )}
                        </span>

                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1B292F] text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded border border-[#8DC21F] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
                          Kec. {kecName}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Active Marker Highlight Ring */}
                <div
                  style={{
                    left: `${activeHotspot.x}%`,
                    top: `${activeHotspot.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute z-10 w-12 h-12 rounded-full border-2 border-dashed border-[#8DC21F] animate-spin pointer-events-none"
                  style-animation-duration="10s"
                />

              </div>
            </div>

            {/* Right Section (col-span-5): Panel Papan Intelijen dengan Simbol Besar & Tajam */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3 min-h-[520px]">
              
              {/* Tab Switcher Tampilan Kolom Kanan */}
              <div className="flex items-center justify-between pb-2 border-b border-[#374853] gap-2">
                <div className="inline-flex p-0.5 bg-[#1A262D] rounded-lg border border-[#374853] text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('asli')}
                    className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                      rightPanelMode === 'asli'
                        ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm font-extrabold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>🖼️ Format Gambar Asli (3 Panel D.IN.2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('siadibibam')}
                    className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                      rightPanelMode === 'siadibibam'
                        ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm font-extrabold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>📋 Register SIADIBIBAM</span>
                    <span className="font-mono text-[10px] bg-[#182329] text-[#8DC21F] px-1 rounded">
                      {activeKecamatanKegiatan.length}
                    </span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Kec. {activeKecamatan}
                </span>
              </div>

              {/* TAMPILAN A: 3 PANEL GAMBAR BESAR SESUAI FOTO PAPAN ASLI SLIDE D.IN.2 */}
              {rightPanelMode === 'asli' && (
                <div className="flex flex-col justify-between gap-3 h-full">
                  {/* Panel 1: Pengawasan Wilayah Teritorial (Peta NKRI) */}
                  <div
                    ref={(el) => { cardRefs.current[0] = el; }}
                    className="bg-[#202D34] rounded-lg border-2 border-[#8DC21F] p-3 shadow-md transition-all hover:bg-[#25363F] group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#374853]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8DC21F]"></span>
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                          1. PENGAWASAN WILAYAH TERITORIAL
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8DC21F] bg-[#1A262D] px-2 py-0.5 rounded border border-[#8DC21F]/40">
                        NKRI · TERITORIAL
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <SimbolSektor
                        keterangan="Pengawasan wilayah teritorial"
                        ukuran="lg"
                        allowZoom
                      />
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-200 block text-xs">
                          Peta Kedaulatan Wilayah Teritorial NKRI
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Pemantauan kedaulatan wilayah teritorial darat, laut pesisir Samudera Hindia, dan perbatasan wilayah Kabupaten Tabanan.
                        </p>
                        <span className="text-[10px] text-[#8DC21F] font-mono block">
                          Slide D.IN.1 · Kode: TER
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Pengamanan Sumber Daya Organisasi (Satya Adhi Wicaksana) */}
                  <div
                    ref={(el) => { cardRefs.current[1] = el; }}
                    className="bg-[#202D34] rounded-lg border-2 border-[#8DC21F] p-3 shadow-md transition-all hover:bg-[#25363F] group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#374853]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8DC21F]"></span>
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                          2. PENGAMANAN SUMBER DAYA ORGANISASI
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8DC21F] bg-[#1A262D] px-2 py-0.5 rounded border border-[#8DC21F]/40">
                        SATYA ADHI WICAKSANA
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <SimbolSektor
                        keterangan="Pengamanan Sumber Daya Organisasi"
                        ukuran="lg"
                        allowZoom
                      />
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-200 block text-xs">
                          Lambang Kejaksaan Republik Indonesia
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Pengamanan internal sumber daya organisasi Kejaksaan Negeri Tabanan, integritas aparatur, dan penguatan doktrin Satya Adhi Wicaksana.
                        </p>
                        <span className="text-[10px] text-[#8DC21F] font-mono block">
                          Slide D.IN.1 · Kode: SDO
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Simbol Sektor Peristiwa di Kecamatan {activeKecamatan} */}
                  {(() => {
                    const activeSektor = activeKecamatanKegiatan[0]?.keterangan_sektor || currentEvent?.keterangan_sektor || 'Politik';
                    const sCfg = SEKTOREN_CONFIG[activeSektor];

                    return (
                      <div
                        ref={(el) => { cardRefs.current[2] = el; }}
                        className="bg-[#202D34] rounded-lg border-2 border-[#8DC21F] p-3 shadow-md transition-all hover:bg-[#25363F] group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#374853]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#8DC21F]"></span>
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                              3. SEKTOR: {activeSektor.toUpperCase()}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: sCfg?.warnaBorder || '#8DC21F' }}>
                            Kec. {activeKecamatan}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <SimbolSektor
                            keterangan={activeSektor}
                            ukuran="lg"
                            allowZoom
                          />
                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-slate-200 block text-xs">
                              {activeKecamatanKegiatan.length > 0
                                ? `Fokus Peristiwa di Kec. ${activeKecamatan}`
                                : `Simbol Intelijen Sektor ${activeSektor}`}
                            </span>
                            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                              {activeKecamatanKegiatan.length > 0
                                ? activeKecamatanKegiatan[0].uraian
                                : `Kecamatan ${activeKecamatan} saat ini berstatus kondusif. Simbol ini mewakili pemetaan sektor ${activeSektor}.`}
                            </p>
                            {activeKecamatanKegiatan.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRightPanelMode('siadibibam')}
                                className="text-[10px] font-bold text-[#8DC21F] hover:underline flex items-center gap-1"
                              >
                                <span>Lihat detail {activeKecamatanKegiatan.length} kegiatan SIADIBIBAM &rarr;</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAMPILAN B: KARTU REGISTER SIADIBIBAM DENGAN SIMBOL BESAR */}
              {rightPanelMode === 'siadibibam' && (
                <>
                  {activeKecamatanKegiatan.length === 0 ? (
                    /* Tampilan jika NIHIL kegiatan di kecamatan ini */
                    <div className="bg-[#202D34] rounded-lg border border-[#374853] p-6 flex flex-col items-center justify-center text-center space-y-3.5 h-full my-auto shadow-md">
                      <div className="w-16 h-16 rounded-full bg-[#1B292F] border-2 border-[#8DC21F]/40 flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-8 h-8 text-[#8DC21F]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white tracking-wide">
                          Kecamatan {activeKecamatan}
                        </h4>
                        <span className="inline-block bg-[#8DC21F]/15 text-[#8DC21F] border border-[#8DC21F]/40 text-xs font-mono font-bold px-3 py-0.5 rounded-full">
                          Status: Nihil Peristiwa · Kondusif
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                        Tidak ada catatan peristiwa intelijen (SIADIBIBAM) di wilayah Kecamatan <strong>{activeKecamatan}</strong> pada filter yang dipilih.
                      </p>
                      <button
                        type="button"
                        onClick={() => setRightPanelMode('asli')}
                        className="px-3.5 py-1.5 bg-[#8DC21F] hover:bg-[#9dd824] text-[#1B292F] font-bold text-xs rounded-md shadow transition-colors"
                      >
                        Kembali ke Tampilan 3 Panel Gambar Asli
                      </button>
                    </div>
                  ) : (
                    /* Tampilan KETIKA ADA kegiatan: Kartu per kegiatan dengan Simbol Besar */
                    <div className="flex flex-col justify-between gap-3 h-full">
                      {activeKecamatanKegiatan.slice(0, 3).map((item, idx) => {
                        const isSelected = selectedKegiatan?.id === item.id;
                        return (
                          <div
                            key={item.id}
                            ref={(el) => { cardRefs.current[idx] = el; }}
                            onClick={() => onSelectKegiatan && onSelectKegiatan(item)}
                            className={`bg-[#202D34] rounded-lg border-2 transition-all p-3.5 shadow-md space-y-2.5 cursor-pointer ${
                              isSelected
                                ? 'border-[#8DC21F] bg-[#24353E] ring-2 ring-[#8DC21F]/40'
                                : 'border-[#8DC21F]/70 hover:border-[#8DC21F] hover:bg-[#25363F]'
                            }`}
                          >
                            {/* Header Kartu Kegiatan */}
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#374853]">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#8DC21F]"></span>
                                <span className="text-[11px] font-bold text-[#8DC21F] uppercase font-mono tracking-wider">
                                  Peristiwa {idx + 1}: {item.keterangan_sektor}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTanggalIndonesia(item.tanggal)}
                              </span>
                            </div>

                            {/* Konten Peristiwa dengan Simbol Ukuran Besar & Jelas */}
                            <div className="flex flex-col sm:flex-row items-start gap-3">
                              <SimbolSektor
                                keterangan={item.keterangan_sektor}
                                ukuran="md"
                                allowZoom
                              />
                              <div className="space-y-1 flex-1 min-w-0 text-xs">
                                <span className="font-bold text-white text-[12px] block truncate">{item.tempat}</span>
                                <span className="text-[10.5px] text-slate-400 font-mono block">
                                  Kec. {item.kecamatan} · Pukul {item.waktu} WITA
                                </span>
                                <p className="font-serif text-[11.5px] text-slate-200 leading-relaxed text-justify line-clamp-3 bg-[#1A262D] p-2 rounded border border-[#2B3A42] mt-1">
                                  {item.uraian}
                                </p>
                              </div>
                            </div>

                            {item.poin_tambahan && item.poin_tambahan.length > 0 && (
                              <div className="text-[10.5px] text-slate-300 font-sans space-y-0.5 pl-1 border-t border-[#374853]/60 pt-1.5">
                                {item.poin_tambahan.slice(0, 2).map((poin, pIdx) => (
                                  <div key={pIdx} className="truncate text-slate-300">
                                    • {poin}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Indikator jika kegiatan > 3 */}
                      {activeKecamatanKegiatan.length > 3 && (
                        <div className="text-center text-[11px] text-slate-400 font-mono bg-[#1A262D] py-1.5 rounded border border-[#2B3A42]">
                          + {activeKecamatanKegiatan.length - 3} kegiatan lainnya tercatat di Kec. {activeKecamatan}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

            </div>

          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-[#1A262D] p-3 rounded-lg border border-[#374853] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8DC21F]" />
              <span>Format tampilan peta meniru persis papan peta intelijen resmi Kejaksaan Negeri Tabanan (Slide D.IN.2).</span>
            </div>
            <div className="font-mono text-[11px] text-[#8DC21F]">
              10 Kecamatan Terpetakan · Bebas API Key
            </div>
          </div>

        </div>
      )}

      {/* 3. MODE 2: PETA DIGITAL GEOSPASIAL DENGAN GEOJSON TABANAN RESMI */}
      {mapMode === 'digital' && (
        <div className="space-y-3">
          {/* Layer switcher & status */}
          <div className="bg-[#202D34] p-3 rounded-lg border border-[#374853] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Peta Digital:</span>
              <span className="bg-[#8DC21F]/20 text-[#8DC21F] font-mono px-2 py-0.5 rounded border border-[#8DC21F]/40 font-bold">
                Batas Resmi GeoJSON Tabanan (OBJECTID: 263, Bali)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([-8.465, 115.085], 11, { duration: 1 });
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#2B3A42] hover:bg-[#344650] text-slate-200 rounded border border-[#3E525E]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8DC21F]" />
                <span>Pusatkan Tabanan</span>
              </button>
            </div>
          </div>

          {/* Leaflet Container (100% Free OpenStreetMap & GeoJSON Tabanan) */}
          <div className="relative w-full h-[540px] sm:h-[620px] rounded-lg border-2 border-[#374853] overflow-hidden shadow-2xl bg-[#202D34]">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Badge Peta Terbuka Bebas API Key */}
            <div className="absolute top-3 right-3 z-[400] bg-[#1A262D]/95 backdrop-blur border border-[#8DC21F] text-slate-100 text-[10px] font-bold px-3 py-1 rounded shadow-lg">
              OpenStreetMap Public Tile · 100% Gratis Tanpa API Key
            </div>

            {/* Notice jika mode klik koordinat aktif */}
            {isPickingCoordinate && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-amber-500 text-[#1B292F] font-bold px-4 py-1.5 rounded-full shadow-lg text-xs flex items-center gap-2 animate-bounce">
                <Navigation className="w-4 h-4" />
                <span>Klik di titik peta untuk memilih koordinat lokasi</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL PREVIEW PETA RESOLUSI PENUH (HD LIGHTBOX) */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative bg-[#1E2B32] border-2 border-[#8DC21F] rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-[#374853] bg-[#172227]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8DC21F]"></span>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Peta Wilayah 10 Kecamatan Kabupaten Tabanan (Resolusi Asli)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex items-center justify-center bg-[#10171B]/80 max-h-[calc(92vh-70px)]">
              <img
                src="/peta_tabanan_resmi.png"
                alt="Peta Wilayah Tabanan Resolusi Asli"
                className="max-w-full max-h-full object-contain rounded shadow-lg border border-slate-700/60"
                onError={(e) => {
                  e.currentTarget.src = '/assets/aistudio/image_237736ac.png';
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PetaTabanan;
