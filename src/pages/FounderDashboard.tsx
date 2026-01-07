import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFounder } from '@/contexts/FounderContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Users, 
  Building2, 
  ClipboardList, 
  Search, 
  Eye, 
  Activity,
  Globe,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
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
  user_name?: string;
  organization_name?: string;
}

interface AccessLog {
  id: string;
  founder_user_id: string;
  target_organization_id: string | null;
  action: string;
  details: unknown;
  created_at: string;
  organization_name?: string;
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { isFounder, enterFounderMode, logFounderAction, loading: founderLoading } = useFounder();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!founderLoading && !isFounder) {
      navigate('/dashboard');
      return;
    }

    if (isFounder) {
      fetchData();
      logFounderAction('view_founder_dashboard');
    }
  }, [isFounder, founderLoading, navigate, logFounderAction]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch organizations with owner info
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch profiles to get owner names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const orgsWithOwners = (orgs || []).map(org => ({
        ...org,
        owner_name: profiles?.find(p => p.user_id === org.owner_id)?.full_name || 'Sin nombre'
      }));

      setOrganizations(orgsWithOwners);

      // Fetch onboarding data
      const { data: onboarding, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('*')
        .order('completed_at', { ascending: false });

      if (onboardingError) throw onboardingError;

      // Enrich onboarding with user and org names
      const enrichedOnboarding = (onboarding || []).map(ob => ({
        ...ob,
        user_name: profiles?.find(p => p.user_id === ob.user_id)?.full_name || 'Sin nombre',
        organization_name: orgsWithOwners.find(o => o.id === ob.organization_id)?.name || 'Sin organización'
      }));

      setOnboardingData(enrichedOnboarding);

      // Fetch access logs
      const { data: logs, error: logsError } = await supabase
        .from('founder_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const logsWithOrgs = (logs || []).map(log => ({
        ...log,
        organization_name: orgsWithOwners.find(o => o.id === log.target_organization_id)?.name
      }));

      setAccessLogs(logsWithOrgs);
    } catch (error) {
      console.error('Error fetching founder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterOrganization = async (org: Organization) => {
    await enterFounderMode(org.id, org.name);
    navigate('/dashboard');
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (founderLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel Founder</h1>
            <p className="text-muted-foreground">
              Administración y soporte de Agro Data
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Organizaciones</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">Cuentas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Encuestas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onboardingData.length}</div>
              <p className="text-xs text-muted-foreground">Onboardings completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accesos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessLogs.length}</div>
              <p className="text-xs text-muted-foreground">Acciones registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations" className="gap-2">
              <Users className="h-4 w-4" />
              Cuentas
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Encuestas
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Registro de Accesos
            </TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cuentas de Clientes</CardTitle>
                <CardDescription>
                  Buscar y acceder a cualquier cuenta para soporte o mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o propietario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredOrganizations.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{org.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{org.owner_name}</span>
                              <span>•</span>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(org.created_at), 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEnterOrganization(org)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Entrar
                          </Button>
                        </div>
                      ))}
                      {filteredOrganizations.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No se encontraron organizaciones
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Respuestas de Encuestas</CardTitle>
                <CardDescription>
                  Datos de onboarding para mejorar Agro Data. No vendemos datos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
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
                        {onboardingData.map((ob) => (
                          <TableRow key={ob.id}>
                            <TableCell className="text-sm">
                              {format(new Date(ob.completed_at), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ob.user_name}</p>
                                <p className="text-xs text-muted-foreground">{ob.organization_name}</p>
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
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Accesos Founder</CardTitle>
                <CardDescription>
                  Historial de todas las acciones realizadas en modo Founder
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
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
                        {accessLogs.map((log) => (
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
                              {log.organization_name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {accessLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No hay registros de acceso
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
