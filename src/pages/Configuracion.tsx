import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, User, Bell, Database } from 'lucide-react';

const Configuracion = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración General</h1>
            <p className="text-muted-foreground">Ajustes del sistema</p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <User className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Perfil</CardTitle>
              <CardDescription>Datos personales y de la finca</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Bell className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Alertas</CardTitle>
              <CardDescription>Configuración de notificaciones</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Database className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Datos</CardTitle>
              <CardDescription>Copias de seguridad y exportación</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Settings className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Sistema</CardTitle>
              <CardDescription>Unidades y parámetros generales</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes del Sistema</CardTitle>
            <CardDescription>
              Configura perfiles y permisos, unidades de medida, parametrización de alertas,
              ajustes de feed, pasturas, reproductores y copias de seguridad.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Panel de Configuración</p>
              <p className="text-sm">Selecciona una categoría arriba para configurar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
