import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2,
  Brain,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FinancialForecast, CostPrediction, CategoryTrend } from '@/hooks/useCostPrediction';

interface CostPredictionCardProps {
  forecast: FinancialForecast;
}

export const CostPredictionCard = ({ forecast }: CostPredictionCardProps) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const variants: Record<string, { bg: string; label: string }> = {
      low: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Bajo' },
      medium: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Medio' },
      high: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Alto' }
    };
    return <Badge className={variants[risk].bg}>Riesgo {variants[risk].label}</Badge>;
  };

  const chartData = forecast.predictions.map(p => ({
    month: p.month.split('-')[1],
    ingresos: p.predictedIngresos,
    egresos: p.predictedEgresos,
    balance: p.predictedBalance,
    confidence: p.confidence
  }));

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Predicción Financiera</CardTitle>
            </div>
            {getRiskBadge(forecast.riskLevel)}
          </div>
          <CardDescription>Proyección de los próximos 6 meses basada en tendencias y estacionalidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${forecast.projectedAnnualBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(forecast.projectedAnnualBalance)}
              </div>
              <div className="text-xs text-muted-foreground">Balance Proyectado 6M</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(forecast.predictions.reduce((s, p) => s + p.predictedIngresos, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Ingresos Proyectados</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(forecast.predictions.reduce((s, p) => s + p.predictedEgresos, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Egresos Proyectados</div>
            </div>
          </div>

          {/* Gráfico de predicción */}
          {chartData.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mes ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="ingresos" 
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    name="Ingresos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="egresos" 
                    stackId="2"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.3}
                    name="Egresos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tendencias por categoría */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tendencias por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast.categoryTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin datos suficientes para tendencias
              </p>
            ) : (
              <div className="space-y-3">
                {forecast.categoryTrends.slice(0, 6).map((trend) => (
                  <div key={trend.category} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.trend)}
                      <span className="text-sm font-medium">{trend.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        trend.changePercent > 0 ? 'text-red-600' : 
                        trend.changePercent < 0 ? 'text-green-600' : ''
                      }`}>
                        {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(trend.currentMonth)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-primary" />
              Recomendaciones IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {forecast.recommendations.map((rec, i) => (
                <Alert key={i} variant={rec.includes('🔴') || rec.includes('📈') ? 'destructive' : 'default'}>
                  <AlertDescription className="text-sm">{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patrón estacional */}
      {forecast.seasonalPattern.length >= 6 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Patrón Estacional Histórico</CardTitle>
            <CardDescription>Balance promedio por mes basado en datos históricos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const monthData = forecast.seasonalPattern.find(p => p.month === i + 1);
                const balance = monthData?.avgBalance || 0;
                const monthNames = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                return (
                  <div key={i} className="text-center">
                    <div className={`h-16 rounded flex items-end justify-center ${
                      balance >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      <div 
                        className={`w-full rounded-t ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ 
                          height: `${Math.min(100, Math.abs(balance) / 100000)}%`,
                          minHeight: '4px'
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{monthNames[i]}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
