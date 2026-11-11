/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Halaman Login Papan Data Peta Intelijen Kejaksaan Negeri Tabanan
 * Mendukung autentikasi Supabase Auth (Email & Password)
 * serta Akses Cepat Simulasi Peran (Admin, Penginput, Pembaca)
 */

import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { DEMO_USERS } from '../services/dataService';
import { UserProfile, UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      // Jika Supabase belum dikonfigurasi di env, cocokkan email demo
      const matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        onLoginSuccess(matched);
      } else {
        setErrorMsg('Supabase belum terhubung di .env. Gunakan salah satu tombol "Masuk Cepat" di bawah.');
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Ambil profil dari tabel profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userObj: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          nama_lengkap: profile?.nama_lengkap || email.split('@')[0],
          nip: profile?.nip,
          jabatan: profile?.jabatan || 'Aparatur Intelijen',
          role: (profile?.role as UserRole) || 'penginput'
        };

        onLoginSuccess(userObj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = DEMO_USERS[role];
    onLoginSuccess(user);
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
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSupabaseLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Email Kedinasan
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="nama@kejaksaan.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-[#8DC21F] text-xs"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2B3A42] border border-[#3E525E] text-slate-100 pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-[#8DC21F] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#8DC21F] hover:bg-[#9dd824] active:bg-[#7db019] text-[#1B292F] font-bold rounded-md shadow-md transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk dengan Supabase Auth'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-[#2B3A42] space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Akses Cepat Pengujian (Simulasi Peran)
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full py-2 px-3 bg-[#2B3A42] hover:bg-[#344650] border border-[#3E525E] rounded-md text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-[#8DC21F]">
                    Masuk sebagai Admin Penuh
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kepala Seksi Intelijen (Hak Akses CRUD Penuh)
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#8DC21F]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('penginput')}
                className="w-full py-2 px-3 bg-[#2B3A42] hover:bg-[#344650] border border-[#3E525E] rounded-md text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-sky-300">
                    Masuk sebagai Penginput Data
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Jaksa Fungsional / Operator Papan Data
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pembaca')}
                className="w-full py-2 px-3 bg-[#2B3A42] hover:bg-[#344650] border border-[#3E525E] rounded-md text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-amber-300">
                    Masuk sebagai Pembaca (Tamu)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Hak Akses Read-Only (Hanya Melihat Data)
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2">
            Klasifikasi Data: RAHASIA / TERBATAS · Dilindungi Row Level Security (RLS)
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
