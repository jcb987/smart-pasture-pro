import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMilkProduction } from './useMilkProduction';
import { useWeightRecords } from './useWeightRecords';
import { useFeeding } from './useFeeding';
import { useHealth } from './useHealth';
import { useAnimals } from './useAnimals';
import { useState, useEffect } from 'react';

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  transaction_date: string;
  transaction_type: 'ingreso' | 'egreso';
  category: string;
  subcategory?: string;
  amount: number;
  description?: string;
  animal_id?: string;
  lot_name?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  animals?: { tag_id: string; name?: string } | null;
}

export interface FinancialSummary {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  margenNeto: number;
  costosPorCategoria: { category: string; amount: number }[];
  ingresosPorCategoria: { category: string; amount: number }[];
  flujoCajaMensual: { month: string; ingresos: number; egresos: number; balance: number }[];
}

export interface CostPerUnit {
  costoPorLitroLeche: number;
  costoPorKiloCarne: number;
  litrosTotales: number;
  kilosTotales: number;
  costosTotales: number;
}

export interface LotProfitability {
  lotName: string;
  animales: number;
  ingresos: number;
  egresos: number;
  margen: number;
  rentabilidad: number;
}

export const INCOME_CATEGORIES = [
  { value: 'venta_leche', label: 'Venta de Leche' },
  { value: 'venta_ganado', label: 'Venta de Ganado' },
  { value: 'venta_carne', label: 'Venta de Carne' },
  { value: 'venta_crias', label: 'Venta de Crías' },
  { value: 'servicios', label: 'Servicios (Monta, etc.)' },
  { value: 'subsidios', label: 'Subsidios/Apoyos' },
  { value: 'otros_ingresos', label: 'Otros Ingresos' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'medicamentos', label: 'Medicamentos/Veterinario' },
  { value: 'mano_obra', label: 'Mano de Obra' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'servicios_publicos', label: 'Servicios Públicos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'compra_ganado', label: 'Compra de Ganado' },
  { value: 'insumos', label: 'Insumos/Materiales' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'impuestos', label: 'Impuestos/Tasas' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otros_gastos', label: 'Otros Gastos' },
];

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'credito', label: 'Crédito' },
];

