import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface HealthEvent {
  id: string;
  animal_id: string;
  event_type: 'tratamiento' | 'vacuna' | 'diagnostico';
  event_date: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  dosage: string | null;
  duration_days: number | null;
  next_dose_date: string | null;
  withdrawal_days: number | null;
  withdrawal_end_date: string | null;
  veterinarian: string | null;
  cost: number | null;
  status: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
  animal?: {
    id: string;
    tag_id: string;
    name: string | null;
  };
}

export interface VaccinationSchedule {
  id: string;
  animal_id: string | null;
  lot_name: string | null;
  vaccine_name: string;
  scheduled_date: string;
  applied_date: string | null;
  next_application_date: string | null;
  dose_number: number;
  is_applied: boolean;
  notes: string | null;
  created_at: string;
  animal?: {
    id: string;
    tag_id: string;
    name: string | null;
  };
}

export interface HealthStats {
  inTreatment: number;
  pendingVaccines: number;
  mastitisCases: number;
  totalEvents: number;
  overdueVaccines: number;
  withdrawalActive: number;
}

export interface DiagnosisStats {
  diagnosis: string;
  count: number;
  percentage: number;
}

const COMMON_DIAGNOSES = [
  'Mastitis',
  'Cojera',
  'Retención de Placenta',
  'Metritis',
  'Neumonía',
  'Diarrea',
  'Fiebre de Leche',
  'Cetosis',
  'Parásitos',
  'Timpanismo',
  'Otro',
];

const COMMON_VACCINES = [
  'Fiebre Aftosa',
  'Brucelosis',
  'Carbón Sintomático',
  'Rabia',
  'IBR',
  'DVB',
  'Leptospirosis',
  'Clostridiales',
];

