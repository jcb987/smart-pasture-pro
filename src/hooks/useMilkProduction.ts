import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB } from '@/lib/offlineDB';

export interface MilkRecord {
  id: string;
  animal_id: string;
  organization_id?: string;
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
  created_by?: string;
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
        const { data, error } = await supabase
          .from('milk_production')
          .select(`
            *,
            animal:animals(id, tag_id, name)
          `)
          .order('production_date', { ascending: false })
          .limit(500);

        if (error) throw error;
        
        const serverRecords = (data as MilkRecord[]) || [];
        setRecords(serverRecords);

        // Cache locally
        if (serverRecords.length > 0) {
          await offlineDB.bulkSave(
            'milk_production',
            serverRecords.map(r => ({ id: r.id, data: r as unknown as Record<string, unknown> }))
          );
          await offlineDB.setMetadata('lastSync_milk_production', new Date().toISOString());
        }
      } else {
        // Load from offline storage
        const offlineRecords = await offlineDB.getAllRecords<MilkRecord>('milk_production');
        setRecords(offlineRecords);
        
        if (offlineRecords.length > 0) {
          toast({
            title: 'Modo Offline',
            description: `Mostrando ${offlineRecords.length} registros de leche guardados`,
          });
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching milk records:', error);
      
      // Fallback to offline
      const offlineRecords = await offlineDB.getAllRecords<MilkRecord>('milk_production');
      setRecords(offlineRecords);
      
      if (offlineRecords.length === 0) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los registros de leche',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, toast]);

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
    const orgId = organizationId || await getOrganizationId();
    if (!orgId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const morning = record.morning_liters || 0;
      const afternoon = record.afternoon_liters || 0;
      const evening = record.evening_liters || 0;
      const total = morning + afternoon + evening;

      const newRecord: MilkRecord = {
        id: crypto.randomUUID(),
        animal_id: record.animal_id,
        organization_id: orgId,
        production_date: record.production_date,
        morning_liters: morning,
        afternoon_liters: afternoon,
        evening_liters: evening,
        total_liters: total,
        fat_percentage: record.fat_percentage || null,
        protein_percentage: record.protein_percentage || null,
        somatic_cell_count: record.somatic_cell_count || null,
        notes: record.notes || null,
        created_at: new Date().toISOString(),
        created_by: user?.id,
      };

      // Add to local state immediately
      setRecords(prev => [newRecord, ...prev]);

      // Only send valid DB columns to the sync queue (exclude 'animal' relation)
      const dbRecord: Record<string, unknown> = {
        id: newRecord.id,
        animal_id: newRecord.animal_id,
        organization_id: newRecord.organization_id,
        production_date: newRecord.production_date,
        morning_liters: newRecord.morning_liters,
        afternoon_liters: newRecord.afternoon_liters,
        evening_liters: newRecord.evening_liters,
        
        fat_percentage: newRecord.fat_percentage,
        protein_percentage: newRecord.protein_percentage,
        somatic_cell_count: newRecord.somatic_cell_count,
        notes: newRecord.notes,
        created_at: newRecord.created_at,
        created_by: newRecord.created_by,
      };

      // Save with offline support
      await saveOffline('milk_production', 'milk_production', 'INSERT', dbRecord);

      toast({ 
        title: 'Éxito', 
        description: isOnline 
          ? 'Producción registrada correctamente'
          : 'Registro guardado localmente. Se sincronizará cuando haya conexión.'
      });
      
      return newRecord;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage || 'No se pudo registrar la producción',
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
      await saveOffline('milk_production', 'milk_production', 'DELETE', { id });

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

  const getStats = (): MilkStats => {
    const formatLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const today = formatLocal(new Date());
    const weekAgo = formatLocal(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const monthAgo = formatLocal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

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
    const sd = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const startDate = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`;

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
      const dd = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const date = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
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
    getProductionCurve,
    fetchRecords,
  };
};
