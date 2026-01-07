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
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Download,
  Loader2,
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { type Animal, type AnimalCategory, type AnimalSex } from '@/hooks/useAnimals';

interface ImportAnimalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAnimals: Animal[];
  onImport: (animals: Omit<Animal, 'id' | 'created_at' | 'updated_at' | 'organization_id'>[]) => Promise<void>;
}

interface ImportRow {
  row_number: number;
  tag_id: string;
  name: string | null;
  category: string;
  sex: string;
  breed: string | null;
  birth_date: string | null;
  mother_tag: string | null;
  father_tag: string | null;
  lot_name: string | null;
  origin: string | null;
  current_weight: number | null;
  notes: string | null;
  errors: string[];
  warnings: string[];
}

const validCategories: AnimalCategory[] = ['vaca', 'toro', 'novilla', 'novillo', 'ternera', 'ternero', 'becerra', 'becerro', 'bufala', 'bufalo'];
const femaleCategories: AnimalCategory[] = ['vaca', 'novilla', 'ternera', 'becerra', 'bufala'];

export function ImportAnimalsDialog({ 
  open, 
  onOpenChange, 
  existingAnimals,
  onImport 
}: ImportAnimalsDialogProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [isAnalyzingPDF, setIsAnalyzingPDF] = useState(false);

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0 });
    setIsAnalyzingPDF(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const normalizeCategory = (value: string): AnimalCategory | null => {
    const normalized = value.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
    
    const categoryMap: Record<string, AnimalCategory> = {
      'vaca': 'vaca',
      'toro': 'toro',
      'novilla': 'novilla',
      'novillo': 'novillo',
      'ternera': 'ternera',
      'ternero': 'ternero',
      'becerra': 'becerra',
      'becerro': 'becerro',
      'bufala': 'bufala',
      'bufalo': 'bufalo',
    };
    
    return categoryMap[normalized] || null;
  };

  const normalizeSex = (value: string): AnimalSex | null => {
    const normalized = value.toLowerCase().trim();
    if (['hembra', 'h', 'f', 'female'].includes(normalized)) return 'hembra';
    if (['macho', 'm', 'male'].includes(normalized)) return 'macho';
    return null;
  };

  const parseDate = (value: unknown): string | null => {
    if (!value) return null;
    
    // Handle Excel date numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    
    // Handle string dates
    if (typeof value === 'string') {
      const dateStr = value.trim();
      // Try ISO format first
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Try DD/MM/YYYY
      const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  const findAnimalByTag = (tag: string | null): Animal | null => {
    if (!tag) return null;
    return existingAnimals.find(a => a.tag_id.toLowerCase() === tag.toLowerCase()) || null;
  };

  const parseExcelFile = useCallback(async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) {
      return [];
    }

    // Get headers from first row
    const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim() || '');
    
    // Map column indices
    const colMap: Record<string, number> = {};
    const expectedColumns = ['arete', 'id', 'tag_id', 'nombre', 'name', 'categoria', 'category', 
      'sexo', 'sex', 'raza', 'breed', 'nacimiento', 'birth_date', 'fecha_nacimiento',
      'madre', 'mother', 'madre_id', 'padre', 'father', 'padre_id',
      'lote', 'lot', 'potrero', 'origen', 'origin', 'peso', 'weight', 'notas', 'notes'];
    
    headers.forEach((h, i) => {
      if (h.includes('arete') || h === 'id' || h === 'tag_id') colMap.tag_id = i;
      if (h.includes('nombre') || h === 'name') colMap.name = i;
      if (h.includes('categoria') || h === 'category') colMap.category = i;
      if (h.includes('sexo') || h === 'sex') colMap.sex = i;
      if (h.includes('raza') || h === 'breed') colMap.breed = i;
      if (h.includes('nacimiento') || h === 'birth_date' || h === 'fecha_nacimiento') colMap.birth_date = i;
      if (h.includes('madre') || h === 'mother') colMap.mother = i;
      if (h.includes('padre') || h === 'father') colMap.father = i;
      if (h.includes('lote') || h === 'lot' || h.includes('potrero')) colMap.lot_name = i;
      if (h.includes('origen') || h === 'origin') colMap.origin = i;
      if (h.includes('peso') || h === 'weight') colMap.weight = i;
      if (h.includes('notas') || h === 'notes') colMap.notes = i;
    });

    const parsedRows: ImportRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0 || !row[colMap.tag_id]) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      const tagId = row[colMap.tag_id]?.toString().trim() || '';
      const categoryRaw = row[colMap.category]?.toString() || '';
      const sexRaw = row[colMap.sex]?.toString() || '';
      const motherTag = row[colMap.mother]?.toString().trim() || null;
      const fatherTag = row[colMap.father]?.toString().trim() || null;

      // Validate tag_id
      if (!tagId) {
        errors.push('Arete/ID es obligatorio');
      } else if (existingAnimals.some(a => a.tag_id.toLowerCase() === tagId.toLowerCase())) {
        errors.push(`Arete "${tagId}" ya existe`);
      } else if (parsedRows.some(r => r.tag_id.toLowerCase() === tagId.toLowerCase())) {
        errors.push(`Arete "${tagId}" duplicado en archivo`);
      }

      // Validate and normalize category
      const category = normalizeCategory(categoryRaw);
      if (!category) {
        errors.push(`Categoría inválida: "${categoryRaw}"`);
      }

      // Validate and normalize sex
      let sex = normalizeSex(sexRaw);
      if (!sex && category) {
        // Auto-assign sex based on category
        sex = femaleCategories.includes(category) ? 'hembra' : 'macho';
        warnings.push('Sexo asignado automáticamente por categoría');
      } else if (!sex) {
        errors.push(`Sexo inválido: "${sexRaw}"`);
      }

      // Validate parent references
      if (motherTag && !findAnimalByTag(motherTag)) {
        warnings.push(`Madre "${motherTag}" no encontrada`);
      }
      if (fatherTag && !findAnimalByTag(fatherTag)) {
        warnings.push(`Padre "${fatherTag}" no encontrado`);
      }

      const birthDate = parseDate(row[colMap.birth_date]);
      const weight = row[colMap.weight] ? parseFloat(row[colMap.weight]?.toString()) : null;

      parsedRows.push({
        row_number: i + 1,
        tag_id: tagId,
        name: row[colMap.name]?.toString().trim() || null,
        category: category || categoryRaw,
        sex: sex || sexRaw,
        breed: row[colMap.breed]?.toString().trim() || null,
        birth_date: birthDate,
        mother_tag: motherTag,
        father_tag: fatherTag,
        lot_name: row[colMap.lot_name]?.toString().trim() || null,
        origin: row[colMap.origin]?.toString().trim() || null,
        current_weight: weight && !isNaN(weight) ? weight : null,
        notes: row[colMap.notes]?.toString().trim() || null,
        errors,
        warnings,
      });
    }

    return parsedRows;
  }, [existingAnimals]);

  // Parse PDF with AI
  const parsePDFWithAI = async (file: File): Promise<ImportRow[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const expectedColumns = [
        { db: 'tag_id', labels: ['arete', 'id', 'tag_id', 'identificador'], required: true },
        { db: 'name', labels: ['nombre', 'name'], required: false },
        { db: 'category', labels: ['categoria', 'category', 'tipo'], required: true },
        { db: 'sex', labels: ['sexo', 'sex', 'genero'], required: true },
        { db: 'breed', labels: ['raza', 'breed'], required: false },
        { db: 'birth_date', labels: ['nacimiento', 'birth_date', 'fecha_nacimiento'], required: false },
        { db: 'mother', labels: ['madre', 'mother', 'madre_id'], required: false },
        { db: 'father', labels: ['padre', 'father', 'padre_id'], required: false },
        { db: 'lot_name', labels: ['lote', 'lot', 'potrero'], required: false },
        { db: 'origin', labels: ['origen', 'origin', 'procedencia'], required: false },
        { db: 'weight', labels: ['peso', 'weight'], required: false },
        { db: 'notes', labels: ['notas', 'notes', 'observaciones'], required: false },
      ];

      const response = await supabase.functions.invoke('pdf-import-parser', {
        body: {
          pdfBase64: base64,
          expectedColumns,
          tableName: 'animals',
        },
      });

      if (response.error) throw response.error;

      const { headers, rows } = response.data as { headers: string[]; rows: unknown[][] };

      if (!rows || rows.length === 0) {
        return [];
      }

      // Map headers to column indices
      const colMap: Record<string, number> = {};
      headers.forEach((h, i) => {
        const normalized = h?.toString().toLowerCase().trim() || '';
        if (normalized.includes('arete') || normalized === 'id' || normalized === 'tag_id') colMap.tag_id = i;
        if (normalized.includes('nombre') || normalized === 'name') colMap.name = i;
        if (normalized.includes('categoria') || normalized === 'category') colMap.category = i;
        if (normalized.includes('sexo') || normalized === 'sex') colMap.sex = i;
        if (normalized.includes('raza') || normalized === 'breed') colMap.breed = i;
        if (normalized.includes('nacimiento') || normalized === 'birth_date') colMap.birth_date = i;
        if (normalized.includes('madre') || normalized === 'mother') colMap.mother = i;
        if (normalized.includes('padre') || normalized === 'father') colMap.father = i;
        if (normalized.includes('lote') || normalized === 'lot' || normalized.includes('potrero')) colMap.lot_name = i;
        if (normalized.includes('origen') || normalized === 'origin') colMap.origin = i;
        if (normalized.includes('peso') || normalized === 'weight') colMap.weight = i;
        if (normalized.includes('notas') || normalized === 'notes') colMap.notes = i;
      });

      const parsedRows: ImportRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as unknown[];
        if (!row || row.length === 0) continue;

        const errors: string[] = [];
        const warnings: string[] = [];

        const tagId = row[colMap.tag_id]?.toString().trim() || '';
        const categoryRaw = row[colMap.category]?.toString() || '';
        const sexRaw = row[colMap.sex]?.toString() || '';
        const motherTag = row[colMap.mother]?.toString().trim() || null;
        const fatherTag = row[colMap.father]?.toString().trim() || null;

        if (!tagId) {
          errors.push('Arete/ID es obligatorio');
        } else if (existingAnimals.some(a => a.tag_id.toLowerCase() === tagId.toLowerCase())) {
          errors.push(`Arete "${tagId}" ya existe`);
        } else if (parsedRows.some(r => r.tag_id.toLowerCase() === tagId.toLowerCase())) {
          errors.push(`Arete "${tagId}" duplicado`);
        }

        const category = normalizeCategory(categoryRaw);
        if (!category) {
          errors.push(`Categoría inválida: "${categoryRaw}"`);
        }

        let sex = normalizeSex(sexRaw);
        if (!sex && category) {
          sex = femaleCategories.includes(category) ? 'hembra' : 'macho';
          warnings.push('Sexo asignado automáticamente');
        } else if (!sex) {
          errors.push(`Sexo inválido: "${sexRaw}"`);
        }

        if (motherTag && !findAnimalByTag(motherTag)) {
          warnings.push(`Madre "${motherTag}" no encontrada`);
        }
        if (fatherTag && !findAnimalByTag(fatherTag)) {
          warnings.push(`Padre "${fatherTag}" no encontrado`);
        }

        const birthDate = parseDate(row[colMap.birth_date]);
        const weight = row[colMap.weight] ? parseFloat(row[colMap.weight]?.toString()) : null;

        parsedRows.push({
          row_number: i + 2,
          tag_id: tagId,
          name: row[colMap.name]?.toString().trim() || null,
          category: category || categoryRaw,
          sex: sex || sexRaw,
          breed: row[colMap.breed]?.toString().trim() || null,
          birth_date: birthDate,
          mother_tag: motherTag,
          father_tag: fatherTag,
          lot_name: row[colMap.lot_name]?.toString().trim() || null,
          origin: row[colMap.origin]?.toString().trim() || null,
          current_weight: weight && !isNaN(weight) ? weight : null,
          notes: row[colMap.notes]?.toString().trim() || null,
          errors,
          warnings,
        });
      }

      return parsedRows;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return [];
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.type === 'application/pdf';

    if (isPDF) {
      setStep('analyzing');
      setIsAnalyzingPDF(true);
      const parsed = await parsePDFWithAI(selectedFile);
      setIsAnalyzingPDF(false);
      
      if (parsed.length === 0) {
        setStep('upload');
        return;
      }
      
      setParsedData(parsed);
      setStep('preview');
    } else {
      const parsed = await parseExcelFile(selectedFile);
      setParsedData(parsed);
      setStep('preview');
    }
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.errors.length === 0);
    if (validRows.length === 0) return;

    setStep('importing');
    let success = 0;
    let errors = 0;

    const animalsToImport = validRows.map(row => {
      const mother = findAnimalByTag(row.mother_tag);
      const father = findAnimalByTag(row.father_tag);

      return {
        tag_id: row.tag_id,
        name: row.name,
        rfid_tag: null,
        category: row.category as AnimalCategory,
        sex: row.sex as AnimalSex,
        breed: row.breed,
        color: null,
        birth_date: row.birth_date,
        entry_date: new Date().toISOString().split('T')[0],
        status: 'activo' as const,
        status_date: null,
        status_reason: null,
        current_weight: row.current_weight,
        last_weight_date: row.current_weight ? new Date().toISOString().split('T')[0] : null,
        origin: row.origin,
        purchase_price: null,
        purchase_date: null,
        lot_name: row.lot_name,
        mother_id: mother?.id || null,
        father_id: father?.id || null,
        notes: row.notes,
      };
    });

    try {
      await onImport(animalsToImport);
      success = animalsToImport.length;
    } catch (error) {
      console.error('Import error:', error);
      errors = animalsToImport.length;
    }

    setImportProgress(100);
    setImportResults({ success, errors });
    setStep('complete');
  };

  const downloadTemplate = () => {
    const template = [
      ['Arete', 'Nombre', 'Categoria', 'Sexo', 'Raza', 'Fecha_Nacimiento', 'Madre', 'Padre', 'Lote', 'Origen', 'Peso', 'Notas'],
      ['001', 'Lucero', 'Vaca', 'Hembra', 'Holstein', '2020-05-15', '', '', 'Potrero 1', 'Nacida en finca', '450', ''],
      ['002', 'Tornado', 'Toro', 'Macho', 'Brahman', '2019-03-20', '001', '', 'Potrero 2', 'Comprado', '650', 'Reproductor'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Animales');
    XLSX.writeFile(wb, 'plantilla_animales.xlsx');
  };

  const validCount = parsedData.filter(r => r.errors.length === 0).length;
  const errorCount = parsedData.filter(r => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Animales
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo Excel (.xlsx), CSV o PDF con los datos de tus animales'}
            {step === 'analyzing' && 'Analizando el documento con IA...'}
            {step === 'preview' && 'Revisa los datos antes de importar'}
            {step === 'importing' && 'Importando animales...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center w-full">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-medium mb-1">Arrastra tu archivo aquí</p>
                <p className="text-sm text-muted-foreground mb-3">Excel (.xlsx, .xls) o PDF</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>Seleccionar archivo</span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full">
                <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Análisis inteligente con IA</p>
                  <p className="text-muted-foreground">
                    Detectamos automáticamente las columnas de Excel o extraemos tablas de PDFs
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel/CSV
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  PDF con tablas
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar plantilla Excel
              </Button>

              <div className="text-sm text-muted-foreground max-w-md text-center">
                <p className="font-medium mb-1">Columnas esperadas:</p>
                <p className="text-xs">Arete*, Nombre, Categoría*, Sexo*, Raza, Fecha_Nacimiento, Madre, Padre, Lote, Origen, Peso, Notas</p>
                <p className="text-xs mt-1">* Campos obligatorios</p>
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-lg font-medium">Analizando PDF con IA...</p>
              <p className="text-sm text-muted-foreground">
                Extrayendo datos de las tablas del documento
              </p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {file?.name}
                </Badge>
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} válidos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount} con errores
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Arete</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Raza</TableHead>
                      <TableHead>Errores/Avisos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.row_number} className={row.errors.length > 0 ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-muted-foreground">{row.row_number}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : row.warnings.length > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.tag_id}</TableCell>
                        <TableCell>{row.name || '-'}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.sex}</TableCell>
                        <TableCell>{row.breed || '-'}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {row.errors.length > 0 && (
                            <div className="text-xs text-destructive">{row.errors.join(', ')}</div>
                          )}
                          {row.warnings.length > 0 && (
                            <div className="text-xs text-amber-600">{row.warnings.join(', ')}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importando animales...</p>
              <Progress value={importProgress} className="w-64" />
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-lg font-medium">¡Importación completada!</p>
              <div className="flex gap-4">
                <Badge variant="default" className="gap-1 bg-green-600 text-lg px-4 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {importResults.success} importados
                </Badge>
                {importResults.errors > 0 && (
                  <Badge variant="destructive" className="gap-1 text-lg px-4 py-2">
                    <XCircle className="h-4 w-4" />
                    {importResults.errors} fallidos
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Volver</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} animales
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}