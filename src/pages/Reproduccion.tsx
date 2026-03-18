import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Plus, TrendingUp, Calendar, AlertTriangle, Baby, Upload, Download, Brain, CalendarClock } from 'lucide-react';
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
  const { females, bulls, events, stats, isLoading, addEvent, deleteEvent } = useReproduction();
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
              <TabsList>
              <TabsTrigger value="females">Hembras Reproductivas</TabsTrigger>
              <TabsTrigger value="events">Historial de Eventos</TabsTrigger>
              <TabsTrigger value="fertility">
                <Brain className="mr-1 h-4 w-4" />
                Análisis Fertilidad
              </TabsTrigger>
              <TabsTrigger value="automated">
                <CalendarClock className="mr-1 h-4 w-4" />
                Eventos Auto
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
    </DashboardLayout>
  );
};

export default Reproduccion;