export const useCostos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get organization ID
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

  // Get data from other modules for calculations
  const { records: milkRecords } = useMilkProduction();
  const { records: weightRecords } = useWeightRecords();
  const { inventory: feedItems, consumption: feedConsumption } = useFeeding();
  const { healthEvents } = useHealth();
  const { animals } = useAnimals();

  // Fetch all transactions
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['financial-transactions', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*, animals(tag_id, name)')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!organizationId,
  });

  // Calculate financial summary
  const calculateSummary = (period?: { start: Date; end: Date }): FinancialSummary => {
    let filteredTransactions = transactions;
    
    if (period) {
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date >= period.start && date <= period.end;
      });
    }

    const ingresos = filteredTransactions.filter(t => t.transaction_type === 'ingreso');
    const egresos = filteredTransactions.filter(t => t.transaction_type === 'egreso');

    const totalIngresos = ingresos.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalEgresos = egresos.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIngresos - totalEgresos;
    const margenNeto = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;

    // Group by category
    const costosPorCategoria = Object.entries(
      egresos.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, amount]) => ({ category, amount }));

    const ingresosPorCategoria = Object.entries(
      ingresos.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, amount]) => ({ category, amount }));

    // Monthly cash flow
    const monthlyData: Record<string, { ingresos: number; egresos: number }> = {};
    filteredTransactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, egresos: 0 };
      }
      if (t.transaction_type === 'ingreso') {
        monthlyData[month].ingresos += Number(t.amount);
      } else {
        monthlyData[month].egresos += Number(t.amount);
      }
    });

    const flujoCajaMensual = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ingresos: data.ingresos,
        egresos: data.egresos,
        balance: data.ingresos - data.egresos,
      }));

    return {
      totalIngresos,
      totalEgresos,
      balance,
      margenNeto,
      costosPorCategoria,
      ingresosPorCategoria,
      flujoCajaMensual,
    };
  };

  // Calculate cost per unit of production
  const calculateCostPerUnit = (): CostPerUnit => {
    const egresos = transactions.filter(t => t.transaction_type === 'egreso');
    const costosTotales = egresos.reduce((sum, t) => sum + Number(t.amount), 0);

    // Total milk production
    const litrosTotales = (milkRecords || []).reduce((sum, r) => sum + Number(r.total_liters || 0), 0);

    // Weight gain (simplified - difference between last and first weights)
    let kilosTotales = 0;
    const animalWeights: Record<string, { first: number; last: number }> = {};
    
    (weightRecords || []).forEach(r => {
      const animalId = r.animal_id;
      if (!animalWeights[animalId]) {
        animalWeights[animalId] = { first: Number(r.weight_kg), last: Number(r.weight_kg) };
      } else {
        animalWeights[animalId].last = Number(r.weight_kg);
      }
    });

    Object.values(animalWeights).forEach(w => {
      const gain = w.last - w.first;
      if (gain > 0) kilosTotales += gain;
    });

    const costoPorLitroLeche = litrosTotales > 0 ? costosTotales / litrosTotales : 0;
    const costoPorKiloCarne = kilosTotales > 0 ? costosTotales / kilosTotales : 0;

    return {
      costoPorLitroLeche,
      costoPorKiloCarne,
      litrosTotales,
      kilosTotales,
      costosTotales,
    };
  };

  // Calculate profitability by lot
  const calculateLotProfitability = (): LotProfitability[] => {
    const lots = [...new Set((animals || []).map(a => a.lot_name).filter(Boolean))] as string[];

    return lots.map(lotName => {
      const lotAnimals = (animals || []).filter(a => a.lot_name === lotName);
      const animalIds = lotAnimals.map(a => a.id);

      const lotIngresos = transactions
        .filter(t => t.transaction_type === 'ingreso' && t.lot_name === lotName)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lotEgresos = transactions
        .filter(t => t.transaction_type === 'egreso' && t.lot_name === lotName)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Add feed costs for this lot
      const feedCosts = (feedConsumption || [])
        .filter(c => c.lot_name === lotName)
        .reduce((sum, c) => sum + Number(c.cost || 0), 0);

      // Add health costs for animals in this lot
      const healthCosts = (healthEvents || [])
        .filter(e => animalIds.includes(e.animal_id))
        .reduce((sum, e) => sum + Number(e.cost || 0), 0);

      const totalEgresos = lotEgresos + feedCosts + healthCosts;
      const margen = lotIngresos - totalEgresos;
      const rentabilidad = lotIngresos > 0 ? (margen / lotIngresos) * 100 : 0;

      return {
        lotName,
        animales: lotAnimals.length,
        ingresos: lotIngresos,
        egresos: totalEgresos,
        margen,
        rentabilidad,
      };
    });
  };

  // Create transaction
  const createTransaction = useMutation({
    mutationFn: async (data: Omit<FinancialTransaction, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'animals'>) => {
      if (!organizationId) throw new Error('No organization');

      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          ...data,
          organization_id: organizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transacción registrada correctamente');
    },
    onError: (error) => {
      toast.error('Error al registrar transacción: ' + error.message);
    },
  });

  // Update transaction
  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FinancialTransaction> & { id: string }) => {
      const { error } = await supabase
        .from('financial_transactions')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transacción actualizada correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar transacción: ' + error.message);
    },
  });

  // Delete transaction
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transacción eliminada correctamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar transacción: ' + error.message);
    },
  });

  return {
    transactions,
    isLoading,
    refetch,
    summary: calculateSummary(),
    costPerUnit: calculateCostPerUnit(),
    lotProfitability: calculateLotProfitability(),
    createTransaction,
    updateTransaction,
    deleteTransaction,
    calculateSummary,
    animals: animals || [],
    lots: [...new Set((animals || []).map(a => a.lot_name).filter(Boolean))] as string[],
  };
};
