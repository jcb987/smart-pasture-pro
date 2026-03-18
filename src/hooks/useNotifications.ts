import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  module: string | null;
  animal_id: string | null;
  is_read: boolean;
  created_at: string;
}

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

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications((data as AppNotification[]) || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  const generateAlerts = useCallback(async () => {
    const orgId = await getOrganizationId();
    if (!orgId) return;

    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const alerts: Omit<AppNotification, 'id' | 'created_at'>[] = [];

    // 1. Overdue births
    const { data: overdueAnimals } = await supabase
      .from('animals')
      .select('id, tag_id, name, expected_calving_date')
      .eq('organization_id', orgId)
      .eq('reproductive_status', 'preñada')
      .lt('expected_calving_date', today);

    overdueAnimals?.forEach(a => {
      alerts.push({
        organization_id: orgId,
        type: 'parto_atrasado',
        title: 'Parto Atrasado',
        message: `${a.tag_id}${a.name ? ` (${a.name})` : ''} tiene parto atrasado`,
        module: 'reproduccion',
        animal_id: a.id,
        is_read: false,
      });
    });

    // 2. Cows due for dry period in 7 days
    const { data: dryCowCandidates } = await supabase
      .from('animals')
      .select('id, tag_id, name, expected_calving_date')
      .eq('organization_id', orgId)
      .eq('reproductive_status', 'preñada')
      .not('expected_calving_date', 'is', null);

    dryCowCandidates?.forEach(a => {
      if (!a.expected_calving_date) return;
      const calvDate = new Date(a.expected_calving_date);
      const dryDate = new Date(calvDate.getTime() - 60 * 24 * 60 * 60 * 1000);
      const daysUntilDry = Math.ceil((dryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysUntilDry <= 7 && daysUntilDry >= 0) {
        alerts.push({
          organization_id: orgId,
          type: 'secado_proximo',
          title: 'Secado Próximo',
          message: `${a.tag_id}${a.name ? ` (${a.name})` : ''} debe secarse en ${daysUntilDry} días`,
          module: 'produccion-leche',
          animal_id: a.id,
          is_read: false,
        });
      }
    });

    // 3. Overdue vaccines
    const { data: overdueVaccines } = await supabase
      .from('vaccination_schedule')
      .select('id, vaccine_name, scheduled_date, animal_id')
      .eq('organization_id', orgId)
      .eq('is_applied', false)
      .lt('scheduled_date', today)
      .limit(5);

    if (overdueVaccines && overdueVaccines.length > 0) {
      alerts.push({
        organization_id: orgId,
        type: 'vacuna_vencida',
        title: 'Vacunas Vencidas',
        message: `${overdueVaccines.length} vacuna(s) programada(s) no aplicada(s) — más antigua: ${overdueVaccines[0].vaccine_name}`,
        module: 'salud',
        animal_id: null,
        is_read: false,
      });
    }

    if (alerts.length === 0) return;

    // Check for existing notifications of same type in last 24 hours to avoid duplicates
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('type')
      .eq('organization_id', orgId)
      .gte('created_at', cutoff);

    const recentTypes = new Set((recentNotifs || []).map(n => n.type));
    const newAlerts = alerts.filter(a => !recentTypes.has(a.type));

    if (newAlerts.length > 0) {
      await supabase.from('notifications').insert(newAlerts);
      await fetchNotifications();
    }
  }, [getOrganizationId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('organization_id', orgId).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      generateAlerts();
    }
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
