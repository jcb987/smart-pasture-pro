import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  ThumbsUp,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface Challenge {
  name: string;
  count: number;
  percentage: number;
}

interface ModuleTrend {
  name: string;
  usage: number;
  trend: 'up' | 'down' | 'stable';
}

interface FounderSatisfactionMetricsProps {
  onboardingCount: number;
  topChallenges: Challenge[];
  moduleTrends: ModuleTrend[];
  loading?: boolean;
}

export function FounderSatisfactionMetrics({ 
  onboardingCount, 
  topChallenges, 
  moduleTrends,
  loading 
}: FounderSatisfactionMetricsProps) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Desafíos Principales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Desafíos Reportados
            <Badge variant="secondary" className="ml-auto">
              {onboardingCount} encuestas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topChallenges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos suficientes
            </p>
          ) : (
            topChallenges.map((challenge, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[70%]">
                    {challenge.name}
                  </span>
                  <span className="text-muted-foreground">
                    {challenge.count} ({challenge.percentage}%)
                  </span>
                </div>
                <Progress value={challenge.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tendencias de Módulos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Módulos Más Usados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moduleTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos de uso disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {moduleTrends.map((module, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{module.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {module.usage} usuarios
                    </span>
                    {module.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    )}
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
