import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplies, Supply } from '@/hooks/useSupplies';
import { AddSupplyDialog } from '@/components/insumos/AddSupplyDialog';
import { AddMovementDialog } from '@/components/insumos/AddMovementDialog';
import { AddLotDialog } from '@/components/insumos/AddLotDialog';
import { SuppliesTable } from '@/components/insumos/SuppliesTable';
import { KardexTable } from '@/components/insumos/KardexTable';
import { LotsTable } from '@/components/insumos/LotsTable';
import { SupplyAlerts } from '@/components/insumos/SupplyAlerts';
import {
  Package,
  Plus,
  ArrowDownCircle,
  AlertTriangle,
  Layers,
  FileText,
  Bell,
  DollarSign,
} from 'lucide-react';

const Insumos = () => {
  const { canWrite } = useModulePermissions('insumos');
  const { getStats, loading } = useSupplies();
  const stats = getStats();
  
  const [showAddSupply, setShowAddSupply] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showAddLot, setShowAddLot] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | undefined>(undefined);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Insumos y Materiales</h1>
            <p className="text-muted-foreground">Inventario completo con kardex, lotes y alertas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <>
                <Button onClick={() => setShowAddSupply(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Insumo
                </Button>
                <Button variant="outline" onClick={() => setShowAddLot(true)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Agregar Lote
                </Button>
                <Button variant="secondary" onClick={() => setShowAddMovement(true)}>
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Registrar Movimiento
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Insumos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">productos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">valor total estimado</p>
            </CardContent>
          </Card>

          <Card className={stats.lowStockCount > 0 ? 'border-red-200 dark:border-red-900' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : ''}`}>
                {loading ? '...' : stats.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">requieren reposición</p>
            </CardContent>
          </Card>

          <Card className={stats.expiringCount > 0 ? 'border-amber-200 dark:border-amber-900' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              <Bell className={`h-4 w-4 ${stats.expiringCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.expiringCount > 0 ? 'text-amber-600' : ''}`}>
                {loading ? '...' : stats.expiringCount}
              </div>
              <p className="text-xs text-muted-foreground">lotes próximos a vencer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalLots}</div>
              <p className="text-xs text-muted-foreground">lotes con stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventario</span>
            </TabsTrigger>
            <TabsTrigger value="kardex" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Kardex</span>
            </TabsTrigger>
            <TabsTrigger value="lots" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Lotes</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              {(stats.lowStockCount + stats.expiringCount + stats.expiredCount) > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                  {stats.lowStockCount + stats.expiringCount + stats.expiredCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Insumos</CardTitle>
              </CardHeader>
              <CardContent>
                <SuppliesTable 
                  onSelectSupply={(supply) => {
                    setSelectedSupply(supply);
                  }} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kardex">
            <Card>
              <CardHeader>
                <CardTitle>Kardex - Movimientos de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <KardexTable supply={selectedSupply} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lots">
            <Card>
              <CardHeader>
                <CardTitle>Control de Lotes y Vencimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <LotsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <SupplyAlerts />
          </TabsContent>
        </Tabs>
      </div>

      <AddSupplyDialog open={showAddSupply} onOpenChange={setShowAddSupply} />
      <AddMovementDialog open={showAddMovement} onOpenChange={setShowAddMovement} />
      <AddLotDialog open={showAddLot} onOpenChange={setShowAddLot} />
    </DashboardLayout>
  );
};

export default Insumos;
