import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, DollarSign, Package, BarChart3, Calendar, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface BaseDataConfig {
  // Precios de venta
  milkPricePerLiter: number;
  meatPricePerKg: number;
  currency: string;
  
  // Costos base mensuales
  monthlyFeedCost: number;
  monthlyHealthCost: number;
  monthlyLaborCost: number;
  otherOperationalCosts: number;
  
  // Producción actual (si no existe en el sistema)
  avgDailyMilkPerFemale: number;
  avgMonthlyMeatKg: number;
  avgDailyWeightGain: number;
  
  // Horizonte y contexto
  projectionMonths: number;
  productionType: 'lecheria' | 'carne' | 'doble_proposito';
}

interface BaseDataSurveyProps {
  existingData: {
    hasAnimals: boolean;
    hasMilkRecords: boolean;
    hasWeightRecords: boolean;
    hasFeedingData: boolean;
    hasHealthData: boolean;
    calculatedMilkAvg: number | null;
    calculatedWeightGain: number | null;
    calculatedFeedCost: number | null;
    calculatedHealthCost: number | null;
  };
  onComplete: (config: BaseDataConfig) => void;
  initialConfig?: Partial<BaseDataConfig>;
}

const DEFAULT_CONFIG: BaseDataConfig = {
  milkPricePerLiter: 0,
  meatPricePerKg: 0,
  currency: 'COP',
  monthlyFeedCost: 0,
  monthlyHealthCost: 0,
  monthlyLaborCost: 0,
  otherOperationalCosts: 0,
  avgDailyMilkPerFemale: 0,
  avgMonthlyMeatKg: 0,
  avgDailyWeightGain: 0,
  projectionMonths: 12,
  productionType: 'doble_proposito',
};

