import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB } from '@/lib/offlineDB';
import { useOrgId } from '@/hooks/useOrgId';

type SupabaseTable = Parameters<typeof supabase.from>[0];

export interface SupabaseQueryOptions<T> {
  /** Nombre de la tabla en Supabase */
  table: SupabaseTable;
  /** Columnas a seleccionar (default: '*') */
  select?: string;
  /** Función para aplicar filtros adicionales al query builder */
  filters?: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>;
  /** Clave de caché offline en IndexedDB */
  offlineKey?: string;
  /** Habilitar caché offline (default: true) */
  offlineEnabled?: boolean;
  /** Transforma los datos recibidos antes de guardar en estado */
  transform?: (data: unknown[]) => T[];
  /** Mensaje personalizado para el toast de error */
  errorMessage?: string;
}

export interface SupabaseQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook genérico para consultas a Supabase con soporte offline.
 * Elimina la duplicación del patrón useState+useEffect+supabase en 40+ hooks.
 *
 * @example
 * const { data: supplies, loading, refetch } = useSupabaseQuery<Supply>({
 *   table: 'supplies',
 *   select: 'id, name, quantity, unit',
 *   filters: q => q.order('name'),
 *   offlineKey: 'supplies',
 * });
 */
export function useSupabaseQuery<T>({
  table,
  select = '*',
  filters,
  offlineKey,
  offlineEnabled = true,
  transform,
  errorMessage,
}: SupabaseQueryOptions<T>): SupabaseQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const mountedRef = useRef(true);

  const cacheKey = offlineKey ?? table;

  const fetch = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setLoading(true);
      setError(null);

      if (offlineEnabled) await initDB();

      if (isOnline) {
        let query = supabase.from(table).select(select);
        if (filters) query = filters(query) as typeof query;

        const { data: rows, error: sbError } = await query;
        if (sbError) throw sbError;

        const result = transform ? transform(rows ?? []) : (rows ?? []) as T[];

        if (!mountedRef.current) return;
        setData(result);

        if (offlineEnabled && result.length > 0) {
          await offlineDB.bulkSave(
            cacheKey as any,
            result.map((item: T) => ({
              id: (item as Record<string, unknown>).id as string,
              data: item as Record<string, unknown>,
            }))
          );
          await offlineDB.setMetadata(`lastSync_${cacheKey}`, new Date().toISOString());
        }
      } else if (offlineEnabled) {
        const cached = await offlineDB.getAllRecords<T>(cacheKey);
        if (!mountedRef.current) return;
        setData(cached);
        if (cached.length > 0) {
          toast({ title: 'Modo Offline', description: `Mostrando datos guardados localmente` });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (!mountedRef.current) return;
      setError(msg);

      // Intento fallback offline
      if (offlineEnabled) {
        try {
          const cached = await offlineDB.getAllRecords<T>(cacheKey);
          if (cached.length > 0) {
            setData(cached);
            toast({ title: 'Usando datos offline', description: `Mostrando datos guardados localmente` });
            return;
          }
        } catch {
          // silencio intencional: ya no hay fallback
        }
      }

      toast({
        title: 'Error',
        description: errorMessage ?? `No se pudieron cargar los datos: ${msg}`,
        variant: 'destructive',
      });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isOnline, table, select, cacheKey, offlineEnabled, errorMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─────────────────────────────────────────────
// Variante React Query (para hooks que ya usan TanStack Query)
// ─────────────────────────────────────────────

export interface SupabaseReactQueryOptions<T> {
  table: SupabaseTable;
  select?: string;
  filters?: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>;
  queryKey?: string[];
  enabled?: boolean;
  queryOptions?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn' | 'enabled'>;
}

/**
 * Variante de useSupabaseQuery usando TanStack React Query.
 * Incluye caché automático, deduplicación y refetch.
 *
 * @example
 * const { data, isLoading, refetch } = useSupabaseReactQuery<Transaction>({
 *   table: 'financial_transactions',
 *   select: '*, animals(tag_id, name)',
 *   filters: q => q.order('transaction_date', { ascending: false }),
 * });
 */
export function useSupabaseReactQuery<T>({
  table,
  select = '*',
  filters,
  queryKey,
  enabled = true,
  queryOptions,
}: SupabaseReactQueryOptions<T>) {
  const { orgId, loadingOrgId } = useOrgId();

  const key = queryKey ?? [table, orgId];

  return useQuery<T[], Error>({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from(table).select(select);
      if (filters) query = filters(query) as typeof query;
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    },
    enabled: enabled && !!orgId && !loadingOrgId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    ...queryOptions,
  });
}
