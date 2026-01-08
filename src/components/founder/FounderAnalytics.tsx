import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Target,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface GrowthData {
  month: string;
  clients: number;
  animals: number;
}

interface RetentionData {
  week: string;
  active: number;
  churned: number;
}

interface ModuleData {
  name: string;
  usage: number;
  growth: number;
}

interface FounderAnalyticsProps {
  growthData: GrowthData[];
  retentionData: RetentionData[];
  moduleData: ModuleData[];
  kpis: {
    mrr: number;
    mrrGrowth: number;
    ltv: number;
    cac: number;
    nps: number;
    churnRate: number;
    engagementScore: number;
    avgSessionTime: number;
  };
  loading?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142.1, 76.2%, 36.3%)', 'hsl(47.9, 95.8%, 53.1%)', 'hsl(262, 83%, 58%)'];

export function FounderAnalytics({ growthData, retentionData, moduleData, kpis, loading }: FounderAnalyticsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'MRR Estimado',
      value: `$${kpis.mrr.toLocaleString()}`,
      change: kpis.mrrGrowth,
      icon: Target,
      description: 'Ingresos mensuales recurrentes',
    },
    {
      title: 'LTV / CAC',
      value: kpis.cac > 0 ? (kpis.ltv / kpis.cac).toFixed(1) + 'x' : 'N/A',
      change: 15,
      icon: Zap,
      description: 'Ratio de valor del cliente',
    },
    {
      title: 'Churn Rate',
      value: `${kpis.churnRate.toFixed(1)}%`,
      change: -kpis.churnRate,
      icon: Users,
      description: 'Tasa de abandono mensual',
      invertColor: true,
    },
    {
      title: 'Engagement',
      value: `${kpis.engagementScore}%`,
      change: 8,
      icon: Activity,
      description: 'Puntuación de engagement',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge 
                  variant={kpi.invertColor 
                    ? (kpi.change > 0 ? 'destructive' : 'default') 
                    : (kpi.change > 0 ? 'default' : 'destructive')
                  }
                  className="gap-1"
                >
                  {kpi.change > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(kpi.change).toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Crecimiento
            </CardTitle>
            <CardDescription>Evolución de clientes y animales registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnimals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="clients" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorClients)" 
                  name="Clientes"
                />
                <Area 
                  type="monotone" 
                  dataKey="animals" 
                  stroke="hsl(142.1, 76.2%, 36.3%)" 
                  fillOpacity={1} 
                  fill="url(#colorAnimals)" 
                  name="Animales (÷10)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Retention Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Retención Semanal
            </CardTitle>
            <CardDescription>Usuarios activos vs abandonos por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="active" fill="hsl(var(--primary))" name="Activos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" fill="hsl(var(--destructive))" name="Abandonos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Uso de Módulos
          </CardTitle>
          <CardDescription>Comparativa de uso entre módulos del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" className="text-xs" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))' 
                }} 
              />
              <Bar dataKey="usage" fill="hsl(var(--primary))" name="Usuarios activos" radius={[0, 4, 4, 0]}>
                {moduleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
