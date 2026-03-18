import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';

export interface SemenLot {
  id: string;
  bull_name: string;
  bull_registration?: string;
  breed?: string;
  doses_available: number;
  doses_total: number;
  cost_per_dose?: number;
  expiration_date?: string;
  storage_location?: string;
  notes?: string;
  created_at: string;
}

const getStorageKey = (orgId: string) => `agrodata_semen_${orgId}`;

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

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;
      const raw = localStorage.getItem(getStorageKey(orgId));
      if (raw) {
        const parsed: SemenLot[] = JSON.parse(raw);
        // Sort by expiration date
        parsed.sort((a, b) => {
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return a.expiration_date.localeCompare(b.expiration_date);
        });
        setInventory(parsed);
      } else {
        setInventory([]);
      }
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  const saveInventory = useCallback(async (lots: SemenLot[]) => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    localStorage.setItem(getStorageKey(orgId), JSON.stringify(lots));
    setInventory(lots);
  }, [getOrganizationId]);

  useEffect(() => {
    if (user) loadInventory();
  }, [user, loadInventory]);

  const addLot = async (lot: Omit<SemenLot, 'id' | 'created_at'>) => {
    try {
      const newLot: SemenLot = {
        ...lot,
        id: `semen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
      };
      const updated = [...inventory, newLot];
      await saveInventory(updated);
      toast({ title: 'Lote agregado', description: `${lot.bull_name}: ${lot.doses_available} dosis` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const updateDoses = async (id: string, change: number) => {
    const lot = inventory.find(l => l.id === id);
    if (!lot) return;
    const newQty = Math.max(0, lot.doses_available + change);
    const updated = inventory.map(l => l.id === id ? { ...l, doses_available: newQty } : l);
    await saveInventory(updated);
  };

  const deleteLot = async (id: string) => {
    try {
      const updated = inventory.filter(l => l.id !== id);
      await saveInventory(updated);
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

  return { inventory, loading, addLot, updateDoses, deleteLot, expirationAlerts, lowStockAlerts, totalDoses, fetchInventory: loadInventory };
};
