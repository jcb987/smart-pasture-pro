import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Loader2,
  Brain,
  Image,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Search,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MilkImageRecord {
  numero: string;
  valores: Record<string, number | null>;
  status: 'valid' | 'warning' | 'excluded';
  warningMessage?: string;
  animalId?: string;
}

// Subcomponent for searchable animal selection in each row
function AnimalSearchCell({
  value,
  animalId,
  disabled,
  animalMap,
  onSelect,
}: {
  value: string;
  animalId?: string;
  disabled: boolean;
  animalMap: Map<string, { id: string; tag_id: string }>;
  onSelect: (numero: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Build unique animal list from the map
  const uniqueAnimals = Array.from(
    new Map(
      Array.from(animalMap.values()).map(a => [a.id, a])
    ).values()
  );

  const filtered = search
    ? uniqueAnimals.filter(a =>
        a.tag_id.toLowerCase().includes(search.toLowerCase())
      )
    : uniqueAnimals;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 w-28 justify-between text-sm font-normal px-2',
            !animalId && value && 'border-yellow-400',
            animalId && 'border-primary',
          )}
          disabled={disabled}
        >
          <span className="truncate">{value || 'Buscar...'}</span>
          <Search className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar chapeta..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No encontrado</CommandEmpty>
            <CommandGroup className="max-h-40 overflow-y-auto">
              {filtered.slice(0, 50).map(animal => (
                <CommandItem
                  key={animal.id}
                  value={animal.tag_id}
                  onSelect={() => {
                    onSelect(animal.tag_id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3',
                      animalId === animal.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {animal.tag_id}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MilkImageImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function MilkImageImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: MilkImageImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'importing' | 'complete'>('upload');
  const [fechas, setFechas] = useState<string[]>([]);
  const [records, setRecords] = useState<MilkImageRecord[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, skipped: 0 });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [animalMap, setAnimalMap] = useState<Map<string, { id: string; tag_id: string }>>(new Map());
  const { toast } = useToast();
  const { user } = useAuth();

  const resetDialog = () => {
    setStep('upload');
    setFechas([]);
    setRecords([]);
    setYear(new Date().getFullYear());
    setAnalysis(null);
    setWarnings([]);
    setImportResults({ success: 0, errors: 0, skipped: 0 });
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const normalizeId = (id: string): string => {
    if (!id) return '';
    return id
      .toLowerCase()
      .trim()
      .replace(/[\/\s\-]+/g, '-')
      .replace(/^0+/, '')
      .replace(/^-+|-+$/g, '');
  };

  const loadAnimals = useCallback(async (): Promise<Map<string, { id: string; tag_id: string }>> => {
    if (!user) return new Map();
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.organization_id) return new Map();
    setOrganizationId(profile.organization_id);

    const { data: animals } = await supabase
      .from('animals')
      .select('id, tag_id')
      .eq('organization_id', profile.organization_id);

    const map = new Map<string, { id: string; tag_id: string }>();
    (animals || []).forEach(a => {
      const entry = { id: a.id, tag_id: a.tag_id };
      map.set(a.tag_id.toLowerCase().trim(), entry);
      map.set(normalizeId(a.tag_id), entry);
    });
    console.log('[MilkImport] Loaded', map.size, 'animal keys');
    setAnimalMap(map);
    return map;
  }, [user]);

  const findAnimalInMap = useCallback((numero: string, map: Map<string, { id: string; tag_id: string }>) => {
    const lower = numero.toLowerCase().trim();
    let found = map.get(lower);
    if (found) return found;
    found = map.get(normalizeId(numero));
    if (found) return found;
    console.log(`[MilkImport] No match for "${numero}"`);
    return undefined;
  }, []);

  const findAnimal = useCallback((numero: string) => {
    return findAnimalInMap(numero, animalMap);
  }, [animalMap, findAnimalInMap]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImage = selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/png' ||
      selectedFile.name.toLowerCase().endsWith('.jpg') || selectedFile.name.toLowerCase().endsWith('.jpeg') ||
      selectedFile.name.toLowerCase().endsWith('.png');

    if (!isImage) {
      toast({
        title: 'Formato no soportado',
        description: 'Solo se aceptan imágenes JPG o PNG de registros de pesa leche',
        variant: 'destructive',
      });
      return;
    }

    setStep('analyzing');
    const loadedMap = await loadAnimals();

    try {
      // Convert to base64
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const imageBase64 = btoa(binary);
      const mimeType = selectedFile.type || (selectedFile.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

      const { data: aiResult, error } = await supabase.functions.invoke('milk-image-parser', {
        body: { imageBase64, mimeType },
      });

      if (error) throw error;
      if (aiResult?.error) throw new Error(aiResult.error);

      const parsedFechas: string[] = aiResult.fechas || [];
      const parsedRegistros: Array<{ numero: string; valores: Record<string, number> }> = aiResult.registros || [];
      const parsedYear = aiResult.year || new Date().getFullYear();

      setFechas(parsedFechas);
      setYear(parsedYear);
      setAnalysis(aiResult.analysis || null);
      setWarnings(aiResult.warnings || []);

      // Map records and check animal existence
      const mappedRecords: MilkImageRecord[] = parsedRegistros
        .filter(r => {
          const vals = Object.values(r.valores || {});
          return vals.some(v => v !== null && v !== undefined && !isNaN(Number(v)));
        })
        .map(r => {
          const animal = findAnimalInMap(r.numero, loadedMap);
          return {
            numero: r.numero,
            valores: r.valores || {},
            status: animal ? 'valid' as const : 'warning' as const,
            warningMessage: animal ? undefined : 'Animal no encontrado en el sistema',
            animalId: animal?.id,
          };
        });

      setRecords(mappedRecords);
      setStep('review');

      if (parsedRegistros.length === 0) {
        toast({
          title: 'Sin datos detectados',
          description: 'La IA no pudo extraer datos de producción de la imagen',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Image analysis error:', err);
      toast({
        title: 'Error al analizar imagen',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      });
      setStep('upload');
    }
  };

  const updateCellValue = (recordIndex: number, fecha: string, value: string) => {
    setRecords(prev => {
      const updated = [...prev];
      const record = { ...updated[recordIndex] };
      const valores = { ...record.valores };

      if (value === '' || value === null || value === undefined) {
        delete valores[fecha];
      } else {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          valores[fecha] = num;
        }
      }
      record.valores = valores;
      updated[recordIndex] = record;
      return updated;
    });
  };

  const updateAnimalNumber = (recordIndex: number, newNumero: string) => {
    setRecords(prev => {
      const updated = [...prev];
      const record = { ...updated[recordIndex] };
      record.numero = newNumero;
      const animal = findAnimal(newNumero);
      record.status = animal ? 'valid' : 'warning';
      record.warningMessage = animal ? undefined : 'Animal no encontrado en el sistema';
      record.animalId = animal?.id;
      updated[recordIndex] = record;
      return updated;
    });
  };

  const toggleExcluded = (recordIndex: number) => {
    setRecords(prev => {
      const updated = [...prev];
      const record = { ...updated[recordIndex] };
      if (record.status === 'excluded') {
        const animal = findAnimal(record.numero);
        record.status = animal ? 'valid' : 'warning';
        record.warningMessage = animal ? undefined : 'Animal no encontrado en el sistema';
        record.animalId = animal?.id;
      } else {
        record.status = 'excluded';
        record.warningMessage = 'Excluido manualmente';
      }
      updated[recordIndex] = record;
      return updated;
    });
  };

  const addRow = () => {
    setRecords(prev => [...prev, {
      numero: '',
      valores: {},
      status: 'warning',
      warningMessage: 'Ingrese número de animal',
    }]);
  };

  const removeRow = (index: number) => {
    setRecords(prev => prev.filter((_, i) => i !== index));
  };

  const parseDateString = (fechaStr: string, yearNum: number): string | null => {
    // Try to parse Spanish month names
    const monthMap: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
    };

    const lower = fechaStr.toLowerCase().trim();

    // "Enero 9" or "9 Enero" pattern
    for (const [name, monthIdx] of Object.entries(monthMap)) {
      const match1 = lower.match(new RegExp(`${name}\\s+(\\d{1,2})`));
      const match2 = lower.match(new RegExp(`(\\d{1,2})\\s+${name}`));
      const match = match1 || match2;
      if (match) {
        const day = parseInt(match[1]);
        const d = new Date(yearNum, monthIdx, day);
        return d.toISOString().split('T')[0];
      }
    }

    // "9/01" or "09/01" pattern  
    const slashMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1]);
      const month = parseInt(slashMatch[2]) - 1;
      const d = new Date(yearNum, month, day);
      return d.toISOString().split('T')[0];
    }

    // ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
      return lower;
    }

    return null;
  };

  const handleImport = async () => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'No se encontró la organización', variant: 'destructive' });
      return;
    }

    setStep('importing');

    const activeRecords = records.filter(r => r.status !== 'excluded' && r.animalId);
    let skipped = 0;
    let parseErrors = 0;

    // Build all rows to insert
    const rowsToInsert: Array<{
      animal_id: string;
      production_date: string;
      morning_liters: number;
      organization_id: string;
      created_by: string | undefined;
    }> = [];

    for (const record of activeRecords) {
      for (const [fecha, valor] of Object.entries(record.valores)) {
        if (valor === null || valor === undefined) {
          skipped++;
          continue;
        }

        const parsedDate = parseDateString(fecha, year);
        if (!parsedDate) {
          parseErrors++;
          continue;
        }

        rowsToInsert.push({
          animal_id: record.animalId!,
          production_date: parsedDate,
          morning_liters: valor,
          organization_id: organizationId,
          created_by: user?.id,
        });
      }
    }

    let success = 0;
    let errors = 0;

    // Insert in batches, one-by-one to handle duplicates gracefully
    const BATCH_SIZE = 50;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      try {
        // Try batch insert first (fastest path)
        const { error } = await supabase
          .from('milk_production')
          .insert(batch);

        if (error) {
          // If batch fails (likely duplicate conflict), fall back to one-by-one
          console.warn('Batch insert failed, trying one-by-one:', error.message);
          for (const row of batch) {
            try {
              const { error: singleErr } = await supabase
                .from('milk_production')
                .insert(row);
              if (singleErr) {
                // Check if it's a duplicate conflict (code 23505)
                if (singleErr.code === '23505') {
                  skipped++;
                } else {
                  console.error('Single insert error:', singleErr);
                  errors++;
                }
              } else {
                success++;
              }
            } catch {
              errors++;
            }
          }
        } else {
          success += batch.length;
        }
      } catch (err) {
        console.error('Batch exception:', err);
        errors += batch.length;
      }
    }

    const skippedWarnings = records.filter(r => r.status === 'warning' && !r.animalId).length;

    setImportResults({ success, errors: errors + parseErrors, skipped: skipped + skippedWarnings });
    setStep('complete');

    // Always trigger refresh so the page shows current data
    onImportComplete();
  };

  const validCount = records.filter(r => r.status === 'valid').length;
  const warningCount = records.filter(r => r.status === 'warning').length;
  const excludedCount = records.filter(r => r.status === 'excluded').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Importar Pesa Leche desde Imagen
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube una foto del registro manuscrito de producción de leche'}
            {step === 'analyzing' && 'Analizando imagen con IA...'}
            {step === 'review' && 'Revisa y edita los datos antes de guardar'}
            {step === 'importing' && 'Guardando registros...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center w-full">
                <Image className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-medium mb-1">Arrastra una foto del registro</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Imagen JPG o PNG del cuaderno de pesa leche
                </p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="milk-image-upload"
                />
                <label htmlFor="milk-image-upload">
                  <Button asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar imagen
                    </span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full">
                <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Lectura inteligente con IA</p>
                  <p className="text-muted-foreground">
                    Detecta números de animal, fechas y valores de producción manuscritos. Podrás revisar y editar antes de guardar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ANALYZING STEP */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Analizando registro manuscrito...</p>
              <p className="text-sm text-muted-foreground">
                La IA está leyendo los números de animal y valores de producción
              </p>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} válidos
                </Badge>
                {warningCount > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount} con advertencia
                  </Badge>
                )}
                {excludedCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    {excludedCount} excluidos
                  </Badge>
                )}
                {analysis && (
                  <span className="text-xs text-muted-foreground ml-2">{analysis}</span>
                )}
              </div>

              {/* Warnings from AI */}
              {warnings.length > 0 && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Editable table */}
              <ScrollArea className="h-[50vh] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 sticky left-0 bg-background z-10">#</TableHead>
                      <TableHead className="min-w-[100px] sticky left-8 bg-background z-10">N° Animal</TableHead>
                      {fechas.map(f => (
                        <TableHead key={f} className="min-w-[80px] text-center text-xs">
                          {f}
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px] text-center">Estado</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          record.status === 'excluded'
                            ? 'opacity-40 line-through bg-muted/30'
                            : record.status === 'warning'
                              ? 'bg-yellow-50/50 dark:bg-yellow-950/20'
                              : ''
                        }
                      >
                        <TableCell className="text-xs text-muted-foreground sticky left-0 bg-background z-10">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="sticky left-8 bg-background z-10">
                          <AnimalSearchCell
                            value={record.numero}
                            animalId={record.animalId}
                            disabled={record.status === 'excluded'}
                            animalMap={animalMap}
                            onSelect={(numero) => updateAnimalNumber(idx, numero)}
                          />
                        </TableCell>
                        {fechas.map(f => (
                          <TableCell key={f} className="p-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={record.valores[f] !== null && record.valores[f] !== undefined ? record.valores[f]! : ''}
                              onChange={(e) => updateCellValue(idx, f, e.target.value)}
                              className="h-8 text-sm text-center w-16 mx-auto"
                              placeholder="-"
                              disabled={record.status === 'excluded'}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          {record.status === 'valid' && (
                            <Badge variant="default" className="text-xs">OK</Badge>
                          )}
                          {record.status === 'warning' && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 cursor-help" title={record.warningMessage}>
                              ⚠️
                            </Badge>
                          )}
                          {record.status === 'excluded' && (
                            <Badge variant="outline" className="text-xs">Excl.</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => toggleExcluded(idx)}
                              title={record.status === 'excluded' ? 'Incluir' : 'Excluir'}
                            >
                              {record.status === 'excluded' ? '↩' : '⊘'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => removeRow(idx)}
                              title="Eliminar fila"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1 h-3 w-3" />
                Agregar fila
              </Button>
            </div>
          )}

          {/* IMPORTING STEP */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Guardando registros...</p>
            </div>
          )}

          {/* COMPLETE STEP */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">Importación completada</p>
              <div className="flex gap-4 text-sm">
                {importResults.success > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-muted-foreground">Nuevos registros</p>
                  </div>
                )}
                {importResults.errors > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
                    <p className="text-muted-foreground">Errores</p>
                  </div>
                )}
                {importResults.skipped > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{importResults.skipped}</p>
                    <p className="text-muted-foreground">Ya existían</p>
                  </div>
                )}
              </div>
              {importResults.success === 0 && importResults.skipped > 0 && importResults.errors === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Todos los registros ya estaban en el sistema. No se modificaron datos existentes.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'review' && (
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar y subir ({validCount} animales)
              </Button>
            </div>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Cerrar</Button>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
