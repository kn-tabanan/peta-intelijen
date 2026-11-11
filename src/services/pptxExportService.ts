/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PPTX Export Service menggunakan pptxgenjs
 * Menghasilkan deck presentasi resmi dengan tata letak meniru papan peta fisik asli:
 * - Slide Cover Papan Data Intelijen
 * - Slide Tabel per Bidang (D.IN.1, D.IN.3, D.IN.4, D.IN.5, D.IN.6)
 * - Slide Peta dan Sebaran Wilayah (D.IN.2)
 * - Slide Penerangan & Penyuluhan Hukum (D.IN.7 - D.IN.8)
 * - Slide Grafik Capaian Penkum & Luhkum (D.IN.9)
 * - Slide Grafik Perkara Kejari Tabanan (D.IN.11)
 */

import PptxGenJS from 'pptxgenjs';
import { KegiatanPeta, PeneranganHukum, PerkaraStatTahun } from '../types';
import { BIDANG_CONFIG, SEKTOREN_CONFIG, KECAMATAN_TABANAN, BidangIntelijen } from '../config/symbols.config';
import { formatTanggalIndonesia } from '../utils/formatters';

export async function exportToPptx(params: {
  kegiatanList: KegiatanPeta[];
  penkumList: PeneranganHukum[];
  perkaraList: PerkaraStatTahun[];
  tahun?: number;
}) {
  const { kegiatanList, penkumList, perkaraList, tahun = 2025 } = params;
  const pptx = new PptxGenJS();

  // Layout 16:9 Widescreen standard
  pptx.layout = 'LAYOUT_16x9';

  // Tema Warna Papan Peta Asli
  const BG_COLOR = '2B3A42'; // Latar gelap kebiruan papan peta
  const ACCENT_GREEN = '8DC21F'; // Hijau khas Kejaksaan RI
  const ROW_LIGHT_GREEN = 'DCE9D0'; // Baris hijau muda
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_DARK = '1A202C';

  // Helper membuat slide dengan kop resmi Kejaksaan
  const createBaseSlide = (slideTitle: string, kodeSlide: string) => {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    // Header Bar Hijau
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.35,
      w: 12.33,
      h: 0.9,
      fill: { color: '202D34' },
      line: { color: ACCENT_GREEN, width: 2 }
    });

    // Teks Logo & Satuan Kerja
    slide.addText('KEJAKSAAN REPUBLIK INDONESIA', {
      x: 0.7,
      y: 0.45,
      w: 8.0,
      h: 0.3,
      fontFace: 'Arial',
      fontSize: 10,
      color: ACCENT_GREEN,
      bold: true
    });

    slide.addText(`KEJAKSAAN NEGERI TABANAN - SEKSI INTELIJEN`, {
      x: 0.7,
      y: 0.7,
      w: 8.0,
      h: 0.4,
      fontFace: 'Arial',
      fontSize: 13,
      color: TEXT_WHITE,
      bold: true
    });

    // Kode Papan Slide di pojok kanan (contoh: D.IN.1)
    slide.addShape(pptx.ShapeType.rect, {
      x: 11.2,
      y: 0.45,
      w: 1.4,
      h: 0.65,
      fill: { color: ACCENT_GREEN },
      align: 'center'
    });

    slide.addText(kodeSlide, {
      x: 11.2,
      y: 0.48,
      w: 1.4,
      h: 0.6,
      fontFace: 'Arial',
      fontSize: 14,
      color: '1B292F',
      bold: true,
      align: 'center'
    });

    // Judul Papan Slide
    slide.addText(slideTitle.toUpperCase(), {
      x: 0.5,
      y: 1.35,
      w: 12.33,
      h: 0.45,
      fontFace: 'Arial',
      fontSize: 15,
      color: ACCENT_GREEN,
      bold: true
    });

    // Footer Papan
    slide.addText(`Papan Data Peta Intelijen Kabupaten Tabanan · Klasifikasi: RAHASIA / TERBATAS`, {
      x: 0.5,
      y: 7.1,
      w: 9.0,
      h: 0.3,
      fontFace: 'Arial',
      fontSize: 9,
      color: '94A3B8'
    });

    return slide;
  };

  // ===========================================================================
  // SLIDE 1: COVER PAPAN DATA PETA INTELIJEN
  // ===========================================================================
  const slideCover = pptx.addSlide();
  slideCover.background = { color: BG_COLOR };

  slideCover.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 11.73,
    h: 5.9,
    fill: { color: '202D34' },
    line: { color: ACCENT_GREEN, width: 3 }
  });

  slideCover.addText('KEJAKSAAN REPUBLIK INDONESIA\nKEJAKSAAN TINGGI BALI\nKEJAKSAAN NEGERI TABANAN', {
    x: 1.2,
    y: 1.3,
    w: 11.0,
    h: 1.2,
    fontFace: 'Arial',
    fontSize: 16,
    color: ACCENT_GREEN,
    bold: true,
    align: 'center'
  });

  slideCover.addText('PAPAN DATA PETA INTELIJEN\n(D.IN.1 s.d. D.IN.11)', {
    x: 1.2,
    y: 2.7,
    w: 11.0,
    h: 1.5,
    fontFace: 'Arial',
    fontSize: 28,
    color: TEXT_WHITE,
    bold: true,
    align: 'center'
  });

  slideCover.addText(`KABUPATEN TABANAN - PROVINSI BALI\nTAHUN ANGGARAN ${tahun}`, {
    x: 1.2,
    y: 4.4,
    w: 11.0,
    h: 0.8,
    fontFace: 'Arial',
    fontSize: 14,
    color: ROW_LIGHT_GREEN,
    align: 'center'
  });

  slideCover.addText('SEKSI INTELIJEN KEJAKSAAN NEGERI TABANAN\nJL. PAHLAWAN NO. 1 TABANAN, BALI', {
    x: 1.2,
    y: 5.4,
    w: 11.0,
    h: 0.6,
    fontFace: 'Arial',
    fontSize: 11,
    color: '94A3B8',
    align: 'center'
  });

  // ===========================================================================
  // SLIDE 2 - 6: TABEL SIADIBIBAM PER BIDANG (D.IN.1, D.IN.3, D.IN.4, D.IN.5, D.IN.6)
  // ===========================================================================
  const daftarBidang: BidangIntelijen[] = [
    'Ideologi, Politik, Pertahanan dan Keamanan',
    'Sosial, Budaya dan Kemasyarakatan',
    'Ekonomi dan Keuangan',
    'Pengamanan dan Pembangunan Strategis',
    'Teknologi Informasi dan Produksi Intelijen'
  ];

  daftarBidang.forEach((bidangKey) => {
    const bConfig = BIDANG_CONFIG[bidangKey];
    const items = kegiatanList.filter(k => k.bidang === bidangKey);
    const slide = createBaseSlide(bConfig.judulPapan, bConfig.kodeSlide);

    // Format Header Tabel Persis Papan Peta Asli
    const tableHeader = [
      { text: 'NO', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } },
      { text: 'SIMBOL SEKTOR', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } },
      { text: 'SIADIBIBAM (5W+1H) / URAIAN PERISTIWA', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } },
      { text: 'KETERANGAN & WILAYAH', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } }
    ];

    const tableRows = items.length > 0 ? items.map((item, idx) => {
      const sCfg = SEKTOREN_CONFIG[item.keterangan_sektor];
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? ROW_LIGHT_GREEN : 'FFFFFF';
      const textColor = TEXT_DARK;

      const uraianLengkap = [
        item.uraian,
        ...(item.poin_tambahan || []).map((pt, pIdx) => `${pIdx + 1}. ${pt}`)
      ].join('\n');

      const keteranganText = [
        `Kecamatan: ${item.kecamatan}`,
        `Waktu: ${item.waktu}`,
        `Tanggal: ${formatTanggalIndonesia(item.tanggal)}`,
        `Tempat: ${item.tempat}`
      ].join('\n');

      return [
        { text: String(idx + 1), options: { fill: { color: rowBg }, color: textColor, align: 'center', bold: true } },
        { text: `${sCfg?.kodeHuruf || 'SEK'}\n[${sCfg?.labelPendek || item.keterangan_sektor}]`, options: { fill: { color: rowBg }, color: textColor, align: 'center', bold: true } },
        { text: uraianLengkap, options: { fill: { color: rowBg }, color: textColor, fontSize: 10 } },
        { text: keteranganText, options: { fill: { color: rowBg }, color: textColor, fontSize: 9 } }
      ];
    }) : [
      [
        { text: '1', options: { fill: { color: ROW_LIGHT_GREEN }, color: TEXT_DARK, align: 'center' } },
        { text: '-', options: { fill: { color: ROW_LIGHT_GREEN }, color: TEXT_DARK, align: 'center' } },
        { text: 'Nihil / Belum ada catatan peristiwa menonjol pada triwulan berjalan.', options: { fill: { color: ROW_LIGHT_GREEN }, color: TEXT_DARK, italic: true } },
        { text: 'Kabupaten Tabanan', options: { fill: { color: ROW_LIGHT_GREEN }, color: TEXT_DARK } }
      ]
    ];

    slide.addTable([tableHeader, ...tableRows] as any, {
      x: 0.5,
      y: 1.9,
      w: 12.33,
      colW: [0.6, 1.8, 7.33, 2.6],
      border: { pt: 1, color: '8DC21F' },
      fontSize: 10,
      autoPage: true
    });
  });

  // ===========================================================================
  // SLIDE 7: PETA & SEBARAN WILAYAH (D.IN.2 GABUNGAN)
  // ===========================================================================
  const slidePeta = createBaseSlide('PETA SEBARAN POTENSI WILAYAH KABUPATEN TABANAN', 'D.IN.2');

  // Ringkasan per kecamatan
  const sebaranHeader = [
    { text: 'KECAMATAN', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } },
    { text: 'JUMLAH KEGIATAN', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } },
    { text: 'SEKTOR DOMINAN', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } }
  ];

  const sebaranRows = KECAMATAN_TABANAN.map((kec, idx) => {
    const listKec = kegiatanList.filter(k => k.kecamatan === kec);
    const sektorFreq: Record<string, number> = {};
    listKec.forEach(k => {
      sektorFreq[k.keterangan_sektor] = (sektorFreq[k.keterangan_sektor] || 0) + 1;
    });
    const dominan = Object.entries(sektorFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Kondusif';

    return [
      { text: `${idx + 1}. ${kec}`, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, bold: true } },
      { text: `${listKec.length} Kejadian`, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, align: 'center' } },
      { text: dominan, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK } }
    ];
  });

  slidePeta.addTable([sebaranHeader, ...sebaranRows] as any, {
    x: 0.5,
    y: 1.9,
    w: 12.33,
    colW: [4.0, 3.0, 5.33],
    border: { pt: 1, color: '8DC21F' },
    fontSize: 10
  });

  // ===========================================================================
  // SLIDE 8: PENERANGAN & PENYULUHAN HUKUM (D.IN.7 - D.IN.8)
  // ===========================================================================
  const slidePenkum = createBaseSlide('DATA PENERANGAN DAN PENYULUHAN HUKUM (PENKUM / LUHKUM)', 'D.IN.7-8');

  const penkumHeader = [
    { text: 'TRIWULAN', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } },
    { text: 'JENIS', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } },
    { text: 'TEMA / MATERI HUKUM', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } },
    { text: 'WAKTU & TEMPAT', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F' } },
    { text: 'PESERTA', options: { bold: true, fill: { color: ACCENT_GREEN }, color: '1B292F', align: 'center' } }
  ];

  const penkumRows = penkumList.map((p, idx) => {
    return [
      { text: `Triwulan ${p.triwulan}`, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, align: 'center', bold: true } },
      { text: p.jenis, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, align: 'center', bold: true } },
      { text: (p.tema || []).join('; '), options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK } },
      { text: `${formatTanggalIndonesia(p.tanggal)}\n${p.tempat} (${p.kecamatan})`, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, fontSize: 9 } },
      { text: `${p.jumlah_peserta} Orang`, options: { fill: { color: idx % 2 === 0 ? ROW_LIGHT_GREEN : 'FFFFFF' }, color: TEXT_DARK, align: 'center', bold: true } }
    ];
  });

  slidePenkum.addTable([penkumHeader, ...penkumRows] as any, {
    x: 0.5,
    y: 1.9,
    w: 12.33,
    colW: [1.6, 1.2, 5.0, 3.0, 1.53],
    border: { pt: 1, color: '8DC21F' },
    fontSize: 10
  });

  // ===========================================================================
  // SLIDE 9: GRAFIK PENKUM / LUHKUM (D.IN.9)
  // ===========================================================================
  const slideGrafikPenkum = createBaseSlide('GRAFIK PENERANGAN DAN PENYULUHAN HUKUM PER TRIWULAN', 'D.IN.9');

  // Hitung agregat per triwulan
  const twAgg = [1, 2, 3, 4].map(tw => {
    const items = penkumList.filter(p => p.triwulan === tw);
    const penkumCount = items.filter(p => p.jenis === 'Penkum').length;
    const luhkumCount = items.filter(p => p.jenis === 'Luhkum').length;
    const target = 1;
    return { tw: `Triwulan ${tw}`, target, penkum: penkumCount, luhkum: luhkumCount };
  });

  const chartDataPenkum = [
    {
      name: 'Target',
      labels: twAgg.map(t => t.tw),
      values: twAgg.map(t => t.target)
    },
    {
      name: 'Realisasi Penkum',
      labels: twAgg.map(t => t.tw),
      values: twAgg.map(t => t.penkum)
    },
    {
      name: 'Realisasi Luhkum',
      labels: twAgg.map(t => t.tw),
      values: twAgg.map(t => t.luhkum)
    }
  ];

  slideGrafikPenkum.addChart(pptx.ChartType.bar, chartDataPenkum, {
    x: 1.0,
    y: 2.0,
    w: 11.33,
    h: 4.8,
    barDir: 'col',
    chartColors: ['38BDF8', '8DC21F', 'F59E0B'],
    showLegend: true,
    legendPos: 't',
    showValue: true,
    plotArea: { fill: { color: '202D34' } }
  });

  // ===========================================================================
  // SLIDE 10: GRAFIK STATISTIK PERKARA (D.IN.11)
  // ===========================================================================
  const slideGrafikPerkara = createBaseSlide('GRAFIK REKAPITULASI PENANGANAN PERKARA', 'D.IN.11');

  // Chart data korupsi & narkotika
  const tahunLabels = perkaraList.map(p => String(p.tahun));
  const chartDataPerkara = [
    {
      name: 'Korupsi (Tut)',
      labels: tahunLabels,
      values: perkaraList.map(p => p.korupsi.tut)
    },
    {
      name: 'Narkotika (Tut)',
      labels: tahunLabels,
      values: perkaraList.map(p => p.narkotika.tut)
    },
    {
      name: 'Perhatian Masyarakat (Tut)',
      labels: tahunLabels,
      values: perkaraList.map(p => p.perhatianMasyarakat.tut)
    }
  ];

  slideGrafikPerkara.addChart(pptx.ChartType.bar, chartDataPerkara, {
    x: 1.0,
    y: 2.0,
    w: 11.33,
    h: 4.8,
    barDir: 'col',
    chartColors: ['EF4444', '10B981', '38BDF8'],
    showLegend: true,
    legendPos: 't',
    showValue: true,
    plotArea: { fill: { color: '202D34' } }
  });

  // Simpan dan unduh file pptx
  const fileName = `Papan_Peta_Intelijen_Kejari_Tabanan_${tahun}_DIN1_s_d_DIN11.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
