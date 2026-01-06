import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface WeightRecord {
  id: string;
  animal_id: string;
  weight_date: string;
  weight_kg: number;
  weight_type: string;
  condition_score: number | null;
  daily_gain: number | null;
  notes: string | null;
  created_at: string;
  animal?: {
    id: string;
    tag_id: string;
    name: string | null;
    category: string;
  };
}

export interface MeatStats {
  animalsInFattening: number;
  avgWeight: number;
  avgDailyGain: number;
  readyForSale: number;
  totalWeightGainMonth: number;
}

export interface AnimalGainRanking {
  animal_id: string;
  tag_id: string;
  name: string | null;
  category: string;
  initial_weight: number;
  current_weight: number;
  total_gain: number;
  avg_daily_gain: number;
  days_tracked: number;
}

export const useWeightRecords = () => {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getOrganizationId = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weight_records')
        .select(`
          *,
          animal:animals(id, tag_id, name, category)
        `)
        .order('weight_date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros de peso',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (record: {
    animal_id: string;
    weight_date: string;
    weight_kg: number;
    weight_type?: string;
    condition_score?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      // Calculate daily gain based on previous record
      const { data: prevRecords } = await supabase
        .from('weight_records')
        .select('weight_kg, weight_date')
        .eq('animal_id', record.animal_id)
        .lt('weight_date', record.weight_date)
        .order('weight_date', { ascending: false })
        .limit(1);

      let daily_gain: number | null = null;
      if (prevRecords && prevRecords.length > 0) {
        const prev = prevRecords[0];
        const daysDiff = Math.ceil(
          (new Date(record.weight_date).getTime() - new Date(prev.weight_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 0) {
          daily_gain = ((record.weight_kg - prev.weight_kg) / daysDiff) * 1000; // g/día
        }
      }

      const { data, error } = await supabase
        .from('weight_records')
        .insert({
          ...record,
          daily_gain,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update animal's current weight
      await supabase
        .from('animals')
        .update({ 
          current_weight: record.weight_kg, 
          last_weight_date: record.weight_date 
        })
        .eq('id', record.animal_id);

      toast({ title: 'Éxito', description: 'Peso registrado correctamente' });
      await fetchRecords();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el peso',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('weight_records').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Registro eliminado' });
      await fetchRecords();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  const getStats = async (): Promise<MeatStats> => {
    // Get animals in fattening categories
    const { data: fatteningAnimals } = await supabase
      .from('animals')
      .select('id, current_weight')
      .in('category', ['novillo', 'novilla', 'ternero', 'ternera'])
      .eq('status', 'activo');

    const animalsInFattening = fatteningAnimals?.length || 0;
    const weights = fatteningAnimals?.filter(a => a.current_weight).map(a => a.current_weight) || [];
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

    // Get average daily gain from recent records
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentRecords = records.filter(r => r.weight_date >= monthAgo && r.daily_gain);
    const avgDailyGain = recentRecords.length > 0 
      ? recentRecords.reduce((sum, r) => sum + (r.daily_gain || 0), 0) / recentRecords.length 
      : 0;

    // Animals ready for sale (weight > 450kg)
    const readyForSale = fatteningAnimals?.filter(a => a.current_weight && a.current_weight >= 450).length || 0;

    // Total weight gain this month
    const totalWeightGainMonth = recentRecords.reduce((sum, r) => {
      const prevWeight = r.daily_gain ? r.weight_kg - (r.daily_gain / 1000) : r.weight_kg;
      return sum + (r.weight_kg - prevWeight);
    }, 0);

    return {
      animalsInFattening,
      avgWeight,
      avgDailyGain,
      readyForSale,
      totalWeightGainMonth,
    };
  };

  const getRankings = (): AnimalGainRanking[] => {
    const animalMap = new Map<string, WeightRecord[]>();

    records.forEach(r => {
      const existing = animalMap.get(r.animal_id) || [];
      existing.push(r);
      animalMap.set(r.animal_id, existing);
    });

    return Array.from(animalMap.entries())
      .map(([animal_id, animalRecords]) => {
        const sorted = animalRecords.sort((a, b) => 
          new Date(a.weight_date).getTime() - new Date(b.weight_date).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const daysDiff = Math.ceil(
          (new Date(last.weight_date).getTime() - new Date(first.weight_date).getTime()) / (1000 * 60 * 60 * 24)
        ) || 1;

        return {
          animal_id,
          tag_id: last.animal?.tag_id || '',
          name: last.animal?.name || null,
          category: last.animal?.category || '',
          initial_weight: first.weight_kg,
          current_weight: last.weight_kg,
          total_gain: last.weight_kg - first.weight_kg,
          avg_daily_gain: ((last.weight_kg - first.weight_kg) / daysDiff) * 1000,
          days_tracked: daysDiff,
        };
      })
      .filter(r => r.days_tracked > 1)
      .sort((a, b) => b.avg_daily_gain - a.avg_daily_gain);
  };

  const getGrowthCurve = (animalId: string) => {
    return records
      .filter(r => r.animal_id === animalId)
      .sort((a, b) => new Date(a.weight_date).getTime() - new Date(b.weight_date).getTime())
      .map(r => ({
        date: r.weight_date,
        weight: r.weight_kg,
        daily_gain: r.daily_gain,
      }));
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchRecords();
      }
    };
    init();
  }, [user]);

  return {
    records,
    loading,
    addRecord,
    deleteRecord,
    getStats,
    getRankings,
    getGrowthCurve,
    fetchRecords,
  };
};
