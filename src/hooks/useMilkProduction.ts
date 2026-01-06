import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MilkRecord {
  id: string;
  animal_id: string;
  production_date: string;
  morning_liters: number;
  afternoon_liters: number;
  evening_liters: number;
  total_liters: number;
  fat_percentage: number | null;
  protein_percentage: number | null;
  somatic_cell_count: number | null;
  notes: string | null;
  created_at: string;
  animal?: {
    id: string;
    tag_id: string;
    name: string | null;
  };
}

export interface MilkStats {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  avgPerCow: number;
  lactatingCows: number;
  avgFat: number | null;
  avgProtein: number | null;
}

export interface AnimalRanking {
  animal_id: string;
  tag_id: string;
  name: string | null;
  total_liters: number;
  avg_liters: number;
  records_count: number;
}

export const useMilkProduction = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
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
        .from('milk_production')
        .select(`
          *,
          animal:animals(id, tag_id, name)
        `)
        .order('production_date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros de leche',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (record: {
    animal_id: string;
    production_date: string;
    morning_liters?: number;
    afternoon_liters?: number;
    evening_liters?: number;
    fat_percentage?: number;
    protein_percentage?: number;
    somatic_cell_count?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('milk_production')
        .insert({
          ...record,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Producción registrada correctamente' });
      await fetchRecords();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar la producción',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('milk_production').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Registro eliminado' });
      await fetchRecords();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  const getStats = (): MilkStats => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayRecords = records.filter(r => r.production_date === today);
    const weekRecords = records.filter(r => r.production_date >= weekAgo);
    const monthRecords = records.filter(r => r.production_date >= monthAgo);

    const todayTotal = todayRecords.reduce((sum, r) => sum + (r.total_liters || 0), 0);
    const weekTotal = weekRecords.reduce((sum, r) => sum + (r.total_liters || 0), 0);
    const monthTotal = monthRecords.reduce((sum, r) => sum + (r.total_liters || 0), 0);

    const uniqueCowsToday = new Set(todayRecords.map(r => r.animal_id)).size;
    const avgPerCow = uniqueCowsToday > 0 ? todayTotal / uniqueCowsToday : 0;

    const withFat = monthRecords.filter(r => r.fat_percentage);
    const withProtein = monthRecords.filter(r => r.protein_percentage);

    return {
      todayTotal,
      weekTotal,
      monthTotal,
      avgPerCow,
      lactatingCows: uniqueCowsToday,
      avgFat: withFat.length > 0 ? withFat.reduce((s, r) => s + (r.fat_percentage || 0), 0) / withFat.length : null,
      avgProtein: withProtein.length > 0 ? withProtein.reduce((s, r) => s + (r.protein_percentage || 0), 0) / withProtein.length : null,
    };
  };

  const getRankings = (period: 'week' | 'month' | 'year' = 'month'): AnimalRanking[] => {
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const periodRecords = records.filter(r => r.production_date >= startDate);

    const animalMap = new Map<string, { total: number; count: number; tag_id: string; name: string | null }>();

    periodRecords.forEach(r => {
      const existing = animalMap.get(r.animal_id);
      if (existing) {
        existing.total += r.total_liters || 0;
        existing.count += 1;
      } else {
        animalMap.set(r.animal_id, {
          total: r.total_liters || 0,
          count: 1,
          tag_id: r.animal?.tag_id || '',
          name: r.animal?.name || null,
        });
      }
    });

    return Array.from(animalMap.entries())
      .map(([animal_id, data]) => ({
        animal_id,
        tag_id: data.tag_id,
        name: data.name,
        total_liters: data.total,
        avg_liters: data.total / data.count,
        records_count: data.count,
      }))
      .sort((a, b) => b.total_liters - a.total_liters);
  };

  const getProductionCurve = (animalId?: string) => {
    const last30Days: { date: string; total: number }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayRecords = records.filter(r => 
        r.production_date === date && 
        (!animalId || r.animal_id === animalId)
      );
      const total = dayRecords.reduce((sum, r) => sum + (r.total_liters || 0), 0);
      last30Days.push({ date, total });
    }

    return last30Days;
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
    getProductionCurve,
    fetchRecords,
  };
};
