import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, Plus, Calculator, Leaf } from 'lucide-react';

const Alimentacion = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alimentación y Nutrición</h1>
            <p className="text-muted-foreground">Gestión de raciones y balance de dietas</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Ración
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Raciones Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Consumo MS/día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,250 kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Costo/Litro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.28</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.45</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Balance Nutricional</CardTitle>
            <CardDescription>
              Gestiona requerimientos nutricionales por categoría, balance energético y proteico,
              cálculo de FDN/FDA, predicción de producción vs alimento, consumo de materia seca
              y agua, y programación automática de suplementos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente podrás balancear dietas aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Alimentacion;
