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
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Download,
  Loader2,
  Brain,
  Sparkles,
  FileText,
  RefreshCw,
  FileDown,
  Edit2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  useSmartAnimalImport, 
  type Species, 
  type ImportedAnimalRow 
} from '@/hooks/useSmartAnimalImport';
import { type Animal, type AnimalCategory, type AnimalSex } from '@/hooks/useAnimals';
import * as XLSX from 'xlsx';

interface SmartAnimalImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAnimals: Animal[];
  onImportComplete: () => void;
}

const SPECIES_OPTIONS: { value: Species; label: string; icon: string }[] = [
  { value: 'bovino', label: 'Bovinos', icon: '🐄' },
  { value: 'bufalo', label: 'Búfalos', icon: '🐃' },
  { value: 'cerdo', label: 'Cerdos', icon: '🐷' },
];

const CATEGORY_OPTIONS: { value: AnimalCategory; label: string; sex: AnimalSex }[] = [
  { value: 'vaca', label: 'Vaca', sex: 'hembra' },
  { value: 'toro', label: 'Toro', sex: 'macho' },
  { value: 'novilla', label: 'Novilla', sex: 'hembra' },
  { value: 'novillo', label: 'Novillo', sex: 'macho' },
  { value: 'ternera', label: 'Ternera', sex: 'hembra' },
  { value: 'ternero', label: 'Ternero', sex: 'macho' },
  { value: 'becerra', label: 'Becerra', sex: 'hembra' },
  { value: 'becerro', label: 'Becerro', sex: 'macho' },
  { value: 'bufala', label: 'Búfala', sex: 'hembra' },
  { value: 'bufalo', label: 'Búfalo', sex: 'macho' },
];

