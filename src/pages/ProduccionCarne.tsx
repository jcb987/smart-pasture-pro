import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Drumstick, Plus, Scale, TrendingUp, Target, Award, Upload, Download } from 'lucide-react';
import { useWeightRecords, MeatStats } from '@/hooks/useWeightRecords';
import { AddWeightRecordDialog } from '@/components/produccion/AddWeightRecordDialog';
import { ProductionChart } from '@/components/produccion/ProductionChart';
import { RankingTable } from '@/components/produccion/RankingTable';
import { ProductionRecordsTable } from '@/components/produccion/ProductionRecordsTable';
import { SmartImportDialog } from '@/components/shared/SmartImportDialog';
import { meatImportConfig } from '@/config/importConfigs';
import { useExportMeat } from '@/hooks/useExportMeat';
import { useImportMeat } from '@/hooks/useImportMeat';

const ProduccionCarne = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { exportToExcel, exporting } = useExportMeat();
  const { importData } = useImportMeat();
  const [stats, setStats] = useState<MeatStats>({
    animalsInFattening: 0,
    avgWeight: 0,
    avgDailyGain: 0,
    readyForSale: 0,
    totalWeightGainMonth: 0,
  });

  const { 
    records, 
    loading, 
    addRecord, 
    deleteRecord, 
    getStats, 
    getRankings,
  } = useWeightRecords();

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();
  }, [records]);

  const rankings = getRankings();

  const rankingItems = rankings.map((r, i) => ({
    position: i + 1,
    tag_id: r.tag_id,
    name: r.name,
    value: r.avg_daily_gain,
    secondary: r.total_gain,
    unit: 'g/día',
    secondaryUnit: 'kg',
  }));

  // Create weight trend data from records
  const weightTrend = (() => {
    const last30Days: { date: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayRecords = records.filter(r => r.weight_date === date);
      const avgWeight = dayRecords.length > 0 
        ? dayRecords.reduce((sum, r) => sum + r.weight_kg, 0) / dayRecords.length 
        : 0;
      last30Days.push({ date, total: avgWeight });
    }
    return last30Days.filter(d => d.total > 0);
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Producción de Carne</h1>
            <p className="text-muted-foreground">Seguimiento de crecimiento y engorde</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" onClick={exportToExcel} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Peso
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Drumstick className="h-4 w-4 text-primary" />
                Animales en Engorde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.animalsInFattening}</div>
              <p className="text-xs text-muted-foreground">Novillos, novillas, terneros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                GDP Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDailyGain.toFixed(0)} g/día</div>
              <p className="text-xs text-muted-foreground">Ganancia diaria de peso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Peso Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgWeight.toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground">Animales en engorde</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Listos para Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readyForSale}</div>
              <p className="text-xs text-muted-foreground">Peso ≥ 450 kg</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Rankings */}
        <div className="grid gap-6 lg:grid-cols-2">
          {weightTrend.length > 0 ? (
            <ProductionChart 
              data={weightTrend} 
              title="Peso Promedio (Pesajes recientes)" 
              unit=" kg"
              type="bar"
              color="hsl(var(--primary))"
            />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Curva de Crecimiento</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[250px] border-2 border-dashed border-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Registra pesos para ver la curva</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="font-medium">Mejores Ganancias de Peso</span>
            </div>
            <RankingTable 
              title="Top GDP - Histórico"
              items={rankingItems}
              valueLabel="GDP"
              secondaryLabel="Ganancia Total"
            />
          </div>
        </div>

        {/* Records Table */}
        <ProductionRecordsTable 
          type="weight" 
          records={records} 
          onDelete={deleteRecord} 
        />

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Control de Crecimiento</CardTitle>
            <CardDescription>
              Registra pesos individuales y por lote, ganancia diaria de peso (g/día),
              curvas de crecimiento, condición corporal, y rentabilidad por animal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && records.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Drumstick className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Comienza a registrar pesos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra el peso de tus animales para calcular ganancias diarias y ver curvas de crecimiento
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primer Peso
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AddWeightRecordDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSubmit={addRecord} 
      />

      <SmartImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        config={meatImportConfig}
        existingData={records}
        onImport={importData}
      />
    </DashboardLayout>
  );
};

export default ProduccionCarne;
  );
};

export default ProduccionCarne;
