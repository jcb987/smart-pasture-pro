import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketPrice {
  id: string;
  organization_id: string;
  price_type: 'leche' | 'ganado_pie' | 'novillo' | 'ternero';
  value: number;
  effective_date: string;
  currency: string;
  notes: string | null;
  created_at: string;
}

export const PRICE_LABELS: Record<string, string> = {
  leche: 'Precio Leche (COP/litro)',
  ganado_pie: 'Ganado en pie (COP/kg)',
  novillo: 'Novillo gordo (COP/kg)',
  ternero: 'Ternero desteto (COP/kg)',
};

export const useMarketPrices = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getOrganizationId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  }, [user]);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('organization_id', orgId)
        .order('effective_date', { ascending: false });
      if (error) throw error;
      setPrices((data as MarketPrice[]) || []);
    } catch (err) {
      console.error('Error fetching market prices:', err);
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  useEffect(() => {
    if (user) fetchPrices();
  }, [user, fetchPrices]);

  const getCurrentPrice = (type: string): number => {
    const found = prices.find(p => p.price_type === type);
    return found ? found.value : 0;
  };

  const updatePrice = async (type: string, value: number, notes?: string) => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;

      // Delete existing price of same type and insert new one
      await supabase
        .from('market_prices')
        .delete()
        .eq('organization_id', orgId)
        .eq('price_type', type);

      const { error } = await supabase
        .from('market_prices')
        .insert({
          organization_id: orgId,
          price_type: type,
          value,
          effective_date: new Date().toISOString().split('T')[0],
          notes: notes || null,
        });

      if (error) throw error;

      toast({ title: 'Precio actualizado', description: `${PRICE_LABELS[type] || type}: ${value.toLocaleString('es-CO')} COP` });
      await fetchPrices();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const calculateHerdValue = (animals: { status: string; current_weight?: number | null }[]): number => {
    const pricePerKg = getCurrentPrice('ganado_pie');
    if (!pricePerKg) return 0;
    return animals
      .filter(a => a.status === 'activo' && a.current_weight)
      .reduce((total, a) => total + (a.current_weight! * pricePerKg), 0);
  };

  const estimateMilkRevenue = (totalLiters: number): number => {
    return totalLiters * getCurrentPrice('leche');
  };

  return { prices, loading, getCurrentPrice, updatePrice, calculateHerdValue, estimateMilkRevenue, fetchPrices };
};
