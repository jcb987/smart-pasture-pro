import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface FeedItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number | null;
  supplier: string | null;
  protein_percentage: number | null;
  energy_mcal: number | null;
  fdn_percentage: number | null;
  dry_matter_percentage: number | null;
  notes: string | null;
  created_at: string;
}

export interface FeedDiet {
  id: string;
  name: string;
  target_group: string | null;
  target_lot: string | null;
  is_active: boolean;
  target_protein: number | null;
  target_energy: number | null;
  target_fdn: number | null;
  target_dry_matter: number | null;
  daily_cost: number | null;
  notes: string | null;
  created_at: string;
  ingredients?: DietIngredient[];
}

export interface DietIngredient {
  id: string;
  diet_id: string;
  feed_id: string;
  quantity_kg: number;
  feed?: FeedItem;
}

export interface FeedConsumption {
  id: string;
  consumption_date: string;
  feed_id: string;
  animal_id: string | null;
  lot_name: string | null;
  quantity_kg: number;
  cost: number | null;
  notes: string | null;
  created_at: string;
  feed?: FeedItem;
}

export interface FeedStats {
  totalFeedItems: number;
  lowStockItems: number;
  activeDiets: number;
  monthlyFeedCost: number;
  dailyConsumption: number;
  avgCostPerAnimal: number;
}

const FEED_CATEGORIES = [
  { value: 'forraje', label: 'Forraje' },
  { value: 'concentrado', label: 'Concentrado' },
  { value: 'suplemento', label: 'Suplemento' },
  { value: 'mineral', label: 'Mineral/Sal' },
  { value: 'otro', label: 'Otro' },
];

const TARGET_GROUPS = [
  { value: 'vacas_lactando', label: 'Vacas en Lactancia' },
  { value: 'vacas_secas', label: 'Vacas Secas' },
  { value: 'novillas', label: 'Novillas' },
  { value: 'novillos', label: 'Novillos' },
  { value: 'terneros', label: 'Terneros' },
  { value: 'terneras', label: 'Terneras' },
  { value: 'toros', label: 'Toros' },
];