export function SmartAnimalImporter({
  open,
  onOpenChange,
  existingAnimals,
  onImportComplete,
}: SmartAnimalImporterProps) {
  const [step, setStep] = useState<'species' | 'upload' | 'analyzing' | 'preview' | 'importing' | 'complete'>('species');
  const [file, setFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const { toast } = useToast();

  const {
    isProcessing,
    processedRows,
    selectedSpecies,
    setSelectedSpecies,
    processFile,
    updateRow,
    importAnimals,
    generateImportLog,
    setProcessedRows,
  } = useSmartAnimalImport(existingAnimals);

  const resetDialog = () => {
    setStep('species');
    setFile(null);
    setImportProgress(0);
    setImportResult(null);
    setEditingRow(null);
    setProcessedRows([]);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleSpeciesSelect = (species: Species) => {
    setSelectedSpecies(species);
    setStep('upload');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('analyzing');

    const results = await processFile(selectedFile, selectedSpecies);
    
    if (results.length === 0) {
      toast({
        title: 'No se encontraron datos',
        description: 'El archivo no contiene datos para importar o no se pudo leer.',
        variant: 'destructive',
      });
      setStep('upload');
      return;
    }

    setStep('preview');
  };

  const handleCategoryChange = (rowNumber: number, category: AnimalCategory) => {
    const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === category);
    updateRow(rowNumber, { 
      category, 
      sex: categoryInfo?.sex || null 
    });
  };

  const handleSexChange = (rowNumber: number, sex: AnimalSex) => {
    updateRow(rowNumber, { sex });
  };

  const handleImport = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .single();

    if (!profile?.organization_id) {
      toast({
        title: 'Error',
        description: 'No se encontró la organización',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImportProgress(10);

    const result = await importAnimals(processedRows, profile.organization_id);
    
    setImportProgress(100);
    setImportResult(result);
    setStep('complete');

    if (result.created > 0 || result.updated > 0) {
      onImportComplete();
    }
  };

  const downloadImportLog = () => {
    if (!importResult) return;
    
    const log = generateImportLog(processedRows, importResult);
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `importacion_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = [
      ['Arete', 'Nombre', 'Categoria/Fase', 'Sexo', 'Raza', 'Peso', 'Lote', 'Estado'],
      ['001', 'Lucero', 'Vaca parida', 'Hembra', 'Holstein', '450', 'Potrero 1', 'Activo'],
      ['002', '', 'Novilla de vientre', 'Hembra', 'Brahman', '320', 'Potrero 2', ''],
      ['003', 'Tornado', 'Reproductor', 'Macho', 'Brahman', '650', '', ''],
      ['004', '', 'Cría macho', '', '', '85', 'Potrero 1', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Animales');
    XLSX.writeFile(wb, 'plantilla_importacion_inteligente.xlsx');
  };

  const validCount = processedRows.filter(r => r.errors.length === 0 && r.category && r.sex).length;
  const errorCount = processedRows.filter(r => r.errors.length > 0).length;
  const updateCount = processedRows.filter(r => r.is_update).length;
  const newCount = processedRows.filter(r => !r.is_update && r.errors.length === 0).length;
  const needsAttention = processedRows.filter(r => !r.category || !r.sex).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Importador Inteligente de Animales
          </DialogTitle>
          <DialogDescription>
            {step === 'species' && 'Selecciona la especie que vas a importar'}
            {step === 'upload' && `Sube un archivo Excel o PDF con los datos de ${SPECIES_OPTIONS.find(s => s.value === selectedSpecies)?.label}`}
            {step === 'analyzing' && 'Analizando archivo con IA...'}
            {step === 'preview' && 'Revisa y corrige los datos antes de importar'}
            {step === 'importing' && 'Importando animales...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Step: Species Selection */}
          {step === 'species' && (
            <div className="py-8">
              <p className="text-center text-muted-foreground mb-6">
                ¿Qué tipo de animales vas a importar?
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {SPECIES_OPTIONS.map(species => (
                  <Button
                    key={species.value}
                    variant="outline"
                    className="h-24 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => handleSpeciesSelect(species.value)}
                  >
                    <span className="text-3xl">{species.icon}</span>
                    <span className="font-medium">{species.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{SPECIES_OPTIONS.find(s => s.value === selectedSpecies)?.icon}</span>
                <span className="font-medium">{SPECIES_OPTIONS.find(s => s.value === selectedSpecies)?.label}</span>
                <Button variant="ghost" size="sm" onClick={() => setStep('species')}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Cambiar
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center w-full max-w-lg">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-medium mb-1">Arrastra tu archivo aquí</p>
                <p className="text-sm text-muted-foreground mb-3">Excel (.xlsx, .xls) o PDF</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="smart-import-upload"
                />
                <label htmlFor="smart-import-upload">
                  <Button asChild>
                    <span>Seleccionar archivo</span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full max-w-lg">
                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Detección automática de campos</p>
                  <p className="text-muted-foreground">
                    Detectamos arete, categoría, sexo, peso, lote y más automáticamente
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar plantilla
              </Button>
            </div>
          )}

          {/* Step: Analyzing */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Brain className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-lg font-medium">Analizando con IA...</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Extrayendo información, detectando fases productivas, e identificando coincidencias con animales existentes
              </p>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Summary */}
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {processedRows.length} registros
                </Badge>
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} listos
                </Badge>
                {updateCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {updateCount} actualizaciones
                  </Badge>
                )}
                {needsAttention > 0 && (
                  <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                    <Edit2 className="h-3 w-3" />
                    {needsAttention} requieren ajuste
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount} errores
                  </Badge>
                )}
              </div>

              {/* Instructions */}
              {needsAttention > 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Algunos registros necesitan que selecciones la categoría o sexo manualmente
                </div>
              )}

              {/* Data Table */}
              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Arete/ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fase Detectada</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRows.slice(0, 50).map((row) => (
                      <TableRow 
                        key={row.row_number}
                        className={
                          row.errors.length > 0 
                            ? 'bg-red-50 dark:bg-red-950/20' 
                            : row.is_update 
                              ? 'bg-blue-50 dark:bg-blue-950/20'
                              : (!row.category || !row.sex)
                                ? 'bg-amber-50 dark:bg-amber-950/20'
                                : ''
                        }
                      >
                        <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                        <TableCell className="font-medium">
                          {row.tag_id || <span className="text-red-500">Sin ID</span>}
                          {row.is_update && (
                            <Badge variant="secondary" className="ml-2 text-xs">Existe</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.productive_stage || '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.category || ''}
                            onValueChange={(val) => handleCategoryChange(row.row_number, val as AnimalCategory)}
                          >
                            <SelectTrigger className={`h-8 w-28 ${!row.category ? 'border-amber-500' : ''}`}>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.sex || ''}
                            onValueChange={(val) => handleSexChange(row.row_number, val as AnimalSex)}
                          >
                            <SelectTrigger className={`h-8 w-24 ${!row.sex ? 'border-amber-500' : ''}`}>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hembra">Hembra</SelectItem>
                              <SelectItem value="macho">Macho</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {row.current_weight ? `${row.current_weight} kg` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.lot_name || '-'}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive" className="text-xs">Error</Badge>
                          ) : row.is_update ? (
                            <Badge variant="secondary" className="text-xs">Actualizar</Badge>
                          ) : (!row.category || !row.sex) ? (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Pendiente</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-600">Nuevo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {processedRows.length > 50 && (
                  <div className="text-center py-2 text-sm text-muted-foreground bg-muted/30">
                    Mostrando 50 de {processedRows.length} registros
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importando animales...</p>
              <Progress value={importProgress} className="w-64" />
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-8 gap-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Importación Completada</h3>
                <p className="text-muted-foreground">
                  Resumen de la operación:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-3xl font-bold text-green-600">{importResult.created}</p>
                  <p className="text-sm text-muted-foreground">Creados</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-3xl font-bold text-blue-600">{importResult.updated}</p>
                  <p className="text-sm text-muted-foreground">Actualizados</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-3xl font-bold text-gray-600">{importResult.skipped}</p>
                  <p className="text-sm text-muted-foreground">Omitidos</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="w-full max-w-md">
                  <p className="text-sm font-medium text-red-600 mb-2">Errores ({importResult.errors.length}):</p>
                  <ScrollArea className="h-24 border rounded-lg p-2 bg-red-50 dark:bg-red-950/20">
                    {importResult.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-700">{error}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <Button variant="outline" onClick={downloadImportLog}>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar log de importación
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'species' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={() => setStep('species')}>
                Atrás
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cambiar archivo
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Importar {validCount} animales
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
