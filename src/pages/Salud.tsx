import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, Plus, Syringe, AlertTriangle, Pill, ShieldCheck, Calendar } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { AddHealthEventDialog } from '@/components/salud/AddHealthEventDialog';
import { AddVaccinationDialog } from '@/components/salud/AddVaccinationDialog';
import { HealthEventsTable, VaccinationTable } from '@/components/salud/HealthTables';
import { HealthAlerts, DiagnosisStatsCard } from '@/components/salud/HealthAlerts';

const Salud = () => {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);

  const {
    healthEvents,
    vaccinations,
    loading,
    addHealthEvent,
    updateHealthEvent,
    deleteHealthEvent,
    addVaccination,
    applyVaccination,
    deleteVaccination,
    getStats,
    getDiagnosisStats,
    getAlerts,
    COMMON_DIAGNOSES,
    COMMON_VACCINES,
  } = useHealth();

  const stats = getStats();
  const diagnosisStats = getDiagnosisStats();
  const alerts = getAlerts();

  const handleCompleteEvent = (id: string) => {
    updateHealthEvent(id, { status: 'completado', outcome: 'curado' });
  };

  const handleApplyVaccination = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    applyVaccination(id, today);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salud y Control Sanitario</h1>
            <p className="text-muted-foreground">Registro de tratamientos, vacunas y diagnósticos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVaccinationDialog(true)}>
              <Syringe className="mr-2 h-4 w-4" />
              Programar Vacuna
            </Button>
            <Button onClick={() => setShowEventDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Evento
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && <HealthAlerts alerts={alerts} />}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4 text-amber-600" />
                En Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.inTreatment}</div>
              <p className="text-xs text-muted-foreground">Tratamientos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Vacunas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVaccines}</div>
              <p className="text-xs text-muted-foreground">Programadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Vacunas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdueVaccines}</div>
              <p className="text-xs text-muted-foreground">Sin aplicar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-red-600" />
                Casos Mastitis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.mastitisCases}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                En Retiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.withdrawalActive}</div>
              <p className="text-xs text-muted-foreground">Período de retiro</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Total Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Histórico</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Events and Vaccinations */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Tratamientos y Diagnósticos</TabsTrigger>
            <TabsTrigger value="vaccinations">Calendario de Vacunas</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <HealthEventsTable 
              events={healthEvents} 
              onDelete={deleteHealthEvent}
              onComplete={handleCompleteEvent}
            />
          </TabsContent>

          <TabsContent value="vaccinations" className="space-y-4">
            <VaccinationTable 
              vaccinations={vaccinations}
              onApply={handleApplyVaccination}
              onDelete={deleteVaccination}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <DiagnosisStatsCard stats={diagnosisStats} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prevención y Monitoreo</CardTitle>
                  <CardDescription>
                    Estadísticas de enfermedades por tipo, época y frecuencia para prevenir brotes y mejorar la recuperación del hato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : healthEvents.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Sin datos suficientes</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Registra eventos de salud para ver estadísticas
                      </p>
                      <Button onClick={() => setShowEventDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Primer Evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {healthEvents.filter(e => e.event_type === 'tratamiento').length}
                          </div>
                          <p className="text-sm text-muted-foreground">Tratamientos</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {healthEvents.filter(e => e.event_type === 'diagnostico').length}
                          </div>
                          <p className="text-sm text-muted-foreground">Diagnósticos</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {vaccinations.filter(v => v.is_applied).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Vacunas Aplicadas</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión Sanitaria Completa</CardTitle>
            <CardDescription>
              Registra tratamientos veterinarios, controla vacunas aplicadas y próximas fechas,
              diagnósticos (mastitis, cojeras, retención de placenta), estadísticas de enfermedades
              y alertas de tratamientos vencidos. Muy útil para prevenir brotes y mejorar recuperación.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <AddHealthEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        onSubmitEvent={addHealthEvent}
        commonDiagnoses={COMMON_DIAGNOSES}
      />

      <AddVaccinationDialog
        open={showVaccinationDialog}
        onOpenChange={setShowVaccinationDialog}
        onSubmit={addVaccination}
        commonVaccines={COMMON_VACCINES}
      />
    </DashboardLayout>
  );
};

export default Salud;
