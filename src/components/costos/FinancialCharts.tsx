import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCostos, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/hooks/useCostos';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const FinancialCharts = () => {
  const { summary } = useCostos();

  const getCategoryLabel = (value: string) => {
    const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    const cat = allCategories.find(c => c.value === value);
    return cat?.label || value;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Prepare data for pie charts
  const ingresosPieData = summary.ingresosPorCategoria.map(item => ({
    name: getCategoryLabel(item.category),
    value: item.amount,
  }));

  const egresosPieData = summary.costosPorCategoria.map(item => ({
    name: getCategoryLabel(item.category),
    value: item.amount,
  }));

  // Format monthly data for display
  const monthlyData = summary.flujoCajaMensual.map(item => ({
    ...item,
    month: item.month.split('-')[1] + '/' + item.month.split('-')[0].slice(2),
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Cash Flow Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Flujo de Caja Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos suficientes para mostrar el flujo de caja
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  name="Ingresos"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="egresos" 
                  name="Egresos"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Income by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {ingresosPieData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay ingresos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ingresosPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ingresosPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Egresos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {egresosPieData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay egresos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={egresosPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {egresosPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Comparison Bar Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Comparativa Ingresos vs Egresos por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos suficientes para mostrar la comparativa
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" />
                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
