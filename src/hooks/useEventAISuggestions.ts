import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AISuggestion {
  id: string;
  title: string;
  data: string;
  interpretation: string;
  action: string;
  priority: 'info' | 'atencion' | 'critico';
  dismissed: boolean;
}

export interface AIEventContext {
  eventType: 'peso' | 'vacuna' | 'salud' | 'reproduccion';
  eventDate: string;
  weight?: number;
  diagnosis?: string;
  treatment?: string;
  vaccine?: string;
  reproType?: string;
  reproResult?: string;
  productiveClassification?: string;
  notes?: string;
}

interface AnimalHistory {
  weights: { weight: number; date: string }[];
  healthEvents: { diagnosis: string | null; treatment: string | null; event_date: string; event_type: string }[];
  reproEvents: { event_type: string; result?: string; date: string }[];
  vaccinations: { vaccine: string; date: string }[];
  animalInfo: {
    tag_id: string;
    name: string | null;
    birth_date: string | null;
    category: string;
    breed: string | null;
    sex: string;
    reproductive_status: string | null;
    current_weight: number | null;
    total_calvings: number | null;
  } | null;
  herdAverages: {
    avgWeight: number | null;
    category: string;
  } | null;
}

interface UseEventAISuggestionsProps {
  animalId: string;
  open: boolean;
}

