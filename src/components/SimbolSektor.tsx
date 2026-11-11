/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Komponen SimbolSektor
 * Memetakan keterangan_sektor intelijen ke aset simbol di /public/symbols/{slug}.png
 * Menampilkan simbol dalam ukuran besar, proporsional, dan tajam sesuai standar papan peta D.IN.
 * Dilengkapi fitur klik untuk perbesar (lightbox modal HD) agar semua detail ilustrasi dan teks terbaca jelas.
 */

import React, { useState, useEffect } from 'react';
import { SEKTOREN_CONFIG, KeteranganSektor } from '../config/symbols.config';
import { Maximize2, X, Shield, Info } from 'lucide-react';

interface SimbolSektorProps {
  keterangan: KeteranganSektor | string;
  ukuran?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tampilkanLabel?: boolean;
  className?: string;
  mode?: 'badge' | 'table' | 'map' | 'preview';
  allowZoom?: boolean;
}

export const SimbolSektor: React.FC<SimbolSektorProps> = ({
  keterangan,
  ukuran = 'md',
  tampilkanLabel = false,
  className = '',
  mode = 'badge',
  allowZoom = true
}) => {
  const [imgError, setImgError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [keterangan]);

  // Ambil konfigurasi berdasarkan keterangan_sektor
  const config = SEKTOREN_CONFIG[keterangan as KeteranganSektor] || {
    keterangan: keterangan as KeteranganSektor,
    bidang: 'Ideologi, Politik, Pertahanan dan Keamanan',
    slug: 'sektor-lainnya',
    fileName: 'sektor-lainnya.png',
    labelPendek: (keterangan || 'SEKTOR').slice(0, 12).toUpperCase(),
    kodeHuruf: (keterangan || 'SEK').slice(0, 3).toUpperCase(),
    warnaBadge: 'bg-slate-800 text-slate-200 border-slate-600',
    warnaTeks: '#94A3B8',
    warnaBorder: '#64748B',
    bgHex: '#1E293B',
    svgIconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  // Ukuran dimensi container proporsional (landscape lebar agar detail gambar terlihat jelas)
  const sizeMap = {
    sm: {
      box: 'w-28 h-18 sm:w-32 sm:h-20',
      img: 'p-1',
      icon: 'w-7 h-7',
      label: 'text-[11px]'
    },
    md: {
      box: 'w-44 h-26 sm:w-48 sm:h-28',
      img: 'p-1.5',
      icon: 'w-9 h-9',
      label: 'text-xs font-bold'
    },
    lg: {
      box: 'w-60 h-36 sm:w-68 sm:h-40',
      img: 'p-2',
      icon: 'w-12 h-12',
      label: 'text-sm font-extrabold'
    },
    xl: {
      box: 'w-72 h-44 sm:w-80 sm:h-48',
      img: 'p-2',
      icon: 'w-14 h-14',
      label: 'text-base font-extrabold'
    },
    hero: {
      box: 'w-full h-48 sm:h-56',
      img: 'p-2.5',
      icon: 'w-16 h-16',
      label: 'text-base font-extrabold'
    }
  };

  const currentSize = sizeMap[ukuran] || sizeMap.md;
  const imageSrc = `/symbols/${config.fileName}`;

  return (
    <>
      <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
        <div
          onClick={() => allowZoom && setIsZoomOpen(true)}
          className={`group relative shrink-0 flex items-center justify-center rounded-lg border-2 shadow-lg transition-all overflow-hidden bg-[#182329] ${
            allowZoom ? 'cursor-pointer hover:border-[#8DC21F] hover:shadow-[#8DC21F]/20' : ''
          } ${currentSize.box}`}
          style={{
            borderColor: config.warnaBorder,
            backgroundColor: config.bgHex || '#182329'
          }}
          title={`${config.keterangan} - Klik untuk memperbesar (HD)`}
        >
          {!imgError ? (
            <img
              src={imageSrc}
              alt={config.keterangan}
              className={`w-full h-full object-contain select-none group-hover:scale-105 transition-transform duration-200 ${currentSize.img}`}
              style={{ imageRendering: 'auto' }}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            // Tactical fallback placeholder box when image cannot be displayed
            <div className="flex flex-col items-center justify-center p-2 text-center w-full h-full select-none">
              <svg
                className={`${currentSize.icon} shrink-0 mb-1`}
                style={{ color: config.warnaTeks }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.svgIconPath} />
              </svg>
              <span
                className="font-mono font-bold text-xs leading-tight truncate px-1 max-w-full"
                style={{ color: config.warnaTeks }}
              >
                {config.kodeHuruf}
              </span>
            </div>
          )}

          {/* Quick Zoom Icon Overlay on Hover */}
          {allowZoom && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="bg-[#1B292F]/90 text-[#8DC21F] border border-[#8DC21F] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                <Maximize2 className="w-3 h-3" />
                <span>Perbesar HD</span>
              </span>
            </div>
          )}

          {/* Tactical sector code pip */}
          <div
            className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl font-mono font-extrabold text-[9px] text-white shadow-sm"
            style={{ backgroundColor: config.warnaBorder }}
          >
            {config.kodeHuruf}
          </div>
        </div>

        {tampilkanLabel && (
          <div className="flex flex-col items-start max-w-full leading-tight">
            <span className="font-bold text-xs leading-snug text-inherit">
              {config.keterangan}
            </span>
            <span
              className="text-[10px] font-mono tracking-tight font-semibold mt-0.5"
              style={{ color: config.warnaTeks }}
            >
              {config.labelPendek}
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Modal HD jika simbol diklik */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[1500] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative bg-[#1E2B32] border-2 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            style={{ borderColor: config.warnaBorder }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#374853]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.warnaBorder }}
                />
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Simbol Sektor Intelijen Kejaksaan RI
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {config.keterangan}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gambar Besar HD */}
            <div
              className="relative w-full aspect-[16/10] max-h-72 flex items-center justify-center rounded-lg border-2 shadow-inner overflow-hidden p-3"
              style={{
                borderColor: config.warnaBorder,
                backgroundColor: config.bgHex || '#182329'
              }}
            >
              <img
                src={imageSrc}
                alt={config.keterangan}
                className="w-full h-full object-contain drop-shadow-md select-none"
              />
            </div>

            {/* Info Metadata */}
            <div className="bg-[#162126] p-3 rounded-lg border border-[#2B3A42] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bidang Intelijen:</span>
                <span className="font-bold text-slate-200 text-right">{config.bidang}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sandi Kode:</span>
                <span
                  className="font-mono font-extrabold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: config.warnaBorder }}
                >
                  {config.kodeHuruf} · {config.labelPendek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nama Aset:</span>
                <code className="font-mono text-[11px] text-[#8DC21F] bg-[#1E2B32] px-1.5 py-0.5 rounded">
                  /public/symbols/{config.fileName}
                </code>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Sesuai format baku papan peta D.IN Intelijen Kejaksaan RI.</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="px-3 py-1 bg-[#2B3A42] hover:bg-[#344650] text-slate-200 rounded font-semibold text-xs border border-[#3E525E]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimbolSektor;
