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
  // Extended fields
  birth_date: string | null;
  age_years: number | null;
  reproductive_status: string | null;
  last_service_date: string | null;
  condition_score: number | null;
  notes: string | null;
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
const FEMALE_KEYWORDS = [
  'vaca', 'vaca seca', 'vaca parida', 'vaca horra', 'vaca gestante', 'vaca lactante',
  'novilla', 'novilla de vientre', 'nov. vientre', 'nov.', 'nva',
  'hemb', 'hembra', 'hem', 'h', 'f', 'female',
  'ternera', 'ternerita', 'cría hembra', 'cria hembra',
  'becerra', 'becerrita',
  'búfala', 'bufala',
  'cerda', 'marrana', 'puerca', 'hembra levante', 'hemb. levante', 'hemb levante',
  'vientre', 'parida', 'seca', 'gestante', 'prenada', 'abierta'
];
const MALE_KEYWORDS = [
  'toro', 'torete', 'toro reproductor',
  'reproductor', 'semental', 'padrote',
  'mac', 'macho', 'm', 'male',
  'ternero', 'ternerito', 'cría macho', 'cria macho',
  'becerro', 'becerrito',
  'novillo', 'torillo',
  'búfalo', 'bufalo',
  'verraco', 'macho levante', 'mac. levante', 'mac levante'
];

// Reproductive status mapping
// TIP / ESTADO columns
const REPRODUCTIVE_STATUS_MAP: Record<string, string> = {
  'pre': 'preñada',
  'pre.': 'preñada',
  'pren': 'preñada',
  'prenada': 'preñada',
  'preñada': 'preñada',
  'gestante': 'preñada',
  'gest': 'preñada',
  'abt': 'vacia',
  'abierta': 'vacia',
  'vacia': 'vacia',
  'vac': 'vacia',
  'vac.': 'vacia',
  'vacía': 'vacia',
  'seca': 'vacia',
  'pst': 'vacia',
  'pos': 'vacia',
  'pos parto': 'vacia',
  'postparto': 'vacia',
  'inseminada': 'inseminada',
  'ins': 'inseminada',
  'ins.': 'inseminada',
  'servida': 'inseminada',
  'serv': 'inseminada',
  'parida': 'parida',
  'par': 'parida',
};

