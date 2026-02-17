import { useUserPermissions } from '@/hooks/useUserPermissions';

/**
 * Returns permission flags for a specific module.
 * Use in page components to conditionally show/hide create, edit, delete buttons.
 */
export function useModulePermissions(moduleName: string) {
  const { hasModuleAccess, hasWriteAccess, hasDeleteAccess, isAdmin, isTeamMember, loading } = useUserPermissions();

  return {
    canRead: hasModuleAccess(moduleName),
    canWrite: hasWriteAccess(moduleName),
    canDelete: hasDeleteAccess(moduleName),
    isAdmin,
    isTeamMember,
    loading,
  };
}
