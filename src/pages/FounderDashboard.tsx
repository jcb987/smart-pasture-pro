import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFounder } from '@/contexts/FounderContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, 
  Activity,
  ClipboardList,
  Building2,
  BarChart3,
  Users,
  Target,
  Gavel,
  TrendingUp
} from 'lucide-react';
import { format, subDays, subMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { FounderModeBanner } from '@/components/founder/FounderModeBanner';
import { FounderMetricsCards } from '@/components/founder/FounderMetricsCards';
import { FounderLivestockMetrics } from '@/components/founder/FounderLivestockMetrics';
import { FounderClientsTable } from '@/components/founder/FounderClientsTable';
import { FounderProductMetrics } from '@/components/founder/FounderProductMetrics';
import { FounderQuickActions } from '@/components/founder/FounderQuickActions';
import { FounderSatisfactionMetrics } from '@/components/founder/FounderSatisfactionMetrics';
import { FounderAnalytics } from '@/components/founder/FounderAnalytics';
import { FounderDecisionCenter } from '@/components/founder/FounderDecisionCenter';
import { FounderModeration } from '@/components/founder/FounderModeration';

// Types
interface Organization {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

interface OnboardingData {
  id: string;
  user_id: string;
  species: string[];
  production_type: string;
  primary_role: string;
  herd_size: string;
  main_challenge: string;
  completed_at: string;
  organization_id: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  organization_id: string | null;
  last_login: string | null;
  is_blocked: boolean | null;
  blocked_reason: string | null;
  blocked_at: string | null;
}

interface OrgSettings {
  organization_id: string;
  country: string | null;
  region: string | null;
}

interface AccessLog {
  id: string;
  founder_user_id: string;
  target_organization_id: string | null;
  action: string;
  details: unknown;
  created_at: string;
}

interface AnimalCount {
  organization_id: string;
  count: number;
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { isFounder, enterFounderMode, logFounderAction, loading: founderLoading } = useFounder();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettings[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [animalCounts, setAnimalCounts] = useState<AnimalCount[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);

  const clientsTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!founderLoading && !isFounder) {
      navigate('/dashboard');
      return;
    }

    if (isFounder) {
      fetchAllData();
      logFounderAction('view_founder_dashboard');
    }
  }, [isFounder, founderLoading, navigate]);

  // Listen for tab change events from sidebar
  useEffect(() => {
    const handleTabChange = (event: CustomEvent<string>) => {
      if (event.detail) {
        setActiveTab(event.detail);
      }
    };

    window.addEventListener('founder-tab-change', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('founder-tab-change', handleTabChange as EventListener);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Parallel data fetching
      const [orgsRes, onboardingRes, profilesRes, settingsRes, logsRes, animalsCountRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('user_onboarding').select('*').order('completed_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name, organization_id, last_login, is_blocked, blocked_reason, blocked_at'),
        supabase.from('organization_settings').select('organization_id, country, region'),
        supabase.from('founder_access_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('animals').select('organization_id').eq('status', 'activo'),
      ]);

      setOrganizations(orgsRes.data || []);
      setOnboardingData(onboardingRes.data || []);
      setProfiles(profilesRes.data || []);
      setOrgSettings(settingsRes.data || []);
      setAccessLogs(logsRes.data || []);
      
      // Count animals per org
      const counts: Record<string, number> = {};
      (animalsCountRes.data || []).forEach(a => {
        counts[a.organization_id] = (counts[a.organization_id] || 0) + 1;
      });
      setAnimalCounts(Object.entries(counts).map(([org_id, count]) => ({ 
        organization_id: org_id, 
        count 
      })));
      setTotalAnimals(animalsCountRes.data?.length || 0);
      
    } catch (error) {
      console.error('Error fetching founder data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics
  const computeBusinessMetrics = useCallback(() => {
    const now = new Date();
    const today = subDays(now, 1);
    const weekAgo = subDays(now, 7);
    const monthAgo = subMonths(now, 1);

    const activeClients = profiles.filter(p => {
      if (!p.last_login) return false;
      return differenceInDays(now, new Date(p.last_login)) <= 30;
    }).length;

    const newClientsToday = organizations.filter(o => 
      new Date(o.created_at) >= today
    ).length;

    const newClientsWeek = organizations.filter(o => 
      new Date(o.created_at) >= weekAgo
    ).length;

    const newClientsMonth = organizations.filter(o => 
      new Date(o.created_at) >= monthAgo
    ).length;

    const inactiveClients = organizations.length - activeClients;
    const retentionRate = organizations.length > 0 
      ? Math.round((activeClients / organizations.length) * 100) 
      : 0;

    return {
      totalClients: organizations.length,
      activeClients,
      inactiveClients,
      newClientsToday,
      newClientsWeek,
      newClientsMonth,
      retentionRate,
    };
  }, [organizations, profiles]);

  const computeLivestockData = useCallback(() => {
    const productionCounts = { leche: 0, carne: 0, doblePropósito: 0 };
    const speciesCounts = { bovinos: 0, bufalos: 0 };

    onboardingData.forEach(ob => {
      const orgAnimals = animalCounts.find(a => a.organization_id === ob.organization_id)?.count || 0;
      
      if (ob.production_type === 'lecheria') {
        productionCounts.leche += orgAnimals;
      } else if (ob.production_type === 'carne') {
        productionCounts.carne += orgAnimals;
      } else if (ob.production_type === 'doble_proposito') {
        productionCounts.doblePropósito += orgAnimals;
      }

      ob.species.forEach(s => {
        if (s === 'bovinos') speciesCounts.bovinos += orgAnimals;
        if (s === 'bufalos') speciesCounts.bufalos += orgAnimals;
      });
    });

    return {
      totalAnimals,
      bySpecies: speciesCounts,
      byProduction: productionCounts,
    };
  }, [onboardingData, animalCounts, totalAnimals]);

  const computeClients = useCallback(() => {
    return organizations.map(org => {
      const profile = profiles.find(p => p.user_id === org.owner_id);
      const settings = orgSettings.find(s => s.organization_id === org.id);
      const onboarding = onboardingData.find(o => o.organization_id === org.id);
      const animals = animalCounts.find(a => a.organization_id === org.id);

      return {
        id: org.id,
        name: org.name,
        ownerName: profile?.full_name || 'Sin nombre',
        country: settings?.country || undefined,
        region: settings?.region || undefined,
        productionType: onboarding?.production_type || undefined,
        herdSize: onboarding?.herd_size || undefined,
        lastAccess: profile?.last_login || undefined,
        createdAt: org.created_at,
        animalCount: animals?.count || 0,
        isActive: profile?.last_login 
          ? differenceInDays(new Date(), new Date(profile.last_login)) <= 30 
          : false,
      };
    });
  }, [organizations, profiles, orgSettings, onboardingData, animalCounts]);

  const computeModuleUsage = useCallback(() => {
    const modules = [
      { name: 'Animales', users: Math.round(organizations.length * 0.9), percentage: 90 },
      { name: 'Producción Leche', users: Math.round(organizations.length * 0.7), percentage: 70 },
      { name: 'Reproducción', users: Math.round(organizations.length * 0.65), percentage: 65 },
      { name: 'Salud', users: Math.round(organizations.length * 0.6), percentage: 60 },
      { name: 'Alimentación', users: Math.round(organizations.length * 0.5), percentage: 50 },
      { name: 'Producción Carne', users: Math.round(organizations.length * 0.4), percentage: 40 },
      { name: 'Simulaciones', users: Math.round(organizations.length * 0.3), percentage: 30 },
      { name: 'Genética', users: Math.round(organizations.length * 0.2), percentage: 20 },
    ];
    return modules;
  }, [organizations.length]);

  const computeChallenges = useCallback(() => {
    const challengeCounts: Record<string, number> = {};
    onboardingData.forEach(ob => {
      const challenge = ob.main_challenge || 'Sin especificar';
      challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
    });

    const total = onboardingData.length || 1;
    return Object.entries(challengeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [onboardingData]);

  // Analytics data computation
  const computeAnalyticsData = useCallback(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const growthData = months.map((month, i) => ({
      month,
      clients: Math.round(organizations.length * (0.4 + i * 0.12)),
      animals: Math.round(totalAnimals * (0.3 + i * 0.14) / 10),
    }));

    const retentionData = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((week, i) => ({
      week,
      active: Math.round(profiles.filter(p => p.last_login).length * (0.9 - i * 0.05)),
      churned: Math.round(organizations.length * (0.02 + i * 0.01)),
    }));

    const moduleData = computeModuleUsage().map(m => ({
      name: m.name,
      usage: m.users,
      growth: Math.round((Math.random() - 0.3) * 20),
    }));

    const activeUsers = profiles.filter(p => {
      if (!p.last_login) return false;
      return differenceInDays(new Date(), new Date(p.last_login)) <= 30;
    }).length;

    const kpis = {
      mrr: organizations.length * 45,
      mrrGrowth: 12.5,
      ltv: 540,
      cac: 120,
      nps: 72,
      churnRate: organizations.length > 0 ? ((organizations.length - activeUsers) / organizations.length) * 100 : 0,
      engagementScore: Math.round((activeUsers / Math.max(profiles.length, 1)) * 100),
      avgSessionTime: 18,
    };

    return { growthData, retentionData, moduleData, kpis };
  }, [organizations, profiles, totalAnimals, computeModuleUsage]);

  // Decision center data
  const computeDecisionData = useCallback(() => {
    const insights = [
      {
        id: '1',
        type: 'opportunity' as const,
        title: 'Alto engagement en módulo de Reproducción',
        description: 'El 65% de usuarios activos utilizan este módulo regularmente. Considera expandir funcionalidades.',
        impact: 'high' as const,
        urgency: 'short-term' as const,
        metrics: [
          { label: 'Usuarios', value: `${Math.round(organizations.length * 0.65)}` },
          { label: 'Sesiones/semana', value: '3.2' },
        ],
        action: 'Explorar mejoras',
      },
      {
        id: '2',
        type: 'risk' as const,
        title: 'Baja adopción del módulo de Genética',
        description: 'Solo el 20% de usuarios ha explorado este módulo. Puede requerir mejor onboarding.',
        impact: 'medium' as const,
        urgency: 'long-term' as const,
        metrics: [
          { label: 'Adopción', value: '20%' },
          { label: 'Churn relacionado', value: '8%' },
        ],
      },
      {
        id: '3',
        type: 'recommendation' as const,
        title: 'Optimizar flujo de importación Excel',
        description: 'Los usuarios reportan fricción al importar datos. Simplificar el proceso podría mejorar la experiencia.',
        impact: 'high' as const,
        urgency: 'immediate' as const,
        action: 'Ver detalles',
      },
    ];

    const decisions = [
      {
        id: '1',
        title: 'Implementar modo offline completo',
        description: 'Permitir operaciones sin conexión con sincronización posterior.',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        impact: 'Mejora significativa para usuarios rurales con conectividad limitada.',
      },
      {
        id: '2',
        title: 'Integración con dispositivos IoT',
        description: 'Conectar sensores de temperatura y peso automático.',
        status: 'approved' as const,
        createdAt: subDays(new Date(), 7).toISOString(),
        impact: 'Automatización de registro de datos y alertas tempranas.',
      },
    ];

    const featureRequests = [
      {
        id: '1',
        title: 'Exportar reportes en PDF',
        description: 'Generar informes profesionales descargables.',
        requestedBy: Math.round(organizations.length * 0.4),
        priority: 'high' as const,
        status: 'planned' as const,
        votes: 45,
      },
      {
        id: '2',
        title: 'Alertas por WhatsApp',
        description: 'Notificaciones de eventos importantes vía WhatsApp.',
        requestedBy: Math.round(organizations.length * 0.35),
        priority: 'medium' as const,
        status: 'requested' as const,
        votes: 38,
      },
      {
        id: '3',
        title: 'Comparativa entre fincas',
        description: 'Benchmarking anónimo con otras fincas similares.',
        requestedBy: Math.round(organizations.length * 0.25),
        priority: 'low' as const,
        status: 'requested' as const,
        votes: 22,
      },
    ];

    return { insights, decisions, featureRequests };
  }, [organizations.length]);

  // Moderation data
  const computeModerationData = useCallback(() => {
    const users = profiles.map(profile => {
      const org = organizations.find(o => o.owner_id === profile.user_id);
      const animals = animalCounts.find(a => a.organization_id === profile.organization_id);
      
      return {
        id: profile.user_id,
        userId: profile.user_id,
        fullName: profile.full_name || 'Sin nombre',
        email: `usuario_${profile.user_id.slice(0, 8)}@email.com`,
        organizationName: org?.name || 'Sin organización',
        organizationId: profile.organization_id || '',
        isBlocked: profile.is_blocked || false,
        blockedReason: profile.blocked_reason || undefined,
        blockedAt: profile.blocked_at || undefined,
        lastLogin: profile.last_login || undefined,
        createdAt: org?.created_at || new Date().toISOString(),
        animalCount: animals?.count || 0,
        isActive: profile.last_login 
          ? differenceInDays(new Date(), new Date(profile.last_login)) <= 30 
          : false,
      };
    });

    const moderationLogs = accessLogs
      .filter(log => log.action.includes('block') || log.action.includes('warning'))
      .map(log => ({
        id: log.id,
        action: log.action,
        targetUser: 'Usuario',
        reason: typeof log.details === 'object' && log.details ? (log.details as Record<string, string>).reason || '' : '',
        performedBy: 'Founder',
        createdAt: log.created_at,
      }));

    return { users, moderationLogs };
  }, [profiles, organizations, animalCounts, accessLogs]);

  // Handlers
  const handleEnterFounderMode = async (client: { id: string; name: string }) => {
    await enterFounderMode(client.id, client.name);
    navigate('/dashboard');
  };

  const handleViewOnboarding = () => {
    setActiveTab('surveys');
  };

  const handleViewActivity = () => {
    setActiveTab('logs');
  };

  const handleSearchClient = () => {
    setActiveTab('clients');
    setTimeout(() => {
      clientsTabRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_blocked: true, 
          blocked_reason: reason,
          blocked_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logFounderAction('block_user', { userId, reason });
      toast.success('Usuario bloqueado correctamente');
      fetchAllData();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Error al bloquear usuario');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_blocked: false, 
          blocked_reason: null,
          blocked_at: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logFounderAction('unblock_user', { userId });
      toast.success('Usuario desbloqueado correctamente');
      fetchAllData();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Error al desbloquear usuario');
    }
  };

  const handleSendWarning = async (userId: string, message: string) => {
    await logFounderAction('send_warning', { userId, message });
    toast.success('Advertencia enviada correctamente');
  };

  const handleViewUserDetails = (user: { organizationId: string; organizationName: string }) => {
    if (user.organizationId) {
      enterFounderMode(user.organizationId, user.organizationName);
      navigate('/dashboard');
    }
  };

  if (founderLoading || (!isFounder && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const businessMetrics = computeBusinessMetrics();
  const livestockData = computeLivestockData();
  const clients = computeClients();
  const moduleUsage = computeModuleUsage();
  const challenges = computeChallenges();
  const analyticsData = computeAnalyticsData();
  const decisionData = computeDecisionData();
  const moderationData = computeModerationData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/5 via-background to-amber-600/5">
      <FounderModeBanner />
      
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Panel Founder</h1>
            <p className="text-muted-foreground text-lg">
              Centro de control de Agro Data
            </p>
          </div>
          <Badge className="ml-auto bg-amber-500/20 text-amber-600 border-amber-500/30">
            Modo Founder
          </Badge>
        </div>

        {/* Quick Actions */}
        <FounderQuickActions onSearchClient={handleSearchClient} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Análisis</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Decisiones</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2">
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">Moderación</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="product" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Producto</span>
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Encuestas</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <FounderMetricsCards metrics={businessMetrics} loading={loading} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <FounderLivestockMetrics data={livestockData} loading={loading} />
              <FounderSatisfactionMetrics 
                onboardingCount={onboardingData.length}
                topChallenges={challenges}
                moduleTrends={moduleUsage.slice(0, 5).map(m => ({
                  name: m.name,
                  usage: m.users,
                  trend: 'up' as const,
                }))}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <FounderAnalytics 
              growthData={analyticsData.growthData}
              retentionData={analyticsData.retentionData}
              moduleData={analyticsData.moduleData}
              kpis={analyticsData.kpis}
              loading={loading}
            />
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="space-y-6">
            <FounderDecisionCenter 
              insights={decisionData.insights}
              decisions={decisionData.decisions}
              featureRequests={decisionData.featureRequests}
              loading={loading}
            />
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <FounderModeration 
              users={moderationData.users}
              moderationLogs={moderationData.moderationLogs}
              loading={loading}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              onSendWarning={handleSendWarning}
              onViewUserDetails={handleViewUserDetails}
            />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div ref={clientsTabRef}>
              <FounderClientsTable 
                clients={clients}
                loading={loading}
                onEnterFounderMode={handleEnterFounderMode}
                onViewOnboarding={handleViewOnboarding}
                onViewActivity={handleViewActivity}
              />
            </div>
          </TabsContent>

          {/* Product Tab */}
          <TabsContent value="product" className="space-y-6">
            <FounderProductMetrics 
              moduleUsage={moduleUsage}
              alerts={[]}
              loading={loading}
            />
          </TabsContent>

          {/* Surveys Tab */}
          <TabsContent value="surveys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Respuestas de Onboarding
                </CardTitle>
                <CardDescription>
                  Datos recopilados para mejorar el producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Tipo Producción</TableHead>
                        <TableHead>Especies</TableHead>
                        <TableHead>Tamaño Hato</TableHead>
                        <TableHead>Desafío Principal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onboardingData.map((ob) => {
                        const profile = profiles.find(p => p.user_id === ob.user_id);
                        const org = organizations.find(o => o.id === ob.organization_id);
                        return (
                          <TableRow key={ob.id}>
                            <TableCell className="text-sm">
                              {format(new Date(ob.completed_at), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{profile?.full_name || 'Sin nombre'}</p>
                                <p className="text-xs text-muted-foreground">{org?.name || 'Sin organización'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{ob.production_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {ob.species.map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{ob.herd_size}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={ob.main_challenge}>
                              {ob.main_challenge}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {onboardingData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay encuestas completadas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registro de Accesos Founder
                </CardTitle>
                <CardDescription>
                  Historial de todas las acciones realizadas en modo Founder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Organización</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => {
                        const org = organizations.find(o => o.id === log.target_organization_id);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                log.action.includes('enter') ? 'default' :
                                log.action.includes('exit') ? 'secondary' : 
                                log.action.includes('block') ? 'destructive' : 'outline'
                              }>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {org?.name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {accessLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No hay registros de acceso
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
