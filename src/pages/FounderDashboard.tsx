import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFounder } from '@/contexts/FounderContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Activity,
  ClipboardList,
  Building2,
  BarChart3,
  Users
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

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Parallel data fetching
      const [orgsRes, onboardingRes, profilesRes, settingsRes, logsRes, animalsCountRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('user_onboarding').select('*').order('completed_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name, organization_id, last_login'),
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
    // Get production types from onboarding
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
    // This would ideally come from activity_logs, simplified here
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

  // Handlers
  const handleEnterFounderMode = async (client: { id: string; name: string }) => {
    await enterFounderMode(client.id, client.name);
    navigate('/dashboard');
  };

  const handleViewOnboarding = (client: { id: string }) => {
    setActiveTab('surveys');
    // Could filter surveys to this client
  };

  const handleViewActivity = (client: { id: string }) => {
    setActiveTab('logs');
    // Could filter logs to this client
  };

  const handleSearchClient = () => {
    setActiveTab('clients');
    setTimeout(() => {
      clientsTabRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Building2 className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="product" className="gap-2">
              <Users className="h-4 w-4" />
              Producto
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Encuestas
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Logs
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
              alerts={[]} // Would come from error tracking
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
                                log.action.includes('exit') ? 'secondary' : 'outline'
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
