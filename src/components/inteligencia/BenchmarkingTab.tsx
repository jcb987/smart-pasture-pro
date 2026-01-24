import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBenchmarking } from "@/hooks/useBenchmarking";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  Target,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

export const BenchmarkingTab = () => {
  const { 
    farmMetrics, 
    overallScore, 
    regions, 
    selectedRegion, 
    setSelectedRegion,
    isLoading 
  } = useBenchmarking();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Region Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparación Regional
          </h3>
          <p className="text-sm text-muted-foreground">
            Compara tu finca con los promedios de tu región (datos de FEDEGAN)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center",
                "bg-gradient-to-br",
                getScoreGradient(overallScore)
              )}>
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className={cn("h-6 w-6 mx-auto mb-1", getScoreColor(overallScore))} />
                    <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
                      {overallScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-bold">Puntaje General de Rendimiento</h4>
              <p className="text-muted-foreground mt-1">
                {overallScore >= 80 && "¡Excelente! Tu finca supera los promedios regionales"}
                {overallScore >= 60 && overallScore < 80 && "Buen desempeño, con oportunidades de mejora"}
                {overallScore < 60 && "Hay oportunidades significativas de mejora"}
              </p>
              <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                <Badge variant="outline" className="text-green-500 border-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Por encima: {farmMetrics.filter(m => m.status === 'above').length}
                </Badge>
                <Badge variant="outline" className="text-red-500 border-red-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Por debajo: {farmMetrics.filter(m => m.status === 'below').length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {farmMetrics.map((metric) => {
          const statusConfig = {
            above: { 
              icon: TrendingUp, 
              color: "text-green-500", 
              bg: "bg-green-500/10",
              label: "Por encima"
            },
            below: { 
              icon: TrendingDown, 
              color: "text-red-500", 
              bg: "bg-red-500/10",
              label: "Por debajo"
            },
            equal: { 
              icon: Minus, 
              color: "text-yellow-500", 
              bg: "bg-yellow-500/10",
              label: "En promedio"
            },
          };
          
          const config = statusConfig[metric.status];
          const StatusIcon = config.icon;

          // Calculate progress percentage (your value vs benchmark)
          const progressPercent = Math.min(100, Math.max(0, 
            (metric.farmValue / metric.benchmarkValue) * 100
          ));

          return (
            <Card key={metric.metricName} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium">{metric.metricName}</p>
                    <Badge variant="outline" className="mt-1">{metric.category}</Badge>
                  </div>
                  <div className={cn("p-2 rounded-full", config.bg)}>
                    <StatusIcon className={cn("h-5 w-5", config.color)} />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Values Comparison */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">{metric.farmValue}</p>
                      <p className="text-sm text-muted-foreground">Tu finca</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl text-muted-foreground">{metric.benchmarkValue}</p>
                      <p className="text-sm text-muted-foreground">Promedio {selectedRegion}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <Progress 
                      value={progressPercent} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Benchmark
                      </span>
                      <span>{metric.unit}</span>
                    </div>
                  </div>

                  {/* Difference */}
                  <div className={cn("text-sm font-medium flex items-center gap-1", config.color)}>
                    <StatusIcon className="h-4 w-4" />
                    {metric.difference > 0 ? '+' : ''}{metric.difference} {metric.unit} ({metric.percentageDiff > 0 ? '+' : ''}{metric.percentageDiff}%)
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {farmMetrics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center">
              No hay suficientes datos para comparar.<br />
              Registra más información de producción, reproducción y salud.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
