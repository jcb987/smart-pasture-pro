import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Milk, Plus, TrendingUp, Award } from 'lucide-react';

const ProduccionLeche = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Producción de Leche</h1>
            <p className="text-muted-foreground">Control completo de producción lechera</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Producción
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Producción Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847 L</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Promedio/Vaca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.3 L</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vacas Lactando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Calidad (Grasa)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.8%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Control de Producción</CardTitle>
            <CardDescription>
              Gestiona producción por animal, grupo o lote, curvas de producción (305 días),
              calidad de leche (grasa, proteína, sólidos, MUN, CCS), ranking de vacas,
              proyección futura y relación producción vs alimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Milk className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente verás gráficas y datos de producción aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProduccionLeche;
