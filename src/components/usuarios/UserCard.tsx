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
import { MoreVertical, Shield, Lock, Unlock, Key, UserCog } from 'lucide-react';
import { type UserProfile, type AppRole } from '@/hooks/useUsers';

interface UserCardProps {
  user: UserProfile;
  isAdmin: boolean;
  onUpdateRole: (userId: string, role: AppRole, action: 'add' | 'remove') => void;
  onToggleBlock: (userId: string, block: boolean, reason?: string) => void;
  onManagePermissions: (user: UserProfile) => void;
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

export function UserCard({ user, isAdmin, onUpdateRole, onToggleBlock, onManagePermissions }: UserCardProps) {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

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
            {isAdmin && (
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
                  <DropdownMenuItem>
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
    </>
  );
}
