import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react';

const Costos = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Costos y Finanzas</h1>
            <p className="text-muted-foreground">Gestión económica de la finca</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$45,230</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Egresos del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">$28,450</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Costo/Litro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.42</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Margen Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">37%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión Financiera</CardTitle>
            <CardDescription>
              Controla ingresos y egresos, costos operativos, estado de resultados (P&G),
              cálculo de costos por litro de leche o kilo de carne, flujos de caja,
              márgenes y rentabilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente podrás gestionar las finanzas aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Costos;
