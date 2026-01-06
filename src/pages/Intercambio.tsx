import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Upload, History, Loader2 } from 'lucide-react';
import { useTraceability } from '@/hooks/useTraceability';
import { ExportLifeSheet } from '@/components/intercambio/ExportLifeSheet';
import { AnimalTimeline } from '@/components/intercambio/AnimalTimeline';
import { TraceabilityRecords } from '@/components/intercambio/TraceabilityRecords';

const Intercambio = () => {
  const { records, loading, getTraceabilityStats } = useTraceability();
  const stats = getTraceabilityStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Intercambio de Datos</h1>
            <p className="text-muted-foreground">Trazabilidad e historial completo por animal</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-500" />
                Hojas de Vida Exportadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.exports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-500" />
                Animales Importados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.imports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Transferencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transfers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4 text-orange-500" />
                Total Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <FileText className="mr-2 h-4 w-4" />
              Línea de Tiempo
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <ExportLifeSheet />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Qué incluye la Hoja de Vida?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Información Básica</p>
                      <p className="text-sm text-muted-foreground">ID, nombre, raza, categoría, estado, fechas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Pedigrí</p>
                      <p className="text-sm text-muted-foreground">Información de madre y padre</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Historial de Peso</p>
                      <p className="text-sm text-muted-foreground">Todos los pesajes con ganancia diaria</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Eventos de Salud</p>
                      <p className="text-sm text-muted-foreground">Tratamientos, diagnósticos, vacunas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Eventos Reproductivos</p>
                      <p className="text-sm text-muted-foreground">Inseminaciones, partos, diagnósticos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium">Producción de Leche</p>
                      <p className="text-sm text-muted-foreground">Historial completo de producción (si aplica)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div>
                      <p className="font-medium">Código de Verificación</p>
                      <p className="text-sm text-muted-foreground">Código único para validar autenticidad</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <AnimalTimeline />
          </TabsContent>

          <TabsContent value="history">
            <TraceabilityRecords records={records} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Intercambio;
