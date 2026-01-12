import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HealthEvent } from './useHealth';

export interface ParasiteSchedule {
  id: string;
  animalId: string;
  tagId: string;
  name: string | null;
  lastTreatmentDate: string | null;
  nextTreatmentDate: string;
  productUsed: string | null;
  daysUntilNext: number;
  status: 'pending' | 'overdue' | 'upcoming' | 'done';
  history: {
    date: string;
    product: string;
    notes: string | null;
  }[];
}

export interface ParasiteStats {
  totalAnimals: number;
  upToDate: number;
  pending: number;
  overdue: number;
  percentageProtected: number;
}

// Intervalos estándar de desparasitación (en días)
const DEWORMING_INTERVALS: Record<string, number> = {
  ternero: 45,
  ternera: 45,
  novillo: 60,
  novilla: 60,
  vaca: 90,
  toro: 90,
  bufala: 90,
  bufalo: 90,
  becerro: 30,
  becerra: 30,
};

/**
 * Hook para control y programación de desparasitaciones
 * Funcionalidad de alta prioridad del análisis InterHerd
 */
export function useParasiteControl() {
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Obtener ID de organización
  const getOrganizationId = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  };

  // Cargar datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthResult, animalsResult] = await Promise.all([
        supabase
          .from('health_events')
          .select('*')
          .ilike('diagnosis', '%parásito%')
          .order('event_date', { ascending: false }),
        supabase
          .from('animals')
          .select('id, tag_id, name, category, status')
          .eq('status', 'activo')
      ]);

      if (healthResult.data) {
        setHealthEvents(healthResult.data as HealthEvent[]);
      }
      if (animalsResult.data) {
        setAnimals(animalsResult.data);
      }
    } catch (error) {
      console.error('Error fetching parasite data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchData();
      }
    };
    init();
  }, [user]);

  /**
   * Calcular programación de desparasitación para cada animal
   */
  const schedules = useMemo((): ParasiteSchedule[] => {
    const today = new Date();
    
    return animals.map(animal => {
      // Buscar último tratamiento de parásitos
      const parasiteEvents = healthEvents.filter(e => 
        e.animal_id === animal.id && 
        (e.diagnosis?.toLowerCase().includes('parásito') || 
         e.treatment?.toLowerCase().includes('desparasit') ||
         e.medication?.toLowerCase().includes('ivermectina') ||
         e.medication?.toLowerCase().includes('albendazol') ||
         e.medication?.toLowerCase().includes('fenbendazol'))
      );

      const lastTreatment = parasiteEvents[0] || null;
      const interval = DEWORMING_INTERVALS[animal.category] || 90;
      
      let nextTreatmentDate: Date;
      if (lastTreatment) {
        nextTreatmentDate = new Date(lastTreatment.event_date);
        nextTreatmentDate.setDate(nextTreatmentDate.getDate() + interval);
      } else {
        // Si nunca se ha desparasitado, programar para hoy
        nextTreatmentDate = new Date();
      }

      const daysUntilNext = Math.ceil(
        (nextTreatmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: 'pending' | 'overdue' | 'upcoming' | 'done';
      if (daysUntilNext < -7) status = 'overdue';
      else if (daysUntilNext < 0) status = 'pending';
      else if (daysUntilNext <= 7) status = 'upcoming';
      else status = 'done';

      const history = parasiteEvents.slice(0, 5).map(e => ({
        date: e.event_date,
        product: e.medication || e.treatment || 'No especificado',
        notes: e.notes
      }));

      return {
        id: animal.id,
        animalId: animal.id,
        tagId: animal.tag_id,
        name: animal.name,
        lastTreatmentDate: lastTreatment?.event_date || null,
        nextTreatmentDate: nextTreatmentDate.toISOString().split('T')[0],
        productUsed: lastTreatment?.medication || null,
        daysUntilNext,
        status,
        history
      };
    }).sort((a, b) => a.daysUntilNext - b.daysUntilNext);
  }, [animals, healthEvents]);

  /**
   * Estadísticas generales de control parasitario
   */
  const stats = useMemo((): ParasiteStats => {
    const upToDate = schedules.filter(s => s.status === 'done').length;
    const pending = schedules.filter(s => s.status === 'pending' || s.status === 'upcoming').length;
    const overdue = schedules.filter(s => s.status === 'overdue').length;

    return {
      totalAnimals: schedules.length,
      upToDate,
      pending,
      overdue,
      percentageProtected: schedules.length > 0 
        ? Math.round((upToDate / schedules.length) * 100) 
        : 0
    };
  }, [schedules]);

  /**
   * Animales que necesitan desparasitación urgente
   */
  const urgentAnimals = useMemo(() => {
    return schedules.filter(s => s.status === 'overdue' || s.status === 'pending');
  }, [schedules]);

  /**
   * Próximos animales a desparasitar (próximos 7 días)
   */
  const upcomingAnimals = useMemo(() => {
    return schedules.filter(s => s.status === 'upcoming');
  }, [schedules]);

  /**
   * Registrar desparasitación
   */
  const registerDeworming = async (data: {
    animalId: string;
    date: string;
    medication: string;
    dosage?: string;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from('health_events')
        .insert({
          animal_id: data.animalId,
          organization_id: organizationId,
          event_type: 'tratamiento',
          event_date: data.date,
          diagnosis: 'Control de Parásitos',
          treatment: 'Desparasitación',
          medication: data.medication,
          dosage: data.dosage,
          notes: data.notes,
          status: 'completado',
          outcome: 'aplicado',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Desparasitación registrada correctamente' });
      await fetchData();
      return result;
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudo registrar la desparasitación',
        variant: 'destructive'
      });
      return null;
    }
  };

  /**
   * Registrar desparasitación masiva por lote
   */
  const registerBulkDeworming = async (data: {
    animalIds: string[];
    date: string;
    medication: string;
    dosage?: string;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return false;
    }

    try {
      const inserts = data.animalIds.map(animalId => ({
        animal_id: animalId,
        organization_id: organizationId,
        event_type: 'tratamiento' as const,
        event_date: data.date,
        diagnosis: 'Control de Parásitos',
        treatment: 'Desparasitación',
        medication: data.medication,
        dosage: data.dosage,
        notes: data.notes,
        status: 'completado',
        outcome: 'aplicado',
        created_by: user?.id
      }));

      const { error } = await supabase
        .from('health_events')
        .insert(inserts);

      if (error) throw error;

      toast({ 
        title: 'Éxito', 
        description: `${data.animalIds.length} animales desparasitados correctamente` 
      });
      await fetchData();
      return true;
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudo registrar la desparasitación',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    loading,
    schedules,
    stats,
    urgentAnimals,
    upcomingAnimals,
    registerDeworming,
    registerBulkDeworming,
    refetch: fetchData
  };
}
