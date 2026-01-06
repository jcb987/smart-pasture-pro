import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Users, Shield, Activity, Search } from 'lucide-react';
import { useUsers, type UserProfile } from '@/hooks/useUsers';
import { UserCard } from '@/components/usuarios/UserCard';
import { PermissionsDialog } from '@/components/usuarios/PermissionsDialog';
import { ActivityLogTable } from '@/components/usuarios/ActivityLogTable';
import { CreateUserDialog } from '@/components/usuarios/CreateUserDialog';

const Usuarios = () => {
  const {
    users,
    activityLogs,
    loading,
    canManageUsers,
    organizationId,
    fetchUsers,
    updateUserRole,
    toggleBlockUser,
    getUserPermissions,
    updateUserPermission,
    modules,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user.full_name?.toLowerCase().includes(search) || false) ||
      (user.farm_name?.toLowerCase().includes(search) || false) ||
      (user.phone?.includes(search) || false)
    );
  });

  const handleManagePermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.is_blocked).length;
  const blockedUsers = users.filter(u => u.is_blocked).length;
  const adminCount = users.filter(u => u.roles.includes('admin')).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Controla accesos, permisos y actividad del sistema
            </p>
          </div>
          {canManageUsers && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{totalUsers}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Activos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-2xl font-bold">{activeUsers}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bloqueados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-2xl font-bold">{blockedUsers}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Administradores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{adminCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Registro de Actividad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, finca o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No se encontraron usuarios</h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Crea el primer usuario para comenzar'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    canManageUsers={canManageUsers}
                    onUpdateRole={updateUserRole}
                    onToggleBlock={toggleBlockUser}
                    onManagePermissions={handleManagePermissions}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actividad">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registro de Actividad
                </CardTitle>
                <CardDescription>
                  Historial de acciones realizadas por los usuarios en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogTable logs={activityLogs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={selectedUser}
        modules={modules}
        getPermissions={getUserPermissions}
        updatePermission={updateUserPermission}
      />

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={fetchUsers}
        organizationId={organizationId}
      />
    </DashboardLayout>
  );
};

export default Usuarios;
