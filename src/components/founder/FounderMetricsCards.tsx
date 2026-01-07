import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  UserPlus,
  UserMinus
} from 'lucide-react';

interface MetricsData {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newClientsToday: number;
  newClientsWeek: number;
  newClientsMonth: number;
  retentionRate: number;
}

interface FounderMetricsCardsProps {
  metrics: MetricsData;
  loading?: boolean;
}

export function FounderMetricsCards({ metrics, loading }: FounderMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Building2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.activeClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            de {metrics.totalClients} registrados
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Nuevos Clientes</CardTitle>
          <UserPlus className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.newClientsMonth}</span>
            <span className="text-sm text-muted-foreground">mes</span>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Hoy: {metrics.newClientsToday}
            </span>
            <span>Semana: {metrics.newClientsWeek}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
          <UserMinus className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.inactiveClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Sin actividad +30 días
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Retención</CardTitle>
          {metrics.retentionRate >= 70 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.retentionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Clientes activos / total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
