import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScoreDefinition {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  score_type: 'numeric' | 'scale' | 'boolean' | 'text';
  min_value: number | null;
  max_value: number | null;
  scale_labels: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnimalScore {
  id: string;
  organization_id: string;
  animal_id: string;
  score_definition_id: string;
  numeric_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  recorded_at: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  score_definition?: ScoreDefinition;
  animal?: { tag_id: string; name: string | null };
}

export interface CreateScoreDefinitionData {
  name: string;
  description?: string;
  score_type: 'numeric' | 'scale' | 'boolean' | 'text';
  min_value?: number;
  max_value?: number;
  scale_labels?: Record<string, string>;
}

export interface CreateAnimalScoreData {
  animal_id: string;
  score_definition_id: string;
  numeric_value?: number;
  text_value?: string;
  boolean_value?: boolean;
  notes?: string;
}

export const useCustomScores = () => {
  const [definitions, setDefinitions] = useState<ScoreDefinition[]>([]);
  const [scores, setScores] = useState<AnimalScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDefinitions = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('custom_score_definitions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDefinitions((data as ScoreDefinition[]) || []);
    } catch (error: any) {
      console.error('Error fetching score definitions:', error);
    }
  };

  const fetchScores = async (animalId?: string) => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      let query = supabase
        .from('animal_custom_scores')
        .select(`
          *,
          score_definition:custom_score_definitions(*),
          animal:animals(tag_id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('recorded_at', { ascending: false });

      if (animalId) {
        query = query.eq('animal_id', animalId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScores((data as any[]) || []);
    } catch (error: any) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefinition = async (defData: CreateScoreDefinitionData) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase.from('custom_score_definitions').insert({
        organization_id: profile.organization_id,
        ...defData,
      });

      if (error) throw error;

      toast({
        title: '¡Score creado!',
        description: 'El tipo de score personalizado se ha creado correctamente.',
      });

      await fetchDefinitions();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const updateDefinition = async (defId: string, updates: Partial<ScoreDefinition>) => {
    try {
      const { error } = await supabase
        .from('custom_score_definitions')
        .update(updates)
        .eq('id', defId);

      if (error) throw error;

      toast({
        title: '¡Actualizado!',
        description: 'El tipo de score se ha actualizado.',
      });

      await fetchDefinitions();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const deleteDefinition = async (defId: string) => {
    try {
      const { error } = await supabase
        .from('custom_score_definitions')
        .update({ is_active: false })
        .eq('id', defId);

      if (error) throw error;

      toast({
        title: '¡Eliminado!',
        description: 'El tipo de score se ha desactivado.',
      });

      await fetchDefinitions();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const recordScore = async (scoreData: CreateAnimalScoreData) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, user_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase.from('animal_custom_scores').insert({
        organization_id: profile.organization_id,
        recorded_by: profile.user_id,
        recorded_at: new Date().toISOString(),
        ...scoreData,
      });

      if (error) throw error;

      toast({
        title: '¡Score registrado!',
        description: 'El score se ha guardado correctamente.',
      });

      await fetchScores(scoreData.animal_id);
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const deleteScore = async (scoreId: string) => {
    try {
      const { error } = await supabase
        .from('animal_custom_scores')
        .delete()
        .eq('id', scoreId);

      if (error) throw error;

      toast({
        title: '¡Eliminado!',
        description: 'El registro se ha eliminado.',
      });

      await fetchScores();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchDefinitions();
    fetchScores();
  }, []);

  return {
    definitions,
    scores,
    loading,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    recordScore,
    deleteScore,
    refetchDefinitions: fetchDefinitions,
    refetchScores: fetchScores,
  };
};
