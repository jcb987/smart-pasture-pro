import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LineChart, RotateCcw, Save, Sparkles, AlertCircle, Settings, CheckCircle2 } from 'lucide-react';
import { useSimulations } from '@/hooks/useSimulations';
import { SimulationControls } from '@/components/simulaciones/SimulationControls';
import { SimulationChart } from '@/components/simulaciones/SimulationChart';
import { SimulationResultsCard } from '@/components/simulaciones/SimulationResults';
import { ScenarioComparison } from '@/components/simulaciones/ScenarioComparison';
import { PresetScenarios } from '@/components/simulaciones/PresetScenarios';
import { BaseDataSurvey, BaseDataConfig } from '@/components/simulaciones/BaseDataSurvey';
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
    baseDataConfig,
    existingDataStatus,
    loading,
    isConfigured,
    runSimulation,
    createScenario,
    deleteScenario,
    compareScenarios,
    getPresetScenarios,
    configureBaseData,
    resetConfiguration,
    validateSimulation,
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
  }, [currentVariables, runSimulation]);

  // Get comparison scenario data
  const comparisonScenario = useMemo(() => {
    if (comparisonIds.length === 2) {
      const [, secondId] = comparisonIds;
      return scenarios.find(s => s.id === secondId);
    }
    return null;
  }, [comparisonIds, scenarios]);

  const validation = validateSimulation();

  const handleReset = () => {
    setCurrentVariables(DEFAULT_VARIABLES);
    setComparisonIds([]);
    toast({ title: 'Variables reiniciadas', description: 'Se han restaurado los valores por defecto' });
  };

  const handleResetConfig = () => {
    resetConfiguration();
    toast({ title: 'Configuración reiniciada', description: 'Debes completar la encuesta nuevamente' });
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast({ title: 'Error', description: 'Ingresa un nombre para el escenario', variant: 'destructive' });
      return;
    }

    if (!validation.isValid) {
      toast({ title: 'Error', description: 'No se puede guardar: faltan datos base', variant: 'destructive' });
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

  const handleConfigComplete = (config: BaseDataConfig) => {
    configureBaseData(config);
    toast({ 
      title: 'Configuración completada', 
      description: 'Ya puedes comenzar a simular escenarios con datos reales' 
    });
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

  // Show configuration survey if not configured
  if (!isConfigured) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Simulaciones</h1>
            <p className="text-muted-foreground">Herramienta de decisión - ¿Qué pasaría si...?</p>
          </div>

          {/* No animals warning */}
          {(!baselineMetrics || baselineMetrics.totalAnimals === 0) && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">No hay animales registrados</p>
                    <p className="text-sm text-muted-foreground">
                      Registra al menos un animal en el módulo de Animales antes de usar simulaciones.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration Survey */}
          {existingDataStatus && (
            <BaseDataSurvey 
              existingData={existingDataStatus}
              onComplete={handleConfigComplete}
            />
          )}

          {/* Info about data sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                ¿Por qué necesitamos estos datos?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Para generar simulaciones <strong>confiables y auditables</strong>, necesitamos información real de tu operación:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>✔ <strong>Precios de venta:</strong> Para calcular ingresos proyectados</li>
                  <li>✔ <strong>Costos operativos:</strong> Para determinar rentabilidad real</li>
                  <li>✔ <strong>Producción actual:</strong> Como base para proyecciones</li>
                  <li>✔ <strong>Horizonte:</strong> Para definir el período de análisis</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Garantía:</strong> Ningún resultado se genera con datos aleatorios o estimados. 
                  Todo proviene de la información que ingresas o de tus registros existentes.
                </p>
              </div>
            </CardContent>
          </Card>
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleResetConfig}>
              <Settings className="mr-2 h-4 w-4" />
              Reconfigurar
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
            <Button onClick={() => setSaveDialogOpen(true)} disabled={!validation.isValid}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Escenario
            </Button>
          </div>
        </div>

        {/* Configuration Summary */}
        {baseDataConfig && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Configuración activa</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {baseDataConfig.productionType === 'lecheria' ? 'Lechería' : 
                       baseDataConfig.productionType === 'carne' ? 'Carne' : 'Doble Propósito'} • 
                      {baseDataConfig.projectionMonths} meses • 
                      {baseDataConfig.currency}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {baseDataConfig.milkPricePerLiter > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Leche: ${baseDataConfig.milkPricePerLiter.toLocaleString()}/L
                    </Badge>
                  )}
                  {baseDataConfig.meatPricePerKg > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Carne: ${baseDataConfig.meatPricePerKg.toLocaleString()}/kg
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Validation warnings */}
        {validation.warnings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Avisos</p>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 mt-1 space-y-0.5">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
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
        {results.monthlyData.length > 0 && (
          <SimulationChart
            data={results.monthlyData}
            comparisonData={comparisonScenario?.results.monthlyData}
            comparisonLabel={comparisonScenario?.name}
          />
        )}

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
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Garantía de precisión:</strong> Todos los cálculos se basan exclusivamente en los datos que ingresaste 
                  en la configuración base y en tus registros del sistema. No se utilizan valores aleatorios ni estimaciones.
                </p>
              </div>
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
