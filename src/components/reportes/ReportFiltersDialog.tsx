import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Loader2 } from 'lucide-react';
import { ReportFilters, ReportType, REPORT_CONFIGS } from '@/hooks/useReports';

interface ReportFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: ReportType | null;
  onGenerate: (filters: ReportFilters) => void;
  loading: boolean;
  availableLots?: string[];
}

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'vaca', label: 'Vacas' },
  { value: 'toro', label: 'Toros' },
  { value: 'novilla', label: 'Novillas' },
  { value: 'novillo', label: 'Novillos' },
  { value: 'ternera', label: 'Terneras' },
  { value: 'ternero', label: 'Terneros' },
];

export const ReportFiltersDialog = ({
  open,
  onOpenChange,
  reportType,
  onGenerate,
  loading,
  availableLots = [],
}: ReportFiltersDialogProps) => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const reportConfig = REPORT_CONFIGS.find(c => c.id === reportType);
  const showDateFilters = reportType !== 'inventario';
  const showCategoryFilter = reportType === 'inventario' || reportType === 'produccion_carne';
  const showLotFilter = reportType === 'inventario' || reportType === 'alimentacion';

  const handleGenerate = () => {
    onGenerate(filters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Configurar Reporte
          </DialogTitle>
          <DialogDescription>
            {reportConfig?.name} - {reportConfig?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showDateFilters && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {showCategoryFilter && (
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showLotFilter && availableLots.length > 0 && (
            <div className="space-y-2">
              <Label>Lote / Potrero</Label>
              <Select
                value={filters.lotName || 'all'}
                onValueChange={(value) => setFilters({ ...filters, lotName: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los lotes</SelectItem>
                  {availableLots.map((lot) => (
                    <SelectItem key={lot} value={lot}>
                      {lot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>
              El reporte se generará con los filtros seleccionados. Una vez generado, podrás exportarlo a Excel o PDF.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar Reporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