export function useEventAISuggestions({ animalId, open }: UseEventAISuggestionsProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnimalHistory | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch animal history when dialog opens
  useEffect(() => {
    const fetchHistory = async () => {
      if (!open || !animalId || !user) return;

      try {
        // Get user's organization
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!profileData?.organization_id) return;

        // Fetch animal info, weights, health events, repro events, and vaccinations in parallel
        // Using allSettled so a single query failure doesn't break the whole feature
        const [animalResult, weightsResult, healthResult, reproResult, vaccinationsResult] = await Promise.allSettled([
          supabase
            .from('animals')
            .select('tag_id, name, birth_date, category, breed, sex, reproductive_status, current_weight, total_calvings')
            .eq('id', animalId)
            .single(),
          supabase
            .from('animal_events')
            .select('weight, event_date')
            .eq('animal_id', animalId)
            .eq('event_type', 'peso')
            .not('weight', 'is', null)
            .order('event_date', { ascending: false })
            .limit(10),
          supabase
            .from('health_events')
            .select('diagnosis, treatment, event_date, event_type')
            .eq('animal_id', animalId)
            .order('event_date', { ascending: false })
            .limit(20),
          supabase
            .from('animal_events')
            .select('event_type, details, event_date')
            .eq('animal_id', animalId)
            .in('event_type', ['palpacion', 'servicio', 'inseminacion', 'celo', 'parto'])
            .order('event_date', { ascending: false })
            .limit(20),
          supabase
            .from('health_events')
            .select('medication, event_date')
            .eq('animal_id', animalId)
            .eq('event_type', 'vacuna')
            .order('event_date', { ascending: false })
            .limit(10),
        ]);

        const animalData = animalResult.status === 'fulfilled' ? animalResult.value : { data: null, error: null };
        const weightsData = weightsResult.status === 'fulfilled' ? weightsResult.value : { data: null, error: null };
        const healthData = healthResult.status === 'fulfilled' ? healthResult.value : { data: null, error: null };
        const reproData = reproResult.status === 'fulfilled' ? reproResult.value : { data: null, error: null };
        const vaccinationsData = vaccinationsResult.status === 'fulfilled' ? vaccinationsResult.value : { data: null, error: null };

        // Get herd average for comparison
        let herdAverages = null;
        if (animalData.data?.category) {
          const { data: avgData } = await supabase
            .from('animals')
            .select('current_weight')
            .eq('organization_id', profileData.organization_id)
            .eq('category', animalResult.data.category)
            .eq('status', 'activo')
            .not('current_weight', 'is', null);

          if (avgData && avgData.length > 0) {
            const weights = avgData.map(a => a.current_weight).filter(Boolean) as number[];
            if (weights.length > 0) {
              herdAverages = {
                avgWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
                category: animalData.data.category,
              };
            }
          }
        }

        setHistory({
          weights: (weightsData.data || []).map(w => ({
            weight: w.weight!,
            date: w.event_date,
          })),
          healthEvents: healthData.data || [],
          reproEvents: (reproData.data || []).map(r => ({
            event_type: r.event_type,
            result: (r.details as { result?: string })?.result,
            date: r.event_date,
          })),
          vaccinations: (vaccinationsData.data || [])
            .filter(v => v.medication)
            .map(v => ({
              vaccine: v.medication!,
              date: v.event_date,
            })),
          animalInfo: animalData.data || null,
          herdAverages,
        });
      } catch (err) {
        console.error('Error fetching animal history:', err);
      }
    };

    fetchHistory();
  }, [animalId, open, user]);

  // Generate local suggestions based on history and current event
  const generateLocalSuggestions = useCallback((context: AIEventContext): AISuggestion[] => {
    if (!history) return [];

    const suggestions: AISuggestion[] = [];
    const today = new Date();

    // Weight-based suggestions
    if (context.eventType === 'peso' && context.weight) {
      const lastWeights = history.weights.slice(0, 5);
      
      if (lastWeights.length > 0) {
        const lastWeight = lastWeights[0];
        const weightDiff = context.weight - lastWeight.weight;
        const daysDiff = Math.round((today.getTime() - new Date(lastWeight.date).getTime()) / (1000 * 60 * 60 * 24));
        
        if (weightDiff !== 0) {
          suggestions.push({
            id: 'weight-change',
            title: weightDiff > 0 ? 'Subió de peso' : 'Bajó de peso',
            data: `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg vs última medición (hace ${daysDiff} días)`,
            interpretation: weightDiff > 0 ? 'Tendencia positiva' : 'Tendencia negativa',
            action: weightDiff < -10 
              ? 'Sugerencia: revisar dieta y repetir peso en 14 días'
              : weightDiff > 0 
                ? 'Buen progreso, mantener manejo actual'
                : 'Monitorear en próximas semanas',
            priority: weightDiff < -15 ? 'critico' : weightDiff < -5 ? 'atencion' : 'info',
            dismissed: false,
          });
        }
        
        // Daily gain calculation
        if (daysDiff > 0 && weightDiff > 0) {
          const dailyGain = weightDiff / daysDiff;
          suggestions.push({
            id: 'daily-gain',
            title: 'Ganancia diaria de peso',
            data: `${dailyGain.toFixed(2)} kg/día promedio`,
            interpretation: dailyGain >= 0.8 ? 'Excelente ganancia' : dailyGain >= 0.5 ? 'Ganancia aceptable' : 'Ganancia baja',
            action: dailyGain < 0.5 ? 'Considerar ajuste de dieta' : 'Mantener plan nutricional',
            priority: dailyGain < 0.3 ? 'atencion' : 'info',
            dismissed: false,
          });
        }
      }

      // Compare with herd average
      if (history.herdAverages?.avgWeight) {
        const diff = context.weight - history.herdAverages.avgWeight;
        const pctDiff = (diff / history.herdAverages.avgWeight) * 100;
        
        suggestions.push({
          id: 'herd-comparison',
          title: 'Comparación con el hato',
          data: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg vs promedio de ${history.herdAverages.category}`,
          interpretation: `${Math.abs(pctDiff).toFixed(0)}% ${diff > 0 ? 'por encima' : 'por debajo'} del promedio`,
          action: diff < -50 ? 'Evaluar causas del bajo peso' : 'Peso dentro de rangos esperados',
          priority: pctDiff < -15 ? 'atencion' : 'info',
          dismissed: false,
        });
      }
    }

    // Health-based suggestions
    if (context.eventType === 'salud') {
      const recentHealthEvents = history.healthEvents.filter(e => {
        const eventDate = new Date(e.event_date);
        const daysDiff = (today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 90;
      });

      if (recentHealthEvents.length >= 3) {
        suggestions.push({
          id: 'health-frequency',
          title: 'Alta frecuencia de eventos',
          data: `${recentHealthEvents.length} eventos de salud en los últimos 90 días`,
          interpretation: 'Animal con historial de problemas',
          action: 'Evaluar viabilidad productiva del animal',
          priority: recentHealthEvents.length >= 5 ? 'critico' : 'atencion',
          dismissed: false,
        });
      }

      // Check for recurring diagnosis
      if (context.diagnosis) {
        const sameDiagnosis = history.healthEvents.filter(
          e => e.diagnosis?.toLowerCase().includes(context.diagnosis!.toLowerCase())
        );
        if (sameDiagnosis.length >= 2) {
          suggestions.push({
            id: 'recurring-diagnosis',
            title: 'Problema recurrente',
            data: `"${context.diagnosis}" aparece ${sameDiagnosis.length + 1} veces`,
            interpretation: 'Condición crónica o tratamiento inefectivo',
            action: 'Sugerir revisión veterinaria especializada',
            priority: 'atencion',
            dismissed: false,
          });
        }
      }
    }

    // Reproductive suggestions
    if (context.eventType === 'reproduccion') {
      // Count services without pregnancy
      const services = history.reproEvents.filter(e => 
        e.event_type === 'servicio' || e.event_type === 'inseminacion'
      );
      const emptyPalpations = history.reproEvents.filter(e => 
        e.event_type === 'palpacion' && e.result === 'vacia'
      );

      if (services.length >= 3 && emptyPalpations.length >= 2) {
        suggestions.push({
          id: 'repeater',
          title: 'Posible repetidora',
          data: `${services.length} servicios y ${emptyPalpations.length} palpaciones vacías`,
          interpretation: 'Baja eficiencia reproductiva',
          action: 'Evaluar causas: nutrición, toro, patologías',
          priority: 'atencion',
          dismissed: false,
        });
      }

      // Check days since last calving
      if (history.animalInfo?.total_calvings && history.animalInfo.total_calvings > 0) {
        const lastParto = history.reproEvents.find(e => e.event_type === 'parto');
        if (lastParto) {
          const daysSinceParto = Math.round(
            (today.getTime() - new Date(lastParto.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceParto > 120) {
            suggestions.push({
              id: 'postpartum-interval',
              title: 'Intervalo postparto largo',
              data: `${daysSinceParto} días desde último parto`,
              interpretation: daysSinceParto > 180 ? 'Intervalo crítico' : 'Fuera del rango óptimo',
              action: 'Priorizar servicio o evaluar anestro',
              priority: daysSinceParto > 180 ? 'critico' : 'atencion',
              dismissed: false,
            });
          }
        }
      }
    }

    // Productive classification suggestions
    if (context.productiveClassification === 'candidato_venta') {
      suggestions.push({
        id: 'sale-candidate-info',
        title: 'Candidato para venta',
        data: 'Completar información para venta',
        interpretation: 'Adjuntar: peso reciente, estado sanitario',
        action: 'Agregar razón: baja producción / edad / mejora genética',
        priority: 'info',
        dismissed: false,
      });
    }

    if (context.productiveClassification === 'candidato_descarte') {
      // Check viability
      const healthIssues = history.healthEvents.length;
      const reproIssues = history.reproEvents.filter(e => 
        e.event_type === 'palpacion' && e.result === 'vacia'
      ).length;

      if (healthIssues > 5 || reproIssues > 2) {
        suggestions.push({
          id: 'low-viability',
          title: 'Baja viabilidad confirmada',
          data: `${healthIssues} eventos salud, ${reproIssues} palpaciones vacías`,
          interpretation: 'Historial respalda decisión de descarte',
          action: 'Documentar razón para trazabilidad',
          priority: 'info',
          dismissed: false,
        });
      }
    }

    return suggestions.slice(0, 6); // Max 6 suggestions
  }, [history]);

  // Call AI for advanced analysis
  const generateAISuggestions = useCallback(async (context: AIEventContext) => {
    if (!history || !history.animalInfo) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('No autorizado');

      const prompt = buildAIPrompt(context, history);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          type: 'chat',
          context: {
            animal: history.animalInfo,
            weights: history.weights.slice(0, 5),
            healthEvents: history.healthEvents.slice(0, 5),
            reproEvents: history.reproEvents.slice(0, 5),
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Límite de solicitudes alcanzado. Intenta en unos segundos.');
        }
        throw new Error('Error al obtener sugerencias de IA');
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Extract summary and recommendation from AI response
      const summaryMatch = fullText.match(/(?:Resumen|RESUMEN)[:\s]*([^\n]+)/i);
      const recommendationMatch = fullText.match(/(?:Recomendación|RECOMENDACIÓN|Siguiente acción)[:\s]*([^\n]+)/i);

      setAiSummary(summaryMatch?.[1]?.trim() || fullText.slice(0, 150));
      setAiRecommendation(recommendationMatch?.[1]?.trim() || null);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('AI suggestions error:', err);
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [history]);

  const updateSuggestions = useCallback((context: AIEventContext) => {
    const localSuggestions = generateLocalSuggestions(context);
    setSuggestions(localSuggestions);
    
    // Optionally trigger AI analysis (debounced in component)
  }, [generateLocalSuggestions]);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, dismissed: true } : s)
    );
  }, []);

  const addToNotes = useCallback((suggestion: AISuggestion): string => {
    return `[IA] ${suggestion.title}: ${suggestion.data}. ${suggestion.action}`;
  }, []);

  return {
    suggestions: suggestions.filter(s => !s.dismissed),
    loading,
    error,
    aiSummary,
    aiRecommendation,
    updateSuggestions,
    generateAISuggestions,
    dismissSuggestion,
    addToNotes,
    historyLoaded: !!history,
  };
}

function buildAIPrompt(context: AIEventContext, history: AnimalHistory): string {
  const animalDesc = history.animalInfo 
    ? `${history.animalInfo.category} ${history.animalInfo.breed || ''} (${history.animalInfo.tag_id})`
    : 'Animal';

  let prompt = `Analiza brevemente este registro de evento para ${animalDesc}:\n\n`;
  prompt += `Tipo de evento: ${context.eventType}\n`;
  prompt += `Fecha: ${context.eventDate}\n`;

  if (context.weight) prompt += `Peso registrado: ${context.weight} kg\n`;
  if (context.diagnosis) prompt += `Diagnóstico: ${context.diagnosis}\n`;
  if (context.treatment) prompt += `Tratamiento: ${context.treatment}\n`;
  if (context.vaccine) prompt += `Vacuna: ${context.vaccine}\n`;
  if (context.reproType) prompt += `Evento reproductivo: ${context.reproType}\n`;
  if (context.reproResult) prompt += `Resultado: ${context.reproResult}\n`;
  if (context.productiveClassification) prompt += `Clasificación comercial: ${context.productiveClassification}\n`;

  prompt += `\nHistorial reciente:\n`;
  prompt += `- Pesos anteriores: ${history.weights.slice(0, 3).map(w => `${w.weight}kg (${w.date})`).join(', ') || 'Sin datos'}\n`;
  prompt += `- Eventos salud: ${history.healthEvents.length} registros\n`;
  prompt += `- Eventos repro: ${history.reproEvents.length} registros\n`;

  prompt += `\nResponde en máximo 3 líneas con:\n`;
  prompt += `1. RESUMEN: [una oración del hallazgo principal]\n`;
  prompt += `2. RECOMENDACIÓN: [una acción concreta sugerida]\n`;

  return prompt;
}
