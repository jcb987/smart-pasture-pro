import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Scale,
  Calculator
} from 'lucide-react';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
  category: string;
  current_weight: number | null;
  birth_date: string | null;
  last_weight_date: string | null;
}

interface WeightPrediction {
  animalId: string;
  tagId: string;
  name: string | null;
  currentWeight: number;
  targetWeight: number;
  daysToTarget: number;
  projectedDate: string;
  dailyGainRequired: number;
  feasibility: 'easy' | 'moderate' | 'hard' | 'unlikely';
}

interface WeightPredictionCardProps {
  animals: Animal[];
}

// Ganancias diarias esperadas por categoría (kg/día)
const EXPECTED_GAINS: Record<string, { min: number; max: number; avg: number }> = {
  ternero: { min: 0.6, max: 1.2, avg: 0.9 },
  ternera: { min: 0.5, max: 1.0, avg: 0.75 },
  becerro: { min: 0.4, max: 0.8, avg: 0.6 },
  becerra: { min: 0.35, max: 0.7, avg: 0.5 },
  novillo: { min: 0.8, max: 1.5, avg: 1.1 },
  novilla: { min: 0.6, max: 1.2, avg: 0.9 },
  vaca: { min: 0.3, max: 0.8, avg: 0.5 },
  toro: { min: 0.5, max: 1.2, avg: 0.8 },
  bufalo: { min: 0.7, max: 1.3, avg: 1.0 },
  bufala: { min: 0.5, max: 1.0, avg: 0.75 },
};

export const WeightPredictionCard = ({ animals }: WeightPredictionCardProps) => {
  const [targetWeight, setTargetWeight] = useState<number>(450);
  const [targetDate, setTargetDate] = useState<string>('');

  const predictions = useMemo((): WeightPrediction[] => {
    if (!targetWeight && !targetDate) return [];

    const today = new Date();
    const target = targetDate ? new Date(targetDate) : null;

    return animals
      .filter(a => a.current_weight && a.current_weight > 0)
      .map(animal => {
        const currentWeight = animal.current_weight!;
        const gains = EXPECTED_GAINS[animal.category] || EXPECTED_GAINS.novillo;

        let daysToTarget: number;
        let projectedDate: string;
        let useTargetWeight = targetWeight;

        if (target) {
          // Calcular peso alcanzable para la fecha
          daysToTarget = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          projectedDate = targetDate;
          // Si no hay peso objetivo, calcular el proyectado
          if (!targetWeight) {
            useTargetWeight = currentWeight + (gains.avg * daysToTarget);
          }
        } else {
          // Calcular días para alcanzar peso objetivo
          const weightDiff = targetWeight - currentWeight;
          daysToTarget = Math.ceil(weightDiff / gains.avg);
          const futureDate = new Date(today);
          futureDate.setDate(futureDate.getDate() + daysToTarget);
          projectedDate = futureDate.toISOString().split('T')[0];
        }

        const weightDiff = useTargetWeight - currentWeight;
        const dailyGainRequired = daysToTarget > 0 ? weightDiff / daysToTarget : 0;

        // Determinar factibilidad
        let feasibility: 'easy' | 'moderate' | 'hard' | 'unlikely';
        if (dailyGainRequired <= 0) feasibility = 'easy';
        else if (dailyGainRequired <= gains.min) feasibility = 'easy';
        else if (dailyGainRequired <= gains.avg) feasibility = 'moderate';
        else if (dailyGainRequired <= gains.max) feasibility = 'hard';
        else feasibility = 'unlikely';

        return {
          animalId: animal.id,
          tagId: animal.tag_id,
          name: animal.name,
          currentWeight,
          targetWeight: useTargetWeight,
          daysToTarget: Math.max(0, daysToTarget),
          projectedDate,
          dailyGainRequired: Math.max(0, dailyGainRequired),
          feasibility
        };
      })
      .filter(p => p.daysToTarget > 0)
      .sort((a, b) => a.daysToTarget - b.daysToTarget);
  }, [animals, targetWeight, targetDate]);

  const getFeasibilityBadge = (feasibility: string) => {
    const variants: Record<string, { bg: string; label: string }> = {
      easy: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Fácil' },
      moderate: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Moderado' },
      hard: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Difícil' },
      unlikely: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Improbable' }
    };
    const variant = variants[feasibility] || variants.moderate;
    return <Badge className={variant.bg}>{variant.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Predicción de Peso Objetivo
        </CardTitle>
        <CardDescription>Calcule cuándo alcanzarán sus animales un peso deseado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetWeight" className="text-sm">
              <Scale className="h-3 w-3 inline mr-1" />
              Peso Objetivo (kg)
            </Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder="450"
              value={targetWeight || ''}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetDate" className="text-sm">
              <Calendar className="h-3 w-3 inline mr-1" />
              O Fecha Objetivo
            </Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Resultados */}
        <ScrollArea className="h-[300px]">
          {predictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {!targetWeight && !targetDate 
                  ? 'Ingrese un peso o fecha objetivo'
                  : 'No hay animales con peso actual registrado'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.slice(0, 15).map((pred) => (
                <div key={pred.animalId} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{pred.tagId}</span>
                      {pred.name && (
                        <span className="text-sm text-muted-foreground ml-1">({pred.name})</span>
                      )}
                    </div>
                    {getFeasibilityBadge(pred.feasibility)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="font-medium">{pred.currentWeight}kg</div>
                      <div className="text-muted-foreground">Actual</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="font-medium">{pred.targetWeight.toFixed(0)}kg</div>
                      <div className="text-muted-foreground">Objetivo</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="font-medium">{pred.daysToTarget}d</div>
                      <div className="text-muted-foreground">Días</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      GDP requerida: {pred.dailyGainRequired.toFixed(2)} kg/d
                    </span>
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(pred.projectedDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
