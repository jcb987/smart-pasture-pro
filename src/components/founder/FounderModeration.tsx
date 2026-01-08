import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Search,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MessageSquare,
  UserX,
  UserCheck,
  Clock,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  organizationName: string;
  organizationId: string;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  lastLogin?: string;
  createdAt: string;
  animalCount: number;
  isActive: boolean;
}

interface ModerationLog {
  id: string;
  action: string;
  targetUser: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

interface FounderModerationProps {
  users: User[];
  moderationLogs: ModerationLog[];
  loading?: boolean;
  onBlockUser: (userId: string, reason: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
  onSendWarning: (userId: string, message: string) => Promise<void>;
  onViewUserDetails: (user: User) => void;
}

export function FounderModeration({
  users,
  moderationLogs,
  loading,
  onBlockUser,
  onUnblockUser,
  onSendWarning,
  onViewUserDetails,
}: FounderModerationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const blockedCount = users.filter(u => u.isBlocked).length;
  const activeCount = users.filter(u => u.isActive && !u.isBlocked).length;
  const inactiveCount = users.filter(u => !u.isActive && !u.isBlocked).length;

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) return;
    setProcessing(true);
    try {
      await onBlockUser(selectedUser.userId, blockReason);
      setShowBlockDialog(false);
      setBlockReason('');
      setSelectedUser(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedUser || !warningMessage.trim()) return;
    setProcessing(true);
    try {
      await onSendWarning(selectedUser.userId, warningMessage);
      setShowWarningDialog(false);
      setWarningMessage('');
      setSelectedUser(null);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> Bloqueado</Badge>;
    }
    if (user.isActive) {
      return <Badge className="bg-emerald-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Activo</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Inactivo</Badge>;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inactiveCount}</p>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <UserX className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{blockedCount}</p>
                  <p className="text-sm text-muted-foreground">Bloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Moderación de Usuarios
            </CardTitle>
            <CardDescription>
              Gestionar acceso, bloquear usuarios y enviar advertencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email u organización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Animales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.isBlocked ? 'bg-red-500/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{user.organizationName || '—'}</TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <span className="text-sm">
                            {format(new Date(user.lastLogin), 'dd MMM yyyy', { locale: es })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{user.animalCount}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewUserDetails(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowWarningDialog(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Enviar advertencia
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isBlocked ? (
                                <DropdownMenuItem 
                                  onClick={() => onUnblockUser(user.userId)}
                                  className="text-emerald-600"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Desbloquear
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowBlockDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bloquear
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Moderation Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Historial de Moderación
            </CardTitle>
            <CardDescription>
              Registro de todas las acciones de moderación realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario Afectado</TableHead>
                    <TableHead>Razón</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderationLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.action === 'block' ? 'destructive' : log.action === 'unblock' ? 'default' : 'secondary'}>
                          {log.action === 'block' ? 'Bloqueo' : log.action === 'unblock' ? 'Desbloqueo' : 'Advertencia'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.targetUser}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.reason}>
                        {log.reason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {moderationLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay registros de moderación
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Bloquear Usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción impedirá que {selectedUser?.fullName || 'el usuario'} acceda al sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Razón del bloqueo</label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Describe la razón del bloqueo..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBlockUser}
              disabled={!blockReason.trim() || processing}
            >
              {processing ? 'Bloqueando...' : 'Bloquear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <MessageSquare className="h-5 w-5" />
              Enviar Advertencia
            </DialogTitle>
            <DialogDescription>
              Envía una advertencia a {selectedUser?.fullName || 'el usuario'} sobre su comportamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mensaje de advertencia</label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Escribe el mensaje de advertencia..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendWarning}
              disabled={!warningMessage.trim() || processing}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {processing ? 'Enviando...' : 'Enviar Advertencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
