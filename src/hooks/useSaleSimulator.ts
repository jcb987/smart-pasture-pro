import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useAnimals } from './useAnimals';
import { useCostos } from './useCostos';

export interface SaleSimulation {
  id: string;
  organization_id: string;
  simulation_name: string;
  simulation_date: string;
  lot_name?: string;
  animal_ids: string[];
  current_avg_weight: number;
  target_weight: number;
  projected_sale_date?: string;
  market_price_per_kg: number;
  total_animals: number;
  projected_revenue: number;
  projected_costs: number;
  projected_profit: number;
  profit_margin_percentage: number;
  ai_recommendations?: string;
  optimal_sale_date?: string;
  optimal_sale_reason?: string;
  created_by?: string;
  created_at: string;
}

export const useSaleSimulator = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { animals } = useAnimals();
  const { transactions, costPerUnit } = useCostos();

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

  // Fetch simulations
  const { data: simulations = [], isLoading, refetch } = useQuery({
    queryKey: ['sale-simulations', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('sale_simulations')
        .select('*')
        .order('simulation_date', { ascending: false });

      if (error) throw error;
      return data as SaleSimulation[];
    },
    enabled: !!organizationId,
  });

  // Calculate simulation
  const calculateSimulation = (params: {
    animalIds?: string[];
    lotName?: string;
    targetWeight: number;
    marketPricePerKg: number;
    dailyGainKg?: number;
  }) => {
    const { animalIds, lotName, targetWeight, marketPricePerKg, dailyGainKg = 0.7 } = params;

    // Get animals for simulation
    let selectedAnimals = animals || [];
    if (animalIds && animalIds.length > 0) {
      selectedAnimals = selectedAnimals.filter(a => animalIds.includes(a.id));
    } else if (lotName) {
      selectedAnimals = selectedAnimals.filter(a => a.lot_name === lotName);
    }

    const totalAnimals = selectedAnimals.length;
    if (totalAnimals === 0) {
      return null;
    }

    // Calculate average current weight
    const currentAvgWeight = selectedAnimals.reduce((sum, a) => sum + (Number(a.current_weight) || 0), 0) / totalAnimals;

    // Calculate days to reach target weight
    const weightToGain = targetWeight - currentAvgWeight;
    const daysToTarget = Math.max(0, Math.ceil(weightToGain / dailyGainKg));

    // Calculate projected sale date
    const projectedSaleDate = new Date();
    projectedSaleDate.setDate(projectedSaleDate.getDate() + daysToTarget);

    // Calculate revenues
    const projectedRevenue = totalAnimals * targetWeight * marketPricePerKg;

    // Estimate costs based on historical data
    const usingFallbackCost = costPerUnit.costoPorKiloCarne <= 0;
    const dailyCostPerAnimal = usingFallbackCost
      ? 15000 // Default 15k COP/día cuando no hay datos de costos reales
      : costPerUnit.costoPorKiloCarne * dailyGainKg;
    const projectedCosts = totalAnimals * dailyCostPerAnimal * daysToTarget;

    // Calculate profit
    const projectedProfit = projectedRevenue - projectedCosts;
    const profitMarginPercentage = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

    return {
      totalAnimals,
      currentAvgWeight,
      targetWeight,
      daysToTarget,
      projectedSaleDate: projectedSaleDate.toISOString().split('T')[0],
      projectedRevenue,
      projectedCosts,
      projectedProfit,
      profitMarginPercentage,
      marketPricePerKg,
      usingFallbackCost,
    };
  };

  // Create simulation
  const createSimulation = useMutation({
    mutationFn: async (data: Omit<SaleSimulation, 'id' | 'organization_id' | 'created_at' | 'simulation_date'>) => {
      if (!organizationId) throw new Error('No organization');

      const { error } = await supabase
        .from('sale_simulations')
        .insert({
          ...data,
          organization_id: organizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-simulations'] });
      toast.success('Simulación guardada correctamente');
    },
    onError: (error) => {
      toast.error('Error al guardar simulación: ' + error.message);
    },
  });

  // Delete simulation
  const deleteSimulation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sale_simulations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-simulations'] });
      toast.success('Simulación eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  return {
    simulations,
    isLoading,
    refetch,
    calculateSimulation,
    createSimulation,
    deleteSimulation,
    animals: animals || [],
    lots: [...new Set((animals || []).map(a => a.lot_name).filter(Boolean))] as string[],
  };
};
