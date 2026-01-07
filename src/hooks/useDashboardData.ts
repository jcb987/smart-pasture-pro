import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface DashboardKPIs {
  totalAnimales: number;
  hembrasLactancia: number;
  produccionDiaria: number;
  alertasActivas: number;
  tasaFertilidad: number;
  produccionPromedio: number;
  diasAbiertosPromedio: number;
  partosEsperados: number;
  cambioMensual: number;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  module: string;
}

export interface RecentEvent {
  id: string;
  event: string;
  animal: string;
  time: string;
}

export const useDashboardData = () => {
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalAnimales: 0,
    hembrasLactancia: 0,
    produccionDiaria: 0,
    alertasActivas: 0,
    tasaFertilidad: 0,
    produccionPromedio: 0,
    diasAbiertosPromedio: 0,
    partosEsperados: 0,
    cambioMensual: 0,
  });
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const getOrganizationId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();
    
    return profile?.organization_id || null;
  };

  const fetchKPIs = useCallback(async () => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;

      // Fetch all active animals
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('id, sex, reproductive_status, last_calving_date, last_service_date, expected_calving_date')
        .eq('status', 'activo');

      if (animalsError) throw animalsError;

      const totalAnimales = animals?.length || 0;
      
      // Count females in lactation
      const hembrasLactancia = animals?.filter(a => 
        a.sex === 'hembra' && a.reproductive_status === 'lactancia'
      ).length || 0;

      // Count expected births (animals with expected_calving_date in next 30 days)
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const partosEsperados = animals?.filter(a => {
        if (!a.expected_calving_date) return false;
        const calvingDate = new Date(a.expected_calving_date);
        return calvingDate >= today && calvingDate <= next30Days;
      }).length || 0;

      // Calculate fertility rate (pregnancies / services)
      const { data: services } = await supabase
        .from('reproductive_events')
        .select('id, event_type, pregnancy_result')
        .in('event_type', ['servicio', 'inseminacion']);

      const totalServices = services?.length || 0;
      const confirmedPregnancies = services?.filter(s => s.pregnancy_result === 'positivo').length || 0;
      const tasaFertilidad = totalServices > 0 ? Math.round((confirmedPregnancies / totalServices) * 100) : 0;

      // Get today's milk production
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data: milkToday } = await supabase
        .from('milk_production')
        .select('total_liters')
        .eq('production_date', todayStr);

      const produccionDiaria = milkToday?.reduce((sum, r) => sum + (r.total_liters || 0), 0) || 0;
      const produccionPromedio = hembrasLactancia > 0 ? Math.round((produccionDiaria / hembrasLactancia) * 10) / 10 : 0;

      // Calculate average open days for females
      const hembrasConParto = animals?.filter(a => a.sex === 'hembra' && a.last_calving_date) || [];
      let totalDiasAbiertos = 0;
      let countDiasAbiertos = 0;

      hembrasConParto.forEach(a => {
        if (a.last_calving_date && !a.last_service_date) {
          const diasAbiertos = Math.floor((today.getTime() - new Date(a.last_calving_date).getTime()) / (1000 * 60 * 60 * 24));
          if (diasAbiertos > 0 && diasAbiertos < 365) {
            totalDiasAbiertos += diasAbiertos;
            countDiasAbiertos++;
          }
        }
      });

      const diasAbiertosPromedio = countDiasAbiertos > 0 ? Math.round(totalDiasAbiertos / countDiasAbiertos) : 0;

      // Calculate monthly change
      const lastMonth = subDays(new Date(), 30);
      const { data: animalsLastMonth } = await supabase
        .from('animals')
        .select('id')
        .eq('status', 'activo')
        .gte('created_at', format(lastMonth, 'yyyy-MM-dd'));

      const cambioMensual = animalsLastMonth?.length || 0;

      // Get active alerts count
      const alertsList = await fetchAlerts(orgId, animals || []);
      const alertasActivas = alertsList.length;

      setKpis({
        totalAnimales,
        hembrasLactancia,
        produccionDiaria,
        alertasActivas,
        tasaFertilidad,
        produccionPromedio,
        diasAbiertosPromedio,
        partosEsperados,
        cambioMensual,
      });

      setAlerts(alertsList);

    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  }, []);

  const fetchAlerts = async (orgId: string, animals: any[]): Promise<DashboardAlert[]> => {
    const alertsList: DashboardAlert[] = [];

    try {
      // Low production animals
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: milkRecords } = await supabase
        .from('milk_production')
        .select('animal_id, total_liters')
        .eq('production_date', today);

      const lowProductionCount = milkRecords?.filter(r => (r.total_liters || 0) < 10).length || 0;
      if (lowProductionCount > 0) {
        alertsList.push({
          id: 'low_production',
          type: 'warning',
          message: `${lowProductionCount} vacas con producción baja hoy`,
          module: 'Producción',
        });
      }

      // Overdue births
      const overdueBirths = animals.filter(a => {
        if (!a.expected_calving_date) return false;
        return new Date(a.expected_calving_date) < new Date();
      }).length;

      if (overdueBirths > 0) {
        alertsList.push({
          id: 'overdue_births',
          type: 'danger',
          message: `${overdueBirths} hembras con parto atrasado`,
          module: 'Reproducción',
        });
      }

      // Animals without weight record in 30 days
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: recentWeights } = await supabase
        .from('weight_records')
        .select('animal_id')
        .gte('weight_date', thirtyDaysAgo);

      const animalsWithRecentWeight = new Set(recentWeights?.map(w => w.animal_id) || []);
      const animalsWithoutWeight = animals.filter(a => !animalsWithRecentWeight.has(a.id)).length;

      if (animalsWithoutWeight > 0) {
        alertsList.push({
          id: 'no_weight',
          type: 'info',
          message: `${animalsWithoutWeight} animales sin pesar en 30 días`,
          module: 'Animales',
        });
      }

      // Pending vaccinations
      const { data: pendingVaccinations } = await supabase
        .from('vaccination_schedule')
        .select('id')
        .eq('is_applied', false)
        .lte('scheduled_date', format(new Date(), 'yyyy-MM-dd'));

      if (pendingVaccinations && pendingVaccinations.length > 0) {
        alertsList.push({
          id: 'pending_vaccines',
          type: 'warning',
          message: `${pendingVaccinations.length} vacunaciones pendientes`,
          module: 'Salud',
        });
      }

      // Active treatments
      const { data: activeHealth } = await supabase
        .from('health_events')
        .select('id')
        .eq('status', 'activo');

      if (activeHealth && activeHealth.length > 0) {
        alertsList.push({
          id: 'active_treatments',
          type: 'info',
          message: `${activeHealth.length} animales en tratamiento activo`,
          module: 'Salud',
        });
      }

    } catch (error) {
      console.error('Error fetching alerts:', error);
    }

    return alertsList;
  };

  const fetchRecentEvents = useCallback(async () => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;

      const events: RecentEvent[] = [];

      // Recent reproductive events
      const { data: reproEvents } = await supabase
        .from('reproductive_events')
        .select('id, event_type, event_date, animal_id, animals(tag_id)')
        .order('created_at', { ascending: false })
        .limit(5);

      reproEvents?.forEach(e => {
        const eventNames: Record<string, string> = {
          'parto': 'Parto registrado',
          'servicio': 'Servicio exitoso',
          'inseminacion': 'Inseminación',
          'diagnostico': 'Diagnóstico prenatal',
        };
        events.push({
          id: `repro_${e.id}`,
          event: eventNames[e.event_type] || e.event_type,
          animal: (e.animals as any)?.tag_id || 'N/A',
          time: formatTimeAgo(new Date(e.event_date)),
        });
      });

      // Recent health events
      const { data: healthEvents } = await supabase
        .from('health_events')
        .select('id, event_type, event_date, animal_id, animals(tag_id)')
        .order('created_at', { ascending: false })
        .limit(5);

      healthEvents?.forEach(e => {
        const eventNames: Record<string, string> = {
          'vacunacion': 'Vacunación aplicada',
          'tratamiento': 'Tratamiento iniciado',
          'enfermedad': 'Enfermedad registrada',
        };
        events.push({
          id: `health_${e.id}`,
          event: eventNames[e.event_type] || e.event_type,
          animal: (e.animals as any)?.tag_id || 'N/A',
          time: formatTimeAgo(new Date(e.event_date)),
        });
      });

      // Recent weight records
      const { data: weightRecords } = await supabase
        .from('weight_records')
        .select('id, weight_date, animal_id, animals(tag_id)')
        .order('created_at', { ascending: false })
        .limit(3);

      weightRecords?.forEach(e => {
        events.push({
          id: `weight_${e.id}`,
          event: 'Peso registrado',
          animal: (e.animals as any)?.tag_id || 'N/A',
          time: formatTimeAgo(new Date(e.weight_date)),
        });
      });

      // Sort by most recent and take top 5
      setRecentEvents(events.slice(0, 5));

    } catch (error) {
      console.error('Error fetching recent events:', error);
    }
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return format(date, 'dd/MM/yyyy');
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchKPIs(), fetchRecentEvents()]);
    setLastUpdated(new Date());
    setLoading(false);
  }, [fetchKPIs, fetchRecentEvents]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    kpis,
    alerts,
    recentEvents,
    loading,
    lastUpdated,
    refresh,
  };
};
