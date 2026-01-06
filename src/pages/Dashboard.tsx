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
  TrendingDown,
  Calendar,
  Activity,
  Droplets,
  Baby,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';

// Mock data - In production this would come from the database
const kpiData = {
  totalAnimales: 324,
  hembrasLactancia: 156,
  partosEsperados: 28,
  produccionDiaria: 2847,
  alertasActivas: 12,
  tasaFertilidad: 68,
  produccionPromedio: 18.3,
  diasAbiertosPromedio: 142,
};

const alerts = [
  { id: 1, type: 'warning', message: '5 vacas con producción baja', module: 'Producción' },
  { id: 2, type: 'danger', message: '3 hembras que debían parir', module: 'Reproducción' },
  { id: 3, type: 'info', message: '8 animales sin pesar esta semana', module: 'Animales' },
  { id: 4, type: 'warning', message: '2 animales con tratamiento pendiente', module: 'Salud' },
];

const recentEvents = [
  { id: 1, event: 'Parto registrado', animal: 'VAC-0234', time: 'Hace 2 horas' },
  { id: 2, event: 'Servicio exitoso', animal: 'VAC-0189', time: 'Hace 5 horas' },
  { id: 3, event: 'Vacunación aplicada', animal: 'Lote A12', time: 'Ayer' },
  { id: 4, event: 'Peso registrado', animal: 'VAC-0156', time: 'Ayer' },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Vista general de tu ganadería • Actualizado hace 5 minutos
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
              <Beef className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalAnimales}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +12 este mes
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hembras en Lactancia</CardTitle>
              <Milk className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.hembrasLactancia}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((kpiData.hembrasLactancia / kpiData.totalAnimales) * 100)}% del hato
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Producción Diaria</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.produccionDiaria} L</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +5.2% vs semana pasada
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{kpiData.alertasActivas}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
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
                <span className="text-2xl font-bold">{kpiData.tasaFertilidad}%</span>
                <Badge variant={kpiData.tasaFertilidad >= 65 ? 'default' : 'destructive'}>
                  {kpiData.tasaFertilidad >= 65 ? 'Óptimo' : 'Bajo'}
                </Badge>
              </div>
              <Progress value={kpiData.tasaFertilidad} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Milk className="h-4 w-4 text-blue-500" />
                Producción Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{kpiData.produccionPromedio} L/día</span>
                <Badge variant="secondary">Por vaca</Badge>
              </div>
              <Progress value={(kpiData.produccionPromedio / 25) * 100} className="mt-2" />
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
                <span className="text-2xl font-bold">{kpiData.diasAbiertosPromedio}</span>
                <Badge variant={kpiData.diasAbiertosPromedio <= 120 ? 'default' : 'destructive'}>
                  {kpiData.diasAbiertosPromedio <= 120 ? 'Normal' : 'Alto'}
                </Badge>
              </div>
              <Progress value={100 - (kpiData.diasAbiertosPromedio / 200) * 100} className="mt-2" />
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
    </DashboardLayout>
  );
};

export default Dashboard;
