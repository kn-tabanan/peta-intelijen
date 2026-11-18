/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function: /api/login
 * Memverifikasi login menggunakan Environment Variables server-side:
 * - USER_LOGIN
 * - USER_PASS
 */

import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Tetap lakukan perbandingan konstan agar timing attack tidak efektif
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function readJsonBody(req: IncomingMessage & { body?: any }): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error('Payload terlalu besar'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(
  req: IncomingMessage & { body?: any; method?: string },
  res: ServerResponse
) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    return;
  }

  const envUser = process.env.USER_LOGIN;
  const envPass = process.env.USER_PASS;

  if (!envUser || !envPass) {
    res.statusCode = 503;
    res.end(JSON.stringify({
      success: false,
      notConfigured: true,
      message: 'Konfigurasi autentikasi server belum diatur (USER_LOGIN dan USER_PASS pada .env / Vercel Environment Variables).'
    }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const username = String(body.username || body.email || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Username/Email dan kata sandi wajib diisi.'
      }));
      return;
    }

    const userValid = safeCompare(username.toLowerCase(), envUser.trim().toLowerCase());
    const passValid = safeCompare(password, envPass);

    if (!userValid || !passValid) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        message: 'Username/Email atau kata sandi tidak sesuai.'
      }));
      return;
    }

    const displayEmail = envUser.includes('@') ? envUser : `${envUser}@kejari-tabanan.go.id`;

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      user: {
        id: 'usr-admin-env',
        email: displayEmail,
        nama_lengkap: 'Administrator Seksi Intelijen',
        jabatan: 'Kejaksaan Negeri Tabanan',
        role: 'admin'
      }
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      message: err?.message || 'Terjadi kesalahan saat memverifikasi akun.'
    }));
  }
}
