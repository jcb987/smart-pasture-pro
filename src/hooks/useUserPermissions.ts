import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserModulePermission {
  module_name: string;
  permission: string;
}

/**
 * Pre-defined module access per role.
 * Ganadero (owner) and admin always get full access — not listed here.
 */
const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  veterinario: [
    'dashboard',
    'animales',
    'reproduccion',
    'produccion-leche',
    'produccion-carne',
    'salud',
    'alimentacion',
    'praderas',
    'genetica',
    'reportes',
    'app-movil',
    'ayuda',
  ],
  tecnico: [
    'dashboard',
    'animales',
    'reproduccion',
    'produccion-leche',
    'produccion-carne',
    'salud',
    'alimentacion',
    'praderas',
    'insumos',
    'app-movil',
    'ayuda',
  ],
};

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserModulePermission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [roleModules, setRoleModules] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        // Check if user is admin
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        const userIsAdmin = !!adminRole;
        setIsAdmin(userIsAdmin);

        // If admin, no need to check further — they see everything
        if (userIsAdmin) {
          setRoleModules(null);
          setPermissions([]);
          setLoading(false);
          return;
        }

        // Check for role-specific access (veterinario, tecnico)
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const roles = (userRoles || []).map(r => r.role);

        if (roles.includes('veterinario')) {
          setRoleModules(ROLE_MODULE_ACCESS.veterinario);
          setLoading(false);
          return;
        }

        if (roles.includes('tecnico')) {
          setRoleModules(ROLE_MODULE_ACCESS.tecnico);
          setLoading(false);
          return;
        }

        // Ganadero and others: check is_team_member for granular permissions
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_team_member')
          .eq('user_id', user.id)
          .maybeSingle();

        const teamMember = (profile as any)?.is_team_member === true;
        setIsTeamMember(teamMember);

        if (!teamMember) {
          // Owner — full access, no need to fetch granular permissions
          setRoleModules(null);
          setLoading(false);
          return;
        }

        // Team member with explicit permissions
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('module_name, permission')
          .eq('user_id', user.id);

        setPermissions(perms || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasModuleAccess = (moduleName: string): boolean => {
    if (loading) return false;
    if (isAdmin) return true;
    if (roleModules !== null) return roleModules.includes(moduleName);
    if (!isTeamMember) return true; // Owner sees everything
    return permissions.some(p => p.module_name === moduleName && p.permission === 'read');
  };

  const hasWriteAccess = (moduleName: string): boolean => {
    if (loading) return false;
    if (isAdmin) return true;
    if (roleModules !== null) return roleModules.includes(moduleName);
    if (!isTeamMember) return true;
    return permissions.some(p => p.module_name === moduleName && p.permission === 'write');
  };

  const hasDeleteAccess = (moduleName: string): boolean => {
    if (loading) return false;
    if (isAdmin) return true;
    if (roleModules !== null) return false; // Role-based users can't delete by default
    if (!isTeamMember) return true;
    return permissions.some(p => p.module_name === moduleName && p.permission === 'delete');
  };

  return {
    permissions,
    isAdmin,
    isTeamMember,
    roleModules,
    loading,
    hasModuleAccess,
    hasWriteAccess,
    hasDeleteAccess,
  };
}
