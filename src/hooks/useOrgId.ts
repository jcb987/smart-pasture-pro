import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB } from '@/lib/offlineDB';

/**
 * Hook centralizado para obtener el organization_id del usuario actual.
 * Incluye soporte offline via IndexedDB.
 * Reemplaza la función getOrganizationId() duplicada en 7+ hooks.
 */
export function useOrgId() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingOrgId, setLoadingOrgId] = useState(true);
  const { isOnline } = useOffline();

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      try {
        // Offline: intenta desde caché primero
        if (!isOnline) {
          const cached = await offlineDB.getMetadata<string>('organizationId');
          if (cached && !cancelled) {
            setOrgId(cached);
            setLoadingOrgId(false);
            return;
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const id = profile?.organization_id ?? null;

        // Persiste para uso offline
        if (id) {
          await offlineDB.setMetadata('organizationId', id);
        }

        if (!cancelled) setOrgId(id);
      } catch (err) {
        // Fallback a caché si hay error de red
        const cached = await offlineDB.getMetadata<string>('organizationId');
        if (!cancelled) setOrgId(cached ?? null);
      } finally {
        if (!cancelled) setLoadingOrgId(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [isOnline]);

  return { orgId, loadingOrgId };
}

/**
 * Función standalone para obtener orgId en contextos fuera de React (ej: mutaciones).
 * Usa la misma lógica con caché offline.
 */
export async function getOrgId(isOnline: boolean): Promise<string | null> {
  if (!isOnline) {
    const cached = await offlineDB.getMetadata<string>('organizationId');
    if (cached) return cached;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const id = profile?.organization_id ?? null;
  if (id) await offlineDB.setMetadata('organizationId', id);
  return id;
}
