/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server Express & Vite Dev Middleware
 * Menyediakan endpoint /api/perkara untuk integrasi CMS Publik Kejaksaan RI
 * (Satker 22.08.00 Kejaksaan Negeri Tabanan) dengan perlindungan Anti-Downtime & Caching
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  fetchPerkaraDataWithResilience,
  checkCmsHealth
} from './src/services/cmsPerkaraService';
import { KECAMATAN_TABANAN } from './src/config/symbols.config';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// 1. Endpoint Utama /api/perkara (juga mendukung ?action=health|cases|kecamatan seperti Vercel)
app.get('/api/perkara', async (req, res) => {
  const action = String(req.query.action || '').toLowerCase();
  const forceRefresh = req.query.refresh === 'true';

  if (action === 'health') {
    res.setHeader('Cache-Control', 'no-store');
    const health = await checkCmsHealth();
    return res.json(health);
  }

  if (action === 'kecamatan') {
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');
    try {
      const summary = await fetchPerkaraDataWithResilience(forceRefresh);
      const data = KECAMATAN_TABANAN.map((kec) => {
        const caseCount = summary.sebaranKecamatan[kec] || 0;
        return {
          kecamatan: kec,
          penkum: Math.max(1, Math.round(caseCount * 0.15)),
          luhkum: Math.max(2, Math.round(caseCount * 0.25)),
          totalPeserta: Math.max(50, caseCount * 15),
          totalPerkara: caseCount
        };
      });
      return res.json({
        status: summary.status,
        source: summary.source,
        isDown: summary.isDown,
        totalCases: summary.totalCases,
        data
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  }

  if (action === 'cases') {
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    try {
      const summary = await fetchPerkaraDataWithResilience(forceRefresh);
      let cases = summary.cases;

      const q = String(req.query.q || '').trim().toLowerCase();
      const kec = String(req.query.kecamatan || '').trim();
      const polsek = String(req.query.polsek || '').trim().toLowerCase();

      if (q) {
        cases = cases.filter(
          (c) =>
            c.no_surat.toLowerCase().includes(q) ||
            c.undang_pasal.toLowerCase().includes(q) ||
            c.tempat_kejadian.toLowerCase().includes(q) ||
            c.ur_ipp.toLowerCase().includes(q) ||
            (c.tdw && c.tdw.toLowerCase().includes(q))
        );
      }

      if (kec && kec !== 'SEMUA') {
        cases = cases.filter((c) => c.kecamatan === kec);
      }

      if (polsek && polsek !== 'semua') {
        cases = cases.filter((c) => c.ur_ipp.toLowerCase().includes(polsek));
      }

      const totalFiltered = cases.length;
      const limit = Math.min(100, parseInt(String(req.query.limit || '50'), 10));
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const paginated = cases.slice(offset, offset + limit);

      return res.json({
        status: 'success',
        source: summary.source,
        isDown: summary.isDown,
        message: summary.message,
        satker: summary.satker,
        satkerName: summary.satkerName,
        total: totalFiltered,
        totalAll: summary.totalCases,
        limit,
        offset,
        data: paginated
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  }

  // Default: Statistik Perkara Multi-Tahun D.IN.11
  const tahunMulai = parseInt(String(req.query.tahunMulai || '2023'), 10);
  const tahunSelesai = parseInt(String(req.query.tahunSelesai || '2026'), 10);

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');

  try {
    const summary = await fetchPerkaraDataWithResilience(forceRefresh);
    const filteredData = summary.perkaraStatTahun.filter(
      (d) => d.tahun >= tahunMulai && d.tahun <= tahunSelesai
    );

    return res.json({
      status: summary.status,
      source: summary.source,
      isDown: summary.isDown,
      message: summary.message,
      satker: summary.satker,
      satkerName: summary.satkerName,
      totalCases: summary.totalCases,
      lastSync: summary.lastSync,
      latencyMs: summary.latencyMs,
      data: filteredData
    });
  } catch (err: any) {
    console.error('Error fetching perkara data:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memproses data perkara',
      error: err.message
    });
  }
});

// 2. Endpoint Subpath Backward-Compatible (/api/perkara/kecamatan, /cases, /health)
app.get('/api/perkara/kecamatan', async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');
  try {
    const summary = await fetchPerkaraDataWithResilience(req.query.refresh === 'true');
    const data = KECAMATAN_TABANAN.map((kec) => {
      const caseCount = summary.sebaranKecamatan[kec] || 0;
      return {
        kecamatan: kec,
        penkum: Math.max(1, Math.round(caseCount * 0.15)),
        luhkum: Math.max(2, Math.round(caseCount * 0.25)),
        totalPeserta: Math.max(50, caseCount * 15),
        totalPerkara: caseCount
      };
    });
    return res.json({
      status: summary.status,
      source: summary.source,
      isDown: summary.isDown,
      totalCases: summary.totalCases,
      data
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/perkara/cases', async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
  try {
    const summary = await fetchPerkaraDataWithResilience(req.query.refresh === 'true');
    let cases = summary.cases;
    const q = String(req.query.q || '').trim().toLowerCase();
    const kec = String(req.query.kecamatan || '').trim();
    if (q) {
      cases = cases.filter(
        (c) =>
          c.no_surat.toLowerCase().includes(q) ||
          c.undang_pasal.toLowerCase().includes(q) ||
          c.tempat_kejadian.toLowerCase().includes(q) ||
          c.ur_ipp.toLowerCase().includes(q) ||
          (c.tdw && c.tdw.toLowerCase().includes(q))
      );
    }
    if (kec && kec !== 'SEMUA') {
      cases = cases.filter((c) => c.kecamatan === kec);
    }
    const totalFiltered = cases.length;
    const limit = Math.min(100, parseInt(String(req.query.limit || '50'), 10));
    const offset = parseInt(String(req.query.offset || '0'), 10);
    return res.json({
      status: 'success',
      source: summary.source,
      isDown: summary.isDown,
      message: summary.message,
      satker: summary.satker,
      satkerName: summary.satkerName,
      total: totalFiltered,
      totalAll: summary.totalCases,
      limit,
      offset,
      data: cases.slice(offset, offset + limit)
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/perkara/health', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const health = await checkCmsHealth();
  return res.json(health);
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server Kejaksaan Negeri Tabanan berjalan di http://0.0.0.0:${port}`);
  });
}

startServer();
