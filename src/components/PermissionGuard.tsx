import { Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  moduleName: string;
  children: React.ReactNode;
}

// Modules that are always accessible to any authenticated user
const ALWAYS_ACCESSIBLE_MODULES = ['dashboard', 'configuracion', 'ayuda'];

const PermissionGuard: React.FC<PermissionGuardProps> = ({ moduleName, children }) => {
  const { hasModuleAccess, loading } = useUserPermissions();

  // Always allow access to core modules to prevent redirect loops
  if (ALWAYS_ACCESSIBLE_MODULES.includes(moduleName)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasModuleAccess(moduleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
