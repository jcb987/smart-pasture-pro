import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Animal, type AnimalCategory, type AnimalSex, type AnimalStatus } from '@/hooks/useAnimals';
import * as XLSX from 'xlsx';

// Types
export type Species = 'bovino' | 'bufalo' | 'cerdo';

export interface ProductiveStage {
  label: string;
  category: AnimalCategory;
  sex: AnimalSex;
  species: Species[];
}

export interface ImportedAnimalRow {
  row_number: number;
  original_data: Record<string, unknown>;
  // Extracted fields
  tag_id: string;
  name: string | null;
  category: AnimalCategory | null;
  sex: AnimalSex | null;
  breed: string | null;
  current_weight: number | null;
  lot_name: string | null;
  status: AnimalStatus;
  productive_stage: string | null;
  // Matching
  matched_animal: Animal | null;
  is_update: boolean;
  // Validation
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// Productive stages mapping for different species
const PRODUCTIVE_STAGES: ProductiveStage[] = [
  // Bovinos/Búfalos - Hembras
  { label: 'Vaca seca', category: 'vaca', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Vaca parida', category: 'vaca', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Novilla de vientre', category: 'novilla', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Nov. vientre', category: 'novilla', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Hemb. levante', category: 'novilla', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Hembra levante', category: 'novilla', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Cría hembra', category: 'ternera', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Ternera', category: 'ternera', sex: 'hembra', species: ['bovino', 'bufalo'] },
  { label: 'Becerra', category: 'becerra', sex: 'hembra', species: ['bovino', 'bufalo'] },
  // Bovinos/Búfalos - Machos
  { label: 'Reproductor', category: 'toro', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Toro', category: 'toro', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Mac. levante', category: 'novillo', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Macho levante', category: 'novillo', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Cría macho', category: 'ternero', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Ternero', category: 'ternero', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Becerro', category: 'becerro', sex: 'macho', species: ['bovino', 'bufalo'] },
  { label: 'Novillo', category: 'novillo', sex: 'macho', species: ['bovino', 'bufalo'] },
  // Búfalos específicos
  { label: 'Búfala', category: 'bufala', sex: 'hembra', species: ['bufalo'] },
  { label: 'Búfalo', category: 'bufalo', sex: 'macho', species: ['bufalo'] },
];

// Sex inference rules
const FEMALE_KEYWORDS = ['vaca', 'novilla', 'nov.', 'hemb', 'hembra', 'cría hembra', 'ternera', 'becerra', 'búfala', 'cerda'];
const MALE_KEYWORDS = ['toro', 'reproductor', 'mac', 'macho', 'cría macho', 'ternero', 'becerro', 'búfalo', 'verraco'];

export function useSmartAnimalImport(existingAnimals: Animal[]) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedRows, setProcessedRows] = useState<ImportedAnimalRow[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species>('bovino');
  const { toast } = useToast();

  // Normalize tag_id for matching (remove spaces, standardize separators)
  const normalizeTagId = useCallback((tag: string): string => {
    return tag
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[-–—]/g, '-')
      .replace(/[\/\\]/g, '/');
  }, []);

  // Find existing animal by tag
  const findExistingAnimal = useCallback((tagId: string): Animal | null => {
    const normalizedInput = normalizeTagId(tagId);
    return existingAnimals.find(a => normalizeTagId(a.tag_id) === normalizedInput) || null;
  }, [existingAnimals, normalizeTagId]);

  // Infer sex from phase/stage text
  const inferSexFromText = useCallback((text: string): AnimalSex | null => {
    const normalized = text.toLowerCase().trim();
    
    for (const keyword of FEMALE_KEYWORDS) {
      if (normalized.includes(keyword)) return 'hembra';
    }
    
    for (const keyword of MALE_KEYWORDS) {
      if (normalized.includes(keyword)) return 'macho';
    }
    
    return null;
  }, []);

  // Map phase/stage to category
  const mapStageToCategory = useCallback((stageText: string, species: Species): { category: AnimalCategory | null; sex: AnimalSex | null } => {
    const normalized = stageText.toLowerCase().trim();
    
    // Try exact match first
    for (const stage of PRODUCTIVE_STAGES) {
      if (stage.species.includes(species) && stage.label.toLowerCase() === normalized) {
        return { category: stage.category, sex: stage.sex };
      }
    }
    
    // Try partial match
    for (const stage of PRODUCTIVE_STAGES) {
      if (stage.species.includes(species) && 
          (normalized.includes(stage.label.toLowerCase()) || 
           stage.label.toLowerCase().includes(normalized))) {
        return { category: stage.category, sex: stage.sex };
      }
    }
    
    // Fallback: just infer sex
    const sex = inferSexFromText(stageText);
    return { category: null, sex };
  }, [inferSexFromText]);

