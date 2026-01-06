import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Smartphone, RefreshCw, Cloud, Download, Wifi, WifiOff, 
  CheckCircle, Clock, Laptop, Tablet, AlertTriangle, QrCode, Loader2
} from 'lucide-react';
import { useMobileSync } from '@/hooks/useMobileSync';
import { useToast } from '@/hooks/use-toast';

const AppMovil = () => {
  const { syncStatus, offlineEvents, syncNow, clearSyncedEvents } = useMobileSync();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncNow();
    setSyncing(false);
    
    toast({
      title: result.success ? 'Sincronización exitosa' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Nunca';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days} días`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Laptop;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">App Móvil y Sincronización</h1>
            <p className="text-muted-foreground">Datos en campo y backup en la nube</p>
          </div>
          <Button onClick={handleSync} disabled={syncing || !syncStatus.isOnline}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar Ahora
          </Button>
        </div>

        {/* Estado de conexión */}
        <Alert variant={syncStatus.isOnline ? 'default' : 'destructive'}>
          {syncStatus.isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertTitle>
            {syncStatus.isOnline ? 'Conectado a Internet' : 'Sin conexión'}
          </AlertTitle>
          <AlertDescription>
            {syncStatus.isOnline 
              ? 'Los datos se sincronizarán automáticamente con la nube.'
              : 'Puedes seguir trabajando. Los datos se sincronizarán cuando recuperes la conexión.'}
          </AlertDescription>
        </Alert>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Última Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLastSync(syncStatus.lastSyncDate)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                Dispositivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStatus.devices.length || 1}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {syncStatus.pendingChanges > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                Eventos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStatus.pendingChanges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                Backup en Nube
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sync" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronización
            </TabsTrigger>
            <TabsTrigger value="devices">
              <Smartphone className="mr-2 h-4 w-4" />
              Dispositivos
            </TabsTrigger>
            <TabsTrigger value="download">
              <Download className="mr-2 h-4 w-4" />
              Descargar App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Estado de sincronización */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estado de Sincronización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estado de conexión</span>
                    <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
                      {syncStatus.isOnline ? 'En línea' : 'Sin conexión'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Última sincronización</span>
                    <span className="font-medium">{formatLastSync(syncStatus.lastSyncDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cambios pendientes</span>
                    <Badge variant={syncStatus.pendingChanges > 0 ? 'secondary' : 'outline'}>
                      {syncStatus.pendingChanges}
                    </Badge>
                  </div>

                  {syncStatus.syncInProgress && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Sincronizando...</p>
                      <Progress value={75} />
                    </div>
                  )}

                  <Button onClick={handleSync} disabled={syncing || !syncStatus.isOnline} className="w-full">
                    {syncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Forzar Sincronización
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Eventos pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Eventos Offline</CardTitle>
                  <CardDescription>
                    Eventos registrados sin conexión pendientes de sincronizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offlineEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Todos los datos están sincronizados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {offlineEvents.slice(-10).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium text-sm">{event.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={event.synced ? 'default' : 'secondary'}>
                            {event.synced ? 'Sincronizado' : 'Pendiente'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {offlineEvents.some(e => e.synced) && (
                    <Button variant="outline" onClick={clearSyncedEvents} className="w-full mt-4">
                      Limpiar eventos sincronizados
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Características de sincronización */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Características de Sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <WifiOff className="h-8 w-8 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Modo Offline</h4>
                      <p className="text-sm text-muted-foreground">
                        Trabaja sin internet. Los datos se guardan localmente y se sincronizan cuando recuperes conexión.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <RefreshCw className="h-8 w-8 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Sincronización Automática</h4>
                      <p className="text-sm text-muted-foreground">
                        Los cambios se sincronizan automáticamente cuando hay conexión disponible.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Cloud className="h-8 w-8 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Backup en la Nube</h4>
                      <p className="text-sm text-muted-foreground">
                        Tus datos están respaldados automáticamente en servidores seguros.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dispositivos Conectados</CardTitle>
                <CardDescription>
                  Dispositivos que tienen acceso a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Última actividad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(syncStatus.devices.length > 0 ? syncStatus.devices : [
                      {
                        id: 'current',
                        name: 'Este dispositivo',
                        type: 'desktop' as const,
                        lastActive: new Date().toISOString(),
                        isCurrentDevice: true,
                      },
                    ]).map((device) => {
                      const Icon = getDeviceIcon(device.type);
                      return (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {device.name}
                          </TableCell>
                          <TableCell className="capitalize">{device.type === 'desktop' ? 'Escritorio' : device.type === 'mobile' ? 'Móvil' : 'Tablet'}</TableCell>
                          <TableCell>{new Date(device.lastActive).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={device.isCurrentDevice ? 'default' : 'secondary'}>
                              {device.isCurrentDevice ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    App para Móvil
                  </CardTitle>
                  <CardDescription>
                    Descarga la aplicación para registrar datos desde el campo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                      <QrCode className="h-20 w-20 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Escanea el código QR con tu teléfono para instalar la app
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      App Store
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Google Play
                    </Button>
                  </div>

                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertTitle>Instalar como App Web</AlertTitle>
                    <AlertDescription>
                      También puedes instalar esta app directamente desde el navegador de tu celular. Abre el menú del navegador y selecciona "Agregar a pantalla de inicio".
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funciones de la App Móvil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Registro de eventos en campo</p>
                      <p className="text-sm text-muted-foreground">Pesos, salud, reproducción, alimentación</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Funciona sin internet</p>
                      <p className="text-sm text-muted-foreground">Los datos se guardan y sincronizan después</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Búsqueda rápida de animales</p>
                      <p className="text-sm text-muted-foreground">Por número, nombre o código QR</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Alertas y recordatorios</p>
                      <p className="text-sm text-muted-foreground">Notificaciones push de eventos importantes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Fotos de animales</p>
                      <p className="text-sm text-muted-foreground">Captura y asocia fotos a cada registro</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Consulta de historial</p>
                      <p className="text-sm text-muted-foreground">Ver toda la información del animal en campo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AppMovil;