export const useFeeding = () => {
  const [inventory, setInventory] = useState<FeedItem[]>([]);
  const [diets, setDiets] = useState<FeedDiet[]>([]);
  const [consumption, setConsumption] = useState<FeedConsumption[]>([]);
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

  const fetchInventory = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('feed_inventory')
        .select('*')
        .eq('organization_id', resolvedId)
        .order('name');

      if (error) throw error;
      setInventory((data || []) as FeedItem[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo cargar el inventario', variant: 'destructive' });
    }
  };

  const fetchDiets = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('feed_diets')
        .select('*')
        .eq('organization_id', resolvedId)
        .order('name');

      if (error) throw error;
      setDiets((data || []) as FeedDiet[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar las dietas', variant: 'destructive' });
    }
  };

  const fetchConsumption = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('feed_consumption')
        .select(`*, feed:feed_inventory(*)`)
        .eq('organization_id', resolvedId)
        .order('consumption_date', { ascending: false })
        .limit(200);

      if (error) throw error;
      setConsumption((data || []) as FeedConsumption[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo cargar el consumo', variant: 'destructive' });
    }
  };

  const fetchAll = async (orgId?: string) => {
    const resolvedId = orgId || organizationId || await getOrganizationId();
    if (!resolvedId) return;
    setLoading(true);
    await Promise.all([fetchInventory(resolvedId), fetchDiets(resolvedId), fetchConsumption(resolvedId)]);
    setLoading(false);
  };

  // Inventory CRUD
  const addFeedItem = async (item: {
    name: string;
    category: string;
    unit?: string;
    current_stock?: number;
    min_stock?: number;
    unit_cost?: number;
    supplier?: string;
    protein_percentage?: number;
    energy_mcal?: number;
    fdn_percentage?: number;
    dry_matter_percentage?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('feed_inventory')
        .insert({ ...item, organization_id: organizationId })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Alimento agregado al inventario' });
      await fetchInventory();
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateFeedItem = async (id: string, updates: Partial<FeedItem>) => {
    try {
      const { error } = await supabase
        .from('feed_inventory')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Inventario actualizado' });
      await fetchInventory();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteFeedItem = async (id: string) => {
    try {
      const { error } = await supabase.from('feed_inventory').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Alimento eliminado' });
      await fetchInventory();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Diet CRUD
  const addDiet = async (diet: {
    name: string;
    target_group?: string;
    target_lot?: string;
    target_protein?: number;
    target_energy?: number;
    target_fdn?: number;
    target_dry_matter?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('feed_diets')
        .insert({ ...diet, organization_id: organizationId, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Dieta creada' });
      await fetchDiets();
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteDiet = async (id: string) => {
    try {
      const { error } = await supabase.from('feed_diets').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Dieta eliminada' });
      await fetchDiets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Consumption
  const addConsumption = async (record: {
    feed_id: string;
    consumption_date: string;
    quantity_kg: number;
    animal_id?: string;
    lot_name?: string;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const feed = inventory.find(f => f.id === record.feed_id);
      const cost = feed?.unit_cost ? record.quantity_kg * feed.unit_cost : null;

      const { data, error } = await supabase
        .from('feed_consumption')
        .insert({ 
          ...record, 
          cost,
          organization_id: organizationId, 
          created_by: user?.id 
        })
        .select()
        .single();

      if (error) throw error;

      // Update stock
      if (feed) {
        await supabase
          .from('feed_inventory')
          .update({ 
            current_stock: Math.max(0, (feed.current_stock || 0) - record.quantity_kg),
            updated_at: new Date().toISOString()
          })
          .eq('id', record.feed_id);
      }

      toast({ title: 'Éxito', description: 'Consumo registrado' });
      await Promise.all([fetchInventory(), fetchConsumption()]);
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteConsumption = async (id: string) => {
    try {
      const { error } = await supabase.from('feed_consumption').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Registro eliminado' });
      await fetchConsumption();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStats = (): FeedStats => {
    const lowStockItems = inventory.filter(f => f.current_stock <= f.min_stock).length;
    const activeDiets = diets.filter(d => d.is_active).length;

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthConsumption = consumption.filter(c => c.consumption_date >= monthAgo);
    const monthlyFeedCost = monthConsumption.reduce((sum, c) => sum + (c.cost || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayConsumption = consumption.filter(c => c.consumption_date === today);
    const dailyConsumption = todayConsumption.reduce((sum, c) => sum + c.quantity_kg, 0);

    return {
      totalFeedItems: inventory.length,
      lowStockItems,
      activeDiets,
      monthlyFeedCost,
      dailyConsumption,
      avgCostPerAnimal: monthConsumption.length > 0 ? monthlyFeedCost / 30 : 0,
    };
  };

  const getLowStockAlerts = () => {
    return inventory.filter(f => f.current_stock <= f.min_stock);
  };

  const getConsumptionByPeriod = (days: number = 30) => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const periodConsumption = consumption.filter(c => c.consumption_date >= startDate);

    const byDate: Record<string, number> = {};
    periodConsumption.forEach(c => {
      byDate[c.consumption_date] = (byDate[c.consumption_date] || 0) + c.quantity_kg;
    });

    return Object.entries(byDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchAll(orgId);
      }
    };
    init();
  }, [user]);

  return {
    inventory,
    diets,
    consumption,
    loading,
    addFeedItem,
    updateFeedItem,
    deleteFeedItem,
    addDiet,
    deleteDiet,
    addConsumption,
    deleteConsumption,
    getStats,
    getLowStockAlerts,
    getConsumptionByPeriod,
    fetchAll,
    FEED_CATEGORIES,
    TARGET_GROUPS,
  };
};
