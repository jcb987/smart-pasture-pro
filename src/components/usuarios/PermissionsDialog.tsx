import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type UserProfile, type UserPermission, type PermissionType } from '@/hooks/useUsers';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  modules: string[];
  getPermissions: (userId: string) => Promise<UserPermission[]>;
  updatePermission: (userId: string, module: string, permission: PermissionType, action: 'add' | 'remove') => Promise<void>;
}

const moduleLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'usuarios': 'Usuarios',
  'animales': 'Animales',
  'reproduccion': 'Reproducción',
  'produccion-leche': 'Producción de Leche',
  'produccion-carne': 'Producción de Carne',
  'salud': 'Salud',
  'alimentacion': 'Alimentación',
  'praderas': 'Praderas',
  'simulaciones': 'Simulaciones',
  'reportes': 'Reportes',
  'costos': 'Costos',
  'insumos': 'Insumos',
  'genetica': 'Genética',
  'intercambio': 'Intercambio',
  'app-movil': 'App Móvil',
  'configuracion': 'Configuración',
  'ayuda': 'Ayuda',
};

export function PermissionsDialog({
  open,
  onOpenChange,
  user,
  modules,
  getPermissions,
  updatePermission,
}: PermissionsDialogProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadPermissions();
    }
  }, [open, user]);

  const loadPermissions = async () => {
    if (!user) return;
    setLoading(true);
    const perms = await getPermissions(user.user_id);
    setPermissions(perms);
    setLoading(false);
  };

  const hasPermission = (module: string, permission: PermissionType) => {
    return permissions.some(p => p.module_name === module && p.permission === permission);
  };

  const handleToggle = async (module: string, permission: PermissionType) => {
    if (!user) return;
    const has = hasPermission(module, permission);
    await updatePermission(user.user_id, module, permission, has ? 'remove' : 'add');
    await loadPermissions();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permisos de {user.full_name}</DialogTitle>
          <DialogDescription>
            Configura qué acciones puede realizar este usuario en cada módulo
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-t-lg font-medium text-sm">
              <div>Módulo</div>
              <div className="text-center">Leer</div>
              <div className="text-center">Editar</div>
              <div className="text-center">Eliminar</div>
            </div>
            
            {/* Rows */}
            {modules.map(module => (
              <div 
                key={module} 
                className="grid grid-cols-4 gap-4 p-3 border-b items-center hover:bg-muted/50"
              >
                <div className="text-sm font-medium">
                  {moduleLabels[module] || module}
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={hasPermission(module, 'read')}
                    onCheckedChange={() => handleToggle(module, 'read')}
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={hasPermission(module, 'write')}
                    onCheckedChange={() => handleToggle(module, 'write')}
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={hasPermission(module, 'delete')}
                    onCheckedChange={() => handleToggle(module, 'delete')}
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
