'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Search,
  BarChart3,
  Users,
  Plus,
  FileCheck2,
  ChevronDown,
  ShoppingBag,
  LogOut,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { exportSalesToCsv } from '@/lib/exportCsv';

export interface User {
  id: string;
  cedula?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASESOR' | 'BACKOFFICE' | 'SUPERVISOR';
  active?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  assignedCampaigns?: Array<{ id: string; name: string; color: string }>;
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  campaignSearch: string;
  setCampaignSearch: (search: string) => void;
  pendingBackofficeCount: number;
  returnedSalesCount?: number;
  onOpenNewSale: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  campaignSearch,
  setCampaignSearch,
  pendingBackofficeCount,
  returnedSalesCount = 0,
  onOpenNewSale,
}: NavbarProps) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      router.push('/login');
    }
  };

  const handleQuickRealtimeExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const res = await fetch(`/api/sales?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        exportSalesToCsv(data, `Reporte_Ventas_${timestamp}.csv`);
      }
    } catch (err) {
      console.error('Error descargando Excel:', err);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Gerencia', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'SUPERVISOR':
        return { label: 'Supervisor', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'BACKOFFICE':
        return { label: 'Back Office', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'ASESOR':
      default:
        return { label: 'Consultor', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const isAdvisor = currentUser.role === 'ASESOR';
  const isBackoffice = currentUser.role === 'BACKOFFICE';
  const isSupervisor = currentUser.role === 'SUPERVISOR';
  const isAdmin = currentUser.role === 'ADMIN';
  const canManageAll = isAdmin || isSupervisor;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all ${activeTab === 'backoffice' ? 'w-full max-w-none' : 'max-w-7xl'}`}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('campaigns')}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md overflow-hidden p-1.5 group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conecta.png"
                alt="Conecta"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-sky-800 to-indigo-900 bg-clip-text text-transparent tracking-tight">
              Conecta
            </span>
          </div>

          {/* Buscador de Campaña */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => {
                  setCampaignSearch(e.target.value);
                  if (activeTab !== 'campaigns') {
                    setActiveTab('campaigns');
                  }
                }}
                placeholder="Buscar campaña..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 rounded-xl border border-slate-200/80 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
              />
              {campaignSearch && (
                <button
                  onClick={() => setCampaignSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/70 rounded-full px-1.5 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Acciones y Usuario */}
          <div className="flex items-center space-x-3">
            {canManageAll && (
              <button
                onClick={handleQuickRealtimeExcel}
                disabled={isDownloadingExcel}
                className="hidden lg:inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloadingExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Excel</span>
              </button>
            )}

            {(isAdvisor || canManageAll) && (
              <button
                onClick={onOpenNewSale}
                className="hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Venta</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/90 transition text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-none">
                    {currentUser.name}
                  </div>
                  <span
                    className={`inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded font-semibold border ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] font-mono text-sky-700">{(currentUser.email || '').split('@')[0]}</p>
                    {currentUser.cedula && (
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        C.C. {currentUser.cedula}
                      </p>
                    )}
                  </div>

                  <div className="px-2 pt-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 flex items-center space-x-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por Pestañas */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition whitespace-nowrap ${
              activeTab === 'campaigns'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Campañas</span>
          </button>

          {(isAdvisor || canManageAll) && (
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition whitespace-nowrap ${
                activeTab === 'sales'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mis Ventas</span>
              {(returnedSalesCount || 0) > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-xs flex items-center space-x-1"
                  title="Tienes ventas en devolución devueltas por Back Office"
                >
                  <span>{returnedSalesCount} {returnedSalesCount === 1 ? 'devuelta' : 'devueltas'}</span>
                </span>
              )}
            </button>
          )}

          {(isBackoffice || canManageAll) && (
            <button
              onClick={() => setActiveTab('backoffice')}
              className={`py-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition whitespace-nowrap ${
                activeTab === 'backoffice'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Back Office</span>
              {pendingBackofficeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {pendingBackofficeCount}
                </span>
              )}
            </button>
          )}

          {canManageAll && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas</span>
            </button>
          )}

          {canManageAll && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2.5 px-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center space-x-2 transition whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