export const useHealth = () => {
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationSchedule[]>([]);
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

  const fetchHealthEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('health_events')
        .select(`
          *,
          animal:animals(id, tag_id, name)
        `)
        .order('event_date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setHealthEvents((data || []) as HealthEvent[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos de salud',
        variant: 'destructive',
      });
    }
  };

  const fetchVaccinations = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccination_schedule')
        .select(`
          *,
          animal:animals(id, tag_id, name)
        `)
        .order('scheduled_date', { ascending: true })
        .limit(500);

      if (error) throw error;
      setVaccinations((data || []) as VaccinationSchedule[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las vacunaciones',
        variant: 'destructive',
      });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchHealthEvents(), fetchVaccinations()]);
    setLoading(false);
  };

  const addHealthEvent = async (event: {
    animal_id: string;
    event_type: 'tratamiento' | 'vacuna' | 'diagnostico';
    event_date: string;
    diagnosis?: string;
    treatment?: string;
    medication?: string;
    dosage?: string;
    duration_days?: number;
    next_dose_date?: string;
    withdrawal_days?: number;
    veterinarian?: string;
    cost?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      let withdrawal_end_date: string | null = null;
      if (event.withdrawal_days && event.event_date) {
        const endDate = new Date(event.event_date);
        endDate.setDate(endDate.getDate() + event.withdrawal_days);
        withdrawal_end_date = endDate.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('health_events')
        .insert({
          ...event,
          withdrawal_end_date,
          organization_id: organizationId,
          created_by: user?.id,
          status: 'activo',
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Evento de salud registrado' });
      await fetchHealthEvents();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el evento',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateHealthEvent = async (id: string, updates: Partial<HealthEvent>) => {
    try {
      const { error } = await supabase
        .from('health_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Evento actualizado' });
      await fetchHealthEvents();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const deleteHealthEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('health_events').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Evento eliminado' });
      await fetchHealthEvents();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const addVaccination = async (vaccination: {
    animal_id?: string;
    lot_name?: string;
    vaccine_name: string;
    scheduled_date: string;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('vaccination_schedule')
        .insert({
          ...vaccination,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Vacunación programada' });
      await fetchVaccinations();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo programar la vacunación',
        variant: 'destructive',
      });
      return null;
    }
  };

  const applyVaccination = async (id: string, appliedDate: string, nextDate?: string) => {
    try {
      const { error } = await supabase
        .from('vaccination_schedule')
        .update({
          is_applied: true,
          applied_date: appliedDate,
          next_application_date: nextDate || null,
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Vacuna aplicada' });
      await fetchVaccinations();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo registrar la aplicación', variant: 'destructive' });
    }
  };

  const deleteVaccination = async (id: string) => {
    try {
      const { error } = await supabase.from('vaccination_schedule').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Vacunación eliminada' });
      await fetchVaccinations();
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const getStats = (): HealthStats => {
    const today = new Date().toISOString().split('T')[0];

    const inTreatment = healthEvents.filter(
      e => e.status === 'activo' && e.event_type === 'tratamiento'
    ).length;

    const pendingVaccines = vaccinations.filter(
      v => !v.is_applied && v.scheduled_date >= today
    ).length;

    const overdueVaccines = vaccinations.filter(
      v => !v.is_applied && v.scheduled_date < today
    ).length;

    const mastitisCases = healthEvents.filter(
      e => e.diagnosis?.toLowerCase().includes('mastitis') && e.status === 'activo'
    ).length;

    const withdrawalActive = healthEvents.filter(
      e => e.withdrawal_end_date && e.withdrawal_end_date >= today
    ).length;

    return {
      inTreatment,
      pendingVaccines,
      mastitisCases,
      totalEvents: healthEvents.length,
      overdueVaccines,
      withdrawalActive,
    };
  };

  const getDiagnosisStats = (): DiagnosisStats[] => {
    const diagnosisCounts: Record<string, number> = {};
    
    healthEvents.forEach(e => {
      if (e.diagnosis) {
        const key = e.diagnosis;
        diagnosisCounts[key] = (diagnosisCounts[key] || 0) + 1;
      }
    });

    const total = Object.values(diagnosisCounts).reduce((a, b) => a + b, 0);

    return Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getAlerts = () => {
    const today = new Date().toISOString().split('T')[0];
    const alerts: { type: 'warning' | 'danger' | 'info'; message: string; count: number }[] = [];

    // Vacunas vencidas
    const overdue = vaccinations.filter(v => !v.is_applied && v.scheduled_date < today);
    if (overdue.length > 0) {
      alerts.push({
        type: 'danger',
        message: 'Vacunas vencidas sin aplicar',
        count: overdue.length,
      });
    }

    // Próximas vacunas (7 días)
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcoming = vaccinations.filter(
      v => !v.is_applied && v.scheduled_date >= today && v.scheduled_date <= weekFromNow
    );
    if (upcoming.length > 0) {
      alerts.push({
        type: 'warning',
        message: 'Vacunas programadas esta semana',
        count: upcoming.length,
      });
    }

    // Animales en retiro
    const inWithdrawal = healthEvents.filter(
      e => e.withdrawal_end_date && e.withdrawal_end_date >= today
    );
    if (inWithdrawal.length > 0) {
      alerts.push({
        type: 'info',
        message: 'Animales en período de retiro',
        count: inWithdrawal.length,
      });
    }

    // Tratamientos activos prolongados (>7 días)
    const prolonged = healthEvents.filter(e => {
      if (e.status !== 'activo' || e.event_type !== 'tratamiento') return false;
      const daysSinceStart = Math.ceil(
        (new Date().getTime() - new Date(e.event_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceStart > 7;
    });
    if (prolonged.length > 0) {
      alerts.push({
        type: 'warning',
        message: 'Tratamientos activos por más de 7 días',
        count: prolonged.length,
      });
    }

    return alerts;
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchAll();
      }
    };
    init();
  }, [user]);

  return {
    healthEvents,
    vaccinations,
    loading,
    addHealthEvent,
    updateHealthEvent,
    deleteHealthEvent,
    addVaccination,
    applyVaccination,
    deleteVaccination,
    getStats,
    getDiagnosisStats,
    getAlerts,
    fetchAll,
    COMMON_DIAGNOSES,
    COMMON_VACCINES,
  };
};
