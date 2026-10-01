'use client';

import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  CheckCircle,
  RotateCcw,
  Clock,
  Eye,
  Search,
  History,
  User,
  Loader2,
  BarChart2,
  FileText,
  Lock,
  Unlock,
  Truck,
  Zap,
  ShieldCheck,
  Calendar,
  Hash,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DocumentViewerModal from './DocumentViewerModal';
import SaleDetailsModal from './SaleDetailsModal';

export type BackofficeStage =
  | 'PENDIENTE_BACKOFFICE'
  | 'PREACTIVO'
  | 'ENVIO_SIM'
  | 'ACTIVO'
  | 'DEVOLUCION'
  | 'APROBADO'
  | 'DEVUELTO'
  | 'RECHAZADO';

export interface Sale {
  id: string;
  campaignId: string;
  planId: string;
  advisorId: string;
  validatorId?: string | null;
  lockedById?: string | null;
  lockedByName?: string | null;
  lockedAt?: string | null;
  documentType?: string | null;
  clientCedula: string;
  clientName: string;
  legalRepCedula?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  department?: string | null;
  city?: string | null;
  contactName?: string | null;
  clientPhone?: string | null;
  contactPhone2?: string | null;
  clientEmail?: string | null;
  otMin?: string | null;
  acquiredServices?: string | null;
  recurrent?: string | null;
  saleValue: number;
  nip?: string | null;
  contractNumber?: string | null;
  contractType?: string | null;
  validationMethod?: string | null;
  identityValidationDate?: string | null;
  otpLine?: string | null;
  otpCode?: string | null;
  saleType?: string | null;
  originOperator?: string | null;
  salesChannel?: string | null;
  databaseName?: string | null;
  externalId?: string | null;
  observation?: string | null;
  stage: BackofficeStage;
  backofficeName?: string | null;
  radicado?: string | null;
  backofficeObservation?: string | null;
  preactivationDate?: string | null;
  simSentDate?: string | null;
  activationDate?: string | null;
  activationMonth?: string | null;
  returnReason?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  documentCedulaUrl?: string | null;
  documentCedulaName?: string | null;
  documentUtilityUrl?: string | null;
  documentUtilityName?: string | null;
  planNameSnapshot?: string | null;
  planPriceSnapshot?: number | null;
  createdAt: string;
  updatedAt: string;
  campaign: { id: string; name: string; color: string };
  plan: { id: string; name: string; price: number; features?: string };
  advisor: { id: string; cedula?: string; name: string; email: string };
  validator?: { id: string; cedula?: string; name: string; email: string } | null;
  lockedBy?: { id: string; cedula?: string; name: string; email: string } | null;
  auditLogs?: Array<{
    id: string;
    action: string;
    comment?: string | null;
    timestamp: string;
    user: { name: string; role: string };
  }>;
}

interface BackofficeViewProps {
  sales: Sale[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  assignedCampaignIds?: string[];
  onRefresh: () => void;
}

export function getStageLabel(stage: string): string {
  switch (stage) {
    case 'ACTIVO':
    case 'APROBADO':
      return 'Activo';
    case 'PREACTIVO':
      return 'Preactivo';
    case 'ENVIO_SIM':
      return 'Envío de SIM';
    case 'DEVOLUCION':
    case 'DEVUELTO':
      return 'Devolución';
    case 'PENDIENTE_BACKOFFICE':
      return 'En cola';
    case 'RECHAZADO':
      return 'Rechazado';
    default:
      return stage;
  }
}

export function computeMonthFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return '';
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  if (monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
    return `${monthNames[monthIndex]} ${year}`;
  }
  return '';
}

