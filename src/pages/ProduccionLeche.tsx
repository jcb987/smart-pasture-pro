import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Plus, TrendingUp, Award, Droplets, FlaskConical, Activity, Download, Upload, MoonStar, AlertTriangle } from 'lucide-react';
import { useMilkProduction } from '@/hooks/useMilkProduction';
import { useAnimals } from '@/hooks/useAnimals';
import { useReproduction } from '@/hooks/useReproduction';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProduccionLeche = () => {
  const { canWrite, canDelete } = useModulePermissions('produccion-leche');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [rankingPeriod, setRankingPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [curveDays, setCurveDays] = useState<30 | 60 | 90>(30);
  const { importData } = useImportMilk();
  
  const {
    records,
    loading,
    addRecord,
    deleteRecord,
    getStats,
    getRankings,
    getProductionCurve,
    getDryCowAlerts,
    getQualityStats,
    fetchRecords,
  } = useMilkProduction();
  const { animals } = useAnimals();
  const { addEvent: addReproEvent } = useReproduction();

  const stats = getStats();
  const rankings = getRankings(rankingPeriod);
  const productionCurve = getProductionCurve(undefined, curveDays);
  const dryCowAlerts = getDryCowAlerts(animals as any);
  const qualityStats = getQualityStats();
  const urgentDryCow = dryCowAlerts.filter(a => a.status === 'vencido' || a.status === 'urgente');

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="lactation">
              <Activity className="mr-1 h-4 w-4" />
              Curvas Lactancia
            </TabsTrigger>
            <TabsTrigger value="dry" className="relative">
              <MoonStar className="mr-1 h-4 w-4" />
              Período Seco
              {urgentDryCow.length > 0 && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-amber-500 text-white">{urgentDryCow.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quality">
              <FlaskConical className="mr-1 h-4 w-4" />
              Calidad
              {qualityStats.ccsAlertCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-red-500 text-white">{qualityStats.ccsAlertCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="records">Registros</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts and Rankings */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium">Curva de Producción</span>
                  <div className="flex gap-1">
                    {([30, 60, 90] as const).map(d => (
                      <Button
                        key={d}
                        variant={curveDays === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurveDays(d)}
                      >
                        {d}d
                      </Button>
                    ))}
                  </div>
                </div>
                <ProductionChart
                  data={productionCurve}
                  title={`Últimos ${curveDays} días`}
                  unit=" L"
                  color="hsl(var(--primary))"
                />
              </div>
              
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

          <TabsContent value="dry">
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Secado Vencido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dryCowAlerts.filter(a => a.status === 'vencido').length}</div>
                    <p className="text-xs text-muted-foreground">Debieron secarse ya</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-600">Urgente (≤7 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{dryCowAlerts.filter(a => a.status === 'urgente').length}</div>
                    <p className="text-xs text-muted-foreground">Secar esta semana</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Programadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dryCowAlerts.filter(a => a.status === 'programado').length}</div>
                    <p className="text-xs text-muted-foreground">Próximamente</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MoonStar className="h-5 w-5 text-blue-500" />
                    Vacas a Secar
                  </CardTitle>
                  <CardDescription>
                    Se recomienda secar 60 días antes del parto para una lactancia óptima
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dryCowAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MoonStar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay vacas preñadas con fecha de parto registrada</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Arete</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Fecha Parto</TableHead>
                          <TableHead>Fecha Secado</TableHead>
                          <TableHead className="text-right">Días para Secar</TableHead>
                          <TableHead>Estado</TableHead>
                          {canWrite && <TableHead className="w-32">Acción</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dryCowAlerts.map(alert => (
                          <TableRow key={alert.animal_id}>
                            <TableCell className="font-medium">{alert.tag_id}</TableCell>
                            <TableCell>{alert.name || '-'}</TableCell>
                            <TableCell>{alert.expected_calving_date}</TableCell>
                            <TableCell>{alert.dry_date}</TableCell>
                            <TableCell className="text-right">
                              {alert.daysUntilDry < 0
                                ? <span className="text-red-600 font-semibold">{Math.abs(alert.daysUntilDry)}d atrasado</span>
                                : <span>{alert.daysUntilDry}d</span>}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                alert.status === 'vencido' ? 'bg-red-500 text-white' :
                                alert.status === 'urgente' ? 'bg-amber-500 text-white' :
                                'bg-green-500 text-white'
                              }>
                                {alert.status === 'vencido' ? 'Vencido' : alert.status === 'urgente' ? 'Urgente' : 'Programado'}
                              </Badge>
                            </TableCell>
                            {canWrite && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addReproEvent({
                                    animal_id: alert.animal_id,
                                    event_type: 'secado',
                                    event_date: new Date().toISOString().split('T')[0],
                                    notes: 'Secado registrado desde módulo de leche',
                                  })}
                                >
                                  Registrar Secado
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quality">
            <div className="space-y-4">
              {/* Quality KPIs */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CCS Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${qualityStats.avgCCS > 400000 ? 'text-red-600' : qualityStats.avgCCS > 200000 ? 'text-amber-600' : 'text-green-600'}`}>
                      {qualityStats.avgCCS > 0 ? `${(qualityStats.avgCCS / 1000).toFixed(0)}k` : '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">células/mL (umbral: 400k)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Grasa Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityStats.avgFat > 0 ? `${qualityStats.avgFat.toFixed(2)}%` : '--'}</div>
                    <p className="text-xs text-muted-foreground">Últimos 30 días</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Proteína Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{qualityStats.avgProtein > 0 ? `${qualityStats.avgProtein.toFixed(2)}%` : '--'}</div>
                    <p className="text-xs text-muted-foreground">Últimos 30 días</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Riesgo Mastitis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{qualityStats.highCCSAnimals.length}</div>
                    <p className="text-xs text-muted-foreground">Animales con CCS {'>'} 400k</p>
                  </CardContent>
                </Card>
              </div>

              {/* CCS Trend Chart */}
              {qualityStats.ccsTrend.some(d => d.avgCCS !== null) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tendencia CCS — Últimos 30 días</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={qualityStats.ccsTrend.filter(d => d.avgCCS !== null)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString()} cel/mL`, 'CCS']} labelFormatter={(l) => `Fecha: ${l}`} />
                        <Line type="monotone" dataKey="avgCCS" stroke="#ef4444" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block"></span> {'<'}200k: Excelente</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block"></span> 200-400k: Aceptable</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block"></span> {'>'}400k: Penalización</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* High CCS Animals */}
              {qualityStats.highCCSAnimals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Animales con CCS Alto — Riesgo de Mastitis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Arete</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="text-right">CCS</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qualityStats.highCCSAnimals.map(a => (
                          <TableRow key={a.animal_id}>
                            <TableCell className="font-medium">{a.tag_id}</TableCell>
                            <TableCell>{a.name || '-'}</TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              {a.ccs.toLocaleString()} cel/mL
                            </TableCell>
                            <TableCell>{a.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-xs text-muted-foreground mt-3">
                      * CCS mayor a 400,000 cel/mL puede generar penalizaciones en precio. Considerar tratamiento preventivo.
                    </p>
                  </CardContent>
                </Card>
              )}

              {qualityStats.avgCCS === 0 && qualityStats.highCCSAnimals.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de calidad registrados</p>
                    <p className="text-sm mt-2">Al registrar producción, incluye CCS, grasa y proteína para ver estadísticas de calidad</p>
                  </CardContent>
                </Card>
              )}
            </div>
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
          try {
            await importData(data);
            setActiveTab('records');
          } finally {
            await fetchRecords();
          }
        }}
      />

    </DashboardLayout>
  );
};

export default ProduccionLeche;

