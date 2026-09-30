'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Check,
  AlertCircle,
  FileCheck,
  Loader2,
  Sparkles,
  Home,
  IdCard,
  Calendar,
  UserCheck,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  campaignId: string;
}

interface Campaign {
  id: string;
  name: string;
  color: string;
  plans: Plan[];
}

interface User {
  id: string;
  cedula?: string;
  name: string;
  role: string;
}

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  currentUser: User;
  onSaleCreated: () => void;
  initialCampaignId?: string;
  initialPlanId?: string;
}

export default function SaleModal({
  isOpen,
  onClose,
  campaigns,
  currentUser,
  onSaleCreated,
  initialCampaignId,
  initialPlanId,
}: SaleModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthName = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // 1. Campaña & Plan
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // 2. Identificación del Cliente
  const [documentType, setDocumentType] = useState<string>('Cédula'); // "NIT" | "Cédula"
  const [clientCedula, setClientCedula] = useState('');
  const [clientName, setClientName] = useState('');
  const [legalRepCedula, setLegalRepCedula] = useState('');

  // 3. Ubicación y Contacto
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [contactName, setContactName] = useState('');
  const [clientPhone, setClientPhone] = useState(''); // Numérico estricto
  const [contactPhone2, setContactPhone2] = useState(''); // Numérico estricto
  const [clientEmail, setClientEmail] = useState(''); // Debe tener @

  // 4. Datos Comerciales y Técnicos
  const [otMin, setOtMin] = useState(''); // Numérico estricto
  const [acquiredServices, setAcquiredServices] = useState('');
  const [recurrent, setRecurrent] = useState('Mensual');
  const [nip, setNip] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractType, setContractType] = useState('Firmado'); // Firmado | Grabado | Venta Digital
  const [validationMethod, setValidationMethod] = useState('Claro Safe'); // Claro Safe | ID Visión | Biométrico | Venta Digital
  const [identityValidationDate, setIdentityValidationDate] = useState(todayStr);
  const [otpLine, setOtpLine] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [saleType, setSaleType] = useState('Línea Nueva'); // Migración | Línea Nueva | Portabilidad
  const [operatorOptions, setOperatorOptions] = useState<string[]>([
    'Claro',
    'Tigo',
    'WOM',
    'Movistar',
    'ETB',
  ]);
  const [originOperator, setOriginOperator] = useState('Claro');
  const [customOperator, setCustomOperator] = useState('');
  const [salesChannel, setSalesChannel] = useState('Telemercadeo');
  const [customSalesChannel, setCustomSalesChannel] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [observation, setObservation] = useState('');

  // 5. Documentos Adjuntos (Cédula + Servicio Público)
  const [cedulaUrl, setCedulaUrl] = useState<string>('');
  const [cedulaName, setCedulaName] = useState<string>('');
  const [isUploadingCedula, setIsUploadingCedula] = useState(false);

  const [utilityUrl, setUtilityUrl] = useState<string>('');
  const [utilityName, setUtilityName] = useState<string>('');
  const [isUploadingUtility, setIsUploadingUtility] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de operadores (incluyendo los personalizados guardados)
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/operators', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.operators) && data.operators.length > 0) {
          setOperatorOptions(data.operators);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const activeCampaigns = campaigns.filter((c: any) => !c.isArchived || c.id === initialCampaignId);
      const defaultCampaign = initialCampaignId || (activeCampaigns.length > 0 ? activeCampaigns[0].id : '');
      setSelectedCampaignId(defaultCampaign);

      const campaign = campaigns.find((c) => c.id === defaultCampaign);
      if (campaign && campaign.plans && campaign.plans.length > 0) {
        const planToUse = initialPlanId
          ? campaign.plans.find((p) => p.id === initialPlanId) || campaign.plans[0]
          : campaign.plans[0];
        setSelectedPlanId(planToUse.id);
        setAcquiredServices(planToUse.name);
      } else {
        setSelectedPlanId('');
        setAcquiredServices('');
      }

      // Reset fields
      setDocumentType('Cédula');
      setClientCedula('');
      setClientName('');
      setLegalRepCedula('');
      setAddress('');
      setNeighborhood('');
      setDepartment('');
      setCity('');
      setContactName('');
      setClientPhone('');
      setContactPhone2('');
      setClientEmail('');
      setOtMin('');
      setRecurrent('Mensual');
      setNip('');
      setContractNumber('');
      setContractType('Firmado');
      setValidationMethod('Claro Safe');
      setIdentityValidationDate(new Date().toISOString().slice(0, 10));
      setOtpLine('');
      setOtpCode('');
      setSaleType('Línea Nueva');
      setOriginOperator('Claro');
      setCustomOperator('');
      setSalesChannel('Telemercadeo');
      setCustomSalesChannel('');
      setDatabaseName('');
      setExternalId('');
      setObservation('');
      setError(null);
      setCedulaUrl('');
      setCedulaName('');
      setUtilityUrl('');
      setUtilityName('');
    }
  }, [isOpen, initialCampaignId, initialPlanId, campaigns]);

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign && campaign.plans && campaign.plans.length > 0) {
      setSelectedPlanId(campaign.plans[0].id);
      setAcquiredServices(campaign.plans[0].name);
    } else {
      setSelectedPlanId('');
      setAcquiredServices('');
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const campaign = campaigns.find((c) => c.id === selectedCampaignId);
    const plan = campaign?.plans.find((p) => p.id === planId);
    if (plan) {
      setAcquiredServices(plan.name);
    }
  };

  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const currentPlan = currentCampaign?.plans.find((p) => p.id === selectedPlanId);

  const handleUploadDoc = async (file: File, type: 'cedula' | 'utility') => {
    const isCed = type === 'cedula';
    if (isCed) setIsUploadingCedula(true);
    else setIsUploadingUtility(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');

      if (isCed) {
        setCedulaUrl(data.url);
        setCedulaName(data.name);
      } else {
        setUtilityUrl(data.url);
        setUtilityName(data.name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isCed) setIsUploadingCedula(false);
      else setIsUploadingUtility(false);
    }
  };

  const handleSaveCustomOperator = async () => {
    const trimmed = customOperator.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!operatorOptions.some((o) => o.toLowerCase() === formatted.toLowerCase())) {
      setOperatorOptions((prev) => [...prev, formatted]);
    }
    setOriginOperator(formatted);
    setCustomOperator('');
    try {
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: formatted }),
      });
      const data = await res.json();
      if (Array.isArray(data?.operators)) {
        setOperatorOptions(data.operators);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCampaignId || !selectedPlanId || !clientCedula.trim() || !clientName.trim()) {
      setError('Por favor completa los campos obligatorios: Campaña, Plan, Número de Documento y Nombre del Cliente.');
      return;
    }

    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setError('El Correo Electrónico es obligatorio y debe contener el símbolo @ para poder guardar.');
      return;
    }

    if (!clientPhone.trim()) {
      setError('El Número de Contacto 1 es obligatorio (solo números).');
      return;
    }

    let finalOriginOperator = originOperator;
    if (originOperator === 'Otro') {
      if (!customOperator.trim()) {
        setError('Por favor escribe cuál es el otro Operador de Origen.');
        return;
      }
      finalOriginOperator =
        customOperator.trim().charAt(0).toUpperCase() + customOperator.trim().slice(1);
    }

    let finalSalesChannel = salesChannel;
    if (salesChannel === 'Otro') {
      if (!customSalesChannel.trim()) {
        setError('Por favor escribe cuál es el Canal de Venta.');
        return;
      }
      finalSalesChannel =
        customSalesChannel.trim().charAt(0).toUpperCase() + customSalesChannel.trim().slice(1);
    }

    if (!cedulaUrl) {
      setError('Por favor adjunta la Cédula / Documento del cliente.');
      return;
    }

    if (!utilityUrl) {
      setError('Por favor adjunta el Recibo de Servicio Público.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          planId: selectedPlanId,
          advisorId: currentUser.id,
          documentType,
          clientCedula: clientCedula.trim(),
          clientName: clientName.trim(),
          legalRepCedula: legalRepCedula.trim() || null,
          address: address.trim() || null,
          neighborhood: neighborhood.trim() || null,
          department: department.trim() || null,
          city: city.trim() || null,
          contactName: contactName.trim() || null,
          clientPhone: clientPhone.trim(),
          contactPhone2: contactPhone2.trim() || null,
          clientEmail: clientEmail.trim(),
          otMin: otMin.trim() || null,
          acquiredServices: acquiredServices.trim() || currentPlan?.name || '',
          recurrent: recurrent.trim() || null,
          nip: nip.trim() || null,
          contractNumber: contractNumber.trim() || null,
          contractType,
          validationMethod,
          identityValidationDate,
          otpLine: otpLine.trim() || null,
          otpCode: otpCode.trim() || null,
          saleType,
          originOperator: finalOriginOperator,
          salesChannel: finalSalesChannel,
          databaseName: databaseName.trim() || null,
          externalId: externalId.trim() || null,
          observation: observation.trim() || null,
          documentCedulaUrl: cedulaUrl,
          documentCedulaName: cedulaName || 'cedula_cliente.svg',
          documentUtilityUrl: utilityUrl,
          documentUtilityName: utilityName || 'recibo_servicio.svg',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar la venta');

      if (
        finalOriginOperator &&
        !operatorOptions.some((o) => o.toLowerCase() === finalOriginOperator.toLowerCase())
      ) {
        setOperatorOptions((prev) => [...prev, finalOriginOperator]);
      }

      onSaleCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Registrar Venta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Scrollable Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* BLOQUE 1: Consultor y Campaña */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>1. Consultor y Campaña</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Fecha de Venta
                </label>
                <input
                  type="text"
                  value={`${todayStr} (${currentMonthName})`}
                  disabled
                  className="w-full px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Cédula Consultor
                </label>
                <input
                  type="text"
                  value={currentUser.cedula || '1000000000'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Consultor
                </label>
                <input
                  type="text"
                  value={currentUser.name}
                  disabled
                  className="w-full px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Campaña *
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => handleCampaignChange(e.target.value)}
                  disabled={!!initialCampaignId}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    initialCampaignId
                      ? 'bg-sky-50 border-sky-300 text-sky-900 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  required
                >
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  {currentCampaign?.plans && currentCampaign.plans.length > 0 ? (
                    currentCampaign.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatCurrency(plan.price)}
                      </option>
                    ))
                  ) : (
                    <option value="">Sin planes</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-1">
                  CFM con IVA
                </label>
                <input
                  type="text"
                  value={currentPlan ? formatCurrency(currentPlan.price) : '$ 0'}
                  disabled
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 2: Identificación del Cliente */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>2. Identificación del Cliente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Cédula">Cédula</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  value={clientCedula}
                  onChange={(e) => setClientCedula(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Cliente *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cédula Representante Legal
                </label>
                <input
                  type="text"
                  value={legalRepCedula}
                  onChange={(e) => setLegalRepCedula(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 3: Ubicación y Contacto */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>3. Ubicación y Contacto</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Barrio *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Departamento *
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contacto *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Contacto 1 *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Contacto 2
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={contactPhone2}
                  onChange={(e) => setContactPhone2(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 4: Datos Comerciales, Contrato, Validación y OTP */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>4. Contrato, Validación y OTP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  OT / MIN *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otMin}
                  onChange={(e) => setOtMin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Servicios Adquiridos *
                </label>
                <input
                  type="text"
                  value={acquiredServices}
                  onChange={(e) => setAcquiredServices(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recurrente
                </label>
                <input
                  type="text"
                  value={recurrent}
                  onChange={(e) => setRecurrent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Contrato
                </label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Contrato *
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Firmado">Firmado</option>
                  <option value="Grabado">Grabado</option>
                  <option value="Venta Digital">Venta Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Método de Validación *
                </label>
                <select
                  value={validationMethod}
                  onChange={(e) => setValidationMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Claro Safe">Claro Safe</option>
                  <option value="ID Visión">ID Visión</option>
                  <option value="Biométrico">Biométrico</option>
                  <option value="Venta Digital">Venta Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Validación Identidad *
                </label>
                <input
                  type="date"
                  value={identityValidationDate}
                  onChange={(e) => setIdentityValidationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Línea OTP Realizada
                </label>
                <input
                  type="text"
                  value={otpLine}
                  onChange={(e) => setOtpLine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número OTP Confirmado
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Venta *
                </label>
                <select
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Migración">Migración</option>
                  <option value="Línea Nueva">Línea Nueva</option>
                  <option value="Portabilidad">Portabilidad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operador de Origen *
                </label>
                <select
                  value={originOperator}
                  onChange={(e) => setOriginOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {operatorOptions.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {originOperator === 'Otro' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-sky-700 mb-1">
                    ¿Cuál es el otro Operador de Origen? *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={customOperator}
                      onChange={(e) => setCustomOperator(e.target.value)}
                      placeholder="Escribe el operador (se guardará en la lista)"
                      className="flex-1 px-3 py-2 bg-sky-50/50 border border-sky-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomOperator}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Canal de Venta *
                </label>
                <select
                  value={salesChannel}
                  onChange={(e) => setSalesChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Telemercadeo">Telemercadeo</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Redes Sociales">Redes Sociales</option>
                  <option value="Base de Datos">Base de Datos</option>
                  <option value="Referido">Referido</option>
                  <option value="Digital / Web">Digital / Web</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {salesChannel === 'Otro' && (
                <div>
                  <label className="block text-xs font-bold text-sky-700 mb-1">
                    ¿Cuál Canal de Venta? *
                  </label>
                  <input
                    type="text"
                    value={customSalesChannel}
                    onChange={(e) => setCustomSalesChannel(e.target.value)}
                    placeholder="Escribe el canal"
                    className="w-full px-3 py-2 bg-sky-50/50 border border-sky-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Base
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID
                </label>
                <input
                  type="text"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observación
                </label>
                <input
                  type="text"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 5: Carga Documental */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              5. Documentos Adjuntos *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Documento 1: Cédula */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-2.5">
                  <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Cédula / NIT *</span>
                </div>

                <div className="relative border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 bg-white text-center transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleUploadDoc(e.target.files[0], 'cedula')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center space-x-2">
                    {isUploadingCedula ? (
                      <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                    ) : cedulaUrl ? (
                      <div className="flex items-center space-x-1.5 text-emerald-700">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold truncate max-w-[200px]">{cedulaName || 'Adjuntado'}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-semibold text-slate-600">Adjuntar archivo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Documento 2: Servicio Público */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Recibo de Servicio Público *</span>
                </div>

                <div className="relative border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 bg-white text-center transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleUploadDoc(e.target.files[0], 'utility')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center space-x-2">
                    {isUploadingUtility ? (
                      <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                    ) : utilityUrl ? (
                      <div className="flex items-center space-x-1.5 text-emerald-700">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold truncate max-w-[200px]">{utilityName || 'Adjuntado'}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-600">Adjuntar archivo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingCedula || isUploadingUtility}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Venta</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
