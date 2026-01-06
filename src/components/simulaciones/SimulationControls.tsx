import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimulationVariables } from '@/hooks/useSimulations';
import { Milk, Beef, DollarSign, Users, Baby, Calendar } from 'lucide-react';

interface SimulationControlsProps {
  variables: SimulationVariables;
  onChange: (variables: SimulationVariables) => void;
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  description?: string;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label className="text-sm font-medium">{label}</Label>
      <span className={`text-sm font-bold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      className="w-full"
    />
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

export const SimulationControls = ({ variables, onChange }: SimulationControlsProps) => {
  const updateVariable = (key: keyof SimulationVariables, value: number) => {
    onChange({ ...variables, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Variables de Simulación
        </CardTitle>
        <CardDescription>
          Ajusta los parámetros para simular diferentes escenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="production" className="text-xs">
              <Milk className="h-3 w-3 mr-1" />
              Producción
            </TabsTrigger>
            <TabsTrigger value="costs" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Costos
            </TabsTrigger>
            <TabsTrigger value="herd" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Hato
            </TabsTrigger>
            <TabsTrigger value="repro" className="text-xs">
              <Baby className="h-3 w-3 mr-1" />
              Reproducción
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="space-y-6 mt-4">
            <SliderControl
              label="Producción de Leche"
              value={variables.milkProductionChange}
              min={-50}
              max={50}
              onChange={(v) => updateVariable('milkProductionChange', v)}
              description="Cambio porcentual en litros de leche diarios"
            />
            <SliderControl
              label="Producción de Carne"
              value={variables.meatProductionChange}
              min={-50}
              max={50}
              onChange={(v) => updateVariable('meatProductionChange', v)}
              description="Cambio porcentual en kg de carne mensual"
            />
            <SliderControl
              label="Ganancia Diaria de Peso"
              value={variables.dailyGainChange}
              min={-50}
              max={50}
              onChange={(v) => updateVariable('dailyGainChange', v)}
              description="Cambio en la GDP de animales en engorde"
            />
          </TabsContent>

          <TabsContent value="costs" className="space-y-6 mt-4">
            <SliderControl
              label="Costo de Alimentación"
              value={variables.feedCostChange}
              min={-50}
              max={100}
              onChange={(v) => updateVariable('feedCostChange', v)}
              description="Variación en costos de alimento concentrado y forraje"
            />
            <SliderControl
              label="Costo de Salud"
              value={variables.healthCostChange}
              min={-50}
              max={200}
              onChange={(v) => updateVariable('healthCostChange', v)}
              description="Variación en gastos veterinarios y medicamentos"
            />
            <SliderControl
              label="Costo de Mano de Obra"
              value={variables.laborCostChange}
              min={-30}
              max={50}
              onChange={(v) => updateVariable('laborCostChange', v)}
              description="Variación en costos laborales"
            />
          </TabsContent>

          <TabsContent value="herd" className="space-y-6 mt-4">
            <SliderControl
              label="Tasa de Mortalidad Anual"
              value={variables.mortalityRate}
              min={0}
              max={15}
              step={0.5}
              onChange={(v) => updateVariable('mortalityRate', v)}
              description="Porcentaje de muertes anuales en el hato"
            />
            <SliderControl
              label="Tasa de Reemplazo Anual"
              value={variables.replacementRate}
              min={0}
              max={40}
              onChange={(v) => updateVariable('replacementRate', v)}
              description="Porcentaje de animales nuevos que ingresan al hato"
            />
            <SliderControl
              label="Tasa de Descarte Anual"
              value={variables.cullingRate}
              min={0}
              max={30}
              onChange={(v) => updateVariable('cullingRate', v)}
              description="Porcentaje de animales descartados por año"
            />
          </TabsContent>

          <TabsContent value="repro" className="space-y-6 mt-4">
            <SliderControl
              label="Tasa de Preñez"
              value={variables.pregnancyRate}
              min={30}
              max={90}
              onChange={(v) => updateVariable('pregnancyRate', v)}
              description="Porcentaje de éxito en servicios reproductivos"
            />
            <SliderControl
              label="Intervalo Entre Partos"
              value={variables.calvingInterval}
              min={11}
              max={18}
              unit=" meses"
              onChange={(v) => updateVariable('calvingInterval', v)}
              description="Meses promedio entre partos"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <SliderControl
            label="Horizonte de Proyección"
            value={variables.projectionMonths}
            min={3}
            max={36}
            unit=" meses"
            onChange={(v) => updateVariable('projectionMonths', v)}
            description="Período de tiempo para la simulación"
          />
        </div>
      </CardContent>
    </Card>
  );
};
