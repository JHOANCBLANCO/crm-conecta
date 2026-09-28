'use client';

import React, { useState } from 'react';
import { UserPlus, Edit, Users as UsersIcon, Shield, FileCheck2, Briefcase } from 'lucide-react';
import { formatDate, generateUsername } from '@/lib/utils';
import { User } from './Navbar';

interface Campaign {
  id: string;
  name: string;
  color: string;
}

interface UsersViewProps {
  users: User[];
  campaigns: Campaign[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onRefresh: () => void;
}

export default function UsersView({
  users,
  campaigns,
  currentUser,
  onRefresh,
}: UsersViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'ADMIN' | 'ASESOR' | 'BACKOFFICE'>('ASESOR');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editCedula, setEditCedula] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCampaignIds, setEditCampaignIds] = useState<string[]>([]);
  const [isUpdatingCampaigns, setIsUpdatingCampaigns] = useState(false);

  const existingUsernames = users.map((u) => u.email);

  const handleNameChange = (newName: string) => {
    setName(newName);
    const autoUser = generateUsername(newName, existingUsernames);
    setEmail(autoUser);
  };

  const handleOpenEditCampaigns = (u: User) => {
    setEditingUser(u);
    setEditCedula(u.cedula || '');
    setEditName(u.name || '');
    setEditEmail((u.email || '').split('@')[0]);
    const ids = u.assignedCampaigns?.map((c) => c.id) || [];
    setEditCampaignIds(ids);
  };

  const handleSaveCampaigns = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingCampaigns(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: editCedula,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase().split('@')[0],
          assignedCampaignIds: editCampaignIds,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingCampaigns(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim() || !name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: cedula.trim(),
          name: name.trim(),
          email: email.trim().toLowerCase().split('@')[0],
          password: password || '123456',
          role,
          assignedCampaignIds: selectedCampaignIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear usuario');
      }

      setCedula('');
      setName('');
      setEmail('');
      setPassword('123456');
      setSelectedCampaignIds([]);
      setIsCreateOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return {
          label: 'Administrador',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Shield,
        };
      case 'BACKOFFICE':
        return {
          label: 'Back Office',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: FileCheck2,
        };
      default:
        return {
          label: 'Consultor',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: Briefcase,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <UsersIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Usuarios</h1>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nombre</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">Campañas</th>
                <th className="py-3.5 px-4">Registro</th>
                <th className="py-3.5 px-4 text-right">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const assigned = u.assignedCampaigns || [];
                const badge = getRoleBadge(u.role);
                const Icon = badge.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {u.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg">
                        {(u.email || '').split('@')[0]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {u.cedula || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badge.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="text-purple-700 font-bold text-[11px]">Todas</span>
                      ) : assigned.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assigned.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditCampaigns(u)}
                        className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">Editar usuario</h3>
                <p className="text-xs text-slate-400">{editingUser.name}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampaigns} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditName(val);
                    const otherUsernames = users
                      .filter((u) => u.id !== editingUser.id)
                      .map((u) => u.email);
                    setEditEmail(generateUsername(val, otherUsernames));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usuario *
                </label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de documento (Cédula) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editCedula}
                  onChange={(e) => setEditCedula(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {editingUser.role !== 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campañas asignadas
                  </label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                    {campaigns.map((camp) => {
                      const isChecked = editCampaignIds.includes(camp.id);
                      return (
                        <label
                          key={camp.id}
                          className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditCampaignIds([...editCampaignIds, camp.id]);
                              } else {
                                setEditCampaignIds(editCampaignIds.filter((id) => id !== camp.id));
                              }
                            }}
                            className="w-3.5 h-3.5 text-sky-600 rounded"
                          />
                          <span className="text-xs text-slate-800">{camp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCampaigns}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isUpdatingCampaigns ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Usuario */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Nuevo usuario</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de documento (Cédula) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Andrés Gómez Rojas"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Usuario *</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="nombre.apellido"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ASESOR">Consultor de Ventas</option>
                  <option value="BACKOFFICE">Back Office</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {role !== 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campañas asignadas
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {campaigns.map((camp) => (
                      <label key={camp.id} className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCampaignIds.includes(camp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCampaignIds([...selectedCampaignIds, camp.id]);
                            } else {
                              setSelectedCampaignIds(selectedCampaignIds.filter((id) => id !== camp.id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-sky-600 rounded"
                        />
                        <span>{camp.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
