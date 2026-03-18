import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  module: string | null;
  animal_id: string | null;
  is_read: boolean;
  created_at: string;
}

const getReadKey = (orgId: string) => `agrodata_notif_read_${orgId}`;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getOrganizationId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  }, [user]);

  // Read state persisted in localStorage (set of notification IDs that are read)
  const getReadSet = (orgId: string): Set<string> => {
    try {
      const raw = localStorage.getItem(getReadKey(orgId));
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const saveReadSet = (orgId: string, readSet: Set<string>) => {
    localStorage.setItem(getReadKey(orgId), JSON.stringify([...readSet]));
  };

  const generateAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;

      const today = new Date().toISOString().split('T')[0];
      const alerts: AppNotification[] = [];

      // 1. Overdue births (pregnant animals past expected_calving_date)
      const { data: overdueAnimals } = await supabase
        .from('animals')
        .select('id, tag_id, name, expected_calving_date')
        .eq('organization_id', orgId)
        .eq('reproductive_status', 'preñada')
        .lt('expected_calving_date', today);

      overdueAnimals?.forEach(a => {
        alerts.push({
          id: `parto_${a.id}`,
          type: 'parto_atrasado',
          title: 'Parto Atrasado',
          message: `${a.tag_id}${a.name ? ` (${a.name})` : ''} tiene parto atrasado`,
          module: 'reproduccion',
          animal_id: a.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      });

      // 2. Cows due for dry period in ≤7 days
      const { data: pregnantAnimals } = await supabase
        .from('animals')
        .select('id, tag_id, name, expected_calving_date')
        .eq('organization_id', orgId)
        .eq('reproductive_status', 'preñada')
        .not('expected_calving_date', 'is', null);

      pregnantAnimals?.forEach(a => {
        if (!a.expected_calving_date) return;
        const dryDate = new Date(new Date(a.expected_calving_date).getTime() - 60 * 86400000);
        const daysUntilDry = Math.ceil((dryDate.getTime() - Date.now()) / 86400000);
        if (daysUntilDry <= 7 && daysUntilDry >= 0) {
          alerts.push({
            id: `secado_${a.id}`,
            type: 'secado_proximo',
            title: 'Secado Próximo',
            message: `${a.tag_id}${a.name ? ` (${a.name})` : ''} debe secarse en ${daysUntilDry} día(s)`,
            module: 'produccion-leche',
            animal_id: a.id,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      });

      // 3. Overdue vaccines
      const { data: overdueVaccines } = await supabase
        .from('vaccination_schedule')
        .select('id, vaccine_name, scheduled_date')
        .eq('organization_id', orgId)
        .eq('is_applied', false)
        .lt('scheduled_date', today)
        .limit(10);

      if (overdueVaccines && overdueVaccines.length > 0) {
        alerts.push({
          id: `vacunas_vencidas`,
          type: 'vacuna_vencida',
          title: 'Vacunas Vencidas',
          message: `${overdueVaccines.length} vacuna(s) no aplicada(s). Más antigua: ${overdueVaccines[0].vaccine_name}`,
          module: 'salud',
          animal_id: null,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Apply read state from localStorage
      const readSet = getReadSet(orgId);
      const withReadState = alerts.map(n => ({ ...n, is_read: readSet.has(n.id) }));
      setNotifications(withReadState);
    } catch (err) {
      console.error('Error generating notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  const markAsRead = async (id: string) => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    const readSet = getReadSet(orgId);
    readSet.add(id);
    saveReadSet(orgId, readSet);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    const readSet = getReadSet(orgId);
    notifications.forEach(n => readSet.add(n.id));
    saveReadSet(orgId, readSet);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    const orgId = await getOrganizationId();
    if (orgId) {
      const readSet = getReadSet(orgId);
      readSet.add(id); // mark as read so it stays "dismissed"
      saveReadSet(orgId, readSet);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchNotifications = generateAlerts;

  useEffect(() => {
    if (user) generateAlerts();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    generateAlerts,
  };
};
