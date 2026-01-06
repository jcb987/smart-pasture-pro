import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, Calendar, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledReport {
  id: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  email: string;
  enabled: boolean;
  lastSent?: string;
  nextSend: string;
}

export const AutomaticReportsConfig = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      reportType: 'produccion',
      frequency: 'daily',
      email: 'admin@finca.com',
      enabled: true,
      lastSent: '2026-01-05',
      nextSend: '2026-01-06',
    },
    {
      id: '2',
      reportType: 'inventario',
      frequency: 'weekly',
      email: 'admin@finca.com',
      enabled: false,
      nextSend: '2026-01-12',
    },
  ]);

  const [newReport, setNewReport] = useState({
    reportType: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    email: '',
  });

  const reportTypes = [
    { value: 'produccion', label: 'Producción Diaria' },
    { value: 'inventario', label: 'Inventario del Hato' },
    { value: 'reproduccion', label: 'Estado Reproductivo' },
    { value: 'salud', label: 'Eventos de Salud' },
    { value: 'financiero', label: 'Resumen Financiero' },
    { value: 'alertas', label: 'Resumen de Alertas' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
  ];

  const handleAddReport = () => {
    if (!newReport.reportType || !newReport.email) {
      toast.error('Completa todos los campos');
      return;
    }

    const nextSend = new Date();
    if (newReport.frequency === 'daily') nextSend.setDate(nextSend.getDate() + 1);
    else if (newReport.frequency === 'weekly') nextSend.setDate(nextSend.getDate() + 7);
    else nextSend.setMonth(nextSend.getMonth() + 1);

    const report: ScheduledReport = {
      id: Date.now().toString(),
      ...newReport,
      enabled: true,
      nextSend: nextSend.toISOString().split('T')[0],
    };

    setReports([...reports, report]);
    setNewReport({ reportType: '', frequency: 'weekly', email: '' });
    toast.success('Reporte programado correctamente');
  };

  const toggleReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success('Reporte eliminado');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Reportes Automáticos
        </CardTitle>
        <CardDescription>
          Programa el envío automático de reportes por email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing reports */}
        <div className="space-y-3">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <Switch 
                  checked={report.enabled}
                  onCheckedChange={() => toggleReport(report.id)}
                />
                <div>
                  <div className="font-medium text-sm">
                    {reportTypes.find(t => t.value === report.reportType)?.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {frequencies.find(f => f.value === report.frequency)?.label}
                    </Badge>
                    <span>→ {report.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Próximo: {report.nextSend}
                  </div>
                  {report.lastSent && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" />
                      Último: {report.lastSent}
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteReport(report.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay reportes programados
            </div>
          )}
        </div>

        {/* Add new report */}
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium text-sm">Agregar Nuevo Reporte</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select 
                value={newReport.reportType} 
                onValueChange={(v) => setNewReport({ ...newReport, reportType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select 
                value={newReport.frequency} 
                onValueChange={(v: 'daily' | 'weekly' | 'monthly') => 
                  setNewReport({ ...newReport, frequency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newReport.email}
                  onChange={(e) => setNewReport({ ...newReport, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="flex-1"
                />
                <Button onClick={handleAddReport}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Los reportes se enviarán automáticamente según la frecuencia configurada. 
          Asegúrate de que el email sea correcto.
        </p>
      </CardContent>
    </Card>
  );
};
