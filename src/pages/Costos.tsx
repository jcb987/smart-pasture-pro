import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCostos } from '@/hooks/useCostos';
import { useCostPrediction } from '@/hooks/useCostPrediction';
import { AddTransactionDialog } from '@/components/costos/AddTransactionDialog';
import { TransactionsTable } from '@/components/costos/TransactionsTable';
import { FinancialCharts } from '@/components/costos/FinancialCharts';
import { CostAnalysis } from '@/components/costos/CostAnalysis';
import { FinancialProjections } from '@/components/costos/FinancialProjections';
import { CostPredictionCard } from '@/components/costos/CostPredictionCard';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  BarChart3,
  Calculator,
  FileSpreadsheet,
  PiggyBank,
  Brain
} from 'lucide-react';

const Costos = () => {
  const { canWrite } = useModulePermissions('costos');
  const { summary, isLoading, transactions } = useCostos();
  const { forecast } = useCostPrediction(transactions || []);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [defaultType, setDefaultType] = useState<'ingreso' | 'egreso'>('ingreso');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddIncome = () => {
    setDefaultType('ingreso');
    setShowAddDialog(true);
  };

  const handleAddExpense = () => {
    setDefaultType('egreso');
    setShowAddDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Costos y Finanzas</h1>
            <p className="text-muted-foreground">Gestión económica y rentabilidad de la finca</p>
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">
                <TrendingUp className="mr-2 h-4 w-4" />
                Registrar Ingreso
              </Button>
              <Button onClick={handleAddExpense} variant="destructive">
                <TrendingDown className="mr-2 h-4 w-4" />
                Registrar Egreso
              </Button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : formatCurrency(summary.totalIngresos)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.ingresosPorCategoria.length} categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : formatCurrency(summary.totalEgresos)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.costosPorCategoria.length} categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? '...' : formatCurrency(summary.balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos - Egresos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Margen Neto</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.margenNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? '...' : `${summary.margenNeto.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Rentabilidad sobre ingresos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Transacciones</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Gráficas</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Análisis</span>
            </TabsTrigger>
            <TabsTrigger value="projections" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Proyecciones</span>
            </TabsTrigger>
            <TabsTrigger value="prediction" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Predicción IA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <FinancialCharts />
          </TabsContent>

          <TabsContent value="analysis">
            <CostAnalysis />
          </TabsContent>

          <TabsContent value="projections">
            <FinancialProjections />
          </TabsContent>

          <TabsContent value="prediction">
            <CostPredictionCard forecast={forecast} />
          </TabsContent>
        </Tabs>
      </div>

      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultType={defaultType}
      />
    </DashboardLayout>
  );
};

export default Costos;
