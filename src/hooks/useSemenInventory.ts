import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';

export interface SemenLot {
  id: string;
  organization_id: string;
  bull_name: string;
  bull_registration: string | null;
  breed: string | null;
  doses_available: number;
  doses_total: number;
  cost_per_dose: number | null;
  expiration_date: string | null;
  storage_location: string | null;
  notes: string | null;
  created_at: string;
}

export const useSemenInventory = () => {
  const [inventory, setInventory] = useState<SemenLot[]>([]);
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

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;
      const { data, error } = await supabase
        .from('semen_inventory')
        .select('*')
        .eq('organization_id', orgId)
        .order('expiration_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      setInventory((data as SemenLot[]) || []);
    } catch (err) {
      console.error('Error fetching semen inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  useEffect(() => {
    if (user) fetchInventory();
  }, [user, fetchInventory]);

  const addLot = async (lot: Omit<SemenLot, 'id' | 'organization_id' | 'created_at'>) => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase
        .from('semen_inventory')
        .insert({ ...lot, organization_id: orgId });
      if (error) throw error;
      toast({ title: 'Lote agregado', description: `${lot.bull_name}: ${lot.doses_available} dosis` });
      await fetchInventory();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const updateDoses = async (id: string, change: number) => {
    const lot = inventory.find(l => l.id === id);
    if (!lot) return;
    const newQty = Math.max(0, lot.doses_available + change);
    try {
      const { error } = await supabase
        .from('semen_inventory')
        .update({ doses_available: newQty })
        .eq('id', id);
      if (error) throw error;
      setInventory(prev => prev.map(l => l.id === id ? { ...l, doses_available: newQty } : l));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteLot = async (id: string) => {
    try {
      const { error } = await supabase.from('semen_inventory').delete().eq('id', id);
      if (error) throw error;
      setInventory(prev => prev.filter(l => l.id !== id));
      toast({ title: 'Lote eliminado' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const expirationAlerts = inventory.filter(lot => {
    if (!lot.expiration_date || lot.doses_available === 0) return false;
    const days = differenceInDays(parseISO(lot.expiration_date), new Date());
    return days <= 90;
  });

  const lowStockAlerts = inventory.filter(l => l.doses_available < 5 && l.doses_available > 0);
  const totalDoses = inventory.reduce((s, l) => s + l.doses_available, 0);

  return { inventory, loading, addLot, updateDoses, deleteLot, expirationAlerts, lowStockAlerts, totalDoses, fetchInventory };
};
