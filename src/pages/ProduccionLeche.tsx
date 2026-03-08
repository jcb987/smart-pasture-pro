import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Plus, TrendingUp, Award, Droplets, FlaskConical, Activity, Download, Upload } from 'lucide-react';
import { useMilkProduction } from '@/hooks/useMilkProduction';
import { SmartImportDialog } from '@/components/shared/SmartImportDialog';
import { milkImportConfig } from '@/config/importConfigs';
import { useImportMilk } from '@/hooks/useImportMilk';
import { useLactationAnalysis } from '@/hooks/useLactationAnalysis';
import { AddMilkRecordDialog } from '@/components/produccion/AddMilkRecordDialog';
import { ProductionChart } from '@/components/produccion/ProductionChart';
import { RankingTable } from '@/components/produccion/RankingTable';
import { ProductionRecordsTable } from '@/components/produccion/ProductionRecordsTable';
import { LactationAnalysisCard } from '@/components/produccion/LactationAnalysisCard';
import { MilkExportDialog } from '@/components/produccion/MilkExportDialog';

const ProduccionLeche = () => {
  const { canWrite, canDelete } = useModulePermissions('produccion-leche');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [rankingPeriod, setRankingPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { importData } = useImportMilk();
  
  const { 
    records, 
    loading, 
    addRecord, 
    deleteRecord, 
    getStats, 
    getRankings, 
    getProductionCurve,
    fetchRecords,
  } = useMilkProduction();

  const stats = getStats();
  const rankings = getRankings(rankingPeriod);
  const productionCurve = getProductionCurve();

  // Análisis de lactancia y CCS
  const { 
    getAllLactationAnalysis, 
    getAllSCCAnalysis, 
    mastitisAlerts, 
    topPersistency 
  } = useLactationAnalysis(records);

  const rankingItems = rankings.map((r, i) => ({
    position: i + 1,
    tag_id: r.tag_id,
    name: r.name,
    value: r.total_liters,
    secondary: r.avg_liters,
    unit: 'L',
    secondaryUnit: 'L/día',
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Producción de Leche</h1>
            <p className="text-muted-foreground">Control completo de producción lechera</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Datos
            </Button>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Datos
            </Button>
            {canWrite && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Producción
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Milk className="h-4 w-4 text-primary" />
                Producción Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTotal.toFixed(1)} L</div>
              <p className="text-xs text-muted-foreground">{stats.lactatingCows} vacas ordeñadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Promedio/Vaca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPerCow.toFixed(1)} L</div>
              <p className="text-xs text-muted-foreground">Litros por vaca hoy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                Producción Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthTotal.toFixed(0)} L</div>
              <p className="text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Calidad Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgFat ? `${stats.avgFat.toFixed(1)}%` : '--'} Grasa
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.avgProtein ? `${stats.avgProtein.toFixed(1)}% Proteína` : 'Sin datos de calidad'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="lactation">
              <Activity className="mr-1 h-4 w-4" />
              Curvas Lactancia
            </TabsTrigger>
            <TabsTrigger value="records">Registros</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts and Rankings */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ProductionChart 
                data={productionCurve} 
                title="Curva de Producción (30 días)" 
                unit=" L"
                color="hsl(var(--primary))"
              />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-medium">Ranking por Período</span>
                  <div className="ml-auto flex gap-1">
                    <Button 
                      variant={rankingPeriod === 'week' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setRankingPeriod('week')}
                    >
                      Semana
                    </Button>
                    <Button 
                      variant={rankingPeriod === 'month' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setRankingPeriod('month')}
                    >
                      Mes
                    </Button>
                    <Button 
                      variant={rankingPeriod === 'year' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setRankingPeriod('year')}
                    >
                      Año
                    </Button>
                  </div>
                </div>
                <RankingTable 
                  title={`Top Productoras - ${rankingPeriod === 'week' ? 'Semana' : rankingPeriod === 'month' ? 'Mes' : 'Año'}`}
                  items={rankingItems}
                  valueLabel="Total"
                  secondaryLabel="Promedio"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lactation">
            <LactationAnalysisCard 
              lactationData={getAllLactationAnalysis}
              sccData={getAllSCCAnalysis}
              mastitisAlerts={mastitisAlerts}
            />
          </TabsContent>

          <TabsContent value="records">
            {/* Records Table */}
            <ProductionRecordsTable 
              type="milk" 
              records={records} 
              onDelete={canDelete ? deleteRecord : undefined} 
            />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Producción Lechera</CardTitle>
            <CardDescription>
              Registra producción por ordeño (mañana, tarde, noche), analiza curvas de producción,
              calidad de leche (grasa, proteína, CCS), ranking de mejores vacas y comparativos por período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && records.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Milk className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Comienza a registrar producción</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra la producción diaria de tus vacas para ver estadísticas y gráficos
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primera Producción
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AddMilkRecordDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSubmit={addRecord} 
      />

      <MilkExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        records={records}
      />

      <SmartImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        config={milkImportConfig}
        existingData={records}
        onImport={async (data) => {
          await importData(data);
          fetchRecords();
        }}
      />

    </DashboardLayout>
  );
};

export default ProduccionLeche;

