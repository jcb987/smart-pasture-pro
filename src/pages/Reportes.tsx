import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileBarChart, ArrowLeft, Sparkles, History, Clock } from 'lucide-react';
import { useReports, ReportType, ReportFilters, ReportData } from '@/hooks/useReports';
import { useAnimals } from '@/hooks/useAnimals';
import { useAuth } from '@/contexts/AuthContext';
import { ReportGrid } from '@/components/reportes/ReportCard';
import { ReportFiltersDialog } from '@/components/reportes/ReportFiltersDialog';
import { ReportViewer } from '@/components/reportes/ReportViewer';
import { AutomaticReportsConfig } from '@/components/reportes/AutomaticReportsConfig';

const Reportes = () => {
  const { loading, generateReport, exportToExcel, exportToPDF, REPORT_CONFIGS } = useReports();
  const { getStats } = useAnimals();
  const { user } = useAuth();

  const RECENT_KEY = `agrodata_recent_reports_${user?.id || 'anon'}`;

  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
  const [recentReports, setRecentReports] = useState<{ type: ReportType; title: string; date: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`agrodata_recent_reports_${user?.id || 'anon'}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentReports));
  }, [recentReports]);

  const stats = getStats();

  const handleSelectReport = (reportType: ReportType) => {
    setSelectedReportType(reportType);
    setFiltersDialogOpen(true);
  };

  const handleGenerateReport = async (filters: ReportFilters) => {
    if (!selectedReportType) return;

    const report = await generateReport(selectedReportType, filters);
    if (report) {
      setCurrentReport(report);
      setFiltersDialogOpen(false);

      // Add to recent reports
      setRecentReports(prev => [
        { type: selectedReportType, title: report.title, date: new Date().toISOString() },
        ...prev.filter(r => r.type !== selectedReportType).slice(0, 4),
      ]);
    }
  };

  const handleExportExcel = () => {
    if (currentReport) {
      exportToExcel(currentReport);
    }
  };

  const handleExportPDF = () => {
    if (currentReport) {
      exportToPDF(currentReport);
    }
  };

  const handleCloseReport = () => {
    setCurrentReport(null);
    setSelectedReportType(null);
  };

  // If viewing a report, show the viewer
  if (currentReport) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleCloseReport}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Reportes
            </Button>
          </div>
          <ReportViewer
            reportData={currentReport}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onClose={handleCloseReport}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes y Análisis</h1>
            <p className="text-muted-foreground">Genera informes completos para análisis o auditorías</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reportes Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{REPORT_CONFIGS.length}</div>
              <p className="text-xs text-muted-foreground">tipos de reporte</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Animales Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">para reportar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lotes.length}</div>
              <p className="text-xs text-muted-foreground">grupos disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reportes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentReports.length}</div>
              <p className="text-xs text-muted-foreground">en esta sesión</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="predefinidos" className="w-full">
          <TabsList>
            <TabsTrigger value="predefinidos">
              <FileBarChart className="mr-2 h-4 w-4" />
              Reportes Predefinidos
            </TabsTrigger>
            <TabsTrigger value="automaticos">
              <Clock className="mr-2 h-4 w-4" />
              Automáticos
            </TabsTrigger>
            <TabsTrigger value="recientes">
              <History className="mr-2 h-4 w-4" />
              Recientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predefinidos" className="mt-6">
            <ReportGrid configs={REPORT_CONFIGS} onSelect={handleSelectReport} />
          </TabsContent>

          <TabsContent value="automaticos" className="mt-6">
            <AutomaticReportsConfig />
          </TabsContent>

          <TabsContent value="recientes" className="mt-6">
            {recentReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Sin reportes recientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Los reportes que generes aparecerán aquí para acceso rápido.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentReports.map((report, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectReport(report.type)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription>
                        {new Date(report.date).toLocaleString('es-ES')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm">
                        Regenerar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Centro de Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                El módulo de reportes te permite generar informes completos para:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                <li>✔ <strong>Producción:</strong> Reportes de leche y carne con estadísticas detalladas</li>
                <li>✔ <strong>Reproducción:</strong> Estado del hato, servicios, partos y tasas de preñez</li>
                <li>✔ <strong>Sanidad:</strong> Tratamientos, vacunaciones, costos veterinarios</li>
                <li>✔ <strong>Económico:</strong> Análisis de costos, alimentación, rentabilidad</li>
                <li>✔ <strong>Inventario:</strong> Listado completo del hato con todos los detalles</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Todos los reportes pueden exportarse a <strong>Excel</strong> o <strong>PDF</strong> para
                presentar en reuniones, auditorías o análisis contables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Dialog */}
      <ReportFiltersDialog
        open={filtersDialogOpen}
        onOpenChange={setFiltersDialogOpen}
        reportType={selectedReportType}
        onGenerate={handleGenerateReport}
        loading={loading}
        availableLots={stats.lotes}
      />
    </DashboardLayout>
  );
};

export default Reportes;
