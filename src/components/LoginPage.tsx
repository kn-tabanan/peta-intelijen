/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Halaman Login Papan Data Peta Intelijen Kejaksaan Negeri Tabanan
 * Autentikasi menggunakan kredensial server-side .env (USER_LOGIN & USER_PASS)
 * melalui endpoint /api/login serta dukungan Supabase Auth jika dikonfigurasi.
 */

import React, { useState } from 'react';
import { Lock, User, AlertCircle, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile, UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Username/Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verifikasi terhadap USER_LOGIN & USER_PASS di .env server-side (/api/login)
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const rawText = await res.text();
      let json: any = null;
      try {
        json = rawText ? JSON.parse(rawText) : null;
      } catch {
        json = null;
      }

      if (res.ok && json?.success && json?.user) {
        onLoginSuccess(json.user as UserProfile);
        return;
      }

      // Jika server belum mengatur USER_LOGIN / USER_PASS namun Supabase Auth dikonfigurasi
      if ((res.status === 503 || !json) && isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username.trim(),
          password
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userObj: UserProfile = {
            id: data.user.id,
            email: data.user.email || username.trim(),
            nama_lengkap: profile?.nama_lengkap || username.trim().split('@')[0],
            nip: profile?.nip,
            jabatan: profile?.jabatan || 'Aparatur Intelijen',
            role: (profile?.role as UserRole) || 'penginput'
          };

          onLoginSuccess(userObj);
          return;
        }
      }

      setErrorMsg(
        json?.message || 'Gagal masuk. Periksa kembali Username/Email dan kata sandi Anda.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk. Periksa kembali Username/Email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2B32] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#202D34] rounded-2xl border border-[#374853] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Badge & Brand */}
        <div className="bg-[#1A262D] px-6 py-8 text-center border-b border-[#2B3A42] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#8DC21F] overflow-hidden bg-[#2B3A42] mb-3 shadow-lg flex items-center justify-center">
            <img
              src="/src/assets/images/kejaksaan_emblem_1793884752383.jpg"
              alt="Logo Kejaksaan RI"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#8DC21F] uppercase">
            Seksi Intelijen
          </span>
          <h1 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
            KEJAKSAAN NEGERI TABANAN
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Papan Data Peta Intelijen (D.IN.1 s.d. D.IN.11)
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Username / Email Kedinasan
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username atau email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 pl-9 pr-3 py-2.5 rounded-md focus:outline-none focus:border-[#8DC21F] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 pl-9 pr-3 py-2.5 rounded-md focus:outline-none focus:border-[#8DC21F] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#8DC21F] hover:bg-[#9dd824] active:bg-[#7db019] disabled:opacity-60 text-[#1B292F] font-bold rounded-md shadow-md transition-colors flex items-center justify-center gap-2 text-xs mt-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
            </button>
          </form>

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-[#2B3A42]">
            Klasifikasi Data: RAHASIA / TERBATAS · Seksi Intelijen Kejari Tabanan
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
