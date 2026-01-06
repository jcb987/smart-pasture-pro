import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useCostos } from '@/hooks/useCostos';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calculator, TrendingUp, TrendingDown, Target } from 'lucide-react';

export const FinancialProjections = () => {
  const { summary } = useCostos();
  const [projectionMonths, setProjectionMonths] = useState(6);
  const [growthRate, setGrowthRate] = useState(5);
  const [costReduction, setCostReduction] = useState(0);

  // Calculate average monthly values
  const monthlyData = summary.flujoCajaMensual;
  const avgMonthlyIncome = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.ingresos, 0) / monthlyData.length
    : 0;
  const avgMonthlyExpense = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.egresos, 0) / monthlyData.length
    : 0;

  // Generate projections
  const projections = [];
  let cumulativeBalance = summary.balance;
  
  for (let i = 1; i <= projectionMonths; i++) {
    const projectedIncome = avgMonthlyIncome * (1 + (growthRate / 100));
    const projectedExpense = avgMonthlyExpense * (1 - (costReduction / 100));
    const monthlyBalance = projectedIncome - projectedExpense;
    cumulativeBalance += monthlyBalance;

    projections.push({
      month: `Mes ${i}`,
      ingresos: Math.round(projectedIncome),
      egresos: Math.round(projectedExpense),
      balance: Math.round(monthlyBalance),
      acumulado: Math.round(cumulativeBalance),
    });
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const totalProjectedIncome = projections.reduce((sum, p) => sum + p.ingresos, 0);
  const totalProjectedExpense = projections.reduce((sum, p) => sum + p.egresos, 0);
  const totalProjectedBalance = totalProjectedIncome - totalProjectedExpense;
  const projectedROI = totalProjectedExpense > 0 
    ? ((totalProjectedBalance / totalProjectedExpense) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Parámetros de Proyección
          </CardTitle>
          <CardDescription>
            Ajusta los parámetros para ver diferentes escenarios financieros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Meses a proyectar</span>
                <span className="font-bold">{projectionMonths} meses</span>
              </Label>
              <Slider
                value={[projectionMonths]}
                onValueChange={([value]) => setProjectionMonths(value)}
                min={3}
                max={24}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Crecimiento ingresos</span>
                <span className="font-bold text-green-600">+{growthRate}%</span>
              </Label>
              <Slider
                value={[growthRate]}
                onValueChange={([value]) => setGrowthRate(value)}
                min={-20}
                max={50}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Reducción de costos</span>
                <span className="font-bold text-blue-600">{costReduction}%</span>
              </Label>
              <Slider
                value={[costReduction]}
                onValueChange={([value]) => setCostReduction(value)}
                min={0}
                max={30}
                step={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Ingresos Proyectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalProjectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              En {projectionMonths} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Egresos Proyectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalProjectedExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              En {projectionMonths} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Balance Proyectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProjectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProjectedBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ganancia/Pérdida neta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI Proyectado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {projectedROI.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno sobre inversión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección de Flujo de Caja</CardTitle>
          <CardDescription>
            Basado en promedios históricos con {growthRate}% de crecimiento y {costReduction}% de reducción de costos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {avgMonthlyIncome === 0 && avgMonthlyExpense === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Registra transacciones para ver las proyecciones financieras
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  name="Ingresos"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="egresos" 
                  name="Egresos"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="acumulado" 
                  name="Balance Acumulado"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Projection Table */}
      {projections.length > 0 && (avgMonthlyIncome > 0 || avgMonthlyExpense > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Proyección Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Período</th>
                    <th className="text-right py-2 font-medium">Ingresos</th>
                    <th className="text-right py-2 font-medium">Egresos</th>
                    <th className="text-right py-2 font-medium">Balance</th>
                    <th className="text-right py-2 font-medium">Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{p.month}</td>
                      <td className="text-right text-green-600">{formatCurrency(p.ingresos)}</td>
                      <td className="text-right text-red-600">{formatCurrency(p.egresos)}</td>
                      <td className={`text-right font-medium ${p.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(p.balance)}
                      </td>
                      <td className={`text-right font-bold ${p.acumulado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(p.acumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
