import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Plus, TrendingUp, Calendar, AlertTriangle, Baby, Upload, Download, Brain, CalendarClock, Syringe, FlaskConical, Beaker, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSemenInventory } from '@/hooks/useSemenInventory';
import { useReproduction } from '@/hooks/useReproduction';
import { useAnimals } from '@/hooks/useAnimals';
import { useFertilityAnalysis } from '@/hooks/useFertilityAnalysis';
import { useAutomatedEvents } from '@/hooks/useAutomatedEvents';
import { RegisterEventDialog } from '@/components/reproduccion/RegisterEventDialog';
import { ReproductiveTable } from '@/components/reproduccion/ReproductiveTable';
import { ReproductiveHistoryDialog } from '@/components/reproduccion/ReproductiveHistoryDialog';
import { ReproductiveAlerts } from '@/components/reproduccion/ReproductiveAlerts';
import { FertilityAnalysisCard } from '@/components/reproduccion/FertilityAnalysisCard';
import { AutomatedEventsCard } from '@/components/reproduccion/AutomatedEventsCard';
import { SmartImportDialog } from '@/components/shared/SmartImportDialog';
import { reproductionImportConfig } from '@/config/importConfigs';
import { useExportReproduction } from '@/hooks/useExportReproduction';
import { useImportReproduction } from '@/hooks/useImportReproduction';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const Reproduccion = () => {
  const { canWrite, canDelete } = useModulePermissions('reproduccion');
  const { females, bulls, events, stats, isLoading, addEvent, deleteEvent, getInseminationAlerts } = useReproduction();
  const { animals } = useAnimals();
  const { getAllFertilityAnalysis, herdStats } = useFertilityAnalysis(females, events);
  const { generatedEvents, urgentEvents, summary, completeEvent } = useAutomatedEvents(animals);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const { exportToExcel, exporting } = useExportReproduction();
  const { importData } = useImportReproduction();
  const [pedigreeData, setPedigreeData] = useState<{ motherName?: string; fatherName?: string }>({});

  const inseminationAlerts = getInseminationAlerts();
  const urgentInsemination = inseminationAlerts.filter(a => a && (a.status === 'en_celo' || a.status === 'proximo'));
  const { inventory: semenInventory, addLot: addSemenLot, deleteLot: deleteSemenLot, expirationAlerts: semenExpiring, lowStockAlerts: semenLowStock, totalDoses, loading: semenLoading } = useSemenInventory();
  const [showSemenDialog, setShowSemenDialog] = useState(false);
  const [semenForm, setSemenForm] = useState({ bull_name: '', bull_registration: '', breed: '', doses_available: '', doses_total: '', cost_per_dose: '', expiration_date: '', storage_location: '', notes: '' });

  const selectedAnimal = selectedAnimalId 
    ? females.find(f => f.id === selectedAnimalId) || null
    : null;

  // Cargar datos de pedigrí cuando se selecciona un animal
  useEffect(() => {
    const loadPedigree = async () => {
      if (!selectedAnimal) {
        setPedigreeData({});
        return;
      }

      const pedigree: { motherName?: string; fatherName?: string } = {};

      if (selectedAnimal.mother_id) {
        const { data: mother } = await supabase
          .from('animals')
          .select('tag_id, name')
          .eq('id', selectedAnimal.mother_id)
          .maybeSingle();
        if (mother) {
          pedigree.motherName = `${mother.tag_id}${mother.name ? ` - ${mother.name}` : ''}`;
        }
      }

      if (selectedAnimal.father_id) {
        const { data: father } = await supabase
          .from('animals')
          .select('tag_id, name')
          .eq('id', selectedAnimal.father_id)
          .maybeSingle();
        if (father) {
          pedigree.fatherName = `${father.tag_id}${father.name ? ` - ${father.name}` : ''}`;
        }
      }

      setPedigreeData(pedigree);
    };

    loadPedigree();
  }, [selectedAnimal]);

  const handleRegisterEvent = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setShowEventDialog(true);
  };

  const handleViewHistory = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setShowHistoryDialog(true);
  };

  const handleSelectFromAlert = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setShowHistoryDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reproducción</h1>
            <p className="text-muted-foreground">Gestión reproductiva y predicciones del hato</p>
          </div>
          <div className="flex gap-2">
            {canWrite && (
              <>
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </>
            )}
            <Button variant="outline" onClick={exportToExcel} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            {canWrite && (
              <Button onClick={() => {
                setSelectedAnimalId(null);
                setShowEventDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Evento
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Tasa de Preñez
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats.pregnancyRate}%</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pregnantCount} de {stats.totalFemales} hembras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Partos Esperados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.expectedBirthsThisMonth}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Días Abiertos Prom.
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-2xl font-bold ${stats.avgOpenDays > 150 ? 'text-red-600' : ''}`}>
                  {stats.avgOpenDays || '-'}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Partos Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-2xl font-bold ${stats.overdueCount > 0 ? 'text-red-600' : ''}`}>
                  {stats.overdueCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Baby className="h-4 w-4 text-purple-500" />
                Estado del Hato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {stats.pregnantCount} Preñ.
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {stats.servicedCount} Serv.
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    {stats.emptyCount} Vac.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tabla principal y alertas */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="females" className="space-y-4">
              <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="females">Hembras Reproductivas</TabsTrigger>
              <TabsTrigger value="inseminacion" className="relative">
                <Syringe className="mr-1 h-4 w-4" />
                Inseminación
                {urgentInsemination.length > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-red-500 text-white">{urgentInsemination.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events">Historial de Eventos</TabsTrigger>
              <TabsTrigger value="fertility">
                <Brain className="mr-1 h-4 w-4" />
                Análisis Fertilidad
              </TabsTrigger>
              <TabsTrigger value="automated">
                <CalendarClock className="mr-1 h-4 w-4" />
                Eventos Auto
              </TabsTrigger>
              <TabsTrigger value="semen" className="relative">
                <Beaker className="mr-1 h-4 w-4" />
                Semen
                {(semenExpiring.length + semenLowStock.length) > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-amber-500 text-white">{semenExpiring.length + semenLowStock.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

              <TabsContent value="females">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventario Reproductivo</CardTitle>
                    <CardDescription>
                      Gestiona el estado reproductivo de vacas y novillas. Registra celos, servicios, 
                      palpaciones y partos para cada animal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <ReproductiveTable
                        females={females}
                        events={events}
                        onRegisterEvent={handleRegisterEvent}
                        onViewHistory={handleViewHistory}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inseminacion">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Syringe className="h-5 w-5 text-pink-500" />
                      Predicción de Inseminación Óptima
                    </CardTitle>
                    <CardDescription>
                      Animales ordenados por proximidad al próximo celo (ciclo de {21} días).
                      Inseminar 10-14 horas después de detectar el celo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inseminationAlerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Syringe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay animales con eventos de celo registrados</p>
                        <p className="text-sm mt-2">Registra eventos de tipo "celo" para ver predicciones</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inseminationAlerts.map(alert => {
                          if (!alert) return null;
                          const statusColor = alert.status === 'en_celo'
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : alert.status === 'proximo'
                            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                            : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
                          const badgeColor = alert.status === 'en_celo'
                            ? 'bg-red-500 text-white'
                            : alert.status === 'proximo'
                            ? 'bg-amber-500 text-white'
                            : 'bg-green-500 text-white';
                          const daysText = alert.daysUntilNextCelo <= 0
                            ? `En celo ahora (hace ${Math.abs(alert.daysUntilNextCelo)} días)`
                            : alert.daysUntilNextCelo === 1
                            ? 'Mañana'
                            : `En ${alert.daysUntilNextCelo} días`;
                          return (
                            <div key={alert.animal_id} className={`flex items-center justify-between p-3 border rounded-lg ${statusColor}`}>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{alert.tag_id}</span>
                                  {alert.name && <span className="text-muted-foreground text-sm">({alert.name})</span>}
                                  <Badge className={`text-xs ${badgeColor}`}>
                                    {alert.status === 'en_celo' ? 'En celo' : alert.status === 'proximo' ? 'Próximo' : 'Normal'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Próximo celo: {alert.optimalWindow}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{daysText}</span>
                                {canWrite && (
                                  <Button size="sm" variant="outline" onClick={() => handleRegisterEvent(alert.animal_id)}>
                                    <Syringe className="h-3 w-3 mr-1" />
                                    Inseminar
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle>Eventos Recientes</CardTitle>
                    <CardDescription>
                      Historial de todos los eventos reproductivos registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay eventos reproductivos registrados</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setShowEventDialog(true)}
                        >
                          Registrar primer evento
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {events.slice(0, 100).map((event) => {
                          const animal = females.find(f => f.id === event.animal_id);
                          return (
                            <div 
                              key={event.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{animal?.tag_id || 'N/A'}</span>
                                  <span className="text-sm px-2 py-0.5 bg-muted rounded capitalize">
                                    {event.event_type}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(event.event_date).toLocaleDateString('es-ES')}
                                  {event.notes && ` - ${event.notes}`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fertility">
                <FertilityAnalysisCard 
                  allMetrics={getAllFertilityAnalysis}
                  herdStats={herdStats}
                />
              </TabsContent>

              <TabsContent value="automated">
                <AutomatedEventsCard
                  events={generatedEvents}
                  urgentEvents={urgentEvents}
                  summary={summary}
                  onComplete={completeEvent}
                />
              </TabsContent>

              <TabsContent value="semen">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Beaker className="h-5 w-5 text-blue-500" />
                          Inventario de Semen
                        </CardTitle>
                        <CardDescription>
                          {totalDoses} dosis disponibles en {semenInventory.length} lotes
                        </CardDescription>
                      </div>
                      {canWrite && (
                        <Button onClick={() => setShowSemenDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Lote
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(semenExpiring.length > 0 || semenLowStock.length > 0) && (
                      <div className="mb-4 space-y-2">
                        {semenExpiring.length > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {semenExpiring.length} lote(s) vencen en los próximos 90 días
                          </div>
                        )}
                        {semenLowStock.length > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {semenLowStock.length} lote(s) con menos de 5 dosis
                          </div>
                        )}
                      </div>
                    )}

                    {semenInventory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay lotes de semen registrados</p>
                        <p className="text-sm mt-1">Agrega lotes para controlar el inventario</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Toro</TableHead>
                            <TableHead>Raza</TableHead>
                            <TableHead className="text-right">Dosis Disp.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead className="text-right">Costo/Dosis</TableHead>
                            <TableHead>Ubicación</TableHead>
                            {canDelete && <TableHead className="w-10"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {semenInventory.map(lot => {
                            const isExpiring = semenExpiring.some(e => e.id === lot.id);
                            const isLow = semenLowStock.some(e => e.id === lot.id);
                            return (
                              <TableRow key={lot.id}>
                                <TableCell>
                                  <div>
                                    <span className="font-medium">{lot.bull_name}</span>
                                    {lot.bull_registration && <p className="text-xs text-muted-foreground">{lot.bull_registration}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>{lot.breed || '-'}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-medium ${isLow ? 'text-orange-600' : lot.doses_available > 10 ? 'text-green-600' : ''}`}>
                                    {lot.doses_available}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">{lot.doses_total}</TableCell>
                                <TableCell>
                                  {lot.expiration_date ? (
                                    <span className={isExpiring ? 'text-amber-600 font-medium' : ''}>
                                      {lot.expiration_date}
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {lot.cost_per_dose ? `$${lot.cost_per_dose.toLocaleString('es-CO')}` : '-'}
                                </TableCell>
                                <TableCell>{lot.storage_location || '-'}</TableCell>
                                {canDelete && (
                                  <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => deleteSemenLot(lot.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel de alertas */}
          <div className="space-y-6">
            <ReproductiveAlerts
              females={females}
              events={events}
              onSelectAnimal={handleSelectFromAlert}
            />

            {/* Indicadores adicionales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores Reproductivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Hembras</span>
                  <span className="font-medium">{stats.totalFemales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preñadas</span>
                  <span className="font-medium text-green-600">{stats.pregnantCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Servidas (sin confirmar)</span>
                  <span className="font-medium text-blue-600">{stats.servicedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vacías</span>
                  <span className="font-medium">{stats.emptyCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lactando</span>
                  <span className="font-medium text-purple-600">{stats.lactatingCount}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Alertas de Celo</span>
                  <span className="font-medium text-pink-600">{stats.heatAlerts}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RegisterEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        females={females}
        bulls={bulls}
        onSubmit={addEvent}
        defaultAnimalId={selectedAnimalId || undefined}
      />

      <ReproductiveHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        animal={selectedAnimal}
        events={events}
        onDeleteEvent={deleteEvent}
        motherName={pedigreeData.motherName}
        fatherName={pedigreeData.fatherName}
      />

      <SmartImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        config={reproductionImportConfig}
        existingData={events}
        onImport={importData}
      />

      {/* Semen Lot Dialog */}
      <Dialog open={showSemenDialog} onOpenChange={setShowSemenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              Agregar Lote de Semen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre del Toro *</Label>
                <Input
                  value={semenForm.bull_name}
                  onChange={e => setSemenForm(p => ({ ...p, bull_name: e.target.value }))}
                  placeholder="Ej: Turbo 1234"
                />
              </div>
              <div className="space-y-1">
                <Label>Registro</Label>
                <Input
                  value={semenForm.bull_registration}
                  onChange={e => setSemenForm(p => ({ ...p, bull_registration: e.target.value }))}
                  placeholder="No. registro"
                />
              </div>
              <div className="space-y-1">
                <Label>Raza</Label>
                <Input
                  value={semenForm.breed}
                  onChange={e => setSemenForm(p => ({ ...p, breed: e.target.value }))}
                  placeholder="Ej: Holstein"
                />
              </div>
              <div className="space-y-1">
                <Label>Dosis Disponibles *</Label>
                <Input
                  type="number"
                  min="0"
                  value={semenForm.doses_available}
                  onChange={e => setSemenForm(p => ({ ...p, doses_available: e.target.value }))}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                <Label>Dosis Totales</Label>
                <Input
                  type="number"
                  min="0"
                  value={semenForm.doses_total}
                  onChange={e => setSemenForm(p => ({ ...p, doses_total: e.target.value }))}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                <Label>Costo por Dosis</Label>
                <Input
                  type="number"
                  min="0"
                  value={semenForm.cost_per_dose}
                  onChange={e => setSemenForm(p => ({ ...p, cost_per_dose: e.target.value }))}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  value={semenForm.expiration_date}
                  onChange={e => setSemenForm(p => ({ ...p, expiration_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Ubicación (tanque/nitrógeno)</Label>
                <Input
                  value={semenForm.storage_location}
                  onChange={e => setSemenForm(p => ({ ...p, storage_location: e.target.value }))}
                  placeholder="Tanque A, gaveta 2"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Notas</Label>
                <Input
                  value={semenForm.notes}
                  onChange={e => setSemenForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSemenDialog(false)}>Cancelar</Button>
            <Button
              disabled={!semenForm.bull_name || !semenForm.doses_available}
              onClick={async () => {
                await addSemenLot({
                  bull_name: semenForm.bull_name,
                  bull_registration: semenForm.bull_registration || undefined,
                  breed: semenForm.breed || undefined,
                  doses_available: parseInt(semenForm.doses_available) || 0,
                  doses_total: parseInt(semenForm.doses_total) || parseInt(semenForm.doses_available) || 0,
                  cost_per_dose: semenForm.cost_per_dose ? parseFloat(semenForm.cost_per_dose) : undefined,
                  expiration_date: semenForm.expiration_date || undefined,
                  storage_location: semenForm.storage_location || undefined,
                  notes: semenForm.notes || undefined,
                });
                setSemenForm({ bull_name: '', bull_registration: '', breed: '', doses_available: '', doses_total: '', cost_per_dose: '', expiration_date: '', storage_location: '', notes: '' });
                setShowSemenDialog(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reproduccion;
