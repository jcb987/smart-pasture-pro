import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaleSimulator } from "@/hooks/useSaleSimulator";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Weight, 
  Calculator,
  Sparkles,
  Save,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

export const SaleSimulatorTab = () => {
  const { lots, animals, calculateSimulation, createSimulation, simulations } = useSaleSimulator();
  
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("500");
  const [marketPrice, setMarketPrice] = useState<string>("8500");
  const [dailyGain, setDailyGain] = useState<string>("0.7");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationName, setSimulationName] = useState<string>("");

  const runSimulation = () => {
    const result = calculateSimulation({
      lotName: selectedLot || undefined,
      targetWeight: Number(targetWeight),
      marketPricePerKg: Number(marketPrice),
      dailyGainKg: Number(dailyGain),
    });
    setSimulationResult(result);
  };

  const saveSimulation = () => {
    if (!simulationResult || !simulationName) return;
    
    createSimulation.mutate({
      simulation_name: simulationName,
      lot_name: selectedLot || undefined,
      animal_ids: [],
      current_avg_weight: simulationResult.currentAvgWeight,
      target_weight: simulationResult.targetWeight,
      projected_sale_date: simulationResult.projectedSaleDate,
      market_price_per_kg: simulationResult.marketPricePerKg,
      total_animals: simulationResult.totalAnimals,
      projected_revenue: simulationResult.projectedRevenue,
      projected_costs: simulationResult.projectedCosts,
      projected_profit: simulationResult.projectedProfit,
      profit_margin_percentage: simulationResult.profitMarginPercentage,
    });
    
    setSimulationName("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Simulador de Ventas
          </CardTitle>
          <CardDescription>
            Proyecta ingresos y determina la fecha óptima de venta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lot Selection */}
          <div className="space-y-2">
            <Label>Lote a Simular</Label>
            <Select value={selectedLot} onValueChange={setSelectedLot}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un lote o todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los animales</SelectItem>
                {lots.map((lot) => (
                  <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Peso Objetivo (kg)
              </Label>
              <Input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Precio/kg (COP)
              </Label>
              <Input
                type="number"
                value={marketPrice}
                onChange={(e) => setMarketPrice(e.target.value)}
                placeholder="8500"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ganancia Diaria (kg/día)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={dailyGain}
                onChange={(e) => setDailyGain(e.target.value)}
                placeholder="0.7"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={runSimulation} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Calcular Proyección
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSimulationResult(null)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className={cn(
        "transition-all",
        simulationResult ? "border-primary/50" : "border-dashed"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resultados de la Simulación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {simulationResult ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Animales</p>
                  <p className="text-2xl font-bold">{simulationResult.totalAnimals}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Peso Promedio Actual</p>
                  <p className="text-2xl font-bold">{simulationResult.currentAvgWeight.toFixed(0)} kg</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Óptima de Venta</p>
                    <p className="text-xl font-bold">
                      {format(new Date(simulationResult.projectedSaleDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-sm text-blue-500">
                      En {simulationResult.daysToTarget} días
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Projection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                  <span className="text-muted-foreground">Ingresos Proyectados</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(simulationResult.projectedRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10">
                  <div>
                    <span className="text-muted-foreground">Costos Estimados</span>
                    {simulationResult.usingFallbackCost && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        ⚠ Usando estimado (15.000 COP/día) — registra costos reales para mayor precisión
                      </p>
                    )}
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(simulationResult.projectedCosts)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                  <span className="font-medium">Utilidad Proyectada</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(simulationResult.projectedProfit)}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Margen: {simulationResult.profitMarginPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Simulation */}
              <div className="flex gap-3">
                <Input
                  placeholder="Nombre de la simulación"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                />
                <Button 
                  onClick={saveSimulation}
                  disabled={!simulationName || createSimulation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calculator className="h-16 w-16 mb-4 opacity-20" />
              <p>Configura los parámetros y ejecuta la simulación</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Simulations */}
      {simulations.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Simulaciones Guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simulations.slice(0, 6).map((sim) => (
                <div 
                  key={sim.id} 
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <p className="font-medium truncate">{sim.simulation_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sim.total_animals} animales • {sim.lot_name || 'Todos'}
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {formatCurrency(Number(sim.projected_profit))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sim.created_at), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
