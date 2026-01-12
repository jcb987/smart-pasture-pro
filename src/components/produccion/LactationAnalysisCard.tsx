import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Calendar } from 'lucide-react';
import { LactationAnalysis, SomaticCellAnalysis } from '@/hooks/useLactationAnalysis';

interface LactationAnalysisCardProps {
  lactationData: LactationAnalysis[];
  sccData: SomaticCellAnalysis[];
  mastitisAlerts: SomaticCellAnalysis[];
}

export const LactationAnalysisCard = ({ lactationData, sccData, mastitisAlerts }: LactationAnalysisCardProps) => {
  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high' | 'critical') => {
    const variants: Record<string, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const labels: Record<string, string> = {
      low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico'
    };
    return <Badge className={variants[risk]}>{labels[risk]}</Badge>;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Curvas de Lactancia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Análisis de Lactancia
          </CardTitle>
          <CardDescription>Curvas individuales con predicción Wood</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {lactationData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Se requieren al menos 5 registros por animal
              </p>
            ) : (
              <div className="space-y-3">
                {lactationData.slice(0, 10).map((data) => (
                  <div key={data.animalId} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{data.tagId}</span>
                        {data.name && <span className="text-sm text-muted-foreground">({data.name})</span>}
                        {getTrendIcon(data.trend)}
                      </div>
                      <span className="text-lg font-bold text-primary">{data.currentProduction.toFixed(1)}L</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="font-medium">{data.peakProduction.toFixed(1)}L</div>
                        <div className="text-muted-foreground">Pico (día {data.peakDay})</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="font-medium">{data.projectedDays305}L</div>
                        <div className="text-muted-foreground">Proy. 305d</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="font-medium">{data.persistency}%</div>
                        <div className="text-muted-foreground">Persistencia</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{data.lactationDays} días de lactancia</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Células Somáticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-red-500" />
            Células Somáticas (CCS)
            {mastitisAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-auto">{mastitisAlerts.length} alertas</Badge>
            )}
          </CardTitle>
          <CardDescription>Monitoreo de mastitis por animal</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {sccData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin datos de CCS registrados
              </p>
            ) : (
              <div className="space-y-3">
                {sccData
                  .sort((a, b) => (b.lastSCC || 0) - (a.lastSCC || 0))
                  .slice(0, 10)
                  .map((data) => (
                    <div key={data.animalId} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{data.tagId}</span>
                          {data.name && <span className="text-sm text-muted-foreground">({data.name})</span>}
                        </div>
                        {getRiskBadge(data.mastitisRisk)}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Último CCS:</span>
                        <span className="font-medium">
                          {data.lastSCC ? `${(data.lastSCC / 1000).toFixed(0)}K` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Promedio:</span>
                        <span className="font-medium">{(data.avgSCC / 1000).toFixed(0)}K</span>
                      </div>
                      
                      {data.alerts.length > 0 && (
                        <div className="pt-2 border-t">
                          {data.alerts.map((alert, i) => (
                            <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{alert}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
