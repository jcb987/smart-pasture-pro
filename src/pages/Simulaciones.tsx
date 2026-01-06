import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Play, RotateCcw, Save, Sparkles, Calculator } from 'lucide-react';
import { useSimulations } from '@/hooks/useSimulations';
import { SimulationControls } from '@/components/simulaciones/SimulationControls';
import { SimulationChart } from '@/components/simulaciones/SimulationChart';
import { SimulationResultsCard } from '@/components/simulaciones/SimulationResults';
import { ScenarioComparison } from '@/components/simulaciones/ScenarioComparison';
import { PresetScenarios } from '@/components/simulaciones/PresetScenarios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const Simulaciones = () => {
  const {
    scenarios,
    currentVariables,
    setCurrentVariables,
    baselineMetrics,
    loading,
    runSimulation,
    createScenario,
    deleteScenario,
    compareScenarios,
    getPresetScenarios,
    DEFAULT_VARIABLES,
  } = useSimulations();

  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  // Run simulation with current variables
  const results = useMemo(() => {
    return runSimulation(currentVariables);
  }, [currentVariables, baselineMetrics]);

  // Get comparison scenario data
  const comparisonScenario = useMemo(() => {
    if (comparisonIds.length === 2) {
      const [, secondId] = comparisonIds;
      return scenarios.find(s => s.id === secondId);
    }
    return null;
  }, [comparisonIds, scenarios]);

  const handleReset = () => {
    setCurrentVariables(DEFAULT_VARIABLES);
    setComparisonIds([]);
    toast({ title: 'Variables reiniciadas', description: 'Se han restaurado los valores por defecto' });
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast({ title: 'Error', description: 'Ingresa un nombre para el escenario', variant: 'destructive' });
      return;
    }

    createScenario(scenarioName, scenarioDescription, currentVariables);
    setSaveDialogOpen(false);
    setScenarioName('');
    setScenarioDescription('');
    toast({ title: 'Escenario guardado', description: `"${scenarioName}" ha sido guardado para comparación` });
  };

  const handleCompare = (ids: string[]) => {
    setComparisonIds(ids);
    const scenario = scenarios.find(s => s.id === ids[0]);
    if (scenario) {
      setCurrentVariables(scenario.variables);
    }
    toast({ title: 'Comparando escenarios', description: 'El escenario seleccionado se ha cargado' });
  };

  const presets = getPresetScenarios();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Simulaciones</h1>
            <p className="text-muted-foreground">Herramienta de decisión - ¿Qué pasaría si...?</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
            <Button onClick={() => setSaveDialogOpen(true)}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Escenario
            </Button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Escenarios Guardados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarios.length}</div>
              <p className="text-xs text-muted-foreground">para comparar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Variables Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(currentVariables).filter((v, i) => v !== Object.values(DEFAULT_VARIABLES)[i]).length}
              </div>
              <p className="text-xs text-muted-foreground">modificadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Horizonte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentVariables.projectionMonths}</div>
              <p className="text-xs text-muted-foreground">meses proyectados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Animales Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{baselineMetrics?.totalAnimals || 0}</div>
              <p className="text-xs text-muted-foreground">en el hato actual</p>
            </CardContent>
          </Card>
        </div>

        {/* No data warning */}
        {(!baselineMetrics || baselineMetrics.totalAnimals === 0) && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-700">Datos insuficientes</p>
                  <p className="text-sm text-amber-600">
                    Registra animales, producción y costos para obtener simulaciones más precisas. 
                    Por ahora se usarán valores estimados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preset Scenarios */}
        <PresetScenarios presets={presets} onSelect={setCurrentVariables} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Controls */}
          <SimulationControls variables={currentVariables} onChange={setCurrentVariables} />

          {/* Results Summary */}
          <SimulationResultsCard results={results} baseline={baselineMetrics} />
        </div>

        {/* Charts */}
        <SimulationChart
          data={results.monthlyData}
          comparisonData={comparisonScenario?.results.monthlyData}
          comparisonLabel={comparisonScenario?.name}
        />

        {/* Saved Scenarios Comparison */}
        <ScenarioComparison
          scenarios={scenarios}
          onDelete={deleteScenario}
          onCompare={handleCompare}
        />

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Acerca del Motor de Simulaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                Esta herramienta te permite evaluar escenarios antes de tomar decisiones importantes en tu finca:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                <li>✔ Simula cambios en producción de leche y carne</li>
                <li>✔ Proyecta el impacto de variaciones en costos de alimentación y salud</li>
                <li>✔ Evalúa diferentes tasas de mortalidad, descarte y reemplazo</li>
                <li>✔ Compara escenarios optimistas, pesimistas y de crisis</li>
                <li>✔ Visualiza resultados en gráficas comparativas</li>
                <li>✔ Guarda escenarios para análisis posterior</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Nota:</strong> Los resultados son proyecciones basadas en tus datos actuales y las variables que configures. 
                Úsalos como guía para la toma de decisiones, no como predicciones exactas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Scenario Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Escenario</DialogTitle>
            <DialogDescription>
              Dale un nombre a este escenario para guardarlo y compararlo con otros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del escenario</Label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Ej: Escenario optimista 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="Ej: Aumento de producción con reducción de costos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveScenario}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Simulaciones;
