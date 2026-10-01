'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  AlertTriangle,
  Eye,
  Phone,
  Search,
  RefreshCw,
  Calendar,
  Home,
  IdCard,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DocumentViewerModal from './DocumentViewerModal';
import SaleDetailsModal from './SaleDetailsModal';
import { Sale, getStageLabel } from './BackofficeView';

interface AdvisorSalesViewProps {
  sales: Sale[];
  currentUserId: string;
  currentUserRole: string;
  currentUserCreatedAt?: string;
  onRefresh: () => void;
  onOpenNewSale: () => void;
}

function isSameDayLocal(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function AdvisorSalesView({
  sales,
  currentUserId,
  currentUserRole,
  currentUserCreatedAt,
  onRefresh,
  onOpenNewSale,
}: AdvisorSalesViewProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const userStartDate = useMemo(() => {
    if (currentUserCreatedAt) {
      return new Date(currentUserCreatedAt);
    }
    return new Date();
  }, [currentUserCreatedAt]);

  const availableMonths = useMemo(() => {
    const list: Array<{ label: string; year: number; month: number; key: string }> = [];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const startY = userStartDate.getFullYear();
    const startM = userStartDate.getMonth();

    const endY = now.getFullYear();
    const endM = now.getMonth();

    for (let y = endY; y >= startY; y--) {
      const maxM = y === endY ? endM : 11;
      const minM = y === startY ? startM : 0;

      for (let m = maxM; m >= minM; m--) {
        list.push({
          label: `${monthNames[m]} ${y}`,
          year: y,
          month: m,
          key: `${y}-${m}`,
        });
      }
    }

    if (list.length === 0) {
      list.push({
        label: `${monthNames[currentMonth]} ${currentYear}`,
        year: currentYear,
        month: currentMonth,
        key: `${currentYear}-${currentMonth}`,
      });
    }

    return list;
  }, [userStartDate, currentMonth, currentYear]);

  const [selectedPeriodMode, setSelectedPeriodMode] = useState<'MONTH' | 'TODAY' | 'YESTERDAY'>('MONTH');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    `${currentYear}-${currentMonth}`
  );

  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [viewingDocSale, setViewingDocSale] = useState<Sale | null>(null);
  const [detailsModalSale, setDetailsModalSale] = useState<Sale | null>(null);

  const [resubmitSale, setResubmitSale] = useState<Sale | null>(null);
  const [resubmitCedulaUrl, setResubmitCedulaUrl] = useState('');
  const [resubmitCedulaName, setResubmitCedulaName] = useState('');
  const [resubmitUtilityUrl, setResubmitUtilityUrl] = useState('');
  const [resubmitUtilityName, setResubmitUtilityName] = useState('');
  const [resubmitComment, setResubmitComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const mySales = useMemo(() => {
    return currentUserRole === 'ASESOR'
      ? sales.filter((s) => s.advisorId === currentUserId)
      : sales;
  }, [sales, currentUserRole, currentUserId]);

  // Bandeja de devoluciones global del asesor: no se limita por fecha para nunca perder una solicitud devuelta
  const allMyReturns = useMemo(() => {
    return mySales.filter((s) => s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO');
  }, [mySales]);

  const periodFilteredSales = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    if (selectedPeriodMode === 'TODAY') {
      return mySales.filter((s) => isSameDayLocal(new Date(s.createdAt), today));
    }
    if (selectedPeriodMode === 'YESTERDAY') {
      return mySales.filter((s) => isSameDayLocal(new Date(s.createdAt), yesterday));
    }

    const selected = availableMonths.find((m) => m.key === selectedMonthKey) || availableMonths[0];
    if (!selected) return mySales;

    const startDate = new Date(selected.year, selected.month, 1, 0, 0, 0);
    const endDate = new Date(selected.year, selected.month + 1, 0, 23, 59, 59, 999);

    return mySales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [mySales, availableMonths, selectedMonthKey, selectedPeriodMode]);

  const totalCount = periodFilteredSales.length;
  const pendingCount = periodFilteredSales.filter((s) => s.stage === 'PENDIENTE_BACKOFFICE').length;
  const preactivoCount = periodFilteredSales.filter((s) => s.stage === 'PREACTIVO').length;
  const envioSimCount = periodFilteredSales.filter((s) => s.stage === 'ENVIO_SIM').length;
  const activoCount = periodFilteredSales.filter(
    (s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO'
  ).length;
  // Conteo total de devoluciones para que la bandeja del asesor las reporte de inmediato
  const devolucionCount = allMyReturns.length;

  const displayedSales = useMemo(() => {
    // Si el usuario selecciona la pestaña de Devolución, mostramos TODAS sus solicitudes devueltas (bandeja directa)
    const baseList = filterStage === 'DEVOLUCION' ? allMyReturns : periodFilteredSales;

    return baseList.filter((s) => {
      if (filterStage !== 'ALL' && filterStage !== 'DEVOLUCION') {
        if (filterStage === 'ACTIVO') {
          if (s.stage !== 'ACTIVO' && s.stage !== 'APROBADO') return false;
        } else if (s.stage !== filterStage) {
          return false;
        }
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          s.clientName.toLowerCase().includes(q) ||
          s.clientCedula.toLowerCase().includes(q) ||
          s.campaign.name.toLowerCase().includes(q) ||
          (s.radicado && s.radicado.toLowerCase().includes(q)) ||
          (s.contractNumber && s.contractNumber.toLowerCase().includes(q)) ||
          (s.otMin && s.otMin.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [periodFilteredSales, allMyReturns, filterStage, searchQuery]);

  const handleResubmitUpload = async (file: File, docType: 'cedula' | 'utility') => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (docType === 'cedula') {
          setResubmitCedulaUrl(data.url);
          setResubmitCedulaName(data.name);
        } else {
          setResubmitUtilityUrl(data.url);
          setResubmitUtilityName(data.name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitSale) return;
    setIsResubmitting(true);

    try {
      const res = await fetch(`/api/sales/${resubmitSale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REENVIAR',
          userId: currentUserId,
          comment: resubmitComment.trim() || 'Documentación subsanada por el asesor.',
          ...(resubmitCedulaUrl
            ? { documentCedulaUrl: resubmitCedulaUrl, documentCedulaName: resubmitCedulaName }
            : {}),
          ...(resubmitUtilityUrl
            ? { documentUtilityUrl: resubmitUtilityUrl, documentUtilityName: resubmitUtilityName }
            : {}),
        }),
      });

      if (res.ok) {
        setResubmitSale(null);
        setResubmitCedulaUrl('');
        setResubmitCedulaName('');
        setResubmitUtilityUrl('');
        setResubmitUtilityName('');
        setResubmitComment('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResubmitting(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'ACTIVO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span>Activo</span>
          </span>
        );
      case 'PREACTIVO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <span>Preactivo</span>
          </span>
        );
      case 'ENVIO_SIM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <span>Envío de SIM</span>
          </span>
        );
      case 'DEVOLUCION':
      case 'DEVUELTO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <span>Devolución</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span>En cola</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Mis Ventas</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedPeriodMode('TODAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedPeriodMode === 'TODAY'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setSelectedPeriodMode('YESTERDAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedPeriodMode === 'YESTERDAY'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ayer
              </button>
              <button
                onClick={() => setSelectedPeriodMode('MONTH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedPeriodMode === 'MONTH'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mes
              </button>
            </div>

            {selectedPeriodMode === 'MONTH' && (
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-sky-600" />
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onOpenNewSale}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Venta</span>
            </button>
          </div>
        </div>

        {/* Filtros de Estado */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-4">
          {[
            { id: 'ALL', label: 'Todas', count: totalCount, color: 'text-slate-900' },
            { id: 'PENDIENTE_BACKOFFICE', label: 'En cola', count: pendingCount, color: 'text-amber-600' },
            { id: 'PREACTIVO', label: 'Preactivo', count: preactivoCount, color: 'text-sky-600' },
            { id: 'ENVIO_SIM', label: 'Envío de SIM', count: envioSimCount, color: 'text-purple-600' },
            { id: 'ACTIVO', label: 'Activo', count: activoCount, color: 'text-emerald-600' },
            { id: 'DEVOLUCION', label: 'Devolución', count: devolucionCount, color: 'text-orange-600' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStage(item.id)}
              className={`p-3 rounded-xl text-left border transition ${
                filterStage === item.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  filterStage === item.id ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
              <span
                className={`text-xl font-black mt-0.5 block ${
                  filterStage === item.id ? 'text-white' : item.color
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bandeja de Devoluciones del Asesor */}
      {devolucionCount > 0 && filterStage !== 'DEVOLUCION' && (
        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-orange-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">
                Bandeja de Devoluciones: {devolucionCount} solicitud(es) devuelta(s) por Back Office
              </p>
              <p className="text-xs text-orange-100">
                Back Office devolvió estas solicitudes por inconsistencias o soportes pendientes. Debes subsanarlas para continuar su trámite.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStage('DEVOLUCION')}
            className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-800 text-xs font-black rounded-xl transition shadow-xs whitespace-nowrap self-start sm:self-center cursor-pointer"
          >
            Abrir Bandeja ({devolucionCount})
          </button>
        </div>
      )}

      {filterStage === 'DEVOLUCION' && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-orange-950">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span>
              Mostrando <strong>Bandeja de Devoluciones</strong> ({displayedSales.length} solicitudes). Revisa la causa indicada por Back Office y presiona <strong>Subsanar</strong> para reenviar.
            </span>
          </div>
          <button
            onClick={() => setFilterStage('ALL')}
            className="text-xs font-bold text-orange-700 hover:text-orange-900 underline ml-3 whitespace-nowrap cursor-pointer"
          >
            Ver todas las ventas
          </button>
        </div>
      )}

      {/* Búsqueda y Tabla */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Ventas ({displayedSales.length})
          </span>

          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, cédula, radicado..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                <th className="py-3.5 px-4">Radicado / Back Office</th>
                <th className="py-3.5 px-4 text-center">Documentos</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSales.map((sale) => {
                const isReturned = sale.stage === 'DEVOLUCION' || sale.stage === 'DEVUELTO';
                return (
                <tr
                  key={sale.id}
                  className={`transition ${
                    isReturned
                      ? 'bg-orange-50/70 border-l-4 border-l-orange-500 hover:bg-orange-100/60'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(sale.createdAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{sale.clientName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {sale.documentType || 'Cédula'}: {sale.clientCedula}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-0.5"
                      style={{ backgroundColor: sale.campaign.color || '#0284c7' }}
                    >
                      {sale.campaign.name}
                    </span>
                    <div className="font-semibold text-slate-800">
                      {sale.planNameSnapshot || sale.plan?.name || sale.acquiredServices}
                    </div>
                    <div className="text-emerald-700 font-bold">{formatCurrency(sale.saleValue)}</div>
                  </td>

                  <td className="py-3.5 px-4 text-[11px]">
                    <div className="font-bold text-slate-800">
                      Radicado: <span className="font-mono">{sale.radicado || '—'}</span>
                    </div>
                    <div className="text-slate-500">
                      Back Office: {sale.backofficeName || sale.validator?.name || 'En cola'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => setDetailsModalSale(sale)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        <span>Ficha</span>
                      </button>
                      <button
                        onClick={() => setViewingDocSale(sale)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-bold text-xs transition border border-sky-200/60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Soportes</span>
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStageBadge(sale.stage)}
                    {(sale.stage === 'DEVOLUCION' || sale.stage === 'DEVUELTO') &&
                      (sale.backofficeObservation || sale.returnReason) && (
                        <div
                          className="mt-1 text-[10px] text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 max-w-[170px] mx-auto truncate"
                          title={sale.backofficeObservation || sale.returnReason || ''}
                        >
                          {sale.backofficeObservation || sale.returnReason}
                        </div>
                      )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {sale.stage === 'DEVOLUCION' || sale.stage === 'DEVUELTO' ? (
                      <button
                        onClick={() => {
                          setResubmitSale(sale);
                          setResubmitCedulaUrl(sale.documentCedulaUrl || sale.documentUrl || '');
                          setResubmitCedulaName(sale.documentCedulaName || sale.documentName || '');
                          setResubmitUtilityUrl(sale.documentUtilityUrl || '');
                          setResubmitUtilityName(sale.documentUtilityName || '');
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Subsanar</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
              {displayedSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Sin ventas en este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Subsanar */}
      {resubmitSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Subsanar devolución</h3>
              <button
                onClick={() => setResubmitSale(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResubmit} className="p-5 space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900">
                <p className="font-semibold">Observación de Back Office:</p>
                <p className="mt-0.5">
                  {resubmitSale.backofficeObservation ||
                    resubmitSale.returnReason ||
                    'Revisar documentación.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Cargar nueva Cédula (si aplica)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    e.target.files?.[0] && handleResubmitUpload(e.target.files[0], 'cedula')
                  }
                  className="w-full text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Cargar nuevo Recibo de Servicio Público (si aplica)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    e.target.files?.[0] && handleResubmitUpload(e.target.files[0], 'utility')
                  }
                  className="w-full text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota de corrección
                </label>
                <textarea
                  value={resubmitComment}
                  onChange={(e) => setResubmitComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResubmitSale(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResubmitting || isUploading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isResubmitting ? 'Enviando...' : 'Reenviar a Back Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsModalSale && (
        <SaleDetailsModal
          isOpen={!!detailsModalSale}
          onClose={() => setDetailsModalSale(null)}
          sale={detailsModalSale}
          onOpenDocuments={() => {
            const s = detailsModalSale;
            setDetailsModalSale(null);
            setViewingDocSale(s);
          }}
        />
      )}

      {viewingDocSale && (
        <DocumentViewerModal
          isOpen={!!viewingDocSale}
          onClose={() => setViewingDocSale(null)}
          documentCedulaUrl={viewingDocSale.documentCedulaUrl || viewingDocSale.documentUrl}
          documentCedulaName={viewingDocSale.documentCedulaName || viewingDocSale.documentName}
          documentUtilityUrl={viewingDocSale.documentUtilityUrl}
          documentUtilityName={viewingDocSale.documentUtilityName}
          clientName={viewingDocSale.clientName}
          clientCedula={viewingDocSale.clientCedula}
          stage={viewingDocSale.stage}
          returnReason={viewingDocSale.backofficeObservation || viewingDocSale.returnReason}
        />
      )}
    </div>
  );
}
