import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserModulePermission {
  module_name: string;
  permission: string;
}

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserModulePermission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
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

        // Check if team member
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_team_member')
          .eq('user_id', user.id)
          .maybeSingle();

        const teamMember = (profile as any)?.is_team_member === true;
        setIsTeamMember(teamMember);

        // If admin, no need to fetch granular permissions - they see everything
        if (userIsAdmin) {
          setPermissions([]);
          setLoading(false);
          return;
        }

        // Fetch user permissions
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
    if (loading) return false; // Don't grant access while loading
    if (isAdmin) return true;
    if (!isTeamMember) return true; // Owner sees everything
    return permissions.some(p => p.module_name === moduleName && p.permission === 'read');
  };

  const hasWriteAccess = (moduleName: string): boolean => {
    if (loading) return false;
    if (isAdmin) return true;
    if (!isTeamMember) return true;
    return permissions.some(p => p.module_name === moduleName && p.permission === 'write');
  };

  const hasDeleteAccess = (moduleName: string): boolean => {
    if (loading) return false;
    if (isAdmin) return true;
    if (!isTeamMember) return true;
    return permissions.some(p => p.module_name === moduleName && p.permission === 'delete');
  };

  return {
    permissions,
    isAdmin,
    isTeamMember,
    loading,
    hasModuleAccess,
    hasWriteAccess,
    hasDeleteAccess,
  };
}
