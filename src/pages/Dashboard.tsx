import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Beef, 
  Milk, 
  Heart, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Activity,
  Droplets,
  Baby,
  Stethoscope,
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import { useDashboardData } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { kpis, alerts, recentEvents, loading, lastUpdated, refresh } = useDashboardData();

  const aiContext = {
    totalAnimals: kpis.totalAnimales,
    animalsInLactation: kpis.hembrasLactancia,
    dailyProduction: kpis.produccionDiaria,
    alertsCount: kpis.alertasActivas,
    fertilityRate: kpis.tasaFertilidad,
  };

  const formatLastUpdated = () => {
    return format(lastUpdated, "'Actualizado' HH:mm", { locale: es });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Vista general de tu ganadería • {formatLastUpdated()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Actualizar</span>
          </Button>
        </div>

        {/* Weather + Main KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <WeatherWidget className="md:col-span-2 lg:col-span-1" />
          
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
              <Beef className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalAnimales}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +{kpis.cambioMensual} este mes
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hembras en Lactancia</CardTitle>
              <Milk className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.hembrasLactancia}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.totalAnimales > 0 ? Math.round((kpis.hembrasLactancia / kpis.totalAnimales) * 100) : 0}% del hato
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Producción Diaria</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.produccionDiaria.toFixed(1)} L</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Promedio: {kpis.produccionPromedio} L/vaca
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{kpis.alertasActivas}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Tasa de Fertilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{kpis.tasaFertilidad}%</span>
                <Badge variant={kpis.tasaFertilidad >= 65 ? 'default' : 'destructive'}>
                  {kpis.tasaFertilidad >= 65 ? 'Óptimo' : 'Bajo'}
                </Badge>
              </div>
              <Progress value={kpis.tasaFertilidad} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Baby className="h-4 w-4 text-purple-500" />
                Partos Esperados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{kpis.partosEsperados}</span>
                <Badge variant="secondary">Próximos 30 días</Badge>
              </div>
              <Progress value={kpis.partosEsperados > 0 ? Math.min((kpis.partosEsperados / 10) * 100, 100) : 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                Días Abiertos Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{kpis.diasAbiertosPromedio || '–'}</span>
                {kpis.diasAbiertosPromedio > 0 ? (
                  <Badge variant={kpis.diasAbiertosPromedio <= 120 ? 'default' : 'destructive'}>
                    {kpis.diasAbiertosPromedio <= 120 ? 'Normal' : 'Alto'}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sin datos</Badge>
                )}
              </div>
              <Progress value={kpis.diasAbiertosPromedio > 0 ? 100 - (kpis.diasAbiertosPromedio / 200) * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Recent Events */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas Activas
              </CardTitle>
              <CardDescription>Eventos que requieren tu atención</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'danger' ? 'bg-red-500' :
                          alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.module}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin alertas activas</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reportes')}>
                Ver todas las alertas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>Últimos eventos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Beef className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.event}</p>
                          <p className="text-xs text-muted-foreground">{event.animal}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin actividad reciente</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/animales')}>
                Ver historial completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más usadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/animales')}>
                <Beef className="h-5 w-5" />
                <span className="text-xs">Nuevo Animal</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/produccion-leche')}>
                <Milk className="h-5 w-5" />
                <span className="text-xs">Registrar Leche</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/reproduccion')}>
                <Baby className="h-5 w-5" />
                <span className="text-xs">Registrar Parto</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/salud')}>
                <Stethoscope className="h-5 w-5" />
                <span className="text-xs">Evento Salud</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget 
        context={aiContext}
        title="Asistente Ganadero"
        placeholder="Pregunta sobre tu hato..."
      />
    </DashboardLayout>
  );
};

export default Dashboard;
