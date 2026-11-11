/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Header Papan Data Peta Intelijen Kejaksaan Negeri Tabanan
 * Mengikuti Top Bar Contract dan visual tema papan peta asli (#2B3A42, #8DC21F)
 */

import React, { useState } from 'react';
import { Menu, X, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface HeaderPapanProps {
  currentUser: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onLogout: () => void;
}

export const HeaderPapan: React.FC<HeaderPapanProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onRoleSwitch,
  onLogout
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Ringkasan' },
    { id: 'tabel-bidang', label: 'Tabel SIADIBIBAM' },
    { id: 'peta', label: 'Peta Wilayah' },
    { id: 'penkum', label: 'Penkum & Luhkum' },
    { id: 'grafik-penkum', label: 'Grafik Penkum' },
    { id: 'grafik-perkara', label: 'Grafik Perkara' }
  ];

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Admin (Kasi Intel)', color: 'text-[#8DC21F] bg-[#8DC21F]/10 border-[#8DC21F]/30' },
    penginput: { label: 'Penginput (Operator)', color: 'text-sky-300 bg-sky-950/60 border-sky-500/30' },
    pembaca: { label: 'Pembaca (Tamu)', color: 'text-amber-300 bg-amber-950/60 border-amber-500/30' }
  };

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#202D34]/95 backdrop-blur border-b border-[#374853] shadow-md">
      {/* Top Bar Container - 3 Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full border border-[#8DC21F]/60 overflow-hidden bg-[#2B3A42] flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/src/assets/images/kejaksaan_emblem_1793884752383.jpg"
              alt="Logo Kejaksaan RI"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              KEJAKSAAN NEGERI TABANAN
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-[#8DC21F] whitespace-nowrap uppercase">
              Seksi Intelijen · Data Peta Intelijen
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links for Desktop (No horizontal scrolling) */}
        <nav className="hidden lg:flex items-center gap-1 py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#8DC21F] text-[#1B292F] shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#2B3A42]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Profile and Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Role Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#3E525E] bg-[#2B3A42] hover:border-[#8DC21F]/60 text-slate-200 transition-colors"
              title="Ganti Peran Pengguna"
            >
              <div className="w-6 h-6 rounded-full bg-[#374853] flex items-center justify-center text-xs font-bold text-[#8DC21F]">
                {currentUser.role === 'admin' ? 'A' : currentUser.role === 'penginput' ? 'P' : 'T'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-semibold text-slate-200 leading-none truncate max-w-[100px]">
                  {currentUser.nama_lengkap.split(',')[0]}
                </span>
                <span className="text-[10px] text-[#8DC21F] leading-tight">
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#202D34] border border-[#3E525E] rounded-lg shadow-xl py-2 z-50">
                <div className="px-3 py-2 border-b border-[#2B3A42]">
                  <p className="text-xs font-bold text-white truncate">{currentUser.nama_lengkap}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-medium ${roleLabels[currentUser.role].color}`}>
                      {roleLabels[currentUser.role].label}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Ganti Peran (Simulasi RBAC)
                  </div>
                  {(['admin', 'penginput', 'pembaca'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between text-slate-200 hover:bg-[#2B3A42]"
                    >
                      <span>{r === 'admin' ? 'Admin Penuh' : r === 'penginput' ? 'Penginput Data' : 'Pembaca (Read-Only)'}</span>
                      {currentUser.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-[#8DC21F]" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#2B3A42] pt-1">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-[#2B3A42] flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Halaman Login)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md bg-[#2B3A42] border border-[#3E525E] text-slate-200 hover:text-white hover:border-[#8DC21F]"
            aria-label="Buka Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile/Tablet Clean Navigation Drawer (No Horizontal Scrolling) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1A262D] border-t border-[#2B3A42] px-4 py-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors text-left flex items-center justify-between ${
                    isActive
                      ? 'bg-[#8DC21F] text-[#1B292F] font-bold shadow-sm'
                      : 'bg-[#25333B] text-slate-200 hover:bg-[#2F414B]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1B292F]"></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderPapan;
