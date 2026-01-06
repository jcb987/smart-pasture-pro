import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'ganadero' | 'tecnico' | 'veterinario';
export type PermissionType = 'read' | 'write' | 'delete';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  farm_name: string | null;
  phone: string | null;
  is_blocked: boolean | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  last_login: string | null;
  created_at: string;
  email?: string;
  roles: AppRole[];
}

export interface UserPermission {
  id: string;
  user_id: string;
  module_name: string;
  permission: PermissionType;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  module_name: string | null;
  ip_address: string | null;
  details: unknown;
  created_at: string;
  user_name?: string;
}

const MODULES = [
  'dashboard',
  'usuarios',
  'animales',
  'reproduccion',
  'produccion-leche',
  'produccion-carne',
  'salud',
  'alimentacion',
  'praderas',
  'simulaciones',
  'reportes',
  'costos',
  'insumos',
  'genetica',
  'intercambio',
  'app-movil',
  'configuracion',
  'ayuda',
];

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { canManage: false, orgId: null };

    // Obtener organization_id del usuario actual
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return { 
      canManage: !!user, 
      orgId: profile?.organization_id || null 
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudieron cargar los usuarios: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo cargar el registro de actividad: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, role: AppRole, action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role, organization_id: organizationId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
      }

      toast({
        title: 'Éxito',
        description: `Rol ${action === 'add' ? 'agregado' : 'eliminado'} correctamente`,
      });

      await fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo actualizar el rol: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const toggleBlockUser = async (userId: string, block: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: block,
          blocked_at: block ? new Date().toISOString() : null,
          blocked_reason: block ? reason : null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Usuario ${block ? 'bloqueado' : 'desbloqueado'} correctamente`,
      });

      await fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo ${block ? 'bloquear' : 'desbloquear'} el usuario: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const getUserPermissions = async (userId: string): Promise<UserPermission[]> => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los permisos',
        variant: 'destructive',
      });
      return [];
    }

    return data || [];
  };

  const updateUserPermission = async (
    userId: string,
    moduleName: string,
    permission: PermissionType,
    action: 'add' | 'remove'
  ) => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_permissions')
          .insert({ user_id: userId, module_name: moduleName, permission });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('module_name', moduleName)
          .eq('permission', permission);

        if (error) throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos actualizados correctamente',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudieron actualizar los permisos: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { canManage, orgId } = await checkAuthStatus();
      setCanManageUsers(canManage);
      setOrganizationId(orgId);
      await fetchUsers();
      await fetchActivityLogs();
    };
    init();
  }, []);

  return {
    users,
    activityLogs,
    loading,
    canManageUsers,
    organizationId,
    fetchUsers,
    fetchActivityLogs,
    updateUserRole,
    toggleBlockUser,
    getUserPermissions,
    updateUserPermission,
    modules: MODULES,
  };
}
