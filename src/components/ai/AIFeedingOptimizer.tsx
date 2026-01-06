import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Utensils, TrendingUp, DollarSign } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';

interface AIFeedingOptimizerProps {
  herdData?: {
    totalAnimals?: number;
    avgProduction?: number;
    currentDiet?: string;
  };
}

export const AIFeedingOptimizer = ({ herdData }: AIFeedingOptimizerProps) => {
  const [animalsCount, setAnimalsCount] = useState(herdData?.totalAnimals?.toString() || '');
  const [avgProduction, setAvgProduction] = useState(herdData?.avgProduction?.toString() || '');
  const [currentDiet, setCurrentDiet] = useState(herdData?.currentDiet || '');
  const [goal, setGoal] = useState<'production' | 'cost' | 'balance'>('balance');

  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant();

  const handleOptimize = () => {
    const prompt = `Optimiza la alimentación del siguiente hato bovino:

Datos del hato:
- Número de animales: ${animalsCount || 'No especificado'}
- Producción promedio: ${avgProduction ? `${avgProduction} L/día` : 'No especificada'}
- Dieta actual: ${currentDiet || 'No especificada'}
- Objetivo principal: ${goal === 'production' ? 'Maximizar producción' : goal === 'cost' ? 'Minimizar costos' : 'Balance producción/costo'}

Por favor proporciona:
1. Evaluación de la dieta actual
2. Recomendaciones específicas de alimentación
3. Cantidades sugeridas por animal
4. Estimación de costos
5. Impacto esperado en producción`;

    sendMessage(prompt, 'optimize-feeding');
  };

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Optimización de Alimentación con IA
        </CardTitle>
        <CardDescription>
          Recibe recomendaciones personalizadas para tu hato
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="animals">Número de animales</Label>
            <Input
              id="animals"
              type="number"
              value={animalsCount}
              onChange={(e) => setAnimalsCount(e.target.value)}
              placeholder="150"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="production">Producción promedio (L/día)</Label>
            <Input
              id="production"
              type="number"
              value={avgProduction}
              onChange={(e) => setAvgProduction(e.target.value)}
              placeholder="18"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diet">Dieta actual (opcional)</Label>
          <Input
            id="diet"
            value={currentDiet}
            onChange={(e) => setCurrentDiet(e.target.value)}
            placeholder="Ej: Pasto kikuyo + concentrado 3kg/día"
          />
        </div>

        <div className="space-y-2">
          <Label>Objetivo de optimización</Label>
          <div className="flex gap-2">
            <Badge
              variant={goal === 'production' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setGoal('production')}
            >
              <TrendingUp className="mr-1 h-3 w-3" />
              Producción
            </Badge>
            <Badge
              variant={goal === 'cost' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setGoal('cost')}
            >
              <DollarSign className="mr-1 h-3 w-3" />
              Costos
            </Badge>
            <Badge
              variant={goal === 'balance' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setGoal('balance')}
            >
              Balance
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleOptimize} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizando...
              </>
            ) : (
              <>
                <Utensils className="mr-2 h-4 w-4" />
                Obtener Recomendaciones
              </>
            )}
          </Button>
          {messages.length > 0 && (
            <Button variant="outline" onClick={clearMessages}>
              Limpiar
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {lastAssistantMessage && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Utensils className="h-4 w-4 text-primary" />
              Recomendaciones
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {lastAssistantMessage.content}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
