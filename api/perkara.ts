/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function: /api/perkara
 * Menghubungkan ke CMS Publik Kejaksaan RI dengan proteksi Anti-Downtime,
 * Caching, dan Fallback Arsip Resmi Satker 22.08.00 Kejaksaan Negeri Tabanan
 */

import type { IncomingMessage, ServerResponse } from 'http';
import {
  fetchPerkaraDataWithResilience,
  CMS_API_DEFAULT_URL,
  CMS_SATKER_TABANAN
} from '../src/services/cmsPerkaraService';

export default async function handler(
  req: IncomingMessage & { query?: any; url?: string },
  res: ServerResponse & { status?: any; json?: any }
) {
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const tahunMulai = parseInt(urlObj.searchParams.get('tahunMulai') || '2023', 10);
  const tahunSelesai = parseInt(urlObj.searchParams.get('tahunSelesai') || '2026', 10);
  const forceRefresh = urlObj.searchParams.get('refresh') === 'true';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');

  // Sub-route: /api/perkara/health
  if (pathname.includes('/health')) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const checkRes = await fetch(CMS_API_DEFAULT_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      res.statusCode = 200;
      res.end(JSON.stringify({
        online: checkRes.ok,
        statusCode: checkRes.status,
        latencyMs,
        endpoint: CMS_API_DEFAULT_URL,
        satker: CMS_SATKER_TABANAN,
        message: checkRes.ok
          ? 'Server CMS Publik Kejaksaan RI online'
          : `Server CMS merespons status ${checkRes.status}`
      }));
      return;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      res.statusCode = 200;
      res.end(JSON.stringify({
        online: false,
        statusCode: 0,
        latencyMs,
        endpoint: CMS_API_DEFAULT_URL,
        satker: CMS_SATKER_TABANAN,
        message: `Server CMS sedang offline/down: ${err.message}`
      }));
      return;
    }
  }

  // Sub-route: /api/perkara/cases
  if (pathname.includes('/cases')) {
    try {
      const summary = await fetchPerkaraDataWithResilience(forceRefresh);
      let cases = summary.cases;

      const q = String(urlObj.searchParams.get('q') || '').trim().toLowerCase();
      const kec = String(urlObj.searchParams.get('kecamatan') || '').trim();

      if (q) {
        cases = cases.filter(
          (c) =>
            c.no_surat.toLowerCase().includes(q) ||
            c.undang_pasal.toLowerCase().includes(q) ||
            c.tempat_kejadian.toLowerCase().includes(q) ||
            c.ur_ipp.toLowerCase().includes(q)
        );
      }

      if (kec && kec !== 'SEMUA') {
        cases = cases.filter((c) => c.kecamatan === kec);
      }

      const limit = Math.min(100, parseInt(urlObj.searchParams.get('limit') || '50', 10));
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);
      const paginated = cases.slice(offset, offset + limit);

      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'success',
        source: summary.source,
        isDown: summary.isDown,
        message: summary.message,
        satker: summary.satker,
        satkerName: summary.satkerName,
        total: cases.length,
        totalAll: summary.totalCases,
        limit,
        offset,
        data: paginated
      }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ status: 'error', error: err.message }));
      return;
    }
  }

  // Default: /api/perkara (Statistik Rekapitulasi Multi-Tahun D.IN.11)
  try {
    const summary = await fetchPerkaraDataWithResilience(forceRefresh);
    const filteredData = summary.perkaraStatTahun.filter(
      (d) => d.tahun >= tahunMulai && d.tahun <= tahunSelesai
    );

    res.statusCode = 200;
    res.end(JSON.stringify({
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
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      status: 'error',
      message: 'Gagal memproses data perkara',
      error: err.message
    }));
  }
}
