import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useMilkProduction } from './useMilkProduction';
import { useWeightRecords } from './useWeightRecords';
import { useReproduction } from './useReproduction';
import { useHealth } from './useHealth';
import { useAnimals } from './useAnimals';

export interface RegionalBenchmark {
  id: string;
  region: string;
  country: string;
  metric_name: string;
  metric_category: string;
  metric_value: number;
  metric_unit?: string;
  sample_size?: number;
  data_period?: string;
  source?: string;
  updated_at: string;
}

export interface FarmMetric {
  metricName: string;
  farmValue: number;
  benchmarkValue: number;
  unit: string;
  difference: number;
  percentageDiff: number;
  status: 'above' | 'below' | 'equal';
  category: string;
}

export const useBenchmarking = () => {
  const { user } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<string>('Nacional');
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get data from other modules
  const { records: milkRecords } = useMilkProduction();
  const { records: weightRecords } = useWeightRecords();
  const { events: reproEvents, females } = useReproduction();
  const { healthEvents } = useHealth();
  const { animals } = useAnimals();

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

  // Fetch regional benchmarks
  const { data: benchmarks = [], isLoading } = useQuery({
    queryKey: ['regional-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_benchmarks')
        .select('*')
        .order('region');

      if (error) throw error;
      return data as RegionalBenchmark[];
    },
  });

  // Get available regions
  const regions = [...new Set(benchmarks.map(b => b.region))];

  // Calculate farm metrics
  const calculateFarmMetrics = (): FarmMetric[] => {
    const metrics: FarmMetric[] = [];
    const regionBenchmarks = benchmarks.filter(b => b.region === selectedRegion);

    // Milk production average
    const milkBenchmark = regionBenchmarks.find(b => b.metric_name === 'avg_milk_liters_day');
    if (milkBenchmark && milkRecords && milkRecords.length > 0) {
      const totalLiters = milkRecords.reduce((sum, r) => sum + Number(r.total_liters || 0), 0);
      const uniqueDays = new Set(milkRecords.map(r => r.production_date)).size;
      const avgMilkPerDay = uniqueDays > 0 ? totalLiters / uniqueDays : 0;
      
      metrics.push({
        metricName: 'Producción de Leche',
        farmValue: Math.round(avgMilkPerDay * 10) / 10,
        benchmarkValue: milkBenchmark.metric_value,
        unit: milkBenchmark.metric_unit || 'litros/día',
        difference: Math.round((avgMilkPerDay - milkBenchmark.metric_value) * 10) / 10,
        percentageDiff: Math.round(((avgMilkPerDay - milkBenchmark.metric_value) / milkBenchmark.metric_value) * 100),
        status: avgMilkPerDay > milkBenchmark.metric_value ? 'above' : avgMilkPerDay < milkBenchmark.metric_value ? 'below' : 'equal',
        category: 'production',
      });
    }

    // Daily weight gain
    const weightBenchmark = regionBenchmarks.find(b => b.metric_name === 'avg_daily_weight_gain');
    if (weightBenchmark && weightRecords && weightRecords.length > 1) {
      // Calculate average daily gain from weight records
      const gains = weightRecords.filter(r => r.daily_gain && Number(r.daily_gain) > 0);
      const avgGain = gains.length > 0 
        ? gains.reduce((sum, r) => sum + Number(r.daily_gain || 0), 0) / gains.length 
        : 0;
      
      metrics.push({
        metricName: 'Ganancia Diaria de Peso',
        farmValue: Math.round(avgGain * 100) / 100,
        benchmarkValue: weightBenchmark.metric_value,
        unit: weightBenchmark.metric_unit || 'kg/día',
        difference: Math.round((avgGain - weightBenchmark.metric_value) * 100) / 100,
        percentageDiff: Math.round(((avgGain - weightBenchmark.metric_value) / weightBenchmark.metric_value) * 100),
        status: avgGain > weightBenchmark.metric_value ? 'above' : avgGain < weightBenchmark.metric_value ? 'below' : 'equal',
        category: 'production',
      });
    }

    // Conception rate - using correct event types
    const conceptionBenchmark = regionBenchmarks.find(b => b.metric_name === 'conception_rate');
    if (conceptionBenchmark && reproEvents && reproEvents.length > 0) {
      const services = reproEvents.filter(e => e.event_type === 'inseminacion' || e.event_type === 'servicio');
      const confirmed = reproEvents.filter(e => e.event_type === 'palpacion' && e.pregnancy_result === 'positivo');
      const conceptionRate = services.length > 0 ? (confirmed.length / services.length) * 100 : 0;
      
      metrics.push({
        metricName: 'Tasa de Concepción',
        farmValue: Math.round(conceptionRate),
        benchmarkValue: conceptionBenchmark.metric_value,
        unit: '%',
        difference: Math.round(conceptionRate - conceptionBenchmark.metric_value),
        percentageDiff: Math.round(((conceptionRate - conceptionBenchmark.metric_value) / conceptionBenchmark.metric_value) * 100),
        status: conceptionRate > conceptionBenchmark.metric_value ? 'above' : conceptionRate < conceptionBenchmark.metric_value ? 'below' : 'equal',
        category: 'reproduction',
      });
    }

    // Mortality rate
    const mortalityBenchmark = regionBenchmarks.find(b => b.metric_name === 'mortality_rate');
    if (mortalityBenchmark && animals && animals.length > 0) {
      const deadAnimals = animals.filter(a => a.status === 'muerto').length;
      const totalAnimals = animals.length;
      const mortalityRate = totalAnimals > 0 ? (deadAnimals / totalAnimals) * 100 : 0;
      
      metrics.push({
        metricName: 'Tasa de Mortalidad',
        farmValue: Math.round(mortalityRate * 10) / 10,
        benchmarkValue: mortalityBenchmark.metric_value,
        unit: '%',
        difference: Math.round((mortalityRate - mortalityBenchmark.metric_value) * 10) / 10,
        percentageDiff: Math.round(((mortalityRate - mortalityBenchmark.metric_value) / mortalityBenchmark.metric_value) * 100),
        // For mortality, lower is better
        status: mortalityRate < mortalityBenchmark.metric_value ? 'above' : mortalityRate > mortalityBenchmark.metric_value ? 'below' : 'equal',
        category: 'health',
      });
    }

    // Calving interval - using females from useReproduction
    const calvingBenchmark = regionBenchmarks.find(b => b.metric_name === 'avg_calving_interval');
    if (calvingBenchmark && females && females.length > 0) {
      const animalsWithCalvings = females.filter(f => 
        f.first_calving_date && f.last_calving_date && f.total_calvings && f.total_calvings > 1
      );
      
      if (animalsWithCalvings.length > 0) {
        let totalIntervalDays = 0;
        let intervalCount = 0;

        animalsWithCalvings.forEach(animal => {
          if (animal.first_calving_date && animal.last_calving_date && animal.total_calvings && animal.total_calvings > 1) {
            const firstDate = new Date(animal.first_calving_date);
            const lastDate = new Date(animal.last_calving_date);
            const daysBetween = Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
            const avgInterval = daysBetween / (animal.total_calvings - 1);
            totalIntervalDays += avgInterval;
            intervalCount++;
          }
        });

        const avgCalvingInterval = intervalCount > 0 ? totalIntervalDays / intervalCount : 0;

        if (avgCalvingInterval > 0) {
          metrics.push({
            metricName: 'Intervalo Entre Partos',
            farmValue: Math.round(avgCalvingInterval),
            benchmarkValue: calvingBenchmark.metric_value,
            unit: 'días',
            difference: Math.round(avgCalvingInterval - calvingBenchmark.metric_value),
            percentageDiff: Math.round(((avgCalvingInterval - calvingBenchmark.metric_value) / calvingBenchmark.metric_value) * 100),
            // For calving interval, lower is better
            status: avgCalvingInterval < calvingBenchmark.metric_value ? 'above' : avgCalvingInterval > calvingBenchmark.metric_value ? 'below' : 'equal',
            category: 'reproduction',
          });
        }
      }
    }

    return metrics;
  };

  // Calculate overall score
  const calculateOverallScore = (): number => {
    const metrics = calculateFarmMetrics();
    if (metrics.length === 0) return 0;

    const scores = metrics.map(m => {
      if (m.status === 'above') return 100;
      if (m.status === 'equal') return 75;
      // Scale based on how far below
      return Math.max(0, 75 + m.percentageDiff);
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return {
    benchmarks,
    isLoading,
    regions,
    selectedRegion,
    setSelectedRegion,
    farmMetrics: calculateFarmMetrics(),
    overallScore: calculateOverallScore(),
  };
};