export function useSmartAnimalImport(existingAnimals: Animal[]) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedRows, setProcessedRows] = useState<ImportedAnimalRow[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species>('bovino');
  const { toast } = useToast();

  // Normalize tag_id for matching
  const normalizeTagId = useCallback((tag: string): string => {
    return tag
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[-–—]/g, '-')
      .replace(/[\/\\]/g, '/');
  }, []);

  // Find existing animal by tag - comprehensive matching
  const findExistingAnimal = useCallback((tagId: string): Animal | null => {
    const normalizedInput = normalizeTagId(tagId);
    // Try exact match
    const exact = existingAnimals.find(a => normalizeTagId(a.tag_id) === normalizedInput);
    if (exact) return exact;
    // Try without leading zeros (e.g. "0001" matches "1")
    const stripped = normalizedInput.replace(/^0+/, '');
    const strippedMatch = existingAnimals.find(a => normalizeTagId(a.tag_id).replace(/^0+/, '') === stripped);
    return strippedMatch || null;
  }, [existingAnimals, normalizeTagId]);

  // Infer sex from text
  const inferSexFromText = useCallback((text: string): AnimalSex | null => {
    if (!text) return null;
    const normalized = text.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'h' || normalized === 'f') return 'hembra';
    if (normalized === 'm') return 'macho';

    const sortedFemaleKeywords = [...FEMALE_KEYWORDS].sort((a, b) => b.length - a.length);
    for (const keyword of sortedFemaleKeywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKeyword)) return 'hembra';
    }

    const sortedMaleKeywords = [...MALE_KEYWORDS].sort((a, b) => b.length - a.length);
    for (const keyword of sortedMaleKeywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKeyword)) return 'macho';
    }

    return null;
  }, []);

  // Map phase/stage to category
  const mapStageToCategory = useCallback((stageText: string, species: Species): { category: AnimalCategory | null; sex: AnimalSex | null } => {
    const normalized = stageText.toLowerCase().trim();

    for (const stage of PRODUCTIVE_STAGES) {
      if (stage.species.includes(species) && stage.label.toLowerCase() === normalized) {
        return { category: stage.category, sex: stage.sex };
      }
    }

    for (const stage of PRODUCTIVE_STAGES) {
      if (stage.species.includes(species) &&
        (normalized.includes(stage.label.toLowerCase()) ||
          stage.label.toLowerCase().includes(normalized))) {
        return { category: stage.category, sex: stage.sex };
      }
    }

    const sex = inferSexFromText(stageText);
    return { category: null, sex };
  }, [inferSexFromText]);

  // Normalize category from text
  const normalizeCategory = useCallback((value: string, species: Species): AnimalCategory | null => {
    const normalized = value.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (species === 'bufalo') {
      const sex = inferSexFromText(value);
      if (normalized.includes('bufala') || normalized.includes('bufalo')) {
        return sex === 'macho' ? 'bufalo' : 'bufala';
      }
      const femaleTerms = ['vaca', 'novilla', 'ternera', 'becerra', 'hembra'];
      const maleTerms = ['toro', 'novillo', 'ternero', 'becerro', 'macho', 'reproductor'];
      for (const term of femaleTerms) {
        if (normalized.includes(term)) return 'bufala';
      }
      for (const term of maleTerms) {
        if (normalized.includes(term)) return 'bufalo';
      }
      if (sex === 'hembra') return 'bufala';
      if (sex === 'macho') return 'bufalo';
      return null;
    }

    const categoryMap: Record<string, AnimalCategory> = {
      'vaca': 'vaca', 'toro': 'toro', 'novilla': 'novilla', 'novillo': 'novillo',
      'ternera': 'ternera', 'ternero': 'ternero', 'becerra': 'becerra', 'becerro': 'becerro',
      'bufala': 'bufala', 'bufalo': 'bufalo',
    };

    if (categoryMap[normalized]) return categoryMap[normalized];

    const stageResult = mapStageToCategory(value, species);
    if (stageResult.category) return stageResult.category;

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

      // Try mmyy or mm/yy (e.g. "01/23" = january 2023)
      const mmyy = dateStr.match(/^(\d{1,2})[\/\-](\d{2})$/);
      if (mmyy) {
        const year = parseInt(mmyy[2]) + 2000;
        return `${year}-${mmyy[1].padStart(2, '0')}-01`;
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

  /**
   * Parse age/years from a value and return birth_date.
   * Handles: "3", "3.5", "3 años", "3 anos", "3a", "3a6m", "3 años 6 meses"
   */
  const parseAgeTobirthDate = useCallback((value: unknown): { birthDate: string | null; ageYears: number | null } => {
    if (!value) return { birthDate: null, ageYears: null };

    const str = value.toString().toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Extract years
    let years = 0;
    let months = 0;

    // Pattern: "3a6m", "3 años 6 meses", "3 anos 6 meses"
    const fullMatch = str.match(/(\d+(?:\.\d+)?)\s*a(?:ños?|nos?|\.)?(?:\s*(\d+)\s*m(?:eses?)?)?/);
    if (fullMatch) {
      years = parseFloat(fullMatch[1]);
      months = fullMatch[2] ? parseInt(fullMatch[2]) : 0;
    } else {
      // Simple number (years)
      const simpleNum = str.match(/^(\d+(?:\.\d+)?)$/);
      if (simpleNum) {
        years = parseFloat(simpleNum[1]);
      }
    }

    if (years === 0 && months === 0) return { birthDate: null, ageYears: null };

    const totalMonths = Math.round(years * 12 + months);
    const now = new Date();
    now.setMonth(now.getMonth() - totalMonths);
    const birthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    return { birthDate, ageYears: parseFloat((years + months / 12).toFixed(1)) };
  }, []);

  /**
   * Parse reproductive status from TIP / GES / ESTADO columns.
   */
  const parseReproductiveStatus = useCallback((value: unknown): string | null => {
    if (!value) return null;
    const str = value.toString().toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Direct map lookup
    const mapped = REPRODUCTIVE_STATUS_MAP[str];
    if (mapped) return mapped;

    // Partial match
    for (const [key, status] of Object.entries(REPRODUCTIVE_STATUS_MAP)) {
      if (str.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return status;
      }
    }

    return null;
  }, []);

  /**
   * Parse body condition score (D column) 1-5
   */
  const parseConditionScore = useCallback((value: unknown): number | null => {
    if (!value) return null;
    const num = parseFloat(value.toString().replace(',', '.'));
    if (!isNaN(num) && num >= 1 && num <= 5) return num;
    return null;
  }, []);

  // Helper function to find a value from multiple possible keys
  const findValue = useCallback((rowData: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
      if (rowData[key] !== undefined && rowData[key] !== null && rowData[key] !== '') {
        return rowData[key];
      }
      for (const dataKey of Object.keys(rowData)) {
        const normalizedDataKey = dataKey.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedSearchKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedDataKey === normalizedSearchKey ||
          normalizedDataKey.includes(normalizedSearchKey) ||
          normalizedSearchKey.includes(normalizedDataKey)) {
          if (rowData[dataKey] !== undefined && rowData[dataKey] !== null && rowData[dataKey] !== '') {
            return rowData[dataKey];
          }
        }
      }
    }
    return null;
  }, []);

  // Process a single row of data
  const processRow = useCallback((
    rowData: Record<string, unknown>,
    rowNumber: number,
    species: Species
  ): ImportedAnimalRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ─────────────────────────────────────────────────
    // 1. TAG / CHAPETA / NUMERO (REQUIRED)
    // ─────────────────────────────────────────────────
    const tagFields = [
      'tag_id', 'arete', 'id', 'numero', 'número', 'identificador', 'codigo', 'código',
      'no', 'n°', 'n.', 'num', 'animal', 'arete/id', 'id animal',
      'identificacion', 'identificación', 'chapeta', 'ear tag', 'tag', 'nro', 'numero animal',
      'no.', '#', 'consecutivo', 'registro'
    ];

    let tagId = '';
    const tagValue = findValue(rowData, tagFields);
    if (tagValue) {
      tagId = tagValue.toString().trim();
    }

    if (!tagId) {
      const firstKey = Object.keys(rowData)[0];
      if (firstKey && rowData[firstKey]) {
        const firstVal = rowData[firstKey]?.toString().trim();
        if (firstVal && /^[\d\w\-\/\.]+$/i.test(firstVal) && firstVal.length < 50) {
          tagId = firstVal;
        }
      }
    }

    if (!tagId) {
      errors.push('ID/Arete no encontrado');
    }

    // ─────────────────────────────────────────────────
    // 2. CHECK FOR DUPLICATES (is_update detection)
    // ─────────────────────────────────────────────────
    const matchedAnimal = tagId ? findExistingAnimal(tagId) : null;
    const isUpdate = matchedAnimal !== null;

    if (isUpdate) {
      warnings.push(`Animal ya existe en el sistema → se actualizarán sus datos`);
    }

    // ─────────────────────────────────────────────────
    // 3. NAME (optional)
    // ─────────────────────────────────────────────────
    const nameFields = ['name', 'nombre', 'alias', 'apodo'];
    const nameValue = findValue(rowData, nameFields);
    const name = nameValue?.toString().trim() || null;

    // ─────────────────────────────────────────────────
    // 4. SEX / CATEGORY (SPECIES RULES ALWAYS WIN)
    // ─────────────────────────────────────────────────
    const stageFields = [
      'stage', 'fase', 'etapa', 'estado_productivo', 'category', 'categoria', 'categoría',
      'tipo', 'clasificacion', 'clasificación', 'fase productiva', 'tipo animal', 'descripcion', 'descripción',
      'tip', 'estado'
    ];
    const stageText = (findValue(rowData, stageFields) || '').toString();

    let category: AnimalCategory | null = null;
    let sex: AnimalSex | null = null;

    // Collect all text from row for sex detection
    const allTextContent = Object.values(rowData)
      .filter(v => v !== null && v !== undefined)
      .map(v => v.toString())
      .join(' ');

    // Explicit sex field
    const sexFields = ['sex', 'sexo', 'genero', 'género', 'gender'];
    const directSex = findValue(rowData, sexFields);
    if (directSex) {
      const normalizedSex = directSex.toString().toLowerCase().trim();
      if (['hembra', 'h', 'f', 'female', 'hem', 'fem'].includes(normalizedSex)) sex = 'hembra';
      else if (['macho', 'm', 'male', 'mac'].includes(normalizedSex)) sex = 'macho';
    }

    if (!sex && stageText) sex = inferSexFromText(stageText);
    if (!sex) sex = inferSexFromText(allTextContent);

    // Try to get category
    const categoryFields = ['category', 'categoria', 'categoría', 'tipo', 'clasificacion'];
    const directCategory = findValue(rowData, categoryFields);
    if (directCategory) {
      category = normalizeCategory(directCategory.toString(), species);
    }
    if (stageText && !category) {
      const stageResult = mapStageToCategory(stageText, species);
      if (stageResult.category) category = stageResult.category;
    }

    // *** SPECIES RULE: ALWAYS overrides document data for buffalo ***
    if (species === 'bufalo') {
      if (sex) {
        category = sex === 'macho' ? 'bufalo' : 'bufala';
      } else {
        sex = 'hembra';
        category = 'bufala';
      }
    }

    if (!category && species !== 'bufalo') warnings.push('Categoría no detectada - requiere selección manual');
    if (!sex && species !== 'bufalo') warnings.push('Sexo no detectado - requiere selección manual');

    // ─────────────────────────────────────────────────
    // 5. BREED (optional)
    // ─────────────────────────────────────────────────
    const breedFields = ['breed', 'raza', 'raza animal', 'tipo raza'];
    const breedValue = findValue(rowData, breedFields);
    const breed = breedValue?.toString().trim() || null;

    // ─────────────────────────────────────────────────
    // 6. WEIGHT (optional)
    // ─────────────────────────────────────────────────
    const weightFields = ['weight', 'peso', 'peso_actual', 'peso_vivo', 'kg', 'peso kg', 'peso (kg)'];
    const weightRaw = findValue(rowData, weightFields);
    const currentWeight = parseWeight(weightRaw);

    // ─────────────────────────────────────────────────
    // 7. LOT / POTRERO (optional)
    // ─────────────────────────────────────────────────
    const lotFields = ['lot_name', 'lote', 'potrero', 'corral', 'grupo', 'ubicacion', 'ubicación', 'location'];
    const lotValue = findValue(rowData, lotFields);
    const lotName = lotValue?.toString().trim() || null;

    // ─────────────────────────────────────────────────
    // 8. STATUS (default activo)
    // ─────────────────────────────────────────────────
    let status: AnimalStatus = 'activo';
    // Only check "estado" column for status if it's NOT a reproductive field
    // TIP and GES are reproductive, not animal status
    const animalStatusFields = ['status', 'situacion', 'situación', 'condicion', 'condición'];
    const statusRaw = findValue(rowData, animalStatusFields);
    if (statusRaw) {
      const normalizedStatus = statusRaw.toString().toLowerCase().trim();
      if (normalizedStatus.includes('vendido') || normalizedStatus.includes('venta')) status = 'vendido';
      else if (normalizedStatus.includes('muerto') || normalizedStatus.includes('muerte')) status = 'muerto';
      else if (normalizedStatus.includes('descartado') || normalizedStatus.includes('descarte')) status = 'descartado';
      else if (normalizedStatus.includes('trasladado') || normalizedStatus.includes('traslado')) status = 'trasladado';
    }

    // ─────────────────────────────────────────────────
    // 9. AGE / YEARS → birth_date  (ANOS, EDAD, AÑOS, AGE column)
    // ─────────────────────────────────────────────────
    const ageFields = ['anos', 'años', 'edad', 'age', 'years', 'anos_vida', 'edad_años', 'a'];
    const ageRaw = findValue(rowData, ageFields);
    const { birthDate, ageYears } = parseAgeTobirthDate(ageRaw);

    // Also check if there's an explicit birth_date column
    const birthDateFields = ['birth_date', 'fecha_nacimiento', 'nacimiento', 'fecha nac', 'fec nac'];
    const birthDateRaw = findValue(rowData, birthDateFields);
    const explicitBirthDate = parseDate(birthDateRaw);

    const finalBirthDate = explicitBirthDate || birthDate;

    // ─────────────────────────────────────────────────
    // 10. REPRODUCTIVE STATUS  (TIP, GES, GESTACION)
    // ─────────────────────────────────────────────────
    // TIP = tipo reproductivo (PRE, ABT, etc.)
    const tipFields = ['tip', 'tipo_repr', 'tipo_reproductivo', 'tipo reprod', 'gest', 'gestacion', 'gestación', 'ges'];
    const tipRaw = findValue(rowData, tipFields);
    const reproductiveStatus = parseReproductiveStatus(tipRaw);

    // ─────────────────────────────────────────────────
    // 11. LAST SERVICE / PALPATION DATE  (ULTIMO column)
    // ─────────────────────────────────────────────────
    const lastServiceFields = [
      'ultimo', 'último', 'ultima', 'última', 'last', 'ultima_palpacion', 'última palpación',
      'ult palp', 'ult. palp', 'fecha_servicio', 'fecha servicio', 'last service', 'ultimo servicio'
    ];
    const lastServiceRaw = findValue(rowData, lastServiceFields);
    const lastServiceDate = parseDate(lastServiceRaw);

    // ─────────────────────────────────────────────────
    // 12. BODY CONDITION SCORE  (D column, 1-5)
    // ─────────────────────────────────────────────────
    const conditionFields = [
      'd', 'cc', 'cs', 'condicion', 'condición', 'condicion_corporal', 'body_condition',
      'bcs', 'score', 'calificacion', 'calificación'
    ];
    const conditionRaw = findValue(rowData, conditionFields);
    const conditionScore = parseConditionScore(conditionRaw);

    // ─────────────────────────────────────────────────
    // 13. NOTES (optional)
    // ─────────────────────────────────────────────────
    const notesFields = ['notes', 'notas', 'observaciones', 'obs', 'comentarios'];
    const notesRaw = findValue(rowData, notesFields);
    const notes = notesRaw?.toString().trim() || null;

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
      birth_date: finalBirthDate,
      age_years: ageYears,
      reproductive_status: reproductiveStatus,
      last_service_date: lastServiceDate,
      condition_score: conditionScore,
      notes,
      matched_animal: matchedAnimal,
      is_update: isUpdate,
      errors,
      warnings,
    };
  }, [normalizeCategory, mapStageToCategory, inferSexFromText, parseWeight, parseDate,
    parseAgeTobirthDate, parseReproductiveStatus, parseConditionScore, findExistingAnimal, findValue]);

  // Process Excel file
  const processExcelFile = useCallback(async (file: File, species: Species): Promise<ImportedAnimalRow[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) return [];

    const headers = (jsonData[0] as string[]).map(h =>
      h?.toString().trim() || ''
    );

    const results: ImportedAnimalRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0 || row.every(cell => !cell)) continue;

      const rowData: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header && row[idx] !== undefined && row[idx] !== null) {
          // Store BOTH original header name AND normalized version
          rowData[header] = row[idx];
          const normalizedHeader = header.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (normalizedHeader !== header) {
            rowData[normalizedHeader] = row[idx];
          }
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
      { db: 'tag_id', labels: ['arete', 'id', 'numero', 'número', 'identificador', 'codigo', 'tag', 'chapeta', 'no'], required: true },
      { db: 'name', labels: ['nombre', 'name'], required: false },
      { db: 'stage', labels: ['fase', 'etapa', 'estado', 'categoria', 'tipo', 'tip'], required: false },
      { db: 'sex', labels: ['sexo', 'sex', 'genero'], required: false },
      { db: 'breed', labels: ['raza', 'breed'], required: false },
      { db: 'weight', labels: ['peso', 'weight', 'peso_actual', 'peso_vivo', 'kg'], required: false },
      { db: 'lot_name', labels: ['lote', 'lot', 'potrero', 'corral', 'grupo'], required: false },
      { db: 'anos', labels: ['anos', 'años', 'edad', 'age', 'years'], required: false },
      { db: 'ges', labels: ['ges', 'gestacion', 'gestación'], required: false },
      { db: 'tip', labels: ['tip', 'tipo', 'tipo_reproductivo'], required: false },
      { db: 'ultimo', labels: ['ultimo', 'último', 'ultima', 'ult palp'], required: false },
      { db: 'd', labels: ['d', 'cc', 'cs', 'condicion', 'bcs'], required: false },
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

    const results: ImportedAnimalRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length === 0) continue;

      const rowData: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header && row[idx] !== undefined && row[idx] !== null) {
          rowData[header] = row[idx];
          const normalizedHeader = header.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (normalizedHeader !== header) {
            rowData[normalizedHeader] = row[idx];
          }
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

  // Update a row manually
  const updateRow = useCallback((rowNumber: number, updates: Partial<ImportedAnimalRow>) => {
    setProcessedRows(prev =>
      prev.map(row =>
        row.row_number === rowNumber
          ? { ...row, ...updates, errors: [], warnings: row.warnings.filter(w => !w.includes('requiere selección')) }
          : row
      )
    );
  }, []);

  // Import animals to database - CRITICAL: existing animals are UPDATED not duplicated
  const importAnimals = useCallback(async (
    rows: ImportedAnimalRow[],
    organizationId: string
  ): Promise<ImportResult> => {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    const validRows = rows.filter(r => r.tag_id && r.errors.length === 0);

    for (const row of validRows) {
      try {
        if (row.is_update && row.matched_animal) {
          // ── UPDATE EXISTING ANIMAL ──────────────────────────────────────
          // ALWAYS update with all available data from file (don't skip if already has value)
          const updates: Record<string, unknown> = {};

          if (row.current_weight) {
            updates.current_weight = row.current_weight;
            updates.last_weight_date = new Date().toISOString().split('T')[0];
          }
          if (row.lot_name) updates.lot_name = row.lot_name;
          if (row.breed) updates.breed = row.breed;
          if (row.birth_date) updates.birth_date = row.birth_date;
          if (row.reproductive_status) updates.reproductive_status = row.reproductive_status;
          if (row.last_service_date) updates.last_service_date = row.last_service_date;
          if (row.notes) updates.notes = row.notes;
          // Update condition score in notes if not a dedicated column
          if (row.condition_score && !updates.notes) {
            updates.notes = `CC: ${row.condition_score}`;
          } else if (row.condition_score && updates.notes) {
            updates.notes = `${updates.notes} | CC: ${row.condition_score}`;
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
        } else if (!row.is_update) {
          // ── CREATE NEW ANIMAL ────────────────────────────────────────────
          if (!row.category || !row.sex) {
            result.errors.push(`Fila ${row.row_number}: Categoría o sexo no definido`);
            result.skipped++;
            continue;
          }

          const notesArr = [];
          if (row.notes) notesArr.push(row.notes);
          if (row.condition_score) notesArr.push(`CC: ${row.condition_score}`);
          if (row.age_years) notesArr.push(`Edad al importar: ${row.age_years} años`);

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
              birth_date: row.birth_date,
              reproductive_status: row.reproductive_status || 'vacia',
              last_service_date: row.last_service_date,
              notes: notesArr.length > 0 ? notesArr.join(' | ') : null,
              organization_id: organizationId,
              entry_date: new Date().toISOString().split('T')[0],
            });

          if (error) throw error;
          result.created++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        result.errors.push(`Fila ${row.row_number} (${row.tag_id}): ${errorMsg}`);
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
      if (row.age_years) lines.push(`  Edad: ${row.age_years} años`);
      if (row.reproductive_status) lines.push(`  Estado reproductivo: ${row.reproductive_status}`);
      if (row.condition_score) lines.push(`  Condición corporal: ${row.condition_score}`);
      if (row.warnings.length > 0) lines.push(`  Advertencias: ${row.warnings.join(', ')}`);
      if (row.errors.length > 0) lines.push(`  Errores: ${row.errors.join(', ')}`);
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
