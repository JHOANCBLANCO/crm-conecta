'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  TrendingUp,
  Layers,
  Search,
  Loader2,
  Truck,
  Zap,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { generateSalesReportPdf } from '@/lib/exportPdf';
import { exportSalesToCsv } from '@/lib/exportCsv';
import { Sale, getStageLabel } from './BackofficeView';
import SaleDetailsModal from './SaleDetailsModal';

interface DashboardViewProps {
  sales: Sale[];
  campaigns: Array<{ id: string; name: string; color: string }>;
  users: Array<{ id: string; name: string; role: string }>;
  onRefresh?: () => Promise<void> | void;
}

function isSameDayLocal(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function DashboardView({
  sales,
  campaigns,
  users,
  onRefresh,
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  // Filtros principales
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('ALL');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('TODAY'); // Por defecto permite ver ventas del día o cambiar a Histórico/Mes
  const [customDateFrom, setCustomDateFrom] = useState(todayStr);
  const [customDateTo, setCustomDateTo] = useState(todayStr);
  const [tableSearch, setTableSearch] = useState('');
  const [isExportingRealtime, setIsExportingRealtime] = useState(false);
  const [detailsModalSale, setDetailsModalSale] = useState<Sale | null>(null);

  // Estado del Comparador de Períodos (Hoy vs Ayer | Período A vs Período B)
  const [comparisonMode, setComparisonMode] = useState<'TODAY_VS_YESTERDAY' | 'CUSTOM_PERIODS'>(
    'TODAY_VS_YESTERDAY'
  );
  const [periodAFrom, setPeriodAFrom] = useState(todayStr);
  const [periodATo, setPeriodATo] = useState(todayStr);
  const [periodBFrom, setPeriodBFrom] = useState(yesterdayStr);
  const [periodBTo, setPeriodBTo] = useState(yesterdayStr);

  const advisors = useMemo(() => {
    return users.filter((u) => u.role === 'ASESOR' || u.role === 'ADMIN');
  }, [users]);

  const availableChannels = useMemo(() => {
    const base = ['Telemercadeo', 'WhatsApp', 'Redes Sociales', 'Base de Datos', 'Referido', 'Digital / Web'];
    const seen = new Set(base.map((c) => c.toLowerCase()));
    sales.forEach((s) => {
      const ch = s.salesChannel?.trim();
      if (ch && !seen.has(ch.toLowerCase())) {
        seen.add(ch.toLowerCase());
        base.push(ch);
      }
    });
    return base;
  }, [sales]);

  // Base filtrada por Campaña, Consultor, Canal y Estado (sin filtro de fecha para alimentar también el comparador)
  const baseFilteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedCampaignId !== 'ALL' && s.campaignId !== selectedCampaignId) return false;
      if (selectedAdvisorId !== 'ALL' && s.advisorId !== selectedAdvisorId) return false;
      if (selectedChannel !== 'ALL' && (s.salesChannel || 'Telemercadeo') !== selectedChannel) return false;

      if (selectedStage !== 'ALL') {
        if (selectedStage === 'ACTIVO') {
          if (s.stage !== 'ACTIVO' && s.stage !== 'APROBADO') return false;
        } else if (selectedStage === 'DEVOLUCION') {
          if (s.stage !== 'DEVOLUCION' && s.stage !== 'DEVUELTO') return false;
        } else if (s.stage !== selectedStage) {
          return false;
        }
      }
      return true;
    });
  }, [sales, selectedCampaignId, selectedAdvisorId, selectedChannel, selectedStage]);

  const applyTimeFilter = (dataset: Sale[]) => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    return dataset.filter((s) => {
      if (selectedCampaignId !== 'ALL' && s.campaignId !== selectedCampaignId) return false;
      if (selectedAdvisorId !== 'ALL' && s.advisorId !== selectedAdvisorId) return false;
      if (selectedChannel !== 'ALL' && (s.salesChannel || 'Telemercadeo') !== selectedChannel) return false;
      if (selectedStage !== 'ALL') {
        if (selectedStage === 'ACTIVO') {
          if (s.stage !== 'ACTIVO' && s.stage !== 'APROBADO') return false;
        } else if (selectedStage === 'DEVOLUCION') {
          if (s.stage !== 'DEVOLUCION' && s.stage !== 'DEVUELTO') return false;
        } else if (s.stage !== selectedStage) {
          return false;
        }
      }

      const saleDate = new Date(s.createdAt);

      if (timeFilter === 'TODAY') {
        return isSameDayLocal(saleDate, now);
      } else if (timeFilter === 'YESTERDAY') {
        return isSameDayLocal(saleDate, yesterday);
      } else if (timeFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= sevenDaysAgo;
      } else if (timeFilter === 'THIS_MONTH') {
        return (
          saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
        );
      } else if (timeFilter === 'LAST_MONTH') {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          saleDate.getMonth() === prevMonth.getMonth() &&
          saleDate.getFullYear() === prevMonth.getFullYear()
        );
      } else if (timeFilter === 'CUSTOM') {
        if (customDateFrom) {
          const from = new Date(customDateFrom + 'T00:00:00');
          if (saleDate < from) return false;
        }
        if (customDateTo) {
          const to = new Date(customDateTo + 'T23:59:59.999');
          if (saleDate > to) return false;
        }
      }

      return true;
    });
  };

  const filteredSales = useMemo(
    () => applyTimeFilter(sales),
    [sales, selectedCampaignId, selectedAdvisorId, selectedChannel, selectedStage, timeFilter, customDateFrom, customDateTo]
  );

  // Cálculo del Comparador (Hoy vs Ayer o Período A vs Período B)
  const comparisonData = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    let listA: Sale[] = [];
    let listB: Sale[] = [];
    let labelA = 'Hoy';
    let labelB = 'Ayer';

    if (comparisonMode === 'TODAY_VS_YESTERDAY') {
      listA = baseFilteredSales.filter((s) => isSameDayLocal(new Date(s.createdAt), now));
      listB = baseFilteredSales.filter((s) => isSameDayLocal(new Date(s.createdAt), yesterday));
      labelA = `Hoy (${todayStr})`;
      labelB = `Ayer (${yesterdayStr})`;
    } else {
      const aStart = periodAFrom ? new Date(periodAFrom + 'T00:00:00') : null;
      const aEnd = periodATo ? new Date(periodATo + 'T23:59:59.999') : null;
      const bStart = periodBFrom ? new Date(periodBFrom + 'T00:00:00') : null;
      const bEnd = periodBTo ? new Date(periodBTo + 'T23:59:59.999') : null;

      listA = baseFilteredSales.filter((s) => {
        const d = new Date(s.createdAt);
        if (aStart && d < aStart) return false;
        if (aEnd && d > aEnd) return false;
        return true;
      });

      listB = baseFilteredSales.filter((s) => {
        const d = new Date(s.createdAt);
        if (bStart && d < bStart) return false;
        if (bEnd && d > bEnd) return false;
        return true;
      });

      labelA = `${periodAFrom || '...'} a ${periodATo || '...'}`;
      labelB = `${periodBFrom || '...'} a ${periodBTo || '...'}`;
    }

    const countA = listA.length;
    const countB = listB.length;
    const valueA = listA.reduce((acc, s) => acc + s.saleValue, 0);
    const valueB = listB.reduce((acc, s) => acc + s.saleValue, 0);
    const activeA = listA.filter((s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO').length;
    const activeB = listB.filter((s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO').length;

    const diffCount = countA - countB;
    const diffValue = valueA - valueB;
    const pctValue =
      valueB > 0 ? Math.round(((valueA - valueB) / valueB) * 100) : valueA > 0 ? 100 : 0;
    const pctCount =
      countB > 0 ? Math.round(((countA - countB) / countB) * 100) : countA > 0 ? 100 : 0;

    return {
      labelA,
      labelB,
      countA,
      countB,
      valueA,
      valueB,
      activeA,
      activeB,
      diffCount,
      diffValue,
      pctValue,
      pctCount,
    };
  }, [baseFilteredSales, comparisonMode, periodAFrom, periodATo, periodBFrom, periodBTo, todayStr, yesterdayStr]);

  const tableDisplaySales = useMemo(() => {
    if (!tableSearch.trim()) return filteredSales;
    const q = tableSearch.toLowerCase();
    return filteredSales.filter(
      (s) =>
        s.clientName.toLowerCase().includes(q) ||
        s.clientCedula.toLowerCase().includes(q) ||
        s.advisor.name.toLowerCase().includes(q) ||
        s.campaign.name.toLowerCase().includes(q) ||
        s.plan.name.toLowerCase().includes(q) ||
        (s.radicado && s.radicado.toLowerCase().includes(q)) ||
        (s.backofficeName && s.backofficeName.toLowerCase().includes(q))
    );
  }, [filteredSales, tableSearch]);

  // Métricas del período filtrado
  const totalSalesCount = filteredSales.length;
  const activeSales = filteredSales.filter((s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO');
  const preactiveSales = filteredSales.filter((s) => s.stage === 'PREACTIVO');
  const simSentSales = filteredSales.filter((s) => s.stage === 'ENVIO_SIM');
  const pendingSales = filteredSales.filter((s) => s.stage === 'PENDIENTE_BACKOFFICE');
  const returnedSales = filteredSales.filter((s) => s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO');

  const totalSoldApproved = activeSales.reduce((acc, s) => acc + s.saleValue, 0);
  const totalSoldOverall = filteredSales.reduce((acc, s) => acc + s.saleValue, 0);

  const uniqueClientsCount = new Set(filteredSales.map((s) => s.clientCedula)).size;
  const approvalRate =
    totalSalesCount > 0 ? Math.round((activeSales.length / totalSalesCount) * 100) : 0;

  const advisorStats = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; count: number; approvedCount: number; totalValue: number }
    >();
    filteredSales.forEach((s) => {
      const aId = s.advisor.id;
      if (!map.has(aId)) {
        map.set(aId, { id: aId, name: s.advisor.name, count: 0, approvedCount: 0, totalValue: 0 });
      }
      const entry = map.get(aId)!;
      entry.count += 1;
      entry.totalValue += s.saleValue;
      if (s.stage === 'ACTIVO' || s.stage === 'APROBADO') entry.approvedCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredSales]);

  const campaignStats = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; color: string; count: number; approvedCount: number; totalValue: number }
    >();
    filteredSales.forEach((s) => {
      const cId = s.campaign.id;
      if (!map.has(cId)) {
        map.set(cId, {
          id: cId,
          name: s.campaign.name,
          color: s.campaign.color,
          count: 0,
          approvedCount: 0,
          totalValue: 0,
        });
      }
      const entry = map.get(cId)!;
      entry.count += 1;
      entry.totalValue += s.saleValue;
      if (s.stage === 'ACTIVO' || s.stage === 'APROBADO') entry.approvedCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredSales]);

  // Estadísticas por Canal de Venta (medio por el cual se vende más)
  const channelStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; approvedCount: number; totalValue: number }
    >();
    filteredSales.forEach((s) => {
      const ch = s.salesChannel?.trim() || 'Telemercadeo';
      if (!map.has(ch)) {
        map.set(ch, {
          name: ch,
          count: 0,
          approvedCount: 0,
          totalValue: 0,
        });
      }
      const entry = map.get(ch)!;
      entry.count += 1;
      entry.totalValue += s.saleValue;
      if (s.stage === 'ACTIVO' || s.stage === 'APROBADO') entry.approvedCount += 1;
    });
    return Array.from(map.values()).sort((a, b) =>
      b.count !== a.count ? b.count - a.count : b.totalValue - a.totalValue
    );
  }, [filteredSales]);

  // Descarga Excel en Tiempo Real
  const handleExportRealtimeCsv = async () => {
    setIsExportingRealtime(true);
    try {
      const res = await fetch(`/api/sales?t=${Date.now()}`, { cache: 'no-store' });
      const freshSales = await res.json();
      const dataToExport = Array.isArray(freshSales) ? applyTimeFilter(freshSales) : filteredSales;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      exportSalesToCsv(dataToExport, `Reporte_Ventas_${timestamp}.csv`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      exportSalesToCsv(filteredSales, `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setIsExportingRealtime(false);
    }
  };

  const handleExportPdf = () => {
    const campaignName =
      selectedCampaignId !== 'ALL'
        ? campaigns.find((c) => c.id === selectedCampaignId)?.name
        : 'Todas';
    const advisorName =
      selectedAdvisorId !== 'ALL'
        ? users.find((u) => u.id === selectedAdvisorId)?.name
        : 'Todos';

    const timeLabels: Record<string, string> = {
      TODAY: `Hoy (${todayStr})`,
      YESTERDAY: `Ayer (${yesterdayStr})`,
      LAST_7_DAYS: 'Últimos 7 días',
      THIS_MONTH: 'Este Mes',
      LAST_MONTH: 'Mes Anterior',
      ALL: 'Histórico Completo',
      CUSTOM: `${customDateFrom || 'Inicio'} a ${customDateTo || 'Hoy'}`,
    };

    generateSalesReportPdf({
      filterInfo: {
        campaignName,
        advisorName,
        planName: selectedStage === 'ALL' ? 'Todos los estados' : getStageLabel(selectedStage),
        dateRange: timeLabels[timeFilter] || 'Personalizado',
      },
      summary: {
        totalSalesCount,
        approvedSalesCount: activeSales.length,
        pendingSalesCount: pendingSales.length + preactiveSales.length + simSentSales.length,
        returnedSalesCount: returnedSales.length,
        rejectedSalesCount: 0,
        totalSoldAmountApproved: totalSoldApproved,
        totalSoldAmountOverall: totalSoldOverall,
        uniqueClientsCount,
        approvalRate,
      },
      byAdvisor: advisorStats,
      sales: filteredSales.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        clientCedula: s.clientCedula,
        clientName: s.clientName,
        saleValue: s.saleValue,
        stage: getStageLabel(s.stage),
        campaign: { name: s.campaign.name },
        plan: { name: s.plan.name },
        advisor: { name: s.advisor.name },
      })),
    });
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'ACTIVO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Activo</span>
          </span>
        );
      case 'PREACTIVO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Zap className="w-3 h-3" />
            <span>Preactivo</span>
          </span>
        );
      case 'ENVIO_SIM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3" />
            <span>Envío de SIM</span>
          </span>
        );
      case 'DEVOLUCION':
      case 'DEVUELTO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <RotateCcw className="w-3 h-3" />
            <span>Devolución</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span>En cola</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Estadísticas</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportRealtimeCsv}
              disabled={isExportingRealtime}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-60"
            >
              {isExportingRealtime ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExportingRealtime ? 'Descargando...' : 'Exportar Excel'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Botones rápidos de período (Ventas del día / Ayer / Mes / Histórico) */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {[
            { id: 'TODAY', label: 'Hoy' },
            { id: 'YESTERDAY', label: 'Ayer' },
            { id: 'LAST_7_DAYS', label: '7 días' },
            { id: 'THIS_MONTH', label: 'Este mes' },
            { id: 'LAST_MONTH', label: 'Mes anterior' },
            { id: 'CUSTOM', label: 'Fechas' },
            { id: 'ALL', label: 'Todo' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                timeFilter === t.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros de Campaña, Consultor, Canal de Venta y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Campaña
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Todas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Consultor
            </label>
            <select
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Todos</option>
              {advisors.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Canal de Venta
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Todos los canales</option>
              {availableChannels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Estado
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="PREACTIVO">Preactivo</option>
              <option value="ENVIO_SIM">Envío de SIM</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="PENDIENTE_BACKOFFICE">En cola</option>
            </select>
          </div>
        </div>

        {timeFilter === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Desde</label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Hasta</label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* PANEL COMPARATIVO: HOY VS AYER / COMPARACIÓN ENTRE PERÍODOS */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Comparativa
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setComparisonMode('TODAY_VS_YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                comparisonMode === 'TODAY_VS_YESTERDAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy vs. Ayer
            </button>
            <button
              onClick={() => setComparisonMode('CUSTOM_PERIODS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                comparisonMode === 'CUSTOM_PERIODS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por fechas
            </button>
          </div>
        </div>

        {comparisonMode === 'CUSTOM_PERIODS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Período 1</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Desde</label>
                  <input
                    type="date"
                    value={periodAFrom}
                    onChange={(e) => setPeriodAFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hasta</label>
                  <input
                    type="date"
                    value={periodATo}
                    onChange={(e) => setPeriodATo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Período 2</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Desde</label>
                  <input
                    type="date"
                    value={periodBFrom}
                    onChange={(e) => setPeriodBFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hasta</label>
                  <input
                    type="date"
                    value={periodBTo}
                    onChange={(e) => setPeriodBTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
            <div className="flex items-center justify-between text-xs font-bold text-sky-800">
              <span>{comparisonData.labelA}</span>
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-black text-sky-950 mt-1.5">
              {formatCurrency(comparisonData.valueA)}
            </div>
            <div className="text-xs text-sky-700 font-semibold mt-1">
              {comparisonData.countA} ventas ({comparisonData.activeA} activas)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>{comparisonData.labelB}</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1.5">
              {formatCurrency(comparisonData.valueB)}
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1">
              {comparisonData.countB} ventas ({comparisonData.activeB} activas)
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              comparisonData.diffValue > 0
                ? 'bg-emerald-50/70 border-emerald-200'
                : comparisonData.diffValue < 0
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Diferencia</span>
              {comparisonData.diffValue > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : comparisonData.diffValue < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              ) : (
                <Minus className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div
              className={`text-xl font-black mt-1.5 ${
                comparisonData.diffValue > 0
                  ? 'text-emerald-800'
                  : comparisonData.diffValue < 0
                  ? 'text-rose-800'
                  : 'text-slate-800'
              }`}
            >
              {comparisonData.diffValue >= 0 ? '+' : ''}
              {formatCurrency(comparisonData.diffValue)} ({comparisonData.pctValue >= 0 ? '+' : ''}
              {comparisonData.pctValue}%)
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1">
              {comparisonData.diffCount >= 0 ? '+' : ''}
              {comparisonData.diffCount} ventas ({comparisonData.pctCount >= 0 ? '+' : ''}
              {comparisonData.pctCount}%)
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen del Período Seleccionado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Activo</span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(totalSoldApproved)}
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-0.5">
            {activeSales.length} ventas ({approvalRate}%)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase">Preactivo</span>
            <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(preactiveSales.reduce((a, s) => a + s.saleValue, 0))}
          </div>
          <div className="text-xs text-sky-700 font-bold mt-0.5">
            {preactiveSales.length} solicitudes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase">Envío de SIM</span>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(simSentSales.reduce((a, s) => a + s.saleValue, 0))}
          </div>
          <div className="text-xs text-purple-700 font-bold mt-0.5">
            {simSentSales.length} solicitudes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 uppercase">Devolución</span>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(returnedSales.reduce((a, s) => a + s.saleValue, 0))}
          </div>
          <div className="text-xs text-orange-700 font-bold mt-0.5">
            {returnedSales.length} solicitudes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Total</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(totalSoldOverall)}
          </div>
          <div className="text-xs text-slate-500 font-bold mt-0.5">
            {totalSalesCount} ventas ({pendingSales.length} en cola)
          </div>
        </div>
      </div>

      {/* Desglose por Campaña, Canal de Venta y Consultor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Por Campaña</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{campaignStats.length}</span>
          </div>

          <div className="space-y-3">
            {campaignStats.map((camp) => {
              const percentage =
                totalSoldOverall > 0 ? Math.round((camp.totalValue / totalSoldOverall) * 100) : 0;
              return (
                <div key={camp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: camp.color }}
                      />
                      <span className="font-bold text-xs text-slate-800">{camp.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-slate-900">
                        {formatCurrency(camp.totalValue)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 ml-1.5">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: camp.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-1">
                    <span>{camp.count} ventas</span>
                    <span className="text-emerald-700">{camp.approvedCount} activas</span>
                  </div>
                </div>
              );
            })}
            {campaignStats.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Sin registros.
              </p>
            )}
          </div>
        </div>

        {/* Por Canal de Venta (Medio por el cual se vende más) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Por Canal de Venta</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{channelStats.length}</span>
          </div>

          <div className="space-y-3">
            {channelStats.map((ch, idx) => {
              const countPercentage =
                totalSalesCount > 0 ? Math.round((ch.count / totalSalesCount) * 100) : 0;
              return (
                <div
                  key={ch.name}
                  className={`p-3 rounded-xl border ${
                    idx === 0
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{ch.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-slate-900">
                        {ch.count} ventas
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        ({countPercentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${countPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-1">
                    <span>{formatCurrency(ch.totalValue)}</span>
                    <span className="text-emerald-700">{ch.approvedCount} activas</span>
                  </div>
                </div>
              );
            })}
            {channelStats.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Sin registros.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Por Consultor</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{advisorStats.length}</span>
          </div>

          <div className="space-y-2.5">
            {advisorStats.map((adv, index) => (
              <div
                key={adv.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{adv.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {adv.count} ventas • <span className="text-emerald-700 font-semibold">{adv.approvedCount} activas</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(adv.totalValue)}
                  </span>
                </div>
              </div>
            ))}
            {advisorStats.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Sin registros.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Consolidada */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-700">
            Ventas ({tableDisplaySales.length})
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Buscar cliente, cédula, radicado..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Campaña / Plan</th>
                <th className="py-3.5 px-4">Canal / Origen</th>
                <th className="py-3.5 px-4">Consultor</th>
                <th className="py-3.5 px-4">Back Office / Radicado</th>
                <th className="py-3.5 px-4">Fechas</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableDisplaySales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    {formatDateShort(sale.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sale.clientName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {sale.documentType || 'Cédula'}: {sale.clientCedula}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-0.5"
                      style={{ backgroundColor: sale.campaign.color }}
                    >
                      {sale.campaign.name}
                    </span>
                    <div className="font-semibold text-slate-800">{sale.plan.name}</div>
                    <div className="font-bold text-emerald-700">{formatCurrency(sale.saleValue)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">
                      {sale.salesChannel || 'Telemercadeo'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Origen: {sale.originOperator || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="font-bold">{sale.advisor.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      C.C. {sale.advisor.cedula || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">
                      {sale.backofficeName || sale.validator?.name || 'Sin asignar'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Radicado: {sale.radicado || '—'}
                    </div>
                    {sale.lockedByName && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                        En gestión: {sale.lockedByName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                    <div>Preact: {sale.preactivationDate || '—'}</div>
                    <div>SIM: {sale.simSentDate || '—'}</div>
                    <div>
                      Act: {sale.activationDate || '—'}{' '}
                      {sale.activationMonth ? `(${sale.activationMonth})` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {getStageBadge(sale.stage)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDetailsModalSale(sale)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>Ficha</span>
                    </button>
                  </td>
                </tr>
              ))}
              {tableDisplaySales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Sin ventas en este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsModalSale && (
        <SaleDetailsModal
          isOpen={!!detailsModalSale}
          onClose={() => setDetailsModalSale(null)}
          sale={detailsModalSale}
        />
      )}
    </div>
  );
}
