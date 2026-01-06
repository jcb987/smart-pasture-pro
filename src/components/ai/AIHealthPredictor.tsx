import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Loader2, Stethoscope, Lightbulb, ShieldCheck } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';

interface AIHealthPredictorProps {
  animalData?: {
    tagId?: string;
    symptoms?: string[];
    recentEvents?: string[];
  };
}

export const AIHealthPredictor = ({ animalData }: AIHealthPredictorProps) => {
  const [symptoms, setSymptoms] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant();

  const handlePredict = () => {
    if (!symptoms.trim()) return;
    
    const prompt = `Analiza los siguientes síntomas en un bovino y proporciona un diagnóstico probable:

Síntomas reportados: ${symptoms}
${animalData?.tagId ? `ID del animal: ${animalData.tagId}` : ''}
${animalData?.recentEvents?.length ? `Eventos recientes: ${animalData.recentEvents.join(', ')}` : ''}

Por favor proporciona:
1. Diagnósticos probables (ordenados por probabilidad)
2. Acciones inmediatas recomendadas
3. Tratamientos sugeridos
4. Cuándo llamar al veterinario`;

    sendMessage(prompt, 'predict-health');
  };

  const commonSymptoms = [
    'Fiebre',
    'Pérdida de apetito',
    'Diarrea',
    'Cojera',
    'Tos',
    'Descarga nasal',
    'Bajo peso',
    'Mastitis',
  ];

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Predicción de Salud con IA
        </CardTitle>
        <CardDescription>
          Describe los síntomas para obtener un diagnóstico preliminar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {commonSymptoms.map(symptom => (
              <Badge
                key={symptom}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSymptoms(prev => 
                  prev ? `${prev}, ${symptom.toLowerCase()}` : symptom.toLowerCase()
                )}
              >
                {symptom}
              </Badge>
            ))}
          </div>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe los síntomas observados... (ej: fiebre alta, no come desde ayer, está decaída)"
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePredict} disabled={isLoading || !symptoms.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Stethoscope className="mr-2 h-4 w-4" />
                Analizar Síntomas
              </>
            )}
          </Button>
          {messages.length > 0 && (
            <Button variant="outline" onClick={() => { clearMessages(); setSymptoms(''); }}>
              Limpiar
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {lastAssistantMessage && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Análisis del Asistente
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {lastAssistantMessage.content}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <ShieldCheck className="h-3 w-3" />
              Esto es una sugerencia. Consulta siempre con un veterinario.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
