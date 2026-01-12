import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, TrendingUp, Award, AlertCircle, Target, Users } from 'lucide-react';
import { FertilityMetrics, HerdFertilityStats } from '@/hooks/useFertilityAnalysis';

interface FertilityAnalysisCardProps {
  allMetrics: FertilityMetrics[];
  herdStats: HerdFertilityStats;
}

export const FertilityAnalysisCard = ({ allMetrics, herdStats }: FertilityAnalysisCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Bajo';
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas del Hato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Estadísticas de Fertilidad del Hato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{herdStats.avgConceptionRate}%</div>
              <div className="text-xs text-muted-foreground">Tasa Concepción</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{herdStats.avgServicesPerConception}</div>
              <div className="text-xs text-muted-foreground">Serv/Concepción</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{herdStats.avgOpenDays}</div>
              <div className="text-xs text-muted-foreground">Días Abiertos</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{herdStats.avgCalvingInterval}</div>
              <div className="text-xs text-muted-foreground">IEP (días)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{herdStats.firstServiceConceptionRate}%</div>
              <div className="text-xs text-muted-foreground">1er Serv. Exitoso</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Fértiles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Mejor Fertilidad
              {herdStats.topFertile.length > 0 && (
                <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {herdStats.topFertile.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Candidatas para donación de embriones</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {herdStats.topFertile.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin datos de fertilidad registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {herdStats.topFertile.map((metric, index) => (
                    <div key={metric.animalId} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <div>
                            <span className="font-medium">{metric.tagId}</span>
                            {metric.name && (
                              <span className="text-sm text-muted-foreground ml-1">({metric.name})</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${getScoreColor(metric.fertilityScore)}`}>
                          {metric.fertilityScore}
                        </div>
                      </div>
                      
                      <Progress value={metric.fertilityScore} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{metric.conceptionRate}%</div>
                          <div className="text-muted-foreground">Concepción</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{metric.avgServicesPerConception}</div>
                          <div className="text-muted-foreground">Serv/Conc.</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{metric.predictedNextConception}%</div>
                          <div className="text-muted-foreground">Prob. Preñez</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Necesitan Atención */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Requieren Atención
              {herdStats.needsAttention.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {herdStats.needsAttention.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Revisar nutrición, detección de celos o salud</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {herdStats.needsAttention.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Heart className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ¡Excelente! No hay animales con baja fertilidad
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {herdStats.needsAttention.map((metric) => (
                    <div key={metric.animalId} className="p-3 border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{metric.tagId}</span>
                          {metric.name && (
                            <span className="text-sm text-muted-foreground ml-1">({metric.name})</span>
                          )}
                        </div>
                        <Badge variant="destructive">{metric.fertilityScore}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Servicios:</span> {metric.totalServices}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Preñeces:</span> {metric.totalPregnancies}
                        </div>
                      </div>
                      
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {metric.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
