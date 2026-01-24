import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useMilkProduction } from './useMilkProduction';
import { useWeightRecords } from './useWeightRecords';
import { useAnimals } from './useAnimals';
import { useCostos } from './useCostos';
import { useFeeding } from './useFeeding';
import { useReproduction } from './useReproduction';

export interface KPIThreshold {
  id: string;
  organization_id: string;
  kpi_name: string;
  kpi_category: string;
  warning_threshold: number;
  critical_threshold: number;
  comparison_operator: 'below' | 'above';
  is_active: boolean;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export interface KPIStatus {
  name: string;
  displayName: string;
  currentValue: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  status: 'ok' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  category: string;
}

const KPI_DISPLAY_NAMES: Record<string, string> = {
  milk_production_avg: 'Producción de Leche Promedio',
  daily_weight_gain: 'Ganancia Diaria de Peso',
  calving_interval: 'Intervalo Entre Partos',
  conception_rate: 'Tasa de Concepción',
  mortality_rate: 'Tasa de Mortalidad',
  open_days_avg: 'Días Abiertos Promedio',
  profit_margin: 'Margen de Utilidad',
  feed_stock_days: 'Días de Stock de Alimento',
};

const KPI_UNITS: Record<string, string> = {
  milk_production_avg: 'L/día',
  daily_weight_gain: 'kg/día',
  calving_interval: 'días',
  conception_rate: '%',
  mortality_rate: '%',
  open_days_avg: 'días',
  profit_margin: '%',
  feed_stock_days: 'días',
};

export const useKPIDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get data from other modules
  const { records: milkRecords } = useMilkProduction();
  const { records: weightRecords } = useWeightRecords();
  const { animals } = useAnimals();
  const { summary } = useCostos();
  const { inventory: feedInventory } = useFeeding();
  const { females } = useReproduction();

  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setOrganizationId(data?.organization_id || null);
    };
    getOrgId();
  }, [user]);

  // Fetch KPI thresholds
  const { data: thresholds = [], isLoading, refetch } = useQuery({
    queryKey: ['kpi-thresholds', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('kpi_thresholds')
        .select('*')
        .order('kpi_category');

      if (error) throw error;
      return data as KPIThreshold[];
    },
    enabled: !!organizationId,
  });

  // Calculate current KPI values
  const calculateKPIValue = (kpiName: string): number => {
    switch (kpiName) {
      case 'milk_production_avg': {
        if (!milkRecords || milkRecords.length === 0) return 0;
        const totalLiters = milkRecords.reduce((sum, r) => sum + Number(r.total_liters || 0), 0);
        const uniqueDays = new Set(milkRecords.map(r => r.production_date)).size;
        return uniqueDays > 0 ? Math.round((totalLiters / uniqueDays) * 10) / 10 : 0;
      }

      case 'daily_weight_gain': {
        if (!weightRecords || weightRecords.length === 0) return 0;
        const gains = weightRecords.filter(r => r.daily_gain && Number(r.daily_gain) > 0);
        return gains.length > 0 
          ? Math.round((gains.reduce((sum, r) => sum + Number(r.daily_gain || 0), 0) / gains.length) * 100) / 100
          : 0;
      }

      case 'mortality_rate': {
        if (!animals || animals.length === 0) return 0;
        const deadAnimals = animals.filter(a => a.status === 'muerto').length;
        return Math.round((deadAnimals / animals.length) * 1000) / 10;
      }

      case 'profit_margin': {
        return summary ? Math.round(summary.margenNeto * 10) / 10 : 0;
      }

      case 'feed_stock_days': {
        if (!feedInventory || feedInventory.length === 0) return 0;
        // Estimate days of stock based on current consumption
        const totalStock = feedInventory.reduce((sum, f) => sum + Number(f.current_stock || 0), 0);
        const avgDailyConsumption = 50; // kg per day estimate
        return Math.round(totalStock / avgDailyConsumption);
      }

      case 'conception_rate': {
        // This would need reproduction data
        return 0;
      }

      case 'calving_interval': {
        if (!females || females.length === 0) return 0;
        const animalsWithCalvings = females.filter(f => 
          f.first_calving_date && f.last_calving_date && f.total_calvings && f.total_calvings > 1
        );
        if (animalsWithCalvings.length === 0) return 0;

        let totalDays = 0;
        animalsWithCalvings.forEach(animal => {
          if (animal.first_calving_date && animal.last_calving_date && animal.total_calvings) {
            const first = new Date(animal.first_calving_date);
            const last = new Date(animal.last_calving_date);
            const days = Math.abs(last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days / (animal.total_calvings - 1);
          }
        });
        return Math.round(totalDays / animalsWithCalvings.length);
      }

      case 'open_days_avg': {
        // Calculate average open days for females
        if (!females || females.length === 0) return 0;
        const femalesWithCalving = females.filter(f => f.last_calving_date);
        if (femalesWithCalving.length === 0) return 0;

        const now = new Date();
        let totalOpenDays = 0;
        femalesWithCalving.forEach(animal => {
          if (animal.last_calving_date) {
            const lastCalving = new Date(animal.last_calving_date);
            const openDays = Math.floor((now.getTime() - lastCalving.getTime()) / (1000 * 60 * 60 * 24));
            totalOpenDays += openDays;
          }
        });
        return Math.round(totalOpenDays / femalesWithCalving.length);
      }

      default:
        return 0;
    }
  };

  // Determine KPI status
  const getKPIStatus = (threshold: KPIThreshold): KPIStatus => {
    const currentValue = calculateKPIValue(threshold.kpi_name);
    let status: 'ok' | 'warning' | 'critical' = 'ok';

    if (threshold.comparison_operator === 'below') {
      if (currentValue < threshold.critical_threshold) status = 'critical';
      else if (currentValue < threshold.warning_threshold) status = 'warning';
    } else {
      if (currentValue > threshold.critical_threshold) status = 'critical';
      else if (currentValue > threshold.warning_threshold) status = 'warning';
    }

    return {
      name: threshold.kpi_name,
      displayName: KPI_DISPLAY_NAMES[threshold.kpi_name] || threshold.kpi_name,
      currentValue,
      unit: KPI_UNITS[threshold.kpi_name] || '',
      warningThreshold: threshold.warning_threshold,
      criticalThreshold: threshold.critical_threshold,
      status,
      trend: 'stable', // Would need historical data to calculate
      category: threshold.kpi_category,
    };
  };

  // Get all KPI statuses
  const kpiStatuses = thresholds.filter(t => t.is_active).map(getKPIStatus);

  // Count alerts
  const alertCounts = {
    critical: kpiStatuses.filter(k => k.status === 'critical').length,
    warning: kpiStatuses.filter(k => k.status === 'warning').length,
    ok: kpiStatuses.filter(k => k.status === 'ok').length,
  };

  // Update threshold
  const updateThreshold = useMutation({
    mutationFn: async ({ id, ...data }: Partial<KPIThreshold> & { id: string }) => {
      const { error } = await supabase
        .from('kpi_thresholds')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-thresholds'] });
      toast.success('Umbral actualizado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Toggle threshold active
  const toggleThreshold = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('kpi_thresholds')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-thresholds'] });
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  return {
    thresholds,
    kpiStatuses,
    alertCounts,
    isLoading,
    refetch,
    updateThreshold,
    toggleThreshold,
  };
};
