import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
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
  Brain,
  Sparkles,
  FileText,
  Image,
  Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
  confidence: number;
  suggestedBy: 'ai' | 'exact' | 'similar';
}

export interface ImportConfig {
  title: string;
  description: string;
  tableName: string;
  requiredColumns: { db: string; labels: string[] }[];
  optionalColumns?: { db: string; labels: string[] }[];
  templateData: unknown[][];
  templateFileName: string;
  validateRow: (row: Record<string, unknown>, existingData: unknown[]) => { errors: string[]; warnings: string[] };
  transformRow: (row: Record<string, unknown>, existingData: unknown[], organizationId: string) => Record<string, unknown>;
}

interface ParsedRow {
  row_number: number;
  data: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

interface SmartImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ImportConfig;
  existingData: unknown[];
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
}

export function SmartImportDialog({
  open,
  onOpenChange,
  config,
  existingData,
  onImport,
}: SmartImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<unknown[][]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [globalDate, setGlobalDate] = useState<string | null>(null);
  const [editAll, setEditAll] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setColumnMappings([]);
    setRawHeaders([]);
    setRawData([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0 });
    setAiAnalysis(null);
    setGlobalDate(null);
    setEditAll(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  // AI-powered column mapping
  const analyzeWithAI = async (headers: string[]) => {
    try {
      const allExpected = [...config.requiredColumns, ...(config.optionalColumns || [])];
      
      const response = await supabase.functions.invoke('smart-import-analyzer', {
        body: {
          headers,
          expectedColumns: allExpected.map(c => ({ 
            db: c.db, 
            labels: c.labels,
            required: config.requiredColumns.some(r => r.db === c.db)
          })),
          tableName: config.tableName,
        },
      });

      if (response.error) throw response.error;

      return response.data as { 
        mappings: ColumnMapping[]; 
        analysis: string;
        warnings: string[];
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  };

  // Fallback mapping without AI
  const fallbackMapping = (headers: string[]): ColumnMapping[] => {
    const allExpected = [...config.requiredColumns, ...(config.optionalColumns || [])];
    const mappings: ColumnMapping[] = [];

    for (const expected of allExpected) {
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        // Check exact match
        if (expected.labels.some(l => l.toLowerCase() === normalizedHeader)) {
          mappings.push({
            excelColumn: header,
            dbColumn: expected.db,
            confidence: 100,
            suggestedBy: 'exact',
          });
          break;
        }
        
        // Check partial match
        if (expected.labels.some(l => 
          normalizedHeader.includes(l.toLowerCase()) || 
          l.toLowerCase().includes(normalizedHeader)
        )) {
          mappings.push({
            excelColumn: header,
            dbColumn: expected.db,
            confidence: 70,
            suggestedBy: 'similar',
          });
          break;
        }
      }
    }

    return mappings;
  };

  const parseDate = (value: unknown): string | null => {
    if (!value) return null;
    
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    
    if (typeof value === 'string') {
      const dateStr = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      
      const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  // Parse image (JPEG/PNG) with AI vision
  const parseImageWithAI = async (file: File): Promise<{ headers: string[]; rows: unknown[][]; mappings: ColumnMapping[]; analysis: string; globalDate?: string | null } | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const mimeType = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const allExpected = [...config.requiredColumns, ...(config.optionalColumns || [])];

      const response = await supabase.functions.invoke('image-import-parser', {
        body: {
          imageBase64: base64,
          mimeType,
          expectedColumns: allExpected.map(c => ({
            db: c.db,
            labels: c.labels,
            required: config.requiredColumns.some(r => r.db === c.db)
          })),
          tableName: config.tableName,
        },
      });

      if (response.error) throw response.error;
      return response.data as { headers: string[]; rows: unknown[][]; mappings: ColumnMapping[]; analysis: string; globalDate?: string | null };
    } catch (error) {
      console.error('Image parsing error:', error);
      return null;
    }
  };

  // Parse PDF content to extract tabular data using AI
  const parsePDFWithAI = async (file: File): Promise<{ headers: string[]; rows: unknown[][] } | null> => {
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const allExpected = [...config.requiredColumns, ...(config.optionalColumns || [])];
      
      const response = await supabase.functions.invoke('pdf-import-parser', {
        body: {
          pdfBase64: base64,
          expectedColumns: allExpected.map(c => ({ 
            db: c.db, 
            labels: c.labels,
            required: config.requiredColumns.some(r => r.db === c.db)
          })),
          tableName: config.tableName,
        },
      });

      if (response.error) throw response.error;

      return response.data as { headers: string[]; rows: unknown[][] };
    } catch (error) {
      console.error('PDF parsing error:', error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('analyzing');

    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.type === 'application/pdf';
    const isImage = selectedFile.type === 'image/jpeg' || selectedFile.type === 'image/png' ||
      selectedFile.name.toLowerCase().endsWith('.jpg') || selectedFile.name.toLowerCase().endsWith('.jpeg') ||
      selectedFile.name.toLowerCase().endsWith('.png') ||
      selectedFile.name.toLowerCase().endsWith('.webp');

    // Create image preview URL for image files
    if (isImage) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
    }

    try {
      let headers: string[];
      let dataRows: unknown[][];

      if (isImage) {
        // Parse image with AI vision
        const imageResult = await parseImageWithAI(selectedFile);

        if (!imageResult || imageResult.rows.length === 0) {
          toast({
            title: 'No se encontraron datos',
            description: 'No se pudieron extraer datos tabulares de la imagen. Asegúrate de que la imagen contenga tablas o listas con datos de animales.',
            variant: 'destructive',
          });
          setStep('upload');
          return;
        }

        headers = imageResult.headers;
        dataRows = imageResult.rows;

        // Capture global date detected by AI (e.g., date in document header)
        if (imageResult.globalDate) {
          setGlobalDate(imageResult.globalDate);
        }

        setRawHeaders(headers);
        setRawData(dataRows);

        // Use mappings from image AI directly
        const detectedMappings = (imageResult.mappings && imageResult.mappings.length > 0)
          ? imageResult.mappings
          : fallbackMapping(headers);
        
        setColumnMappings(detectedMappings);
        const analysisText = imageResult.analysis + (imageResult.globalDate ? ` | Fecha global detectada: ${imageResult.globalDate}` : '');
        setAiAnalysis(analysisText);

        // Skip mapping step - process directly
        processWithMappings(headers, dataRows, detectedMappings, imageResult.globalDate || null);
        return;
      }

      if (isPDF) {
        // Parse PDF with AI
        const pdfResult = await parsePDFWithAI(selectedFile);
        
        if (!pdfResult || pdfResult.rows.length === 0) {
          toast({
            title: 'No se encontraron datos',
            description: 'No se pudieron extraer datos tabulares del PDF. Verifica que el archivo contenga tablas con datos.',
            variant: 'destructive',
          });
          setStep('upload');
          return;
        }

        headers = pdfResult.headers;
        dataRows = pdfResult.rows;
      } else {
        // Parse Excel/CSV
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          toast({
            title: 'Archivo vacío',
            description: 'El archivo no contiene datos para importar',
            variant: 'destructive',
          });
          setStep('upload');
          return;
        }

        // Smart header detection: find the row that best matches expected column labels
        const allExpectedLabels = [...config.requiredColumns, ...(config.optionalColumns || [])]
          .flatMap(c => c.labels.map(l => l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')));
        
        let headerRowIndex = 0;
        let bestScore = 0;
        
        for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
          const row = jsonData[r] as unknown[];
          if (!row || row.length < 2) continue;
          let score = 0;
          for (const cell of row) {
            if (!cell) continue;
            const normalized = String(cell).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
            if (allExpectedLabels.some(l => normalized.includes(l) || l.includes(normalized))) {
              score++;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            headerRowIndex = r;
          }
        }

        headers = (jsonData[headerRowIndex] as string[]).map(h => h?.toString().trim().replace(/\s*\*\s*$/, '') || '');
        dataRows = jsonData.slice(headerRowIndex + 1).filter(row => {
          // Skip empty rows
          const r = row as unknown[];
          return r && r.some(cell => cell !== null && cell !== undefined && cell !== '');
        });
      }

      setRawHeaders(headers);
      setRawData(dataRows);

      // Try AI analysis first
      const aiResult = await analyzeWithAI(headers);
      let detectedMappings: ColumnMapping[];
      
      if (aiResult) {
        detectedMappings = aiResult.mappings;
        setColumnMappings(aiResult.mappings);
        setAiAnalysis(aiResult.analysis);
      } else {
        detectedMappings = fallbackMapping(headers);
        setColumnMappings(detectedMappings);
        setAiAnalysis(null);
      }

      // Skip mapping step - process directly
      processWithMappings(headers, dataRows, detectedMappings, null);
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Error al leer archivo',
        description: isPDF ? 'No se pudo procesar el archivo PDF' : 'No se pudo procesar el archivo',
        variant: 'destructive',
      });
      setStep('upload');
    }
  };

  const processWithMappings = (
    headersArg?: string[],
    dataArg?: unknown[][],
    mappingsArg?: ColumnMapping[],
    globalDateArg?: string | null,
  ) => {
    const headers = headersArg ?? rawHeaders;
    const data = dataArg ?? rawData;
    const mappings = mappingsArg ?? columnMappings;
    const gDate = globalDateArg !== undefined ? globalDateArg : globalDate;

    const parsedRows: ParsedRow[] = [];
    
    // Create column index map
    const colIndexMap: Record<string, number> = {};
    mappings.forEach(mapping => {
      const idx = headers.findIndex(h => h === mapping.excelColumn);
      if (idx !== -1) {
        colIndexMap[mapping.dbColumn] = idx;
      }
    });

    // Identify all date-related columns to apply globalDate fallback
    const dateColumns = Object.keys(colIndexMap).filter(col => 
      col.includes('date') || col.includes('fecha')
    );

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length === 0) continue;

      const rowData: Record<string, unknown> = {};
      
      for (const [dbCol, idx] of Object.entries(colIndexMap)) {
        let value = row[idx];
        
        // Parse dates
        if (dbCol.includes('date') || dbCol.includes('fecha')) {
          value = parseDate(value);
        }
        
        rowData[dbCol] = value;
      }

      // Apply globalDate to any date column that is missing a value
      if (gDate) {
        for (const dateCol of dateColumns) {
          if (!rowData[dateCol]) {
            rowData[dateCol] = gDate;
          }
        }
        const commonDateFields = ['production_date', 'event_date', 'weight_date', 'date'];
        for (const field of commonDateFields) {
          if (!(field in rowData) && !colIndexMap[field]) {
            const isExpected = [...config.requiredColumns, ...(config.optionalColumns || [])].some(c => c.db === field);
            if (isExpected) {
              rowData[field] = gDate;
            }
          }
        }
      }

      const { errors, warnings } = config.validateRow(rowData, existingData);

      parsedRows.push({
        row_number: i + 2,
        data: rowData,
        errors,
        warnings,
      });
    }

    setParsedData(parsedRows);
    setStep('preview');
  };

  const handleImport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'No se encontró el usuario autenticado', variant: 'destructive' });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      toast({ title: 'Error', description: 'No se encontró la organización', variant: 'destructive' });
      return;
    }

    const validRows = parsedData.filter(r => r.errors.length === 0);
    if (validRows.length === 0) return;

    setStep('importing');
    
    const dataToImport = validRows.map(row => 
      config.transformRow(row.data, existingData, profile.organization_id)
    );

    try {
      await onImport(dataToImport);
      setImportProgress(100);
      setImportResults({ success: dataToImport.length, errors: 0 });
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({ success: 0, errors: dataToImport.length });
    }

    setStep('complete');
  };

  const downloadTemplate = () => {
    // If a static template file exists for this config, download it directly
    const staticTemplates: Record<string, string> = {
      'plantilla_produccion_leche.xlsx': '/templates/plantilla_produccion_leche.xlsx',
    };
    const staticPath = staticTemplates[config.templateFileName];
    if (staticPath) {
      const a = document.createElement('a');
      a.href = staticPath;
      a.download = config.templateFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    // Fallback: generate template dynamically
    const ws = XLSX.utils.aoa_to_sheet(config.templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, config.templateFileName);
  };

  const validCount = parsedData.filter(r => r.errors.length === 0).length;
  const errorCount = parsedData.filter(r => r.errors.length > 0).length;

  // Get display columns for preview
  const displayColumns = columnMappings.slice(0, 6).map(m => m.dbColumn);

  // Handler to delete a row
  const handleDeleteRow = (rowIndex: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== rowIndex));
  };

  // Handler for inline cell editing
  const handleCellEdit = (rowIndex: number, col: string, value: string) => {
    setParsedData(prev => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row.data = { ...row.data, [col]: value };
      // Re-validate
      const { errors, warnings } = config.validateRow(row.data, existingData);
      row.errors = errors;
      row.warnings = warnings;
      updated[rowIndex] = row;
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && config.description}
            {step === 'analyzing' && 'Analizando estructura del archivo con IA...'}
            {step === 'preview' && 'Revisa los datos antes de importar'}
            {step === 'importing' && 'Importando datos...'}
            {step === 'complete' && 'Importación completada'}
            {step === 'importing' && 'Importando datos...'}
            {step === 'complete' && 'Importación completada'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center w-full">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-medium mb-1">Arrastra tu archivo aquí</p>
                <p className="text-sm text-muted-foreground mb-3">Excel, PDF, o imagen con tablas (JPG, PNG)</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png"
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

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full">
                <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Análisis inteligente con IA</p>
                  <p className="text-muted-foreground">
                    Detectamos columnas en Excel, extraemos tablas de PDFs, y leemos datos en imágenes
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-muted-foreground flex-wrap justify-center">
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel/CSV
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  PDF con tablas
                </div>
                <div className="flex items-center gap-1">
                  <Image className="h-3.5 w-3.5" />
                  Imagen (JPG/PNG)
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar plantilla Excel
              </Button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-lg font-medium">Analizando con IA...</p>
              <p className="text-sm text-muted-foreground">
                Detectando columnas, formatos y posibles errores
              </p>
            </div>
          )}


          {step === 'preview' && (
            <div className="space-y-4">
              {/* Image preview for image imports */}
              {imagePreviewUrl && (
                <div className="border rounded-lg overflow-hidden max-h-[180px]">
                  <img
                    src={imagePreviewUrl}
                    alt="Imagen original importada"
                    className="w-full h-full object-contain bg-muted"
                    style={{ maxHeight: '180px' }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditAll(!editAll)}
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editAll ? 'Dejar de editar' : 'Editar todo'}
                </Button>
              </div>

              {errorCount > 0 && validCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  Se importarán {validCount} de {parsedData.length} registros. {errorCount} tienen errores y serán omitidos.
                </div>
              )}

              <ScrollArea className={imagePreviewUrl ? 'h-[220px] border rounded-lg' : 'h-[350px] border rounded-lg'}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="w-10"></TableHead>
                      {displayColumns.map(col => (
                        <TableHead key={col} className="text-xs">{col}</TableHead>
                      ))}
                      <TableHead className="text-xs">Errores/Avisos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, rowIdx) => {
                      const hasError = row.errors.length > 0;
                      const hasWarning = row.warnings.length > 0;
                      return (
                        <TableRow key={row.row_number} className={hasError ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-muted-foreground text-xs">{row.row_number}</TableCell>
                          <TableCell className="p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRow(rowIdx)}
                              title="Eliminar fila"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </TableCell>
                          {displayColumns.map(col => (
                            <TableCell key={col} className="p-1">
                              {editAll || hasError ? (
                                <Input
                                  value={String(row.data[col] ?? '')}
                                  onChange={(e) => handleCellEdit(rowIdx, col, e.target.value)}
                                  className="h-7 text-xs min-w-[80px]"
                                />
                              ) : (
                                <span
                                  className="cursor-pointer text-xs hover:underline block truncate max-w-[120px]"
                                  onClick={() => {
                                    // Enable editing for this single row
                                    setEditAll(false);
                                    // Just toggle to editAll briefly to allow single cell edit
                                    handleCellEdit(rowIdx, col, String(row.data[col] ?? ''));
                                  }}
                                  title="Clic para editar"
                                >
                                  {String(row.data[col] ?? '-')}
                                </span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="max-w-[180px]">
                            {hasError && (
                              <div className="text-xs text-destructive">{row.errors.join(', ')}</div>
                            )}
                            {hasWarning && (
                              <div className="text-xs text-amber-600">{row.warnings.join(', ')}</div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">Importando datos...</p>
              <Progress value={importProgress} className="w-64" />
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
              <p className="text-lg font-medium">¡Importación completada!</p>
              <div className="flex gap-4">
                <Badge variant="default" className="gap-1 bg-green-600 text-base px-3 py-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {importResults.success} importados
                </Badge>
                {importResults.errors > 0 && (
                  <Badge variant="destructive" className="gap-1 text-base px-3 py-1">
                    <XCircle className="h-4 w-4" />
                    {importResults.errors} errores
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
              <Button variant="outline" onClick={() => { resetDialog(); }}>Volver</Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0}
                className={validCount > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              >
                Importar {validCount} registros
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