  // Normalize category from text - FORCES buffalo categories when species is bufalo
  const normalizeCategory = useCallback((value: string, species: Species): AnimalCategory | null => {
    const normalized = value.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // If species is bufalo, force buffalo categories
    if (species === 'bufalo') {
      // Map bovine categories to buffalo equivalents based on sex inference
      const sex = inferSexFromText(value);
      
      // Check if it's explicitly buffalo
      if (normalized.includes('bufala') || normalized.includes('bufalo')) {
        return sex === 'macho' ? 'bufalo' : 'bufala';
      }
      
      // Map common bovine terms to buffalo
      const femaleTerms = ['vaca', 'novilla', 'ternera', 'becerra', 'hembra'];
      const maleTerms = ['toro', 'novillo', 'ternero', 'becerro', 'macho', 'reproductor'];
      
      for (const term of femaleTerms) {
        if (normalized.includes(term)) return 'bufala';
      }
      for (const term of maleTerms) {
        if (normalized.includes(term)) return 'bufalo';
      }
      
      // If sex was detected, use it
      if (sex === 'hembra') return 'bufala';
      if (sex === 'macho') return 'bufalo';
      
      return null;
    }
    
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
    
    // Direct match
    if (categoryMap[normalized]) {
      return categoryMap[normalized];
    }
    
    // Try mapping from stage
    const stageResult = mapStageToCategory(value, species);
    if (stageResult.category) {
      return stageResult.category;
    }
    
    return null;
  }, [mapStageToCategory, inferSexFromText]);

  // Parse date from various formats
  const parseDate = useCallback((value: unknown): string | null => {
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
  }, []);

  // Parse weight
  const parseWeight = useCallback((value: unknown): number | null => {
    if (!value) return null;
    
    const numStr = value.toString().replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(numStr);
    
    if (isNaN(num) || num <= 0) return null;
    return num;
  }, []);

