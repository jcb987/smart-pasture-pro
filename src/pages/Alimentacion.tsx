import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Utensils, Plus, Calculator, Leaf, Package, AlertTriangle, 
  DollarSign, TrendingUp, Scale 
} from 'lucide-react';
import { useFeeding, FeedItem } from '@/hooks/useFeeding';
import { AddFeedItemDialog } from '@/components/alimentacion/AddFeedItemDialog';
import { AddConsumptionDialog } from '@/components/alimentacion/AddConsumptionDialog';
import { AddDietDialog } from '@/components/alimentacion/AddDietDialog';
import { FeedInventoryTable, ConsumptionTable } from '@/components/alimentacion/FeedTables';
import { ProductionChart } from '@/components/produccion/ProductionChart';

const Alimentacion = () => {
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [showConsumptionDialog, setShowConsumptionDialog] = useState(false);
  const [showDietDialog, setShowDietDialog] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedItem | null>(null);

  const {
    inventory,
    diets,
    consumption,
    loading,
    addFeedItem,
    updateFeedItem,
    deleteFeedItem,
    addDiet,
    deleteDiet,
    addConsumption,
    deleteConsumption,
    getStats,
    getLowStockAlerts,
    getConsumptionByPeriod,
    FEED_CATEGORIES,
    TARGET_GROUPS,
  } = useFeeding();

  const stats = getStats();
  const lowStockAlerts = getLowStockAlerts();
  const consumptionData = getConsumptionByPeriod(30);

  const handleEditFeed = (item: FeedItem) => {
    setEditingFeed(item);
    // For now, just show alert - could implement edit dialog
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alimentación y Nutrición</h1>
            <p className="text-muted-foreground">Gestión de raciones, inventario y balance de dietas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDietDialog(true)}>
              <Calculator className="mr-2 h-4 w-4" />
              Nueva Dieta
            </Button>
            <Button variant="outline" onClick={() => setShowConsumptionDialog(true)}>
              <Utensils className="mr-2 h-4 w-4" />
              Registrar Consumo
            </Button>
            <Button onClick={() => setShowFeedDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Alimento
            </Button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Stock Bajo</AlertTitle>
            <AlertDescription>
              {lowStockAlerts.length} alimento(s) con stock bajo o agotado: {' '}
              {lowStockAlerts.map(a => a.name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Alimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedItems}</div>
              <p className="text-xs text-muted-foreground">En inventario</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Requieren reposición</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                Dietas Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeDiets}</div>
              <p className="text-xs text-muted-foreground">Configuradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Consumo Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyConsumption.toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground">Total del día</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Costo Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyFeedCost.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Costo/Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgCostPerAnimal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Promedio diario</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="consumption">Consumo</TabsTrigger>
            <TabsTrigger value="diets">Dietas</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <FeedInventoryTable 
              items={inventory} 
              onEdit={handleEditFeed}
              onDelete={deleteFeedItem}
            />
          </TabsContent>

          <TabsContent value="consumption" className="space-y-4">
            <ConsumptionTable 
              records={consumption}
              onDelete={deleteConsumption}
            />
          </TabsContent>

          <TabsContent value="diets" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {diets.map((diet) => (
                <Card key={diet.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{diet.name}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => deleteDiet(diet.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                    <CardDescription>
                      {TARGET_GROUPS.find(g => g.value === diet.target_group)?.label || diet.target_lot || 'Sin grupo'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Proteína:</span>{' '}
                        <span className="font-medium">{diet.target_protein ? `${diet.target_protein}%` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Energía:</span>{' '}
                        <span className="font-medium">{diet.target_energy ? `${diet.target_energy} Mcal` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">FDN:</span>{' '}
                        <span className="font-medium">{diet.target_fdn ? `${diet.target_fdn}%` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MS:</span>{' '}
                        <span className="font-medium">{diet.target_dry_matter ? `${diet.target_dry_matter} kg` : '-'}</span>
                      </div>
                    </div>
                    {diet.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{diet.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {diets.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center text-muted-foreground">
                      <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay dietas configuradas</p>
                      <Button variant="link" onClick={() => setShowDietDialog(true)}>
                        Crear primera dieta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {consumptionData.length > 0 ? (
                <ProductionChart 
                  data={consumptionData} 
                  title="Consumo Diario (30 días)" 
                  unit=" kg"
                  type="bar"
                  color="hsl(var(--primary))"
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Consumo Diario</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[250px] border-2 border-dashed border-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Registra consumo para ver gráficas</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análisis Nutricional</CardTitle>
                  <CardDescription>
                    Sugerencias basadas en el balance nutricional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {inventory.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Agrega alimentos con valores nutricionales para obtener análisis
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inventory.filter(f => f.protein_percentage).length > 0 ? (
                        <>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Proteína Promedio Disponible</p>
                            <p className="text-2xl font-bold text-primary">
                              {(inventory
                                .filter(f => f.protein_percentage)
                                .reduce((sum, f) => sum + (f.protein_percentage || 0), 0) / 
                                inventory.filter(f => f.protein_percentage).length
                              ).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Energía Promedio Disponible</p>
                            <p className="text-2xl font-bold text-primary">
                              {(inventory
                                .filter(f => f.energy_mcal)
                                .reduce((sum, f) => sum + (f.energy_mcal || 0), 0) / 
                                (inventory.filter(f => f.energy_mcal).length || 1)
                              ).toFixed(2)} Mcal/kg
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Agrega valores nutricionales a los alimentos para ver análisis
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión Nutricional Completa</CardTitle>
            <CardDescription>
              Inventario de alimentos y suplementos con valores nutricionales, balance de dietas
              por grupo (energía, proteína, FDN), costos de alimentación por período, análisis
              de consumo vs producción, y alertas de stock bajo. Permite gestionar costos y nutrición
              de forma eficiente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <AddFeedItemDialog
        open={showFeedDialog}
        onOpenChange={setShowFeedDialog}
        onSubmit={addFeedItem}
        categories={FEED_CATEGORIES}
      />

      <AddConsumptionDialog
        open={showConsumptionDialog}
        onOpenChange={setShowConsumptionDialog}
        onSubmit={addConsumption}
        feedItems={inventory}
      />

      <AddDietDialog
        open={showDietDialog}
        onOpenChange={setShowDietDialog}
        onSubmit={addDiet}
        targetGroups={TARGET_GROUPS}
      />
    </DashboardLayout>
  );
};

export default Alimentacion;
