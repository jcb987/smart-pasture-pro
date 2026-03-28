import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { useExportExcel, ExportFilters } from '@/hooks/useExportExcel';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableLots: string[];
}

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  // Bovinos
  { value: 'vaca', label: '🐄 Vacas' },
  { value: 'toro', label: '🐂 Toros' },
  { value: 'novilla', label: 'Novillas' },
  { value: 'novillo', label: 'Novillos' },
  { value: 'ternera', label: 'Terneras' },
  { value: 'ternero', label: 'Terneros' },
  { value: 'becerra', label: 'Becerras' },
  { value: 'becerro', label: 'Becerros' },
  // Bufalinos
  { value: 'bufala', label: '🐃 Búfalas' },
  { value: 'bufalo', label: '🐃 Búfalos' },
];

const STATUSES = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'activo', label: 'Solo activos' },
  { value: 'vendido', label: 'Vendidos' },
  { value: 'muerto', label: 'Muertos' },
  { value: 'descartado', label: 'Descartados' },
];

export const ExportDialog = ({ open, onOpenChange, availableLots }: ExportDialogProps) => {
  const { exportToExcel, exporting } = useExportExcel();
  const [filters, setFilters] = useState<ExportFilters>({
    status: 'all',
    category: undefined,
    lotName: undefined,
  });

  const handleExport = async () => {
    const exportFilters: ExportFilters = {
      ...filters,
      category: filters.category === 'all' ? undefined : filters.category,
      lotName: filters.lotName === 'all' ? undefined : filters.lotName,
    };
    await exportToExcel(exportFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar a Excel
          </DialogTitle>
          <DialogDescription>
            Selecciona los filtros para exportar el inventario ganadero. El archivo incluirá todos los datos de identificación, producción, salud, reproducción y costos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Estado de los animales</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as ExportFilters['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
