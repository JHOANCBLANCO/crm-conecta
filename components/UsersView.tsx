'use client';

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Edit,
  Users as UsersIcon,
  Shield,
  FileCheck2,
  Briefcase,
  UserCheck,
  UserX,
  KeyRound,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [searchCedula, setSearchCedula] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'ASESOR' | 'BACKOFFICE'>('ASESOR');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editCedula, setEditCedula] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editCampaignIds, setEditCampaignIds] = useState<string[]>([]);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [isUpdatingCampaigns, setIsUpdatingCampaigns] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Todos los usuarios (activos e inactivos) bloquean su nombre de usuario para que nunca quede libre
  const existingUsernames = useMemo(() => users.map((u) => u.email), [users]);

  const activeUsersCount = useMemo(
    () => users.filter((u) => u.active !== false).length,
    [users]
  );
  const inactiveUsersCount = useMemo(
    () => users.filter((u) => u.active === false).length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const cleanSearch = searchCedula.trim().replace(/\D/g, '');
    return users.filter((u) => {
      const isUserActive = u.active !== false;
      if (statusFilter === 'ACTIVE' && !isUserActive) return false;
      if (statusFilter === 'INACTIVE' && isUserActive) return false;
      if (cleanSearch.length > 0) {
        const uCedula = (u.cedula || '').replace(/\D/g, '');
        if (!uCedula.includes(cleanSearch)) return false;
      }
      return true;
    });
  }, [users, statusFilter, searchCedula]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    const autoUser = generateUsername(newName, existingUsernames);
    setEmail(autoUser);
  };

  const handleToggleUserStatus = async (u: User) => {
    if (u.id === currentUser.id) return;
    const nextActive = u.active === false ? true : false;
    setTogglingUserId(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleOpenEditCampaigns = (u: User) => {
    setEditingUser(u);
    setEditCedula(u.cedula || '');
    setEditName(u.name || '');
    setEditEmail((u.email || '').split('@')[0]);
    setEditPassword('');
    setShowEditPassword(false);
    setEditActive(u.active !== false);
    setEditErrorMsg(null);
    const ids = u.assignedCampaigns?.map((c) => c.id) || [];
    setEditCampaignIds(ids);
  };

  const handleSaveCampaigns = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingCampaigns(true);
    setEditErrorMsg(null);
    try {
      const payload: Record<string, any> = {
        cedula: editCedula,
        name: editName.trim(),
        email: editEmail.trim().toLowerCase().split('@')[0].replace(/\s+/g, ''),
        active: editingUser.id === currentUser.id ? true : editActive,
        assignedCampaignIds: editCampaignIds,
      };
      if (editPassword.trim().length > 0) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar usuario');
      }
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      setEditErrorMsg(err.message);
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
          email: email.trim().toLowerCase().split('@')[0].replace(/\s+/g, ''),
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <UsersIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Usuarios</h1>
          </div>

          {/* Pestañas Activos / Inactivos / Todos */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Activos ({activeUsersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Inactivos ({inactiveUsersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({users.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Buscador exclusivo por número de cédula */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={searchCedula}
              onChange={(e) => setSearchCedula(e.target.value.replace(/\D/g, ''))}
              placeholder="Buscar por cédula..."
              className="w-full pl-9 pr-7 py-2 bg-slate-100 hover:bg-slate-100/90 focus:bg-white text-xs font-mono font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 placeholder:font-sans"
            />
            {searchCedula && (
              <button
                type="button"
                onClick={() => setSearchCedula('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200/80 rounded-full w-4 h-4 flex items-center justify-center font-bold"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
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
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Campañas</th>
                <th className="py-3.5 px-4">Registro</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    {searchCedula.trim() ? (
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-700">
                          No se encontraron usuarios con la cédula &quot;{searchCedula}&quot;
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Verifica el número o cambia la pestaña entre Activos, Inactivos o Todos.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSearchCedula('')}
                          className="mt-2 inline-block px-3 py-1 bg-slate-100 hover:bg-slate-200 text-sky-700 font-bold rounded-lg text-xs transition"
                        >
                          Limpiar filtro de cédula
                        </button>
                      </div>
                    ) : (
                      'No hay usuarios en esta vista.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const assigned = u.assignedCampaigns || [];
                  const badge = getRoleBadge(u.role);
                  const Icon = badge.icon;
                  const isUserActive = u.active !== false;
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition ${
                        !isUserActive ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs uppercase ${
                              isUserActive
                                ? 'bg-gradient-to-br from-slate-700 to-slate-900'
                                : 'bg-slate-400'
                            }`}
                          >
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
                        {isUserActive ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3" />
                            <span>Inactivo</span>
                          </span>
                        )}
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
                        <div className="inline-flex items-center justify-end space-x-1.5">
                          {!isSelf && (
                            <button
                              type="button"
                              disabled={togglingUserId === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                                isUserActive
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {isUserActive ? 'Inactivar' : 'Reactivar'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditCampaigns(u)}
                            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
                            title="Editar usuario / Cambiar clave"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar Usuario / Cambiar Clave / Estado */}
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

            <form onSubmit={handleSaveCampaigns} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {editErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
                  {editErrorMsg}
                </div>
              )}

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

              {/* Cambiar Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span>Cambiar contraseña</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                    className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Estado Activo / Inactivo */}
              {editingUser.id !== currentUser.id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado de acceso
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditActive(true)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center space-x-1.5 transition ${
                        editActive
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Activo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditActive(false)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center space-x-1.5 transition ${
                        !editActive
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <UserX className="w-4 h-4" />
                      <span>Inactivo</span>
                    </button>
                  </div>
                </div>
              )}

              {editingUser.role !== 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campañas asignadas
                  </label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50">
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
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