export default function BackofficeView({
  sales,
  currentUserId,
  currentUserName,
  currentUserRole,
  assignedCampaignIds,
  onRefresh,
}: BackofficeViewProps) {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'my_dashboard'>('queue');
  const [lockErrorBanner, setLockErrorBanner] = useState<string | null>(null);

  const [viewingDocSale, setViewingDocSale] = useState<Sale | null>(null);
  const [detailsModalSale, setDetailsModalSale] = useState<Sale | null>(null);
  const [historyModalSale, setHistoryModalSale] = useState<Sale | null>(null);

  const [managingSale, setManagingSale] = useState<Sale | null>(null);
  const [boStage, setBoStage] = useState<string>('PREACTIVO');
  const [boRadicado, setBoRadicado] = useState<string>('');
  const [boPreactivationDate, setBoPreactivationDate] = useState<string>('');
  const [boSimSentDate, setBoSimSentDate] = useState<string>('');
  const [boActivationDate, setBoActivationDate] = useState<string>('');
  const [boActivationMonth, setBoActivationMonth] = useState<string>('');
  const [boObservation, setBoObservation] = useState<string>('');
  const [isTakingId, setIsTakingId] = useState<string | null>(null);
  const [isSavingBo, setIsSavingBo] = useState<boolean>(false);
  const [isReleasingBo, setIsReleasingBo] = useState<boolean>(false);

  const accessibleSales = useMemo(() => {
    if (!assignedCampaignIds || assignedCampaignIds.length === 0) {
      return sales;
    }
    return sales.filter((s) => assignedCampaignIds.includes(s.campaignId));
  }, [sales, assignedCampaignIds]);

  const pendingCount = accessibleSales.filter((s) => s.stage === 'PENDIENTE_BACKOFFICE').length;
  const preactivoCount = accessibleSales.filter((s) => s.stage === 'PREACTIVO').length;
  const envioSimCount = accessibleSales.filter((s) => s.stage === 'ENVIO_SIM').length;
  const activoCount = accessibleSales.filter(
    (s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO'
  ).length;
  const devolucionCount = accessibleSales.filter(
    (s) => s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO'
  ).length;

  const myManagedSales = useMemo(
    () =>
      accessibleSales.filter(
        (s) => s.validatorId === currentUserId || s.backofficeName === currentUserName
      ),
    [accessibleSales, currentUserId, currentUserName]
  );

  const myActiveSales = myManagedSales.filter(
    (s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO'
  );
  const myPreactivoSales = myManagedSales.filter((s) => s.stage === 'PREACTIVO');
  const mySimSales = myManagedSales.filter((s) => s.stage === 'ENVIO_SIM');
  const myReturnedSales = myManagedSales.filter(
    (s) => s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO'
  );

  const displayedSales = useMemo(() => {
    return accessibleSales.filter((sale) => {
      if (filterStage !== 'ALL') {
        if (filterStage === 'ACTIVO') {
          if (sale.stage !== 'ACTIVO' && sale.stage !== 'APROBADO') return false;
        } else if (filterStage === 'DEVOLUCION') {
          if (sale.stage !== 'DEVOLUCION' && sale.stage !== 'DEVUELTO') return false;
        } else if (sale.stage !== filterStage) {
          return false;
        }
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          sale.clientName.toLowerCase().includes(q) ||
          sale.clientCedula.toLowerCase().includes(q) ||
          sale.advisor.name.toLowerCase().includes(q) ||
          sale.campaign.name.toLowerCase().includes(q) ||
          (sale.radicado && sale.radicado.toLowerCase().includes(q)) ||
          (sale.backofficeName && sale.backofficeName.toLowerCase().includes(q)) ||
          (sale.contractNumber && sale.contractNumber.toLowerCase().includes(q)) ||
          (sale.otMin && sale.otMin.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [accessibleSales, filterStage, searchQuery]);

  const populateManagementModal = (sale: Sale) => {
    setManagingSale(sale);
    const defaultNextStage =
      sale.stage === 'PENDIENTE_BACKOFFICE'
        ? 'PREACTIVO'
        : sale.stage === 'APROBADO'
        ? 'ACTIVO'
        : sale.stage === 'DEVUELTO'
        ? 'DEVOLUCION'
        : sale.stage;
    setBoStage(defaultNextStage);
    setBoRadicado(sale.radicado || '');
    setBoPreactivationDate(sale.preactivationDate || '');
    setBoSimSentDate(sale.simSentDate || '');
    setBoActivationDate(sale.activationDate || '');
    setBoActivationMonth(
      sale.activationMonth || (sale.activationDate ? computeMonthFromDate(sale.activationDate) : '')
    );
    setBoObservation(sale.backofficeObservation || sale.returnReason || '');
  };

  const handleTakeAndManageSale = async (sale: Sale) => {
    setLockErrorBanner(null);

    if (sale.lockedById === currentUserId) {
      populateManagementModal(sale);
      return;
    }

    setIsTakingId(sale.id);
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOMAR',
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLockErrorBanner(
          data.error || 'La solicitud ya fue tomada por otro operador.'
        );
        onRefresh();
        return;
      }

      onRefresh();
      populateManagementModal(data);
    } catch (err) {
      console.error('Error al tomar solicitud:', err);
    } finally {
      setIsTakingId(null);
    }
  };

  const handleReleaseSale = async (saleId: string, savePartialFields = false) => {
    setIsReleasingBo(true);
    setLockErrorBanner(null);
    try {
      const bodyPayload: any = {
        action: 'SOLTAR',
        userId: currentUserId,
        userName: currentUserName,
        userRole: currentUserRole,
      };

      if (savePartialFields) {
        bodyPayload.radicado = boRadicado;
        bodyPayload.preactivationDate = boPreactivationDate;
        bodyPayload.simSentDate = boSimSentDate;
        bodyPayload.activationDate = boActivationDate;
        bodyPayload.activationMonth = boActivationMonth;
        bodyPayload.backofficeObservation = boObservation;
      }

      const res = await fetch(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        setManagingSale(null);
        onRefresh();
      } else {
        const errData = await res.json();
        setLockErrorBanner(errData.error || 'Error al liberar la solicitud');
      }
    } catch (err) {
      console.error('Error al soltar solicitud:', err);
    } finally {
      setIsReleasingBo(false);
    }
  };

  const handleSaveBackofficeManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSale) return;
    setIsSavingBo(true);
    setLockErrorBanner(null);

    try {
      const res = await fetch(`/api/sales/${managingSale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GESTIONAR_BACKOFFICE',
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
          nextStage: boStage,
          radicado: boRadicado,
          preactivationDate: boPreactivationDate,
          simSentDate: boSimSentDate,
          activationDate: boActivationDate,
          activationMonth: boActivationMonth,
          backofficeObservation: boObservation,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setManagingSale(null);
        onRefresh();
      } else {
        setLockErrorBanner(data.error || 'Error al guardar la gestión');
      }
    } catch (err) {
      console.error('Error guardando gestión Back Office:', err);
    } finally {
      setIsSavingBo(false);
    }
  };

  const handleActivationDateChange = (val: string) => {
    setBoActivationDate(val);
    if (val) {
      setBoActivationMonth(computeMonthFromDate(val));
    } else {
      setBoActivationMonth('');
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'ACTIVO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Activo</span>
          </span>
        );
      case 'PREACTIVO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Zap className="w-3.5 h-3.5" />
            <span>Preactivo</span>
          </span>
        );
      case 'ENVIO_SIM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Envío de SIM</span>
          </span>
        );
      case 'DEVOLUCION':
      case 'DEVUELTO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Devolución</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
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
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Back Office</h1>
              <p className="text-xs text-slate-500">{currentUserName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solicitudes
            </button>
            <button
              onClick={() => setActiveSubTab('my_dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSubTab === 'my_dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Mi Resumen</span>
            </button>
          </div>
        </div>

        {lockErrorBanner && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{lockErrorBanner}</span>
            </div>
            <button
              onClick={() => setLockErrorBanner(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {activeSubTab === 'my_dashboard' ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase">Activo</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-950 mt-1.5">
                {formatCurrency(myActiveSales.reduce((a, s) => a + s.saleValue, 0))}
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                {myActiveSales.length} solicitudes
              </div>
            </div>

            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 uppercase">Preactivo</span>
                <Zap className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-black text-sky-950 mt-1.5">
                {formatCurrency(myPreactivoSales.reduce((a, s) => a + s.saleValue, 0))}
              </div>
              <div className="text-xs text-sky-700 font-semibold mt-0.5">
                {myPreactivoSales.length} solicitudes
              </div>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase">Envío de SIM</span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-purple-950 mt-1.5">
                {formatCurrency(mySimSales.reduce((a, s) => a + s.saleValue, 0))}
              </div>
              <div className="text-xs text-purple-700 font-semibold mt-0.5">
                {mySimSales.length} solicitudes
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-800 uppercase">Devolución</span>
                <RotateCcw className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-black text-orange-950 mt-1.5">
                {formatCurrency(myReturnedSales.reduce((a, s) => a + s.saleValue, 0))}
              </div>
              <div className="text-xs text-orange-700 font-semibold mt-0.5">
                {myReturnedSales.length} solicitudes
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-4">
            {[
              { id: 'ALL', label: 'Todas', count: accessibleSales.length, color: 'text-slate-900' },
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
        )}
      </div>

      {/* Tabla de Solicitudes */}
      {activeSubTab === 'queue' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">
              Solicitudes ({displayedSales.length})
            </span>

            <div className="relative w-full sm:w-72">
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
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-[24%]">Cliente / Campaña</th>
                  <th className="py-3.5 px-4 w-[14%]">Consultor</th>
                  <th className="py-3.5 px-4 w-[19%]">Estado / Radicado</th>
                  <th className="py-3.5 px-4 w-[16%]">Fechas</th>
                  <th className="py-3.5 px-4 w-[13%]">Back Office</th>
                  <th className="py-3.5 px-3 text-center w-[7%]">Soportes</th>
                  <th className="py-3.5 px-4 text-right w-[7%]">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedSales.map((sale) => {
                  const isLockedByMe = sale.lockedById === currentUserId;
                  const isLockedByOther =
                    Boolean(sale.lockedById) && sale.lockedById !== currentUserId;
                  const lockerName =
                    sale.lockedByName || sale.lockedBy?.name || 'Otro operador';

                  return (
                    <tr
                      key={sale.id}
                      className={`transition ${
                        isLockedByMe
                          ? 'bg-sky-50/40'
                          : isLockedByOther
                          ? 'bg-slate-50/80'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate" title={sale.clientName}>
                          {sale.clientName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {sale.documentType || 'Cédula'}: {sale.clientCedula}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: sale.campaign.color || '#0284c7' }}
                          >
                            {sale.campaign.name}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(sale.saleValue)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 truncate" title={sale.advisor.name}>
                          {sale.advisor.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          C.C. {sale.advisor.cedula || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(sale.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStageBadge(sale.stage)}
                        <div className="text-[11px] text-slate-600 mt-1">
                          Radicado: <strong className="font-mono text-slate-800">{sale.radicado || '—'}</strong>
                        </div>
                        {(sale.backofficeObservation || sale.returnReason) && (
                          <p
                            className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 break-words"
                            title={sale.backofficeObservation || sale.returnReason || ''}
                          >
                            {sale.backofficeObservation || sale.returnReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <div>Pre: <span className="font-semibold text-slate-800">{sale.preactivationDate || '—'}</span></div>
                          <div>SIM: <span className="font-semibold text-slate-800">{sale.simSentDate || '—'}</span></div>
                          <div>Act: <span className="font-semibold text-slate-800">{sale.activationDate || '—'}</span></div>
                          <div>Mes: <span className="font-semibold text-slate-800">{sale.activationMonth || '—'}</span></div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px] font-semibold text-slate-800">
                          {sale.backofficeName || sale.validator?.name || 'Sin asignar'}
                        </div>

                        <div className="mt-1">
                          {isLockedByMe && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              <Lock className="w-3 h-3" />
                              <span>En gestión</span>
                            </span>
                          )}
                          {isLockedByOther && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Lock className="w-3 h-3" />
                              <span>{lockerName}</span>
                            </span>
                          )}
                          {!sale.lockedById && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600">
                              <Unlock className="w-3 h-3" />
                              <span>Libre</span>
                            </span>
                          )}
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

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isLockedByOther ? (
                            <div className="flex items-center space-x-1">
                              <button
                                disabled
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Bloqueada</span>
                              </button>
                              {currentUserRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleReleaseSale(sale.id, false)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                                >
                                  Liberar
                                </button>
                              )}
                            </div>
                          ) : isLockedByMe ? (
                            <>
                              <button
                                onClick={() => populateManagementModal(sale)}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition shadow-2xs"
                              >
                                Gestionar
                              </button>
                              <button
                                onClick={() => handleReleaseSale(sale.id, false)}
                                disabled={isReleasingBo}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                              >
                                Soltar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleTakeAndManageSale(sale)}
                              disabled={isTakingId === sale.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition shadow-2xs disabled:opacity-50"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{isTakingId === sale.id ? 'Tomando...' : 'Tomar'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setHistoryModalSale(sale)}
                            title="Historial"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayedSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                      Sin solicitudes en este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Gestión Back Office */}
      {managingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {managingSale.clientName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {managingSale.documentType || 'Cédula'}: {managingSale.clientCedula} •{' '}
                    {managingSale.campaign.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalSale(managingSale)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
                >
                  Ficha
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDocSale(managingSale)}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Soportes
                </button>
                <button
                  type="button"
                  onClick={() => setManagingSale(null)}
                  className="text-slate-400 hover:text-white px-1.5 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBackofficeManagement} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Estado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'PREACTIVO', label: 'Preactivo', icon: Zap },
                    { id: 'ENVIO_SIM', label: 'Envío de SIM', icon: Truck },
                    { id: 'ACTIVO', label: 'Activo', icon: CheckCircle },
                    { id: 'DEVOLUCION', label: 'Devolución', icon: RotateCcw },
                  ].map((st) => {
                    const Icon = st.icon;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setBoStage(st.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-bold transition ${
                          boStage === st.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Back Office y Radicado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Back Office
                  </label>
                  <input
                    type="text"
                    value={currentUserName}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Radicado
                  </label>
                  <input
                    type="text"
                    value={boRadicado}
                    onChange={(e) => setBoRadicado(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Preactivación
                  </label>
                  <input
                    type="date"
                    value={boPreactivationDate}
                    onChange={(e) => setBoPreactivationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Envío de SIM
                  </label>
                  <input
                    type="date"
                    value={boSimSentDate}
                    onChange={(e) => setBoSimSentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Activación
                  </label>
                  <input
                    type="date"
                    value={boActivationDate}
                    onChange={(e) => handleActivationDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mes de Activación
                  </label>
                  <input
                    type="text"
                    value={boActivationMonth}
                    onChange={(e) => setBoActivationMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Observación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observación {boStage === 'DEVOLUCION' && '*'}
                </label>
                <textarea
                  value={boObservation}
                  onChange={(e) => setBoObservation(e.target.value)}
                  required={boStage === 'DEVOLUCION'}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => handleReleaseSale(managingSale.id, true)}
                  disabled={isReleasingBo || isSavingBo}
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isReleasingBo ? 'Liberando...' : 'Soltar'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setManagingSale(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBo || isReleasingBo}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    {isSavingBo ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial */}
      {historyModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">
                Historial — {historyModalSale.clientName}
              </h3>
              <button
                onClick={() => setHistoryModalSale(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {historyModalSale.auditLogs && historyModalSale.auditLogs.length > 0 ? (
                historyModalSale.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-slate-600">{log.comment}</p>
                    <p className="text-[11px] text-slate-400">
                      {log.user?.name} ({log.user?.role})
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Sin registros adicionales.
                </p>
              )}
            </div>
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
