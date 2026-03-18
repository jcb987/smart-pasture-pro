import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { MilkRecord } from '@/hooks/useMilkProduction';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

type DatePreset = 'week' | 'month' | 'custom';

interface MilkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: MilkRecord[];
}

const formatLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const MilkExportDialog = ({ open, onOpenChange, records }: MilkExportDialogProps) => {
  const [preset, setPreset] = useState<DatePreset>('month');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [exporting, setExporting] = useState(false);
  const { generateReport, exportToPDF } = useReports();
  const { toast } = useToast();

  const handlePreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    if (p === 'week') {
      setDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
      setDateTo(endOfWeek(now, { weekStartsOn: 1 }));
    } else if (p === 'month') {
      setDateFrom(startOfMonth(now));
      setDateTo(endOfMonth(now));
    }
  };

  const getDateRange = () => ({
    from: dateFrom ? formatLocalDate(dateFrom) : formatLocalDate(subDays(new Date(), 30)),
    to: dateTo ? formatLocalDate(dateTo) : formatLocalDate(new Date()),
  });

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { from, to } = getDateRange();
      const reportData = await generateReport('produccion_leche', { dateFrom: from, dateTo: to });
      if (reportData) {
        exportToPDF(reportData);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      const { from, to } = getDateRange();
      const filtered = records.filter(
        (r) => r.production_date >= from && r.production_date <= to
      );

      const rows = filtered.map((r) => ({
        Arete: r.animal?.tag_id || '',
        Nombre: r.animal?.name || '',
        Fecha: r.production_date,
        'Litros Mañana': r.morning_liters ?? '',
        'Litros Tarde': r.afternoon_liters ?? '',
        'Litros Noche': r.evening_liters ?? '',
        'Total Litros': r.total_liters ?? '',
        'Grasa %': r.fat_percentage ?? '',
        'Proteína %': r.protein_percentage ?? '',
        CCS: r.somatic_cell_count ?? '',
        Observaciones: r.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 30 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ProduccionLeche');
      XLSX.writeFile(wb, `produccion_leche_${from}_${to}.xlsx`);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${rows.length} registros en Excel`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo exportar los datos',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Datos de Producción</DialogTitle>
          <DialogDescription>
            Selecciona el formato y el rango de fechas para la exportación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Período</label>
            <div className="flex gap-2">
              {([
                { value: 'week', label: 'Esta Semana' },
                { value: 'month', label: 'Este Mes' },
                { value: 'custom', label: 'Personalizado' },
              ] as { value: DatePreset; label: string }[]).map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom date pickers */}
          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Desde</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Fecha inicio'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={es}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Hasta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Fecha fin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={es}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Date range display */}
          <div className="text-xs text-muted-foreground text-center">
            {dateFrom && dateTo && (
              <>Exportando del {format(dateFrom, 'dd MMM yyyy', { locale: es })} al {format(dateTo, 'dd MMM yyyy', { locale: es })}</>
            )}
          </div>

          {/* Export buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6 text-destructive" />
              )}
              <span className="text-sm font-medium">Exportar PDF</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              )}
              <span className="text-sm font-medium">Exportar Excel</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
