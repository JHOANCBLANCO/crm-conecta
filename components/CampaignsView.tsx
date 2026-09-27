'use client';

import React, { useState } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Package,
  ShoppingBag,
  CheckCircle,
  ChevronRight,
  X,
  Tag,
  Search,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  campaignId: string;
  active: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  isArchived: boolean;
  plans: Plan[];
  _count?: {
    sales: number;
    plans: number;
  };
}

interface CampaignsViewProps {
  campaigns: Campaign[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUserRole: string;
  onRefresh: () => void;
  onOpenSaleModalWithPlan: (campaignId: string, planId?: string) => void;
}

export default function CampaignsView({
  campaigns,
  searchQuery,
  setSearchQuery,
  currentUserRole,
  onRefresh,
  onOpenSaleModalWithPlan,
}: CampaignsViewProps) {
  const isAdmin = currentUserRole === 'ADMIN';
  const isAdvisor = currentUserRole === 'ASESOR';

  const [showArchived, setShowArchived] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignColor, setNewCampaignColor] = useState('#0284c7');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // El asesor solo puede ver campañas activas (nunca ocultas).
  // El administrador puede ver ocultas si activa el filtro o si las busca.
  const filteredCampaigns = campaigns.filter((c) => {
    if (!isAdmin && c.isArchived) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (!isAdmin || !showArchived) {
      return !c.isArchived;
    }
    return true;
  });

  const handleToggleArchive = async (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = !campaign.isArchived;
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: nextStatus }),
      });
      if (res.ok) {
        onRefresh();
        if (selectedCampaign?.id === campaign.id) {
          setSelectedCampaign({ ...selectedCampaign, isArchived: nextStatus });
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setIsCreatingCampaign(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          description: newCampaignDesc.trim() || null,
          color: newCampaignColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear la campaña');
      }

      setNewCampaignName('');
      setNewCampaignDesc('');
      setIsCreateCampaignOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !newPlanName.trim() || !newPlanPrice) return;
    setIsCreatingPlan(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          name: newPlanName.trim(),
          price: parseFloat(newPlanPrice),
          features: newPlanFeatures.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear el plan');
      }

      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanFeatures('');
      setIsAddPlanOpen(false);
      onRefresh();

      const createdPlan = await res.json();
      setSelectedCampaign({
        ...selectedCampaign,
        plans: [...selectedCampaign.plans, createdPlan],
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const colorPresets = [
    { label: 'Azul', hex: '#0284c7' },
    { label: 'Morado', hex: '#7c3aed' },
    { label: 'Rojo', hex: '#dc2626' },
    { label: 'Verde', hex: '#059669' },
    { label: 'Ámbar', hex: '#d97706' },
    { label: 'Índigo', hex: '#4f46e5' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Package className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Campañas</h1>
        </div>

        {/* Controles exclusivos del Administrador */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 px-3.5 py-2 rounded-xl cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300"
              />
              <span>Mostrar ocultas</span>
            </label>

            <button
              onClick={() => setIsCreateCampaignOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Campaña</span>
            </button>
          </div>
        )}
      </div>

      {/* Grilla de Campañas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.map((camp) => {
          const isSelected = selectedCampaign?.id === camp.id;
          return (
            <div
              key={camp.id}
              onClick={() => setSelectedCampaign(isSelected ? null : camp)}
              className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                camp.isArchived
                  ? 'border-slate-300 bg-slate-50/70 opacity-80'
                  : 'border-slate-200/90 hover:border-sky-400 hover:shadow-lg'
              } ${isSelected ? 'ring-2 ring-sky-500 shadow-md' : 'shadow-xs'}`}
            >
              <div
                className="h-2 w-full"
                style={{ backgroundColor: camp.color || '#0284c7' }}
              />

              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: camp.color }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {camp.isArchived ? 'Oculta' : 'Activa'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => handleToggleArchive(camp, e)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                        camp.isArchived
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {camp.isArchived ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mostrar</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors mb-1">
                  {camp.name}
                </h3>
                {camp.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {camp.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center space-x-2.5">
                    <div className="p-1.5 bg-sky-100/70 text-sky-600 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Planes</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {camp.plans?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center space-x-2.5">
                    <div className="p-1.5 bg-emerald-100/70 text-emerald-600 rounded-lg">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ventas</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {camp._count?.sales ??
                          camp.plans?.reduce((acc, p) => acc + ((p as any).sales?.length || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 flex items-center space-x-1">
                  <span>{isSelected ? 'Cerrar planes' : 'Ver planes'}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                  />
                </span>
                {(isAdvisor || isAdmin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSaleModalWithPlan(camp.id);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    + Vender
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Sin campañas</h3>
          </div>
        )}
      </div>

      {/* Detalle de Planes de la Campaña Seleccionada */}
      {selectedCampaign && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: selectedCampaign.color || '#0284c7' }}
              >
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {selectedCampaign.name}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={() => setIsAddPlanOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Plan</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {selectedCampaign.plans && selectedCampaign.plans.length > 0 ? (
              selectedCampaign.plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 hover:border-sky-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-sm font-extrabold text-slate-900">{plan.name}</h4>
                      <span className="text-base font-black text-sky-600 whitespace-nowrap">
                        {formatCurrency(plan.price)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                      {plan.features.split(',').map((f, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{f.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(isAdvisor || isAdmin) && (
                    <button
                      onClick={() => onOpenSaleModalWithPlan(selectedCampaign.id, plan.id)}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Vender Plan</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-6 text-xs text-slate-400">
                Sin planes registrados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Crear Campaña */}
      {isCreateCampaignOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Nueva campaña</h3>
              <button
                onClick={() => setIsCreateCampaignOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la campaña *
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Ej. Movistar Hogar"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewCampaignColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        newCampaignColor === c.hex ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCampaignOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isCreatingCampaign ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Plan */}
      {isAddPlanOpen && selectedCampaign && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">
                Agregar plan — {selectedCampaign.name}
              </h3>
              <button
                onClick={() => setIsAddPlanOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del plan *
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor mensual (CFM con IVA) *
                </label>
                <input
                  type="number"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Características (separadas por coma)
                </label>
                <textarea
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlanOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlan}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isCreatingPlan ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
