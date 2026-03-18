import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB } from '@/lib/offlineDB';

export interface WeightRecord {
  id: string;
  animal_id: string;
  organization_id?: string;
  weight_date: string;
  weight_kg: number;
  weight_type: string;
  condition_score: number | null;
  daily_gain: number | null;
  notes: string | null;
  created_at: string;
  created_by?: string;
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
  const { isOnline, saveOffline } = useOffline();

  const getOrganizationId = useCallback(async () => {
    if (!isOnline) {
      const cachedOrgId = await offlineDB.getMetadata<string>('organizationId');
      if (cachedOrgId) return cachedOrgId;
    }

    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const orgId = data?.organization_id || null;
    if (orgId) {
      await offlineDB.setMetadata('organizationId', orgId);
    }
    return orgId;
  }, [user, isOnline]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      await initDB();

      if (isOnline) {
        const orgId = organizationId || await getOrganizationId();
        if (!orgId) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('weight_records')
          .select(`
            *,
            animal:animals(id, tag_id, name, category)
          `)
          .eq('organization_id', orgId)
          .order('weight_date', { ascending: false })
          .limit(500);

        if (error) throw error;
        
        const serverRecords = (data as WeightRecord[]) || [];
        setRecords(serverRecords);

        // Cache locally
        if (serverRecords.length > 0) {
          await offlineDB.bulkSave(
            'weight_records',
            serverRecords.map(r => ({ id: r.id, data: r as unknown as Record<string, unknown> }))
          );
          await offlineDB.setMetadata('lastSync_weight_records', new Date().toISOString());
        }
      } else {
        // Load from offline storage
        const offlineRecords = await offlineDB.getAllRecords<WeightRecord>('weight_records');
        setRecords(offlineRecords);
        
        if (offlineRecords.length > 0) {
          toast({
            title: 'Modo Offline',
            description: `Mostrando ${offlineRecords.length} registros de peso guardados`,
          });
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching weight records:', error);
      
      // Fallback to offline
      const offlineRecords = await offlineDB.getAllRecords<WeightRecord>('weight_records');
      setRecords(offlineRecords);
      
      if (offlineRecords.length === 0) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los registros de peso',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, toast]);

  const addRecord = async (record: {
    animal_id: string;
    weight_date: string;
    weight_kg: number;
    weight_type?: string;
    condition_score?: number;
    notes?: string;
  }) => {
    const orgId = organizationId || await getOrganizationId();
    if (!orgId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      // Calculate daily gain based on previous records in local state
      let daily_gain: number | null = null;
      const animalRecords = records
        .filter(r => r.animal_id === record.animal_id && r.weight_date < record.weight_date)
        .sort((a, b) => new Date(b.weight_date).getTime() - new Date(a.weight_date).getTime());
      
      if (animalRecords.length > 0) {
        const prev = animalRecords[0];
        const daysDiff = Math.ceil(
          (new Date(record.weight_date).getTime() - new Date(prev.weight_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 0) {
          daily_gain = ((record.weight_kg - prev.weight_kg) / daysDiff) * 1000; // g/día
        }
      }

      const newRecord: WeightRecord = {
        id: crypto.randomUUID(),
        animal_id: record.animal_id,
        organization_id: orgId,
        weight_date: record.weight_date,
        weight_kg: record.weight_kg,
        weight_type: record.weight_type || 'normal',
        condition_score: record.condition_score || null,
        daily_gain,
        notes: record.notes || null,
        created_at: new Date().toISOString(),
        created_by: user?.id,
      };

      // Add to local state immediately
      setRecords(prev => [newRecord, ...prev]);

      // Save with offline support
      await saveOffline('weight_records', 'weight_records', 'INSERT', newRecord as unknown as Record<string, unknown>);

      // Also update the animal's current weight
      const animalUpdate = {
        id: record.animal_id,
        current_weight: record.weight_kg,
        last_weight_date: record.weight_date,
      };
      await saveOffline('animals', 'animals', 'UPDATE', animalUpdate);

      toast({ 
        title: 'Éxito', 
        description: isOnline 
          ? 'Peso registrado correctamente'
          : 'Registro guardado localmente. Se sincronizará cuando haya conexión.'
      });
      
      return newRecord;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage || 'No se pudo registrar el peso',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      // Remove from local state immediately
      setRecords(prev => prev.filter(r => r.id !== id));

      // Save with offline support
      await saveOffline('weight_records', 'weight_records', 'DELETE', { id });

      toast({ 
        title: 'Éxito', 
        description: isOnline 
          ? 'Registro eliminado'
          : 'Eliminación guardada. Se sincronizará cuando haya conexión.'
      });
    } catch (error: unknown) {
      toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  const getStats = async (): Promise<MeatStats> => {
    // Use cached animals data if available
    let fatteningAnimals: { id: string; current_weight: number | null }[] = [];
    
    if (isOnline) {
      const { data } = await supabase
        .from('animals')
        .select('id, current_weight')
        .in('category', ['novillo', 'novilla', 'ternero', 'ternera'])
        .eq('status', 'activo');
      fatteningAnimals = data || [];
    } else {
      // Use cached animals
      const cached = await offlineDB.getAllRecords<{ id: string; current_weight: number | null; category: string; status: string }>('animals');
      fatteningAnimals = cached.filter(a => 
        ['novillo', 'novilla', 'ternero', 'ternera'].includes(a.category) && 
        a.status === 'activo'
      );
    }

    const animalsInFattening = fatteningAnimals.length;
    const weights = fatteningAnimals.filter(a => a.current_weight).map(a => a.current_weight!);
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentRecords = records.filter(r => r.weight_date >= monthAgo && r.daily_gain);
    const avgDailyGain = recentRecords.length > 0 
      ? recentRecords.reduce((sum, r) => sum + (r.daily_gain || 0), 0) / recentRecords.length 
      : 0;

    const readyForSale = fatteningAnimals.filter(a => a.current_weight && a.current_weight >= 450).length;

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
      await initDB();
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchRecords();
      }
    };
    init();
  }, [user]);

  // Re-fetch when coming back online
  useEffect(() => {
    if (isOnline && organizationId) {
      fetchRecords();
    }
  }, [isOnline, organizationId, fetchRecords]);

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
