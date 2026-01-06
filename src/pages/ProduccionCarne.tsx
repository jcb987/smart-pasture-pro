import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Drumstick, Plus, Scale, TrendingUp } from 'lucide-react';

const ProduccionCarne = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Producción de Carne</h1>
            <p className="text-muted-foreground">Seguimiento de crecimiento y engorde</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Peso
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Animales en Engorde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">GDP Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">850 g/día</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peso Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">425 kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Listos para Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Control de Crecimiento</CardTitle>
            <CardDescription>
              Registra pesos individuales y por lote, ganancia diaria de peso (g/día),
              curvas de crecimiento, valor genético estimado, índice de producción
              de carne y rentabilidad por animal o lote.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Drumstick className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente verás curvas de crecimiento y datos aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProduccionCarne;
