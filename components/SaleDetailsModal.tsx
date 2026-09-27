'use client';

import React from 'react';
import { X, FileText, UserCheck, Building2, MapPin, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getStageLabel } from './BackofficeView';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onOpenDocuments?: () => void;
}

export default function SaleDetailsModal({
  isOpen,
  onClose,
  sale,
  onOpenDocuments,
}: SaleDetailsModalProps) {
  if (!isOpen || !sale) return null;

  const FieldItem = ({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) => (
    <div className={`p-2.5 rounded-lg border ${highlight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200/80'}`}>
      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`block text-xs font-semibold mt-0.5 break-words ${highlight ? 'text-emerald-900' : 'text-slate-800'}`}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">
                Ficha de Venta #{sale.externalId || sale.id.slice(-6)}
              </h3>
              <p className="text-xs text-slate-300">
                Cliente: <span className="font-semibold text-white">{sale.clientName}</span> ({sale.documentType || 'Cédula'}: {sale.clientCedula})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Consultor y Campaña */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>1. Datos de Registro y Consultor</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldItem label="Fecha de Venta" value={formatDate(sale.createdAt)} />
              <FieldItem label="Cédula Consultor" value={sale.advisor?.cedula || '—'} />
              <FieldItem label="Consultor" value={sale.advisor?.name} />
              <FieldItem label="Campaña" value={sale.campaign?.name} />
            </div>
          </div>

          {/* Section 2: Identificación del Cliente */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>2. Identificación del Cliente</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldItem label="Tipo de Documento" value={sale.documentType || 'Cédula'} />
              <FieldItem label="Número de Documento" value={sale.clientCedula} />
              <FieldItem label="Nombre Cliente" value={sale.clientName} />
              <FieldItem label="Cédula Rep. Legal" value={sale.legalRepCedula} />
            </div>
          </div>

          {/* Section 3: Ubicación y Contacto */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>3. Ubicación y Contacto</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldItem label="Dirección" value={sale.address} />
              <FieldItem label="Barrio" value={sale.neighborhood} />
              <FieldItem label="Departamento" value={sale.department} />
              <FieldItem label="Ciudad" value={sale.city} />
              <FieldItem label="Contacto" value={sale.contactName} />
              <FieldItem label="Número Contacto 1" value={sale.clientPhone} />
              <FieldItem label="Número Contacto 2" value={sale.contactPhone2} />
              <FieldItem label="Correo Electrónico" value={sale.clientEmail} />
            </div>
          </div>

          {/* Section 4: Datos Técnicos, Contrato, Validación y OTP */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>4. Datos Comerciales, Contrato, Validación y OTP</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldItem label="OT / MIN" value={sale.otMin} />
              <FieldItem label="Servicios Adquiridos" value={sale.acquiredServices || sale.plan?.name} />
              <FieldItem label="Recurrente" value={sale.recurrent} />
              <FieldItem label="CFM con IVA" value={formatCurrency(sale.saleValue)} highlight />
              <FieldItem label="NIP" value={sale.nip} />
              <FieldItem label="Número de Contrato" value={sale.contractNumber} />
              <FieldItem label="Tipo de Contrato" value={sale.contractType} />
              <FieldItem label="Método de Validación" value={sale.validationMethod} />
              <FieldItem label="Fecha Validación Identidad" value={sale.identityValidationDate} />
              <FieldItem label="Línea OTP Realizada" value={sale.otpLine} />
              <FieldItem label="Número OTP Confirmado" value={sale.otpCode} />
              <FieldItem label="Tipo de Venta" value={sale.saleType} />
              <FieldItem label="Nombre de la Base" value={sale.databaseName} />
              <FieldItem label="ID" value={sale.externalId} />
              <div className="col-span-2">
                <FieldItem label="Observación Consultor" value={sale.observation} />
              </div>
            </div>
          </div>

          {/* Section 5: Gestión y Activación Back Office */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>5. Gestión y Activación de Back Office</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldItem label="Estado Back Office" value={getStageLabel(sale.stage)} highlight />
              <FieldItem label="Back Office Encargado" value={sale.backofficeName || sale.validator?.name || 'Sin asignar'} />
              <FieldItem label="Radicado" value={sale.radicado} />
              <FieldItem
                label="Estado de Gestión"
                value={sale.lockedByName ? `En gestión por ${sale.lockedByName}` : 'Disponible'}
              />
              <FieldItem label="Fecha de Preactivación" value={sale.preactivationDate} />
              <FieldItem label="Fecha de Envío de SIM" value={sale.simSentDate} />
              <FieldItem label="Fecha de Activación" value={sale.activationDate} />
              <FieldItem label="Mes de Activación" value={sale.activationMonth} />
              <div className="col-span-2 sm:col-span-4">
                <FieldItem
                  label="Observación Back Office"
                  value={sale.backofficeObservation || sale.returnReason}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Estado actual: <strong className="text-slate-800">{getStageLabel(sale.stage)}</strong>
          </div>
          <div className="flex items-center space-x-3">
            {onOpenDocuments && (
              <button
                onClick={onOpenDocuments}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Ver Soportes (Cédula y Recibo)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
