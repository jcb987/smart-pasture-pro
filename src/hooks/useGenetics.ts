import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnimals } from './useAnimals';

export interface GeneticEvaluation {
  id: string;
  organization_id: string;
  animal_id: string;
  evaluation_date: string;
  evaluator?: string;
  milk_production_index?: number;
  meat_production_index?: number;
  growth_rate_index?: number;
  fertility_index?: number;
  calving_ease_index?: number;
  maternal_ability_index?: number;
  body_conformation_score?: number;
  udder_score?: number;
  legs_feet_score?: number;
  disease_resistance_index?: number;
  longevity_index?: number;
  overall_genetic_value?: number;
  reliability_percentage?: number;
  notes?: string;
  created_at: string;
}

export interface BreedingSuggestion {
  id: string;
  organization_id: string;
  female_id: string;
  male_id?: string;
  semen_code?: string;
  bull_name?: string;
  suggested_date?: string;
  priority: number;
  expected_improvement?: Record<string, number>;
  inbreeding_coefficient?: number;
  compatibility_score?: number;
  status: string;
  executed_date?: string;
  notes?: string;
  created_at: string;
}

export interface PedigreeNode {
  id: string;
  tag_id: string;
  name?: string;
  sex: string;
  breed?: string;
  birth_date?: string;
  mother?: PedigreeNode;
  father?: PedigreeNode;
  geneticValue?: number;
}

export interface InbreedingResult {
  coefficient: number;
  commonAncestors: string[];
  risk: 'bajo' | 'moderado' | 'alto' | 'muy_alto';
}

