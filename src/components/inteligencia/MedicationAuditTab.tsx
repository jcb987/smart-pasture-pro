import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMedicationAudit, CERTIFICATION_STANDARDS } from "@/hooks/useMedicationAudit";
import { 
  FileCheck, 
  AlertTriangle, 
  Pill, 
  Calendar,
  Download,
  Plus,
  Shield,
  Clock
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";

export const MedicationAuditTab = () => {
  const { 
    reports, 
    getAnimalsInWithdrawal,
    generateReport,
    updateReportStatus,
    isLoading 
  } = useMedicationAudit();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportName: '',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    certificationStandard: '',
  });

  const animalsInWithdrawal = getAnimalsInWithdrawal();

  const handleGenerate = () => {
    generateReport.mutate({
      reportName: reportForm.reportName,
      startDate: reportForm.startDate,
      endDate: reportForm.endDate,
      certificationStandard: reportForm.certificationStandard || undefined,
    }, {
      onSuccess: () => {
        setIsGenerateOpen(false);
        setReportForm({
          reportName: '',
          startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
          certificationStandard: '',
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal Alert */}
      {animalsInWithdrawal.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Animales en Período de Retiro
            </CardTitle>
            <CardDescription>
              Estos animales no deben ser vendidos ni sacrificados hasta que finalice el período de retiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {animalsInWithdrawal.slice(0, 6).map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border"
                >
                  <div>
                    <p className="font-medium">{item.animal?.tag_id}</p>
                    <p className="text-sm text-muted-foreground">{item.medication}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(item.withdrawalEndDate), 'd MMM', { locale: es })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {animalsInWithdrawal.length > 6 && (
              <p className="text-sm text-muted-foreground mt-3">
                Y {animalsInWithdrawal.length - 6} animales más...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Auditoría de Medicamentos
          </h3>
          <p className="text-sm text-muted-foreground">
            Genera reportes para certificaciones sanitarias y auditorías
          </p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Reporte de Auditoría</DialogTitle>
              <DialogDescription>
                Crea un reporte detallado de uso de medicamentos para certificaciones
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Reporte *</Label>
                <Input
                  value={reportForm.reportName}
                  onChange={(e) => setReportForm({...reportForm, reportName: e.target.value})}
                  placeholder="Ej: Auditoría Q1 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={reportForm.startDate}
                    onChange={(e) => setReportForm({...reportForm, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={reportForm.endDate}
                    onChange={(e) => setReportForm({...reportForm, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estándar de Certificación</Label>
                <Select 
                  value={reportForm.certificationStandard}
                  onValueChange={(v) => setReportForm({...reportForm, certificationStandard: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATION_STANDARDS.map((std) => (
                      <SelectItem key={std.value} value={std.value}>{std.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerate}
                className="w-full"
                disabled={!reportForm.reportName || !reportForm.startDate || !reportForm.endDate || generateReport.isPending}
              >
                <Shield className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Generados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Certificación</TableHead>
                <TableHead className="text-center">Tratamientos</TableHead>
                <TableHead className="text-center">Animales</TableHead>
                <TableHead className="text-center">En Retiro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.report_name}</TableCell>
                  <TableCell>
                    {format(new Date(report.report_period_start), 'd MMM', { locale: es })} - 
                    {format(new Date(report.report_period_end), 'd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {CERTIFICATION_STANDARDS.find(s => s.value === report.certification_standard)?.label || '-'}
                  </TableCell>
                  <TableCell className="text-center">{report.total_treatments}</TableCell>
                  <TableCell className="text-center">{report.total_animals_treated}</TableCell>
                  <TableCell className="text-center">
                    {report.animals_in_withdrawal > 0 ? (
                      <Badge variant="outline" className="text-yellow-600">
                        {report.animals_in_withdrawal}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        report.status === 'final' ? 'default' : 
                        report.status === 'submitted' ? 'secondary' : 'outline'
                      }
                    >
                      {report.status === 'draft' && 'Borrador'}
                      {report.status === 'final' && 'Final'}
                      {report.status === 'submitted' && 'Enviado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateReportStatus.mutate({ id: report.id, status: 'final' })}
                        >
                          Finalizar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No hay reportes generados</p>
                    <p className="text-sm text-muted-foreground">
                      Genera tu primer reporte de auditoría de medicamentos
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Trazabilidad Completa</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Historial detallado de cada medicamento aplicado por animal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h4 className="font-medium">Control de Retiro</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Alertas automáticas de períodos de retiro activos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h4 className="font-medium">Certificaciones</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Reportes compatibles con estándares internacionales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
