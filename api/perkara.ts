/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function: /api/perkara
 * Mendukung routing query param (?action=health|cases|kecamatan) maupun subpath
 * agar selalu kompatibel 100% di Vercel dan Express tanpa 404.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import {
  fetchPerkaraDataWithResilience,
  checkCmsHealth
} from '../src/services/cmsPerkaraService';
import { KECAMATAN_TABANAN } from '../src/config/symbols.config';

export default async function handler(
  req: IncomingMessage & { query?: any; url?: string },
  res: ServerResponse & { status?: any; json?: any }
) {
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const action = (urlObj.searchParams.get('action') || '').toLowerCase();
  const tahunMulai = parseInt(urlObj.searchParams.get('tahunMulai') || '2023', 10);
  const tahunSelesai = parseInt(urlObj.searchParams.get('tahunSelesai') || '2026', 10);
  const forceRefresh = urlObj.searchParams.get('refresh') === 'true';

  res.setHeader('Content-Type', 'application/json');

  // Route: Health Check (?action=health atau /api/perkara/health)
  if (action === 'health' || pathname.includes('/health')) {
    res.setHeader('Cache-Control', 'no-store');
    const health = await checkCmsHealth();
    res.statusCode = 200;
    res.end(JSON.stringify(health));
    return;
  }

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');

  // Route: Sebaran 10 Kecamatan (?action=kecamatan atau /api/perkara/kecamatan)
  if (action === 'kecamatan' || pathname.includes('/kecamatan')) {
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

      res.statusCode = 200;
      res.end(JSON.stringify({
        status: summary.status,
        source: summary.source,
        isDown: summary.isDown,
        totalCases: summary.totalCases,
        data
      }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ status: 'error', error: err.message }));
      return;
    }
  }

  // Route: Daftar Register Kasus (?action=cases atau /api/perkara/cases)
  if (action === 'cases' || pathname.includes('/cases')) {
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
            c.ur_ipp.toLowerCase().includes(q) ||
            (c.tdw && c.tdw.toLowerCase().includes(q))
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
