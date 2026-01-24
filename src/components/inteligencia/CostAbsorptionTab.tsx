import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCostos } from "@/hooks/useCostos";
import { 
  Calculator, 
  Milk, 
  Beef,
  TrendingDown,
  TrendingUp,
  PieChart,
  DollarSign
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const CostAbsorptionTab = () => {
  const { costPerUnit, summary, lotProfitability } = useCostos();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Prepare pie chart data for costs by category
  const costPieData = summary.costosPorCategoria.map((cat) => ({
    name: cat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: cat.amount,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Cost Per Unit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Milk className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Costo por Litro de Leche</p>
                    <p className="text-3xl font-bold">
                      {costPerUnit.costoPorLitroLeche > 0 
                        ? formatCurrency(costPerUnit.costoPorLitroLeche)
                        : 'Sin datos'
                      }
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Producción Total</p>
                    <p className="text-lg font-semibold">{costPerUnit.litrosTotales.toFixed(0)} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Benchmark</p>
                    <p className="text-lg font-semibold text-muted-foreground">$850/L</p>
                  </div>
                </div>
              </div>
            </div>
            {costPerUnit.costoPorLitroLeche > 0 && costPerUnit.costoPorLitroLeche < 850 && (
              <div className="mt-4 flex items-center gap-2 text-green-500 text-sm">
                <TrendingDown className="h-4 w-4" />
                Por debajo del promedio nacional
              </div>
            )}
            {costPerUnit.costoPorLitroLeche > 850 && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
                <TrendingUp className="h-4 w-4" />
                Por encima del promedio nacional
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/20">
                    <Beef className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Costo por Kilo de Carne</p>
                    <p className="text-3xl font-bold">
                      {costPerUnit.costoPorKiloCarne > 0 
                        ? formatCurrency(costPerUnit.costoPorKiloCarne)
                        : 'Sin datos'
                      }
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Ganancia Total</p>
                    <p className="text-lg font-semibold">{costPerUnit.kilosTotales.toFixed(0)} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Benchmark</p>
                    <p className="text-lg font-semibold text-muted-foreground">$4,200/kg</p>
                  </div>
                </div>
              </div>
            </div>
            {costPerUnit.costoPorKiloCarne > 0 && costPerUnit.costoPorKiloCarne < 4200 && (
              <div className="mt-4 flex items-center gap-2 text-green-500 text-sm">
                <TrendingDown className="h-4 w-4" />
                Por debajo del promedio nacional
              </div>
            )}
            {costPerUnit.costoPorKiloCarne > 4200 && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
                <TrendingUp className="h-4 w-4" />
                Por encima del promedio nacional
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribución de Costos
            </CardTitle>
            <CardDescription>
              Desglose de egresos por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            {costPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={costPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {costPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay datos de costos registrados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lot Profitability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Rentabilidad por Lote
            </CardTitle>
            <CardDescription>
              Margen de ganancia de cada lote de animales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lotProfitability.length > 0 ? (
              <div className="space-y-4">
                {lotProfitability.map((lot) => (
                  <div 
                    key={lot.lotName}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{lot.lotName}</p>
                        <p className="text-sm text-muted-foreground">{lot.animales} animales</p>
                      </div>
                      <div className={`text-right ${lot.rentabilidad >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <p className="text-xl font-bold">{lot.rentabilidad.toFixed(1)}%</p>
                        <p className="text-sm">rentabilidad</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Ingresos</p>
                        <p className="font-medium text-green-600">{formatCurrency(lot.ingresos)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Egresos</p>
                        <p className="font-medium text-red-600">{formatCurrency(lot.egresos)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margen</p>
                        <p className={`font-medium ${lot.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lot.margen)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay datos de lotes</p>
                  <p className="text-sm">Asigna animales a lotes para ver rentabilidad</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Costs Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Costos Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Costos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(costPerUnit.costosTotales)}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 text-center">
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIngresos)}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 text-center">
              <p className="text-sm text-muted-foreground">Egresos Totales</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalEgresos)}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-sm text-muted-foreground">Margen Neto</p>
              <p className="text-2xl font-bold text-primary">{summary.margenNeto.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
