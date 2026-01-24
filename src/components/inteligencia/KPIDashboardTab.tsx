import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useKPIDashboard, KPIStatus } from "@/hooks/useKPIDashboard";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const KPICard = ({ kpi }: { kpi: KPIStatus }) => {
  const statusConfig = {
    ok: { 
      icon: CheckCircle, 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    warning: { 
      icon: AlertTriangle, 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20"
    },
    critical: { 
      icon: XCircle, 
      color: "text-red-500", 
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const config = statusConfig[kpi.status];
  const StatusIcon = config.icon;
  const TrendIcon = trendIcons[kpi.trend];

  return (
    <Card className={cn("transition-all hover:shadow-md", config.border, "border-2")}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{kpi.displayName}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{kpi.currentValue}</span>
              <span className="text-sm text-muted-foreground">{kpi.unit}</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-full", config.bg)}>
            <StatusIcon className={cn("h-6 w-6", config.color)} />
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendIcon className="h-4 w-4" />
            <span>vs mes anterior</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Umbral: </span>
            <span className="font-medium">{kpi.warningThreshold} / {kpi.criticalThreshold}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const KPIDashboardTab = () => {
  const { kpiStatuses, alertCounts, thresholds, toggleThreshold, isLoading } = useKPIDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(
          "border-2",
          alertCounts.critical > 0 ? "border-red-500/50 bg-red-500/5" : "border-muted"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Críticas</p>
                <p className="text-4xl font-bold text-red-500">{alertCounts.critical}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          alertCounts.warning > 0 ? "border-yellow-500/50 bg-yellow-500/5" : "border-muted"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Advertencias</p>
                <p className="text-4xl font-bold text-yellow-500">{alertCounts.warning}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KPIs Saludables</p>
                <p className="text-4xl font-bold text-green-500">{alertCounts.ok}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Indicadores Clave de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStatuses.map((kpi) => (
            <KPICard key={kpi.name} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Umbrales
              </CardTitle>
              <CardDescription>
                Personaliza los límites de alerta para cada indicador
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Configurar Notificaciones
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {thresholds.map((threshold) => (
              <div 
                key={threshold.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <Switch
                    checked={threshold.is_active}
                    onCheckedChange={(checked) => 
                      toggleThreshold.mutate({ id: threshold.id, isActive: checked })
                    }
                  />
                  <div>
                    <p className="font-medium">
                      {threshold.kpi_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Alerta: {threshold.comparison_operator === 'below' ? '<' : '>'} {threshold.warning_threshold} | 
                      Crítico: {threshold.comparison_operator === 'below' ? '<' : '>'} {threshold.critical_threshold}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{threshold.kpi_category}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
