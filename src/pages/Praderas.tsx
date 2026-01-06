import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, Plus, MapPin, Sun } from 'lucide-react';

const Praderas = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Praderas y Forraje</h1>
            <p className="text-muted-foreground">Control de pasturas y aforo</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Aforo
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Potreros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hectáreas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">180 ha</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Capacidad Carga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.8 UA/ha</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Descanso Prom.</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">35 días</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Praderas</CardTitle>
            <CardDescription>
              Controla número de potreros, días de descanso/ocupación, capacidad de carga por potrero,
              aforos con imágenes de drones, análisis de bromatología y capacidad productiva.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Sprout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente verás mapas y datos de praderas aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Praderas;
