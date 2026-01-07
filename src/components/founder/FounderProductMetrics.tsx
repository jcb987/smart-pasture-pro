import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';

interface ModuleUsage {
  name: string;
  users: number;
  percentage: number;
}

interface ProductAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  module: string;
  message: string;
  count: number;
}

interface FounderProductMetricsProps {
  moduleUsage: ModuleUsage[];
  alerts: ProductAlert[];
  loading?: boolean;
}

export function FounderProductMetrics({ moduleUsage, alerts, loading }: FounderProductMetricsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader><div className="h-6 bg-muted rounded w-48" /></CardHeader>
          <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader><div className="h-6 bg-muted rounded w-48" /></CardHeader>
          <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  const sortedModules = [...moduleUsage].sort((a, b) => b.users - a.users);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Uso de Módulos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Uso de Módulos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedModules.slice(0, 8).map((module) => (
            <div key={module.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{module.name}</span>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{module.users}</span>
                  <Badge variant="secondary" className="text-xs">
                    {module.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress value={module.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alertas del Producto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas del Producto
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-emerald-500/10 rounded-full mb-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay alertas activas. ¡Todo funciona bien!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'error' 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : alert.type === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{alert.module}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                    <Badge 
                      variant={alert.type === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.count}x
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
