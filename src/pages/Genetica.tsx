import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dna, Plus, Award, GitBranch } from 'lucide-react';

const Genetica = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Genética y Reproductores</h1>
            <p className="text-muted-foreground">Gestión de genética y selección</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Reproductor
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reproductores Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toros en Catálogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Consanguinidad Prom.</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Embriones Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mejoramiento Genético</CardTitle>
            <CardDescription>
              Gestiona ranking de reproductores, valor genético estimado, genealogía y pedigrí,
              consanguinidad, selección y descarte inteligente, control de semen y embriones.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <Dna className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Módulo en Desarrollo</p>
              <p className="text-sm">Próximamente podrás gestionar la genética aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Genetica;
