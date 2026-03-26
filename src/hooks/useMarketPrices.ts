import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketPrice {
  id?: string;
  price_type: 'leche' | 'ganado_pie' | 'novillo' | 'ternero';
  value: number;
  effective_date: string;
}

export const PRICE_LABELS: Record<string, string> = {
  leche: 'Precio Leche (COP/litro)',
  ganado_pie: 'Ganado en pie (COP/kg)',
  novillo: 'Novillo gordo (COP/kg)',
  ternero: 'Ternero desteto (COP/kg)',
};

const PRICE_TYPES = ['leche', 'ganado_pie', 'novillo', 'ternero'] as const;

const getStorageKey = (orgId: string) => `agrodata_prices_${orgId}`;

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
      const raw = localStorage.getItem(getStorageKey(orgId));
      if (raw) {
        setPrices(JSON.parse(raw));
      } else {
        setPrices([]);
      }
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

  const updatePrice = async (type: string, value: number) => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;
      const existing = prices.filter(p => p.price_type !== type);
      const updated: MarketPrice[] = [
        ...existing,
        { price_type: type as MarketPrice['price_type'], value, effective_date: new Date().toISOString().split('T')[0] },
      ];
      localStorage.setItem(getStorageKey(orgId), JSON.stringify(updated));
      setPrices(updated);
      toast({ title: 'Precio actualizado', description: `${PRICE_LABELS[type] || type}: ${value.toLocaleString('es-CO')} COP` });
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