  // Process a single row of data
  const processRow = useCallback((
    rowData: Record<string, unknown>,
    rowNumber: number,
    species: Species
  ): ImportedAnimalRow => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Extract tag_id (primary identifier)
    let tagId = '';
    const tagFields = ['tag_id', 'arete', 'id', 'numero', 'identificador', 'codigo'];
    for (const field of tagFields) {
      if (rowData[field]) {
        tagId = rowData[field]?.toString().trim() || '';
        break;
      }
    }
    
    if (!tagId) {
      errors.push('ID/Arete no encontrado');
    }
    
    // Extract name (optional)
    const name = rowData['name']?.toString().trim() || 
                 rowData['nombre']?.toString().trim() || 
                 null;
    
    // Extract stage/phase and derive category/sex
    let stageText = rowData['stage']?.toString() || 
                    rowData['fase']?.toString() || 
                    rowData['etapa']?.toString() || 
                    rowData['estado_productivo']?.toString() || 
                    rowData['category']?.toString() || 
                    rowData['categoria']?.toString() || '';
    
    let category: AnimalCategory | null = null;
    let sex: AnimalSex | null = null;
    
    // Try to get category directly
    const directCategory = rowData['category']?.toString() || rowData['categoria']?.toString();
    if (directCategory) {
      category = normalizeCategory(directCategory, species);
    }
    
    // Try to get sex directly
    const directSex = rowData['sex']?.toString() || rowData['sexo']?.toString();
    if (directSex) {
      const normalizedSex = directSex.toLowerCase().trim();
      if (['hembra', 'h', 'f', 'female'].includes(normalizedSex)) sex = 'hembra';
      else if (['macho', 'm', 'male'].includes(normalizedSex)) sex = 'macho';
    }
    
    // If stage text exists, try to infer category and sex
    if (stageText && (!category || !sex)) {
      const stageResult = mapStageToCategory(stageText, species);
      if (!category && stageResult.category) category = stageResult.category;
      if (!sex && stageResult.sex) sex = stageResult.sex;
    }
    
    // If still no sex, try to infer from any text field
    if (!sex) {
      const allText = Object.values(rowData).filter(v => typeof v === 'string').join(' ');
      sex = inferSexFromText(allText);
    }
    
    // FORCE BUFFALO CATEGORIES: If species is bufalo, override any detected bovine categories
    if (species === 'bufalo') {
      if (category && !['bufala', 'bufalo'].includes(category)) {
        // Convert bovine categories to buffalo based on sex
        category = sex === 'macho' ? 'bufalo' : 'bufala';
      } else if (!category && sex) {
        // If no category but sex detected, assign buffalo category
        category = sex === 'macho' ? 'bufalo' : 'bufala';
      }
    }
    
    // Warnings for missing data (not blocking)
    if (!category) {
      warnings.push('Categoría no detectada - requiere selección manual');
    }
    if (!sex) {
      warnings.push('Sexo no detectado - requiere selección manual');
    }
    
    // Extract breed (optional)
    const breed = rowData['breed']?.toString().trim() || 
                  rowData['raza']?.toString().trim() || 
                  null;
    
    // Extract weight (optional)
    const weightRaw = rowData['weight'] || rowData['peso'] || rowData['peso_actual'];
    const currentWeight = parseWeight(weightRaw);
    
    // Extract lot (optional)
    const lotName = rowData['lot_name']?.toString().trim() || 
                    rowData['lote']?.toString().trim() || 
                    rowData['potrero']?.toString().trim() || 
                    null;
    
    // Extract status (default to activo)
    let status: AnimalStatus = 'activo';
    const statusRaw = rowData['status']?.toString() || rowData['estado']?.toString();
    if (statusRaw) {
      const normalizedStatus = statusRaw.toLowerCase().trim();
      if (normalizedStatus.includes('vendido')) status = 'vendido';
      else if (normalizedStatus.includes('muerto')) status = 'muerto';
      else if (normalizedStatus.includes('descartado')) status = 'descartado';
      else if (normalizedStatus.includes('trasladado')) status = 'trasladado';
    }
    
    // Check for existing animal (matching)
    const matchedAnimal = tagId ? findExistingAnimal(tagId) : null;
    const isUpdate = matchedAnimal !== null;
    
    if (isUpdate) {
      warnings.push(`Animal existente encontrado - se actualizarán datos`);
    }
    
    return {
      row_number: rowNumber,
      original_data: rowData,
      tag_id: tagId,
      name,
      category,
      sex,
      breed,
      current_weight: currentWeight,
      lot_name: lotName,
      status,
      productive_stage: stageText || null,
      matched_animal: matchedAnimal,
      is_update: isUpdate,
      errors,
      warnings,
    };
  }, [normalizeCategory, mapStageToCategory, inferSexFromText, parseWeight, findExistingAnimal]);

  // Process Excel file
  const processExcelFile = useCallback(async (file: File, species: Species): Promise<ImportedAnimalRow[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) return [];

    const headers = (jsonData[0] as string[]).map(h => 
      h?.toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
    );
    
    const results: ImportedAnimalRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0 || row.every(cell => !cell)) continue;

      const rowData: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header && row[idx] !== undefined && row[idx] !== null) {
          rowData[header] = row[idx];
        }
      });

      results.push(processRow(rowData, i + 1, species));
    }

    return results;
  }, [processRow]);

  // Process PDF file using AI
  const processPDFFile = useCallback(async (file: File, species: Species): Promise<ImportedAnimalRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const expectedColumns = [
      { db: 'tag_id', labels: ['arete', 'id', 'numero', 'identificador', 'codigo', 'tag'], required: true },
      { db: 'name', labels: ['nombre', 'name'], required: false },
      { db: 'stage', labels: ['fase', 'etapa', 'estado', 'categoria', 'tipo', 'estado_productivo'], required: false },
      { db: 'sex', labels: ['sexo', 'sex', 'genero'], required: false },
      { db: 'breed', labels: ['raza', 'breed'], required: false },
      { db: 'weight', labels: ['peso', 'weight', 'peso_actual', 'peso_vivo', 'kg'], required: false },
      { db: 'lot_name', labels: ['lote', 'lot', 'potrero', 'corral', 'grupo'], required: false },
      { db: 'status', labels: ['estado', 'status', 'situacion'], required: false },
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

    if (!rows || rows.length === 0) return [];

    const normalizedHeaders = headers.map(h => 
      h?.toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
    );

    const results: ImportedAnimalRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length === 0) continue;

      const rowData: Record<string, unknown> = {};
      normalizedHeaders.forEach((header, idx) => {
        if (header && row[idx] !== undefined && row[idx] !== null) {
          rowData[header] = row[idx];
        }
      });

      results.push(processRow(rowData, i + 1, species));
    }

    return results;
  }, [processRow]);

  // Main process file function
  const processFile = useCallback(async (file: File, species: Species) => {
    setIsProcessing(true);
    setSelectedSpecies(species);
    
    try {
      const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      
      let results: ImportedAnimalRow[];
      if (isPDF) {
        results = await processPDFFile(file, species);
      } else {
        results = await processExcelFile(file, species);
      }
      
      setProcessedRows(results);
      return results;
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error al procesar archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [processExcelFile, processPDFFile, toast]);

  // Update a row manually (for user corrections)
  const updateRow = useCallback((rowNumber: number, updates: Partial<ImportedAnimalRow>) => {
    setProcessedRows(prev => 
      prev.map(row => 
        row.row_number === rowNumber 
          ? { ...row, ...updates, errors: [], warnings: row.warnings.filter(w => !w.includes('requiere selección')) }
          : row
      )
    );
  }, []);

  // Import animals to database
  const importAnimals = useCallback(async (
    rows: ImportedAnimalRow[],
    organizationId: string
  ): Promise<ImportResult> => {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
    
    // Filter valid rows
    const validRows = rows.filter(r => r.tag_id && r.errors.length === 0);
    
    for (const row of validRows) {
      try {
        if (row.is_update && row.matched_animal) {
          // Update existing animal
          const updates: Record<string, unknown> = {};
          if (row.current_weight && !row.matched_animal.current_weight) {
            updates.current_weight = row.current_weight;
            updates.last_weight_date = new Date().toISOString().split('T')[0];
          }
          if (row.lot_name && !row.matched_animal.lot_name) {
            updates.lot_name = row.lot_name;
          }
          if (row.breed && !row.matched_animal.breed) {
            updates.breed = row.breed;
          }
          
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('animals')
              .update(updates)
              .eq('id', row.matched_animal.id);
            
            if (error) throw error;
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          // Create new animal
          if (!row.category || !row.sex) {
            result.errors.push(`Fila ${row.row_number}: Categoría o sexo no definido`);
            result.skipped++;
            continue;
          }
          
          const { error } = await supabase
            .from('animals')
            .insert({
              tag_id: row.tag_id,
              name: row.name,
              category: row.category,
              sex: row.sex,
              breed: row.breed,
              current_weight: row.current_weight,
              last_weight_date: row.current_weight ? new Date().toISOString().split('T')[0] : null,
              lot_name: row.lot_name,
              status: row.status,
              organization_id: organizationId,
              entry_date: new Date().toISOString().split('T')[0],
            });
          
          if (error) throw error;
          result.created++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        result.errors.push(`Fila ${row.row_number}: ${errorMsg}`);
        result.skipped++;
      }
    }
    
    return result;
  }, []);

  // Generate import log
  const generateImportLog = useCallback((rows: ImportedAnimalRow[], result: ImportResult): string => {
    const lines: string[] = [
      '=== LOG DE IMPORTACIÓN ===',
      `Fecha: ${new Date().toLocaleString()}`,
      `Especie: ${selectedSpecies}`,
      '',
      `Resumen:`,
      `- Creados: ${result.created}`,
      `- Actualizados: ${result.updated}`,
      `- Omitidos: ${result.skipped}`,
      '',
    ];
    
    if (result.errors.length > 0) {
      lines.push('Errores:', ...result.errors, '');
    }
    
    lines.push('Detalle por registro:', '');
    
    for (const row of rows) {
      const status = row.is_update ? 'ACTUALIZADO' : (row.errors.length > 0 ? 'ERROR' : 'CREADO');
      lines.push(`[${status}] Fila ${row.row_number}: ${row.tag_id}`);
      if (row.warnings.length > 0) {
        lines.push(`  Advertencias: ${row.warnings.join(', ')}`);
      }
      if (row.errors.length > 0) {
        lines.push(`  Errores: ${row.errors.join(', ')}`);
      }
    }
    
    return lines.join('\n');
  }, [selectedSpecies]);

  return {
    isProcessing,
    processedRows,
    selectedSpecies,
    setSelectedSpecies,
    processFile,
    updateRow,
    importAnimals,
    generateImportLog,
    setProcessedRows,
  };
}
