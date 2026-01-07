import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationResults as Results, CurrentMetrics } from '@/hooks/useSimulations';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface SimulationResultsProps {
  results: Results;
  baseline: CurrentMetrics | null;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const ChangeIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        Sin cambio
      </Badge>
    );
  }

  return (
    <Badge
      variant={isPositive ? 'default' : 'destructive'}
      className={`gap-1 ${isPositive ? 'bg-green-600' : ''}`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value}%
    </Badge>
  );
};

export const SimulationResultsCard = ({ results, baseline }: SimulationResultsProps) => {
  const isProfit = results.netProfit > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Resultados de la Simulación
        </CardTitle>
        <CardDescription>
          Proyección financiera basada en los parámetros configurados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Ingresos Totales</span>
              <ChangeIndicator value={results.revenueChange} />
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(results.totalRevenue)}</p>
          </div>

          {/* Total Costs */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Costos Totales</span>
              <ChangeIndicator value={results.costChange} inverted />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(results.totalCosts)}</p>
          </div>

          {/* Net Profit */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Utilidad Neta</span>
              <ChangeIndicator value={results.profitChange} />
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.netProfit)}
            </p>
          </div>

          {/* ROI */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">ROI</span>
              <Badge variant="outline" className="w-fit gap-1">
                <Percent className="h-3 w-3" />
                Retorno
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${results.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {results.roi}%
              </p>
              {results.roi > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        {results.monthlyData.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Resumen por Período</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Mejor mes: </span>
                <span className="font-medium">
                  {results.monthlyData.reduce((best, m) => m.profit > best.profit ? m : best).label}
                </span>
                <span className="text-green-600 ml-1">
                  ({formatCurrency(Math.max(...results.monthlyData.map(m => m.profit)))})
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Promedio mensual: </span>
                <span className="font-medium">
                  {formatCurrency(results.netProfit / results.monthlyData.length)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Hato final: </span>
                <span className="font-medium">
                  {results.monthlyData[results.monthlyData.length - 1]?.herdSize || 0} cabezas
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Baseline Comparison */}
        {baseline && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Datos base:</strong> {baseline.totalAnimals} animales, 
              {baseline.femalesCount} hembras produciendo ~{baseline.avgDailyMilk.toFixed(1)}L/día, 
              {baseline.malesCount} machos con GDP de ~{baseline.avgDailyGain.toFixed(2)}kg/día
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
