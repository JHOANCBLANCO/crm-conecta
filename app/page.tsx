'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar, { User } from '@/components/Navbar';
import CampaignsView, { Campaign } from '@/components/CampaignsView';
import BackofficeView, { Sale } from '@/components/BackofficeView';
import AdvisorSalesView from '@/components/AdvisorSalesView';
import DashboardView from '@/components/DashboardView';
import UsersView from '@/components/UsersView';
import SaleModal from '@/components/SaleModal';
import ForcePasswordChangeModal from '@/components/ForcePasswordChangeModal';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('campaigns');
  const [campaignSearch, setCampaignSearch] = useState<string>('');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sale Modal state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState<boolean>(false);
  const [modalInitialCampaignId, setModalInitialCampaignId] = useState<string | undefined>(undefined);
  const [modalInitialPlanId, setModalInitialPlanId] = useState<string | undefined>(undefined);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = await meRes.json();
      if (!meData.user) {
        router.push('/login');
        return null;
      }
      return meData.user;
    } catch (err) {
      router.push('/login');
      return null;
    }
  }, [router]);

  // Fetch all data
  const loadData = useCallback(async () => {
    try {
      const authUser = await checkAuth();
      if (!authUser) return;

      const [usersRes, campaignsRes, salesRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch(`/api/campaigns?includeArchived=true&userId=${authUser.id}`, { cache: 'no-store' }),
        fetch(`/api/sales?userId=${authUser.id}&userRole=${authUser.role}&t=${Date.now()}`, {
          cache: 'no-store',
        }),
      ]);

      const [usersData, campaignsData, salesData] = await Promise.all([
        usersRes.json(),
        campaignsRes.json(),
        salesRes.json(),
      ]);

      if (Array.isArray(usersData)) {
        setUsers(usersData);
        const freshUser = usersData.find((u: User) => u.id === authUser.id) || authUser;
        setCurrentUser(freshUser);
      } else {
        setCurrentUser(authUser);
      }

      if (Array.isArray(campaignsData)) {
        setCampaigns(campaignsData);
      }

      if (Array.isArray(salesData)) {
        setSales(salesData);
      }
    } catch (err) {
      console.error('Error cargando datos del sistema:', err);
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sincronización automática en tiempo real cada 4 segundos (bloqueos de Back Office, nuevas ventas y estado activo del usuario)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        const authUser = await checkAuth();
        if (!authUser) return;

        const salesRes = await fetch(
          `/api/sales?userId=${currentUser.id}&userRole=${currentUser.role}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) {
          setSales(salesData);
        }
      } catch (err) {
        // Silencioso en background
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser, checkAuth]);

  // When switching user in the demo pill, set tab appropriately
  const handleSelectUser = async (newUser: User) => {
    setCurrentUser(newUser);
    if (newUser.role === 'ASESOR' && activeTab === 'backoffice') {
      setActiveTab('sales');
    } else if (newUser.role === 'BACKOFFICE' && activeTab === 'sales') {
      setActiveTab('backoffice');
    }
    try {
      const [campaignsRes, salesRes] = await Promise.all([
        fetch(`/api/campaigns?includeArchived=true&userId=${newUser.id}`, { cache: 'no-store' }),
        fetch(`/api/sales?userId=${newUser.id}&userRole=${newUser.role}&t=${Date.now()}`, {
          cache: 'no-store',
        }),
      ]);
      const [cData, sData] = await Promise.all([campaignsRes.json(), salesRes.json()]);
      if (Array.isArray(cData)) setCampaigns(cData);
      if (Array.isArray(sData)) setSales(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSaleModalWithPlan = (campaignId: string, planId?: string) => {
    setModalInitialCampaignId(campaignId);
    setModalInitialPlanId(planId);
    setIsSaleModalOpen(true);
  };

  const handleOpenGenericNewSale = () => {
    setModalInitialCampaignId(undefined);
    setModalInitialPlanId(undefined);
    setIsSaleModalOpen(true);
  };

  const userAllowedCampaigns = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') return campaigns;
    const assignedIds = currentUser.assignedCampaigns?.map((c) => c.id) || [];
    return campaigns.filter((c) => assignedIds.includes(c.id) && !c.isArchived);
  }, [campaigns, currentUser]);

  const assignedCampaignIds = useMemo(() => {
    return currentUser?.assignedCampaigns?.map((c) => c.id) || [];
  }, [currentUser]);

  const pendingBackofficeCount = sales.filter((s) => s.stage === 'PENDIENTE_BACKOFFICE').length;

  const returnedSalesCount = useMemo(() => {
    if (!currentUser) return 0;
    return sales.filter(
      (s) =>
        (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR' || s.advisorId === currentUser.id) &&
        (s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO')
    ).length;
  }, [sales, currentUser]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Cargando Conecta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        campaignSearch={campaignSearch}
        setCampaignSearch={setCampaignSearch}
        pendingBackofficeCount={pendingBackofficeCount}
        returnedSalesCount={returnedSalesCount}
        onOpenNewSale={handleOpenGenericNewSale}
      />

      <main
        className={`flex-1 w-full mx-auto py-6 transition-all ${
          activeTab === 'backoffice'
            ? 'w-full max-w-none px-4 sm:px-6 lg:px-8'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8'
        }`}
      >
        {activeTab === 'campaigns' && (
          <CampaignsView
            campaigns={userAllowedCampaigns}
            searchQuery={campaignSearch}
            setSearchQuery={setCampaignSearch}
            currentUserRole={currentUser.role}
            currentUserId={currentUser.id}
            onRefresh={loadData}
            onOpenSaleModalWithPlan={handleOpenSaleModalWithPlan}
          />
        )}

        {activeTab === 'sales' && (currentUser.role === 'ASESOR' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <AdvisorSalesView
            sales={sales}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
            currentUserCreatedAt={currentUser.createdAt}
            onRefresh={loadData}
            onOpenNewSale={handleOpenGenericNewSale}
          />
        )}

        {activeTab === 'backoffice' && (currentUser.role === 'BACKOFFICE' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <BackofficeView
            sales={sales}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserRole={currentUser.role}
            assignedCampaignIds={(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') ? undefined : assignedCampaignIds}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'dashboard' && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <DashboardView
            sales={sales}
            campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
            users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'users' && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <UsersView
            users={users}
            campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
            onRefresh={loadData}
          />
        )}
      </main>

      {isSaleModalOpen && (
        <SaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          campaigns={userAllowedCampaigns}
          currentUser={currentUser}
          onSaleCreated={loadData}
          initialCampaignId={modalInitialCampaignId}
          initialPlanId={modalInitialPlanId}
        />
      )}

      {currentUser && Boolean(currentUser.mustChangePassword) && (
        <ForcePasswordChangeModal
          isOpen={true}
          currentUser={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setUsers((prev) =>
              prev.map((u) =>
                u.id === updatedUser.id ? { ...u, mustChangePassword: false } : u
              )
            );
          }}
        />
      )}

      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
        Conecta CRM
      </footer>
    </div>
  );
}