export const BaseDataSurvey = ({ existingData, onComplete, initialConfig }: BaseDataSurveyProps) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<BaseDataConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
    // Pre-fill with calculated values if available
    avgDailyMilkPerFemale: existingData.calculatedMilkAvg || initialConfig?.avgDailyMilkPerFemale || 0,
    avgDailyWeightGain: existingData.calculatedWeightGain || initialConfig?.avgDailyWeightGain || 0,
    monthlyFeedCost: existingData.calculatedFeedCost || initialConfig?.monthlyFeedCost || 0,
    monthlyHealthCost: existingData.calculatedHealthCost || initialConfig?.monthlyHealthCost || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = (key: keyof BaseDataConfig, value: number | string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (config.milkPricePerLiter <= 0 && config.productionType !== 'carne') {
        newErrors.milkPricePerLiter = 'Requerido para producción de leche';
      }
      if (config.meatPricePerKg <= 0 && config.productionType !== 'lecheria') {
        newErrors.meatPricePerKg = 'Requerido para producción de carne';
      }
    }

    if (currentStep === 2) {
      if (config.monthlyFeedCost <= 0) {
        newErrors.monthlyFeedCost = 'Ingresa el costo mensual de alimentación';
      }
    }

    if (currentStep === 3) {
      if (config.productionType !== 'carne' && config.avgDailyMilkPerFemale <= 0 && !existingData.hasMilkRecords) {
        newErrors.avgDailyMilkPerFemale = 'Requerido si no hay registros de producción';
      }
      if (config.productionType !== 'lecheria' && config.avgDailyWeightGain <= 0 && !existingData.hasWeightRecords) {
        newErrors.avgDailyWeightGain = 'Requerido si no hay registros de peso';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        onComplete(config);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const DataSourceBadge = ({ hasData, label }: { hasData: boolean; label: string }) => (
    <Badge variant={hasData ? 'default' : 'secondary'} className="gap-1 text-xs">
      {hasData ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {hasData ? `${label} (del sistema)` : `${label} (manual)`}
    </Badge>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Configuración Base para Simulación
            </CardTitle>
            <CardDescription>
              Paso {step} de 4 — Completa los datos necesarios para calcular proyecciones reales
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Precios de Venta */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <DollarSign className="h-5 w-5 text-green-600" />
              Precios de Venta
            </div>
            <p className="text-sm text-muted-foreground">
              Define los precios a los que vendes tus productos. Estos valores son esenciales para calcular ingresos.
            </p>

            <div className="space-y-2">
              <Label>Tipo de producción</Label>
              <RadioGroup
                value={config.productionType}
                onValueChange={(v) => updateConfig('productionType', v as BaseDataConfig['productionType'])}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lecheria" id="lecheria" />
                  <Label htmlFor="lecheria">Lechería</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="carne" id="carne" />
                  <Label htmlFor="carne">Carne</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doble_proposito" id="doble_proposito" />
                  <Label htmlFor="doble_proposito">Doble Propósito</Label>
                </div>
              </RadioGroup>
            </div>

            {config.productionType !== 'carne' && (
              <div className="space-y-2">
                <Label htmlFor="milkPrice">Precio por litro de leche ($)</Label>
                <Input
                  id="milkPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={config.milkPricePerLiter || ''}
                  onChange={(e) => updateConfig('milkPricePerLiter', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 1500"
                />
                {errors.milkPricePerLiter && (
                  <p className="text-xs text-destructive">{errors.milkPricePerLiter}</p>
                )}
              </div>
            )}

            {config.productionType !== 'lecheria' && (
              <div className="space-y-2">
                <Label htmlFor="meatPrice">Precio por kg de carne en pie ($)</Label>
                <Input
                  id="meatPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={config.meatPricePerKg || ''}
                  onChange={(e) => updateConfig('meatPricePerKg', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 8500"
                />
                {errors.meatPricePerKg && (
                  <p className="text-xs text-destructive">{errors.meatPricePerKg}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Moneda</Label>
              <RadioGroup
                value={config.currency}
                onValueChange={(v) => updateConfig('currency', v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COP" id="cop" />
                  <Label htmlFor="cop">COP (Peso colombiano)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USD" id="usd" />
                  <Label htmlFor="usd">USD (Dólar)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 2: Costos Base */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Package className="h-5 w-5 text-orange-600" />
              Costos Base Mensuales
            </div>
            <p className="text-sm text-muted-foreground">
              Ingresa tus costos mensuales promedio. Estos son fundamentales para calcular rentabilidad.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataSourceBadge hasData={existingData.hasFeedingData} label="Alimentación" />
              <DataSourceBadge hasData={existingData.hasHealthData} label="Sanidad" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedCost">Costo mensual de alimentación ($)</Label>
                <Input
                  id="feedCost"
                  type="number"
                  min="0"
                  value={config.monthlyFeedCost || ''}
                  onChange={(e) => updateConfig('monthlyFeedCost', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 5000000"
                />
                {existingData.calculatedFeedCost && (
                  <p className="text-xs text-muted-foreground">
                    Detectado del sistema: ${existingData.calculatedFeedCost.toLocaleString()}
                  </p>
                )}
                {errors.monthlyFeedCost && (
                  <p className="text-xs text-destructive">{errors.monthlyFeedCost}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthCost">Costo mensual de sanidad ($)</Label>
                <Input
                  id="healthCost"
                  type="number"
                  min="0"
                  value={config.monthlyHealthCost || ''}
                  onChange={(e) => updateConfig('monthlyHealthCost', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 1000000"
                />
                {existingData.calculatedHealthCost && (
                  <p className="text-xs text-muted-foreground">
                    Detectado del sistema: ${existingData.calculatedHealthCost.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCost">Costo mensual de mano de obra ($)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  min="0"
                  value={config.monthlyLaborCost || ''}
                  onChange={(e) => updateConfig('monthlyLaborCost', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 3000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCosts">Otros costos operativos ($)</Label>
                <Input
                  id="otherCosts"
                  type="number"
                  min="0"
                  value={config.otherOperationalCosts || ''}
                  onChange={(e) => updateConfig('otherOperationalCosts', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 500000 (opcional)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Producción Actual */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Producción Actual
            </div>
            <p className="text-sm text-muted-foreground">
              Si ya tienes registros en el sistema, estos campos se prellenarán automáticamente.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <DataSourceBadge hasData={existingData.hasMilkRecords} label="Leche" />
              <DataSourceBadge hasData={existingData.hasWeightRecords} label="Peso/Carne" />
            </div>

            {config.productionType !== 'carne' && (
              <div className="space-y-2">
                <Label htmlFor="milkAvg">Litros promedio por hembra/día</Label>
                <Input
                  id="milkAvg"
                  type="number"
                  min="0"
                  step="0.5"
                  value={config.avgDailyMilkPerFemale || ''}
                  onChange={(e) => updateConfig('avgDailyMilkPerFemale', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 15"
                  disabled={existingData.hasMilkRecords && !!existingData.calculatedMilkAvg}
                />
                {existingData.calculatedMilkAvg && (
                  <p className="text-xs text-green-600">
                    ✓ Calculado del sistema: {existingData.calculatedMilkAvg.toFixed(1)} L/día
                  </p>
                )}
                {errors.avgDailyMilkPerFemale && (
                  <p className="text-xs text-destructive">{errors.avgDailyMilkPerFemale}</p>
                )}
              </div>
            )}

            {config.productionType !== 'lecheria' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weightGain">Ganancia diaria de peso promedio (kg/día)</Label>
                  <Input
                    id="weightGain"
                    type="number"
                    min="0"
                    step="0.1"
                    value={config.avgDailyWeightGain || ''}
                    onChange={(e) => updateConfig('avgDailyWeightGain', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 0.8"
                    disabled={existingData.hasWeightRecords && !!existingData.calculatedWeightGain}
                  />
                  {existingData.calculatedWeightGain && (
                    <p className="text-xs text-green-600">
                      ✓ Calculado del sistema: {existingData.calculatedWeightGain.toFixed(2)} kg/día
                    </p>
                  )}
                  {errors.avgDailyWeightGain && (
                    <p className="text-xs text-destructive">{errors.avgDailyWeightGain}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meatKg">Kg de carne producida/mes (ventas)</Label>
                  <Input
                    id="meatKg"
                    type="number"
                    min="0"
                    value={config.avgMonthlyMeatKg || ''}
                    onChange={(e) => updateConfig('avgMonthlyMeatKg', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Horizonte y Confirmación */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Calendar className="h-5 w-5 text-purple-600" />
              Horizonte de Proyección
            </div>
            <p className="text-sm text-muted-foreground">
              Define el período de tiempo para tus simulaciones.
            </p>

            <div className="space-y-2">
              <Label htmlFor="months">Meses a proyectar</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="60"
                value={config.projectionMonths}
                onChange={(e) => updateConfig('projectionMonths', parseInt(e.target.value) || 12)}
              />
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-3">Resumen de configuración</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de producción:</span>
                  <span className="font-medium capitalize">{config.productionType.replace('_', ' ')}</span>
                </div>
                {config.productionType !== 'carne' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio leche:</span>
                    <span className="font-medium">${config.milkPricePerLiter.toLocaleString()}/L</span>
                  </div>
                )}
                {config.productionType !== 'lecheria' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio carne:</span>
                    <span className="font-medium">${config.meatPricePerKg.toLocaleString()}/kg</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costos mensuales totales:</span>
                  <span className="font-medium">
                    ${(config.monthlyFeedCost + config.monthlyHealthCost + config.monthlyLaborCost + config.otherOperationalCosts).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horizonte:</span>
                  <span className="font-medium">{config.projectionMonths} meses</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>✓ Listo para simular</strong> — Todos los cálculos se basarán exclusivamente en estos datos ingresados por ti.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Anterior
          </Button>
          <Button onClick={handleNext}>
            {step < 4 ? (
              <>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Comenzar Simulación
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
