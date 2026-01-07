import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimulationResults as Results, CurrentMetrics } from '@/hooks/useSimulations';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Minus, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      <Badge variant="outline" className="gap-1 text-xs">
        <Minus className="h-3 w-3" />
        Sin cambio
      </Badge>
    );
  }

  return (
    <Badge
      variant={isPositive ? 'default' : 'destructive'}
      className={`gap-1 text-xs ${isPositive ? 'bg-green-600' : ''}`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value}%
    </Badge>
  );
};

const DataSourceIndicator = ({ source, assumptions }: { source: string; assumptions: string[] }) => {
  const getSourceLabel = () => {
    switch (source) {
      case 'system_data': return 'Datos del sistema';
      case 'user_input': return 'Datos ingresados';
      case 'mixed': return 'Datos mixtos';
      default: return 'Datos configurados';
    }
  };

  const getSourceIcon = () => {
    switch (source) {
      case 'system_data': return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'user_input': return <Info className="h-3 w-3 text-blue-600" />;
      case 'mixed': return <AlertCircle className="h-3 w-3 text-amber-600" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-xs cursor-help">
            {getSourceIcon()}
            {getSourceLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium mb-1">Fuentes de datos:</p>
          <ul className="text-xs space-y-0.5">
            {assumptions.slice(0, 5).map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const SimulationResultsCard = ({ results, baseline }: SimulationResultsProps) => {
  const isProfit = results.netProfit > 0;
  const hasData = results.monthlyData.length > 0;

  // Check if results are valid (not empty due to missing config)
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resultados de la Simulación
          </CardTitle>
          <CardDescription>
            Completa la configuración base para ver resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">Datos insuficientes para simular</p>
            <p className="text-sm text-muted-foreground mt-1">
              Completa la encuesta de configuración base para comenzar
            </p>
            {results.assumptions && results.assumptions.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-left w-full">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Datos faltantes:</p>
                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                  {results.assumptions.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultados de la Simulación
            </CardTitle>
            <CardDescription>
              Proyección financiera basada en tus datos reales
            </CardDescription>
          </div>
          <DataSourceIndicator source={results.dataSource} assumptions={results.assumptions} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Ingresos Totales</span>
              <ChangeIndicator value={results.revenueChange} />
            </div>
            <p className="text-lg font-bold text-primary">{formatCurrency(results.totalRevenue)}</p>
          </div>

          {/* Total Costs */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Costos Totales</span>
              <ChangeIndicator value={results.costChange} inverted />
            </div>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(results.totalCosts)}</p>
          </div>

          {/* Net Profit */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Utilidad Neta</span>
              <ChangeIndicator value={results.profitChange} />
            </div>
            <p className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.netProfit)}
            </p>
          </div>

          {/* ROI */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">ROI</span>
              <Badge variant="outline" className="w-fit gap-1 text-xs">
                <Percent className="h-3 w-3" />
                Retorno
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-bold ${results.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {results.roi}%
              </p>
              {results.roi > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
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

        {/* Data source notice */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <strong>Basado en datos ingresados</strong> — Cero valores aleatorios o estimados
          </p>
        </div>

        {/* Baseline Comparison */}
        {baseline && baseline.totalAnimals > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong>Base actual:</strong> {baseline.totalAnimals} animales
              {baseline.femalesCount > 0 && `, ${baseline.femalesCount} hembras`}
              {baseline.malesCount > 0 && `, ${baseline.malesCount} machos`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
