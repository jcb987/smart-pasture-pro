import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreVertical, Shield, Lock, Unlock, Key, UserCog, Trash2 } from 'lucide-react';
import { type UserProfile, type AppRole } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserCardProps {
  user: UserProfile;
  canManageUsers: boolean;
  onUpdateRole: (userId: string, role: AppRole, action: 'add' | 'remove') => void;
  onToggleBlock: (userId: string, block: boolean, reason?: string) => void;
  onManagePermissions: (user: UserProfile) => void;
  onUserDeleted?: () => void;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  ganadero: 'Ganadero',
  tecnico: 'Técnico',
  veterinario: 'Veterinario',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  ganadero: 'bg-primary text-primary-foreground',
  tecnico: 'bg-blue-500 text-white',
  veterinario: 'bg-green-500 text-white',
};

export function UserCard({ user, canManageUsers, onUpdateRole, onToggleBlock, onManagePermissions, onUserDeleted }: UserCardProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBlock = () => {
    onToggleBlock(user.user_id, true, blockReason);
    setBlockDialogOpen(false);
    setBlockReason('');
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await supabase.functions.invoke('manage-team-user', {
        body: { action: 'delete', target_user_id: user.user_id },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Error desconocido');

      toast({ title: 'Éxito', description: 'Usuario eliminado correctamente' });
      setDeleteDialogOpen(false);
      onUserDeleted?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' });
      return;
    }
    try {
      setActionLoading(true);
      const response = await supabase.functions.invoke('manage-team-user', {
        body: { action: 'reset_password', target_user_id: user.user_id, new_password: newPassword },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Error desconocido');

      toast({ title: 'Éxito', description: 'Contraseña restablecida correctamente' });
      setResetPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo restablecer la contraseña',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const allRoles: AppRole[] = ['admin', 'ganadero', 'tecnico', 'veterinario'];

  return (
    <>
      <Card className={user.is_blocked ? 'opacity-60 border-destructive' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {user.full_name || 'Sin nombre'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {user.farm_name || 'Sin finca asignada'}
                </p>
              </div>
            </div>
            {canManageUsers && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Gestionar roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Gestionar permisos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResetPasswordDialogOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Restablecer contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.is_blocked ? (
                    <DropdownMenuItem onClick={() => onToggleBlock(user.user_id, false)}>
                      <Unlock className="mr-2 h-4 w-4" />
                      Desbloquear cuenta
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => setBlockDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Bloquear cuenta
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar usuario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.phone && (
              <p className="text-sm text-muted-foreground">
                📞 {user.phone}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {user.roles.length > 0 ? (
                user.roles.map(role => (
                  <Badge key={role} className={roleColors[role]}>
                    {roleLabels[role]}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Sin rol asignado</Badge>
              )}
            </div>
            {user.is_blocked && (
              <div className="p-2 bg-destructive/10 rounded-md text-sm">
                <p className="font-medium text-destructive">Cuenta bloqueada</p>
                {user.blocked_reason && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Razón: {user.blocked_reason}
                  </p>
                )}
              </div>
            )}
            {user.last_login && (
              <p className="text-xs text-muted-foreground">
                Último acceso: {new Date(user.last_login).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para bloquear usuario */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres bloquear a {user.full_name}? 
              El usuario no podrá acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Razón del bloqueo (opcional)</Label>
              <Input
                id="reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ingresa la razón del bloqueo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBlock}>
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar roles */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar roles</DialogTitle>
            <DialogDescription>
              Asigna o remueve roles para {user.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {allRoles.map(role => {
              const hasRole = user.roles.includes(role);
              return (
                <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[role]}>{roleLabels[role]}</Badge>
                  </div>
                  <Button
                    variant={hasRole ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => {
                      onUpdateRole(user.user_id, role, hasRole ? 'remove' : 'add');
                    }}
                  >
                    {hasRole ? 'Remover' : 'Agregar'}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar usuario */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente a <strong>{user.full_name}</strong>? 
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este usuario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? 'Eliminando...' : 'Eliminar permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para restablecer contraseña */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => { setResetPasswordDialogOpen(open); if (!open) setNewPassword(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {user.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordDialogOpen(false); setNewPassword(''); }} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={actionLoading}>
              {actionLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