export const useGenetics = () => {
  const [evaluations, setEvaluations] = useState<GeneticEvaluation[]>([]);
  const [suggestions, setSuggestions] = useState<BreedingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { animals } = useAnimals();

  const getOrganizationId = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .single();
    return profile?.organization_id || null;
  };

  const fetchEvaluations = async () => {
    const { data, error } = await supabase
      .from('genetic_evaluations')
      .select('*')
      .order('evaluation_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las evaluaciones genéticas',
        variant: 'destructive',
      });
    } else {
      setEvaluations(data || []);
    }
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('breeding_suggestions')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sugerencias de apareamiento',
        variant: 'destructive',
      });
    } else {
      const mappedData: BreedingSuggestion[] = (data || []).map(s => ({
        ...s,
        expected_improvement: s.expected_improvement as Record<string, number> | undefined,
      }));
      setSuggestions(mappedData);
    }
  };

  const createEvaluation = async (evaluation: Omit<GeneticEvaluation, 'id' | 'organization_id' | 'created_at'>) => {
    if (!organizationId) return false;

    const { error } = await supabase
      .from('genetic_evaluations')
      .insert({ ...evaluation, organization_id: organizationId });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la evaluación genética',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Éxito',
      description: 'Evaluación genética registrada correctamente',
    });
    fetchEvaluations();
    return true;
  };

  const createSuggestion = async (suggestion: Omit<BreedingSuggestion, 'id' | 'organization_id' | 'created_at'>) => {
    if (!organizationId) return false;

    const { error } = await supabase
      .from('breeding_suggestions')
      .insert({ ...suggestion, organization_id: organizationId });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la sugerencia de apareamiento',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Éxito',
      description: 'Sugerencia de apareamiento creada correctamente',
    });
    fetchSuggestions();
    return true;
  };

  const updateSuggestionStatus = async (id: string, status: string, executedDate?: string) => {
    const { error } = await supabase
      .from('breeding_suggestions')
      .update({ status, executed_date: executedDate })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la sugerencia',
        variant: 'destructive',
      });
      return false;
    }

    fetchSuggestions();
    return true;
  };

  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase
      .from('breeding_suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sugerencia',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Éxito',
      description: 'Sugerencia eliminada correctamente',
    });
    fetchSuggestions();
    return true;
  };

  // Construir árbol genealógico (pedigrí)
  const buildPedigree = (animalId: string, depth: number = 3): PedigreeNode | null => {
    if (depth <= 0) return null;

    const animal = animals.find(a => a.id === animalId);
    if (!animal) return null;

    const evaluation = evaluations.find(e => e.animal_id === animalId);

    const node: PedigreeNode = {
      id: animal.id,
      tag_id: animal.tag_id,
      name: animal.name || undefined,
      sex: animal.sex,
      breed: animal.breed || undefined,
      birth_date: animal.birth_date || undefined,
      geneticValue: evaluation?.overall_genetic_value,
    };

    if (animal.mother_id) {
      node.mother = buildPedigree(animal.mother_id, depth - 1) || undefined;
    }
    if (animal.father_id) {
      node.father = buildPedigree(animal.father_id, depth - 1) || undefined;
    }

    return node;
  };

  // Calcular coeficiente de consanguinidad
  const calculateInbreeding = (femaleId: string, maleId: string): InbreedingResult => {
    const getAncestors = (animalId: string, depth: number = 4): Set<string> => {
      const ancestors = new Set<string>();
      const animal = animals.find(a => a.id === animalId);
      
      if (!animal || depth <= 0) return ancestors;

      if (animal.mother_id) {
        ancestors.add(animal.mother_id);
        getAncestors(animal.mother_id, depth - 1).forEach(a => ancestors.add(a));
      }
      if (animal.father_id) {
        ancestors.add(animal.father_id);
        getAncestors(animal.father_id, depth - 1).forEach(a => ancestors.add(a));
      }

      return ancestors;
    };

    const femaleAncestors = getAncestors(femaleId);
    const maleAncestors = getAncestors(maleId);

    const commonAncestors: string[] = [];
    femaleAncestors.forEach(ancestor => {
      if (maleAncestors.has(ancestor)) {
        const animalData = animals.find(a => a.id === ancestor);
        if (animalData) {
          commonAncestors.push(animalData.tag_id);
        }
      }
    });

    // Cálculo simplificado del coeficiente
    const coefficient = commonAncestors.length * 6.25; // Aproximación

    let risk: InbreedingResult['risk'] = 'bajo';
    if (coefficient > 25) risk = 'muy_alto';
    else if (coefficient > 12.5) risk = 'alto';
    else if (coefficient > 6.25) risk = 'moderado';

    return { coefficient, commonAncestors, risk };
  };

  // Generar sugerencias automáticas de apareamiento
  const generateBreedingSuggestions = (femaleId: string): BreedingSuggestion[] => {
    const female = animals.find(a => a.id === femaleId);
    if (!female || female.sex !== 'hembra') return [];

    const males = animals.filter(a => 
      a.sex === 'macho' && 
      a.status === 'activo' &&
      (a.category === 'toro')
    );

    const suggestions = males.map(male => {
      const inbreeding = calculateInbreeding(femaleId, male.id);
      const femaleEval = evaluations.find(e => e.animal_id === femaleId);
      const maleEval = evaluations.find(e => e.animal_id === male.id);

      // Calcular score de compatibilidad
      let compatibilityScore = 100 - inbreeding.coefficient;

      // Bonificar si ambos tienen evaluaciones genéticas altas
      if (femaleEval?.overall_genetic_value && maleEval?.overall_genetic_value) {
        compatibilityScore += (femaleEval.overall_genetic_value + maleEval.overall_genetic_value) / 4;
      }

      return {
        id: `temp-${male.id}`,
        organization_id: organizationId || '',
        female_id: femaleId,
        male_id: male.id,
        bull_name: male.name || male.tag_id,
        priority: Math.round(100 - compatibilityScore),
        inbreeding_coefficient: inbreeding.coefficient,
        compatibility_score: Math.min(100, Math.max(0, compatibilityScore)),
        status: 'sugerido',
        created_at: new Date().toISOString(),
        expected_improvement: {
          milk: maleEval?.milk_production_index || 0,
          meat: maleEval?.meat_production_index || 0,
          fertility: maleEval?.fertility_index || 0,
        },
      } as BreedingSuggestion;
    });

    return suggestions.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
  };

  // Estadísticas genéticas del hato
  const getGeneticStats = () => {
    const activeAnimals = animals.filter(a => a.status === 'activo');
    const animalsWithEval = evaluations.filter(e => 
      activeAnimals.some(a => a.id === e.animal_id)
    );

    const avgGeneticValue = animalsWithEval.length > 0
      ? animalsWithEval.reduce((sum, e) => sum + (e.overall_genetic_value || 0), 0) / animalsWithEval.length
      : 0;

    const avgMilkIndex = animalsWithEval.length > 0
      ? animalsWithEval.reduce((sum, e) => sum + (e.milk_production_index || 0), 0) / animalsWithEval.length
      : 0;

    const avgMeatIndex = animalsWithEval.length > 0
      ? animalsWithEval.reduce((sum, e) => sum + (e.meat_production_index || 0), 0) / animalsWithEval.length
      : 0;

    const topReproducers = [...animalsWithEval]
      .sort((a, b) => (b.overall_genetic_value || 0) - (a.overall_genetic_value || 0))
      .slice(0, 10)
      .map(e => {
        const animal = animals.find(a => a.id === e.animal_id);
        return { ...e, animal };
      });

    return {
      totalEvaluations: evaluations.length,
      animalsEvaluated: new Set(evaluations.map(e => e.animal_id)).size,
      avgGeneticValue: Math.round(avgGeneticValue * 10) / 10,
      avgMilkIndex: Math.round(avgMilkIndex * 10) / 10,
      avgMeatIndex: Math.round(avgMeatIndex * 10) / 10,
      pendingSuggestions: suggestions.filter(s => s.status === 'pendiente').length,
      topReproducers,
    };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      await Promise.all([fetchEvaluations(), fetchSuggestions()]);
      setLoading(false);
    };
    init();
  }, []);

  return {
    evaluations,
    suggestions,
    loading,
    createEvaluation,
    createSuggestion,
    updateSuggestionStatus,
    deleteSuggestion,
    buildPedigree,
    calculateInbreeding,
    generateBreedingSuggestions,
    getGeneticStats,
    refetch: () => Promise.all([fetchEvaluations(), fetchSuggestions()]),
  };
};
