'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, CheckCircle2, AlertTriangle, XCircle, Home, IdCard } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCedulaUrl?: string | null;
  documentCedulaName?: string | null;
  documentUtilityUrl?: string | null;
  documentUtilityName?: string | null;
  clientName: string;
  clientCedula: string;
  stage?: string;
  returnReason?: string | null;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  documentCedulaUrl,
  documentCedulaName,
  documentUtilityUrl,
  documentUtilityName,
  clientName,
  clientCedula,
  stage,
  returnReason,
}: DocumentViewerModalProps) {
  const [activeDocTab, setActiveDocTab] = useState<'cedula' | 'utility'>('cedula');

  if (!isOpen) return null;

  const currentDocUrl = activeDocTab === 'cedula' ? documentCedulaUrl : documentUtilityUrl;
  const currentDocName = activeDocTab === 'cedula' ? (documentCedulaName || 'Cédula de Ciudadanía') : (documentUtilityName || 'Recibo de Servicio Público');

  const isPdf = currentDocUrl?.toLowerCase().endsWith('.pdf') || currentDocName?.toLowerCase().endsWith('.pdf');
  const isSvg = currentDocUrl?.toLowerCase().endsWith('.svg');
  const isImage = currentDocUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || isSvg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Validación Documental - Conecta
              </h3>
              <p className="text-xs text-slate-300">
                Cliente: <span className="font-semibold text-white">{clientName}</span> | C.C. {clientCedula}
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

        {/* Document Switcher Tabs (Cédula vs Servicio Público) */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveDocTab('cedula')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                activeDocTab === 'cedula'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <IdCard className="w-4 h-4" />
              <span>1. Cédula de Ciudadanía</span>
              {documentCedulaUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveDocTab('utility')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                activeDocTab === 'utility'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Recibo Servicio Público</span>
              {documentUtilityUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Warning if returned */}
        {stage === 'DEVUELTO' && returnReason && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">Documentación Devuelta por Back Office</p>
              <p className="text-xs text-amber-800 mt-0.5">{returnReason}</p>
            </div>
          </div>
        )}

        {/* Content viewer */}
        <div className="flex-1 bg-slate-100 p-6 overflow-auto flex items-center justify-center min-h-[400px]">
          {currentDocUrl ? (
            <div className="max-w-full flex flex-col items-center">
              {isImage ? (
                <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentDocUrl}
                    alt={currentDocName}
                    className="max-h-[500px] w-auto object-contain rounded-lg"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={currentDocUrl}
                  title={currentDocName}
                  className="w-[700px] h-[500px] rounded-xl border border-slate-300 shadow-md bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow border border-slate-200">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">{currentDocName}</p>
                  <a
                    href={currentDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 mt-3 text-xs font-medium text-sky-600 hover:text-sky-700"
                  >
                    <span>Abrir en nueva pestaña</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                No se adjuntó {activeDocTab === 'cedula' ? 'la cédula' : 'el recibo de servicio público'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Documento visible: </span>
            <span className="font-semibold text-slate-800">{currentDocName}</span>
          </div>
          <div className="flex items-center space-x-3">
            {currentDocUrl && (
              <a
                href={currentDocUrl}
                download={currentDocName}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
