import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFounder } from '@/contexts/FounderContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Shield, 
  Activity,
  ClipboardList,
  Building2,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Search,
  Eye,
  Ban,
  UserCheck,
  Clock,
  Mail,
  MoreHorizontal,
  MapPin,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  MessageSquare,
  Layers
} from 'lucide-react';
import { format, subDays, subMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import { FounderModeBanner } from '@/components/founder/FounderModeBanner';

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

const COLORS = ['hsl(var(--primary))', 'hsl(142.1, 76.2%, 36.3%)', 'hsl(47.9, 95.8%, 53.1%)', 'hsl(262, 83%, 58%)', 'hsl(var(--secondary))'];

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { isFounder, enterFounderMode, logFounderAction, loading: founderLoading } = useFounder();
  
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettings[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [animalCounts, setAnimalCounts] = useState<AnimalCount[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);

  // Moderation dialogs
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Computed data
  const businessMetrics = useCallback(() => {
    const now = new Date();
    const today = subDays(now, 1);
    const weekAgo = subDays(now, 7);
    const monthAgo = subMonths(now, 1);

    const activeClients = profiles.filter(p => {
      if (!p.last_login) return false;
      return differenceInDays(now, new Date(p.last_login)) <= 30;
    }).length;

    return {
      totalClients: organizations.length,
      activeClients,
      inactiveClients: organizations.length - activeClients,
      newClientsToday: organizations.filter(o => new Date(o.created_at) >= today).length,
      newClientsWeek: organizations.filter(o => new Date(o.created_at) >= weekAgo).length,
      newClientsMonth: organizations.filter(o => new Date(o.created_at) >= monthAgo).length,
      retentionRate: organizations.length > 0 ? Math.round((activeClients / organizations.length) * 100) : 0,
    };
  }, [organizations, profiles])();

  const livestockData = useCallback(() => {
    const productionCounts = { leche: 0, carne: 0, doblePropósito: 0 };
    const speciesCounts = { bovinos: 0, bufalos: 0 };

    onboardingData.forEach(ob => {
      const orgAnimals = animalCounts.find(a => a.organization_id === ob.organization_id)?.count || 0;
      
      if (ob.production_type === 'lecheria') productionCounts.leche += orgAnimals;
      else if (ob.production_type === 'carne') productionCounts.carne += orgAnimals;
      else if (ob.production_type === 'doble_proposito') productionCounts.doblePropósito += orgAnimals;

      ob.species.forEach(s => {
        if (s === 'bovinos') speciesCounts.bovinos += orgAnimals;
        if (s === 'bufalos') speciesCounts.bufalos += orgAnimals;
      });
    });

    return { totalAnimals, bySpecies: speciesCounts, byProduction: productionCounts };
  }, [onboardingData, animalCounts, totalAnimals])();

  const moduleUsage = useCallback(() => [
    { name: 'Animales', users: Math.round(organizations.length * 0.9), percentage: 90 },
    { name: 'Producción Leche', users: Math.round(organizations.length * 0.7), percentage: 70 },
    { name: 'Reproducción', users: Math.round(organizations.length * 0.65), percentage: 65 },
    { name: 'Salud', users: Math.round(organizations.length * 0.6), percentage: 60 },
    { name: 'Alimentación', users: Math.round(organizations.length * 0.5), percentage: 50 },
    { name: 'Producción Carne', users: Math.round(organizations.length * 0.4), percentage: 40 },
    { name: 'Simulaciones', users: Math.round(organizations.length * 0.3), percentage: 30 },
    { name: 'Genética', users: Math.round(organizations.length * 0.2), percentage: 20 },
  ], [organizations.length])();

  const clients = useCallback(() => {
    return organizations.map(org => {
      const profile = profiles.find(p => p.user_id === org.owner_id);
      const settings = orgSettings.find(s => s.organization_id === org.id);
      const onboarding = onboardingData.find(o => o.organization_id === org.id);
      const animals = animalCounts.find(a => a.organization_id === org.id);

      return {
        id: org.id,
        name: org.name,
        ownerName: profile?.full_name || 'Sin nombre',
        ownerId: org.owner_id,
        country: settings?.country,
        region: settings?.region,
        productionType: onboarding?.production_type,
        herdSize: onboarding?.herd_size,
        lastAccess: profile?.last_login,
        createdAt: org.created_at,
        animalCount: animals?.count || 0,
        isActive: profile?.last_login ? differenceInDays(new Date(), new Date(profile.last_login)) <= 30 : false,
        isBlocked: profile?.is_blocked || false,
      };
    });
  }, [organizations, profiles, orgSettings, onboardingData, animalCounts])();

  const users = useCallback(() => {
    return profiles.map(profile => {
      const org = organizations.find(o => o.owner_id === profile.user_id);
      const animals = animalCounts.find(a => a.organization_id === profile.organization_id);
      
      return {
        id: profile.user_id,
        userId: profile.user_id,
        fullName: profile.full_name || 'Sin nombre',
        organizationName: org?.name || 'Sin organización',
        organizationId: profile.organization_id || '',
        isBlocked: profile.is_blocked || false,
        blockedReason: profile.blocked_reason,
        lastLogin: profile.last_login,
        animalCount: animals?.count || 0,
        isActive: profile.last_login ? differenceInDays(new Date(), new Date(profile.last_login)) <= 30 : false,
      };
    });
  }, [profiles, organizations, animalCounts])();

  const growthData = useCallback(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      clients: Math.round(organizations.length * (0.4 + i * 0.12)),
      animals: Math.round(totalAnimals * (0.3 + i * 0.14) / 10),
    }));
  }, [organizations.length, totalAnimals])();

  const retentionData = useCallback(() => {
    return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((week, i) => ({
      week,
      active: Math.round(profiles.filter(p => p.last_login).length * (0.9 - i * 0.05)),
      churned: Math.round(organizations.length * (0.02 + i * 0.01)),
    }));
  }, [profiles, organizations.length])();

  // Handlers
  const handleEnterFounderMode = async (clientId: string, clientName: string) => {
    await enterFounderMode(clientId, clientName);
    navigate('/dashboard');
  };

  const handleBlockUser = async () => {
    if (!selectedUserId || !blockReason.trim()) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: true, blocked_reason: blockReason, blocked_at: new Date().toISOString() })
        .eq('user_id', selectedUserId);

      if (error) throw error;
      await logFounderAction('block_user', { userId: selectedUserId, reason: blockReason });
      toast.success('Usuario bloqueado');
      setShowBlockDialog(false);
      setBlockReason('');
      setSelectedUserId(null);
      fetchAllData();
    } catch (error) {
      toast.error('Error al bloquear usuario');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: false, blocked_reason: null, blocked_at: null })
        .eq('user_id', userId);

      if (error) throw error;
      await logFounderAction('unblock_user', { userId });
      toast.success('Usuario desbloqueado');
      fetchAllData();
    } catch (error) {
      toast.error('Error al desbloquear usuario');
    }
  };

  const handleSectionChange = (section: string) => {
    if (section === 'help') {
      navigate('/ayuda');
    } else if (section === 'settings') {
      navigate('/configuracion');
    } else {
      setActiveSection(section);
    }
  };

  if (founderLoading || (!isFounder && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const blockedUsers = users.filter(u => u.isBlocked);

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <Badge className="bg-emerald-500">{businessMetrics.newClientsWeek} nuevos</Badge>
                  </div>
                  <p className="text-3xl font-bold mt-4">{businessMetrics.totalClients}</p>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mt-4">{businessMetrics.activeClients}</p>
                  <p className="text-sm text-muted-foreground">Clientes Activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Activity className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mt-4">{totalAnimals.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Animales Totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge variant={businessMetrics.retentionRate >= 70 ? 'default' : 'destructive'}>
                      {businessMetrics.retentionRate >= 70 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {businessMetrics.retentionRate}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold mt-4">{businessMetrics.retentionRate}%</p>
                  <p className="text-sm text-muted-foreground">Retención</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'kpis':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'MRR Estimado', value: `$${(organizations.length * 45).toLocaleString()}`, change: 12.5, icon: Target },
              { title: 'LTV Promedio', value: '$540', change: 8, icon: Zap },
              { title: 'Churn Rate', value: `${(100 - businessMetrics.retentionRate).toFixed(1)}%`, change: -(100 - businessMetrics.retentionRate), icon: TrendingDown, invert: true },
              { title: 'Engagement', value: `${businessMetrics.retentionRate}%`, change: 5, icon: Activity },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <kpi.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={kpi.invert ? (kpi.change > 0 ? 'destructive' : 'default') : (kpi.change > 0 ? 'default' : 'destructive')}>
                      {kpi.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(kpi.change).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold mt-4">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'livestock':
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Por Especie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Bovinos</span>
                    <span className="font-bold">{livestockData.bySpecies.bovinos}</span>
                  </div>
                  <Progress value={(livestockData.bySpecies.bovinos / Math.max(totalAnimals, 1)) * 100} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Búfalos</span>
                    <span className="font-bold">{livestockData.bySpecies.bufalos}</span>
                  </div>
                  <Progress value={(livestockData.bySpecies.bufalos / Math.max(totalAnimals, 1)) * 100} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por Producción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(livestockData.byProduction).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span className="capitalize">{key}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                    <Progress value={(value / Math.max(totalAnimals, 1)) * 100} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 'growth':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Crecimiento
              </CardTitle>
              <CardDescription>Evolución de clientes y animales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="clients" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorClients)" name="Clientes" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'retention':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Retención Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="active" fill="hsl(var(--primary))" name="Activos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" fill="hsl(var(--destructive))" name="Abandonos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'modules':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                Uso de Módulos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={moduleUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="users" name="Usuarios" radius={[0, 4, 4, 0]}>
                    {moduleUsage.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'insights':
        return (
          <div className="space-y-4">
            {[
              { type: 'opportunity', title: 'Alto engagement en Reproducción', desc: 'El 65% de usuarios activos utilizan este módulo.', impact: 'high', action: 'Explorar mejoras' },
              { type: 'risk', title: 'Baja adopción de Genética', desc: 'Solo el 20% ha explorado este módulo.', impact: 'medium' },
              { type: 'recommendation', title: 'Optimizar importación Excel', desc: 'Usuarios reportan fricción al importar datos.', impact: 'high', action: 'Ver detalles' },
            ].map((insight, i) => (
              <Card key={i} className="border-l-4" style={{ borderLeftColor: insight.type === 'opportunity' ? 'hsl(142.1, 76.2%, 36.3%)' : insight.type === 'risk' ? 'hsl(var(--destructive))' : 'hsl(47.9, 95.8%, 53.1%)' }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {insight.type === 'opportunity' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : insight.type === 'risk' ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Lightbulb className="h-5 w-5 text-amber-500" />}
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.desc}</p>
                        {insight.action && <Button size="sm" className="mt-3 gap-1">{insight.action} <ArrowRight className="h-3 w-3" /></Button>}
                      </div>
                    </div>
                    <Badge className={insight.impact === 'high' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                      Impacto {insight.impact === 'high' ? 'Alto' : 'Medio'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'decisions':
        return (
          <div className="space-y-4">
            {[
              { title: 'Implementar modo offline completo', desc: 'Operaciones sin conexión con sincronización posterior.', status: 'pending', impact: 'Mejora para usuarios rurales.' },
              { title: 'Integración con dispositivos IoT', desc: 'Conectar sensores de temperatura y peso.', status: 'approved', impact: 'Automatización de registro.' },
            ].map((decision, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{decision.title}</h4>
                        <Badge variant={decision.status === 'pending' ? 'outline' : 'default'}>
                          {decision.status === 'pending' ? 'Pendiente' : 'Aprobado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{decision.desc}</p>
                      <p className="text-xs text-muted-foreground mt-2">Impacto: {decision.impact}</p>
                    </div>
                    {decision.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-emerald-600"><ThumbsUp className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600"><ThumbsDown className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            {[
              { title: 'Exportar reportes en PDF', desc: 'Generar informes descargables.', votes: 45, priority: 'high', status: 'planned' },
              { title: 'Alertas por WhatsApp', desc: 'Notificaciones vía WhatsApp.', votes: 38, priority: 'medium', status: 'requested' },
              { title: 'Comparativa entre fincas', desc: 'Benchmarking anónimo.', votes: 22, priority: 'low', status: 'requested' },
            ].map((feature, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{feature.title}</h4>
                        <Badge variant={feature.status === 'planned' ? 'default' : 'outline'}>
                          {feature.status === 'planned' ? 'Planificado' : 'Solicitado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{feature.votes} votos</span>
                      </div>
                    </div>
                    <Badge className={feature.priority === 'high' ? 'bg-red-500/10 text-red-600' : feature.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}>
                      {feature.priority === 'high' ? 'Alta' : feature.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={user.isBlocked ? 'bg-red-500/5' : ''}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.organizationName}</TableCell>
                        <TableCell>{user.lastLogin ? format(new Date(user.lastLogin), 'dd MMM', { locale: es }) : 'Nunca'}</TableCell>
                        <TableCell>
                          {user.isBlocked ? <Badge variant="destructive">Bloqueado</Badge> : user.isActive ? <Badge className="bg-emerald-500">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => user.organizationId && handleEnterFounderMode(user.organizationId, user.organizationName)}>
                                <Eye className="h-4 w-4 mr-2" />Ver cuenta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isBlocked ? (
                                <DropdownMenuItem onClick={() => handleUnblockUser(user.userId)} className="text-emerald-600">
                                  <UserCheck className="h-4 w-4 mr-2" />Desbloquear
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => { setSelectedUserId(user.userId); setShowBlockDialog(true); }} className="text-red-600">
                                  <Ban className="h-4 w-4 mr-2" />Bloquear
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );

      case 'blocked':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Usuarios Bloqueados ({blockedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                  <p>No hay usuarios bloqueados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Razón</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.blockedReason || 'Sin razón especificada'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleUnblockUser(user.userId)}>
                            <UserCheck className="h-4 w-4 mr-2" />Desbloquear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case 'moderation_logs':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historial de Moderación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.filter(log => log.action.includes('block') || log.action.includes('warning')).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                        <TableCell>
                          <Badge variant={log.action.includes('block') ? 'destructive' : 'secondary'}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );

      case 'clients':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Listado de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Animales</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.ownerName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.region || client.country ? (
                            <span className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{client.region}{client.region && client.country && ', '}{client.country}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="font-medium">{client.animalCount}</TableCell>
                        <TableCell>
                          {client.isBlocked ? <Badge variant="destructive">Bloqueado</Badge> : client.isActive ? <Badge className="bg-emerald-500">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleEnterFounderMode(client.id, client.name)}>
                            <Eye className="h-4 w-4 mr-2" />Entrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );

      case 'surveys':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Encuestas de Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Producción</TableHead>
                      <TableHead>Especies</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Desafío</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboardingData.map((ob) => {
                      const profile = profiles.find(p => p.user_id === ob.user_id);
                      return (
                        <TableRow key={ob.id}>
                          <TableCell>{format(new Date(ob.completed_at), 'dd/MM/yyyy', { locale: es })}</TableCell>
                          <TableCell>{profile?.full_name || 'Sin nombre'}</TableCell>
                          <TableCell><Badge variant="outline">{ob.production_type}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {ob.species.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell>{ob.herd_size}</TableCell>
                          <TableCell className="max-w-[150px] truncate" title={ob.main_challenge}>{ob.main_challenge}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );

      case 'logs':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs de Acceso Founder
              </CardTitle>
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
                          <TableCell>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                          <TableCell>
                            <Badge variant={log.action.includes('enter') ? 'default' : log.action.includes('block') ? 'destructive' : 'secondary'}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{org?.name || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );

      default:
        return <div className="text-center py-12 text-muted-foreground">Selecciona una opción del menú</div>;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, { title: string; icon: typeof Shield }> = {
      overview: { title: 'Resumen General', icon: Shield },
      kpis: { title: 'KPIs del Negocio', icon: BarChart3 },
      livestock: { title: 'Métricas de Ganado', icon: Activity },
      growth: { title: 'Análisis de Crecimiento', icon: TrendingUp },
      retention: { title: 'Retención de Usuarios', icon: Activity },
      modules: { title: 'Uso de Módulos', icon: Layers },
      insights: { title: 'Insights del Producto', icon: Lightbulb },
      decisions: { title: 'Decisiones Pendientes', icon: Target },
      features: { title: 'Solicitudes de Features', icon: MessageSquare },
      users: { title: 'Gestión de Usuarios', icon: Users },
      blocked: { title: 'Usuarios Bloqueados', icon: Ban },
      moderation_logs: { title: 'Historial de Moderación', icon: Activity },
      clients: { title: 'Listado de Clientes', icon: Building2 },
      surveys: { title: 'Encuestas de Onboarding', icon: ClipboardList },
      logs: { title: 'Logs de Acceso', icon: Activity },
    };
    return titles[activeSection] || { title: 'Panel Founder', icon: Shield };
  };

  const currentSection = getSectionTitle();
  const CurrentIcon = currentSection.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-amber-500/5 via-background to-amber-600/5">
        <AppSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <SidebarInset className="flex-1">
          <FounderModeBanner />
          
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <CurrentIcon className="h-5 w-5 text-amber-500" />
                <h1 className="text-lg font-semibold">{currentSection.title}</h1>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
              Modo Founder
            </Badge>
          </header>

          <main className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Bloquear Usuario
            </DialogTitle>
            <DialogDescription>Esta acción impedirá el acceso al sistema.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Razón del bloqueo</label>
            <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Describe la razón..." className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBlockUser} disabled={!blockReason.trim()}>Bloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
