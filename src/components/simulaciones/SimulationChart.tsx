import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthlyProjection } from '@/hooks/useSimulations';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';

interface SimulationChartProps {
  data: MonthlyProjection[];
  comparisonData?: MonthlyProjection[];
  comparisonLabel?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const SimulationChart = ({ data, comparisonData, comparisonLabel }: SimulationChartProps) => {
  // Merge data for comparison view
  const mergedData = data.map((d, i) => ({
    ...d,
    ...(comparisonData?.[i] ? {
      compRevenue: comparisonData[i].revenue,
      compProfit: comparisonData[i].profit,
      compCosts: comparisonData[i].totalCosts,
      compHerdSize: comparisonData[i].herdSize,
    } : {}),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Proyecciones Gráficas
        </CardTitle>
        <CardDescription>
          Visualiza el impacto de tus decisiones en el tiempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-1" />
              Financiero
            </TabsTrigger>
            <TabsTrigger value="production">
              <TrendingUp className="h-4 w-4 mr-1" />
              Producción
            </TabsTrigger>
            <TabsTrigger value="costs">
              <BarChart3 className="h-4 w-4 mr-1" />
              Costos
            </TabsTrigger>
            <TabsTrigger value="herd">
              <Users className="h-4 w-4 mr-1" />
              Hato
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mes: ${label}`}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Utilidad"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
                {comparisonData && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="compRevenue"
                      name={`Ingresos (${comparisonLabel})`}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="compProfit"
                      name={`Utilidad (${comparisonLabel})`}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="production" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={formatNumber} className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatNumber(value) + (name.includes('Leche') ? ' L' : ' kg'),
                    name,
                  ]}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="milkProduction"
                  name="Leche (L)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="meatProduction"
                  name="Carne (kg)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="costs" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="feedCosts" name="Alimentación" stackId="costs" fill="#f97316" />
                <Bar dataKey="healthCosts" name="Salud" stackId="costs" fill="#8b5cf6" />
                {comparisonData && (
                  <Line
                    type="monotone"
                    dataKey="compCosts"
                    name={`Total (${comparisonLabel})`}
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="herd" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [value + ' cabezas', 'Tamaño del Hato']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="herdSize"
                  name="Tamaño del Hato"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
                {comparisonData && (
                  <Line
                    type="monotone"
                    dataKey="compHerdSize"
                    name={`Hato (${comparisonLabel})`}
                    stroke="#8b5cf6"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
