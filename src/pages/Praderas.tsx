import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Sprout, Plus, MapPin, Sun, Ruler, Trees, 
  RotateCcw, CheckCircle, Clock, Sparkles
} from 'lucide-react';
import { usePaddocks } from '@/hooks/usePaddocks';
import { AddPaddockDialog } from '@/components/praderas/AddPaddockDialog';
import { StartRotationDialog } from '@/components/praderas/StartRotationDialog';
import { AddMeasurementDialog } from '@/components/praderas/AddMeasurementDialog';
import { PaddocksGrid, RotationHistoryTable, MeasurementsTable } from '@/components/praderas/PaddockComponents';
import { PraderasAIAssistant } from '@/components/praderas/PraderasAIAssistant';

const Praderas = () => {
  const [showPaddockDialog, setShowPaddockDialog] = useState(false);
  const [showRotationDialog, setShowRotationDialog] = useState(false);
  const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedPaddockForRotation, setSelectedPaddockForRotation] = useState<string | null>(null);

  const {
    paddocks,
    rotations,
    measurements,
    loading,
    addPaddock,
    updatePaddock,
    deletePaddock,
    startRotation,
    endRotation,
    addMeasurement,
    deleteMeasurement,
    getStats,
    getRestAlerts,
    GRASS_TYPES,
  } = usePaddocks();

  const stats = getStats();
  const readyPaddocks = getRestAlerts();
  const activeRotations = rotations.filter(r => !r.exit_date);

  const handleStartRotation = (paddockId: string) => {
    setSelectedPaddockForRotation(paddockId);
    setShowRotationDialog(true);
  };

  const handleEndRotation = async (paddockId: string) => {
    const activeRotation = rotations.find(r => r.paddock_id === paddockId && !r.exit_date);
    if (activeRotation) {
      await endRotation(activeRotation.id, {
        exit_date: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Praderas y Forraje</h1>
            <p className="text-muted-foreground">Administración de potreros y rotación de pasturas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Sheet open={showAIAssistant} onOpenChange={setShowAIAssistant}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <Sparkles className="h-4 w-4" />
                  Ayuda IA
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0">
                <PraderasAIAssistant
                  paddocksCount={stats.totalPaddocks}
                  totalHectares={stats.totalHectares}
                  totalAnimalsInPasture={stats.totalAnimalsInPasture}
                  occupiedPaddocks={stats.occupiedPaddocks}
                  availablePaddocks={stats.availablePaddocks}
                  onClose={() => setShowAIAssistant(false)}
                />
              </SheetContent>
            </Sheet>
            <Button variant="outline" onClick={() => setShowMeasurementDialog(true)}>
              <Ruler className="mr-2 h-4 w-4" />
              Nuevo Aforo
            </Button>
            <Button variant="outline" onClick={() => setShowRotationDialog(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Iniciar Rotación
            </Button>
            <Button onClick={() => setShowPaddockDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Potrero
            </Button>
          </div>
        </div>

        {/* Ready for use alerts */}
        {readyPaddocks.length > 0 && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Potreros Listos para Uso</AlertTitle>
            <AlertDescription className="text-green-700">
              {readyPaddocks.length} potrero(s) han completado su período de descanso: {' '}
              {readyPaddocks.map(p => p.name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Potreros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPaddocks}</div>
              <p className="text-xs text-muted-foreground">Total registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trees className="h-4 w-4 text-green-600" />
                Hectáreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHectares.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Área total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sun className="h-4 w-4 text-blue-600" />
                Ocupados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.occupiedPaddocks}</div>
              <p className="text-xs text-muted-foreground">Con animales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                En Descanso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.restingPaddocks}</div>
              <p className="text-xs text-muted-foreground">Recuperándose</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availablePaddocks}</div>
              <p className="text-xs text-muted-foreground">Listos para uso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" />
                Prom. Descanso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRestDays.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Días promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary" />
                En Pastoreo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnimalsInPasture}</div>
              <p className="text-xs text-muted-foreground">Animales</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="paddocks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="paddocks">Potreros</TabsTrigger>
            <TabsTrigger value="history">Historial Rotaciones</TabsTrigger>
            <TabsTrigger value="measurements">Aforos</TabsTrigger>
          </TabsList>

          <TabsContent value="paddocks" className="space-y-4">
            <PaddocksGrid 
              paddocks={paddocks}
              onDelete={deletePaddock}
              onStartRotation={handleStartRotation}
              onEndRotation={handleEndRotation}
              activeRotations={activeRotations}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <RotationHistoryTable rotations={rotations} />
          </TabsContent>

          <TabsContent value="measurements" className="space-y-4">
            <MeasurementsTable 
              measurements={measurements}
              onDelete={deleteMeasurement}
            />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Praderas</CardTitle>
            <CardDescription>
              Registro de potreros con días de descanso/ocupación, capacidad de carga por potrero,
              aforos manuales y estimaciones del potencial del forraje, e historial completo de uso
              de praderas. Facilita la rotación de potreros y planificación forrajera.
            </CardDescription>
          </CardHeader>
          {loading && paddocks.length === 0 && (
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <AddPaddockDialog
        open={showPaddockDialog}
        onOpenChange={setShowPaddockDialog}
        onSubmit={addPaddock}
        grassTypes={GRASS_TYPES}
      />

      <StartRotationDialog
        open={showRotationDialog}
        onOpenChange={setShowRotationDialog}
        onSubmit={startRotation}
        paddocks={paddocks}
      />

      <AddMeasurementDialog
        open={showMeasurementDialog}
        onOpenChange={setShowMeasurementDialog}
        onSubmit={addMeasurement}
        paddocks={paddocks}
      />
    </DashboardLayout>
  );
};

export default Praderas;
