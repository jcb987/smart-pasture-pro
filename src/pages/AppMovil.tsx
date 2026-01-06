import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, RefreshCw, Cloud, Download } from 'lucide-react';

const AppMovil = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">App Móvil y Sincronización</h1>
            <p className="text-muted-foreground">Datos en campo y backup en la nube</p>
          </div>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar Ahora
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hace 2h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dispositivos Conectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conectividad Móvil</CardTitle>
            <CardDescription>
              Sincroniza datos entre PC y teléfono, usa la app offline y sincroniza con internet,
              ingresa eventos desde el campo y mantén backup automático en la nube.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Descarga la App</p>
              <p className="text-sm mb-4">Disponible para iOS y Android</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  App Store
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Google Play
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AppMovil;
