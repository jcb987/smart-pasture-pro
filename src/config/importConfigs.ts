import { ImportConfig } from '@/components/shared/SmartImportDialog';
import { supabase } from '@/integrations/supabase/client';

// Helper to find animal by tag
const findAnimalByTag = async (tag: string | undefined, organizationId: string) => {
  if (!tag) return null;
  const { data } = await supabase
    .from('animals')
    .select('id, tag_id')
    .eq('organization_id', organizationId)
    .ilike('tag_id', tag.trim())
    .maybeSingle();
  return data;
};

export const reproductionImportConfig: ImportConfig = {
  title: 'Importar Eventos Reproductivos',
  description: 'Importa eventos de reproducción como celos, servicios, palpaciones y partos desde Excel',
  tableName: 'reproductive_events',
  requiredColumns: [
    { db: 'animal_tag', labels: ['arete', 'id', 'tag_id', 'animal', 'identificacion'] },
    { db: 'event_type', labels: ['tipo', 'evento', 'type', 'tipo_evento'] },
    { db: 'event_date', labels: ['fecha', 'date', 'fecha_evento'] },
  ],
  optionalColumns: [
    { db: 'bull_tag', labels: ['toro', 'bull', 'macho', 'reproductor'] },
    { db: 'semen_batch', labels: ['lote_semen', 'semen', 'batch', 'pajilla'] },
    { db: 'technician', labels: ['tecnico', 'inseminador', 'technician'] },
    { db: 'pregnancy_result', labels: ['resultado', 'prenez', 'result'] },
    { db: 'notes', labels: ['notas', 'observaciones', 'notes', 'comentarios'] },
  ],
  templateData: [
    ['Arete', 'Tipo_Evento', 'Fecha', 'Toro', 'Lote_Semen', 'Tecnico', 'Resultado', 'Notas'],
    ['001', 'inseminacion', '2025-01-15', '', 'ABC123', 'Dr. Garcia', '', 'Primera inseminación'],
    ['002', 'palpacion', '2025-01-20', '', '', 'Dr. Lopez', 'preñada', 'Confirmada 60 días'],
    ['003', 'celo', '2025-01-10', '', '', '', '', 'Detectado 7am'],
  ],
  templateFileName: 'plantilla_reproduccion.xlsx',
  validateRow: (row, existingData) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.animal_tag) {
      errors.push('Arete es obligatorio');
    }

    if (!row.event_type) {
      errors.push('Tipo de evento es obligatorio');
    } else {
      const validTypes = ['celo', 'inseminacion', 'monta_natural', 'palpacion', 'parto', 'aborto', 'secado'];
      const normalized = String(row.event_type).toLowerCase().trim();
      if (!validTypes.some(t => normalized.includes(t))) {
        errors.push(`Tipo de evento no reconocido: ${row.event_type}`);
      }
    }

    if (!row.event_date) {
      errors.push('Fecha es obligatoria');
    }

    return { errors, warnings };
  },
  transformRow: (row, existingData, organizationId) => {
    const eventType = String(row.event_type || '').toLowerCase().trim()
      .replace('inseminación', 'inseminacion')
      .replace('palpación', 'palpacion');

    return {
      animal_tag: row.animal_tag,
      event_type: eventType,
      event_date: row.event_date,
      semen_batch: row.semen_batch || null,
      technician: row.technician || null,
      pregnancy_result: row.pregnancy_result || null,
      notes: row.notes || null,
      bull_tag: row.bull_tag || null,
      organization_id: organizationId,
    };
  },
};

export const milkImportConfig: ImportConfig = {
  title: 'Importar Producción de Leche',
  description: 'Importa registros de producción lechera desde Excel',
  tableName: 'milk_production',
  requiredColumns: [
    { db: 'animal_tag', labels: ['arete', 'id', 'tag_id', 'animal', 'vaca'] },
    { db: 'production_date', labels: ['fecha', 'date', 'dia'] },
  ],
  optionalColumns: [
    { db: 'morning_liters', labels: ['manana', 'am', 'morning', 'litros_am', 'ordeño_am'] },
    { db: 'afternoon_liters', labels: ['tarde', 'pm', 'afternoon', 'litros_pm', 'ordeño_pm'] },
    { db: 'evening_liters', labels: ['noche', 'evening', 'litros_noche'] },
    { db: 'total_liters', labels: ['total', 'litros', 'produccion', 'total_litros'] },
    { db: 'fat_percentage', labels: ['grasa', 'fat', 'porcentaje_grasa', '%grasa'] },
    { db: 'protein_percentage', labels: ['proteina', 'protein', 'porcentaje_proteina', '%proteina'] },
    { db: 'somatic_cell_count', labels: ['ccs', 'celulas', 'scc', 'celulas_somaticas'] },
    { db: 'notes', labels: ['notas', 'observaciones', 'notes'] },
  ],
  templateData: [
    ['Arete', 'Fecha', 'Litros_AM', 'Litros_PM', 'Total', 'Grasa%', 'Proteina%', 'CCS', 'Notas'],
    ['001', '2025-01-15', '12.5', '10.3', '22.8', '3.8', '3.2', '150000', ''],
    ['002', '2025-01-15', '14.0', '11.5', '25.5', '4.0', '3.4', '120000', 'Excelente producción'],
  ],
  templateFileName: 'plantilla_produccion_leche.xlsx',
  validateRow: (row, existingData) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.animal_tag) {
      errors.push('Arete es obligatorio');
    }

    if (!row.production_date) {
      errors.push('Fecha es obligatoria');
    }

    // Check that at least one production value exists
    if (!row.morning_liters && !row.afternoon_liters && !row.evening_liters && !row.total_liters) {
      errors.push('Debe incluir al menos un valor de producción');
    }

    return { errors, warnings };
  },
  transformRow: (row, existingData, organizationId) => {
    const morning = row.morning_liters ? parseFloat(String(row.morning_liters)) : null;
    const afternoon = row.afternoon_liters ? parseFloat(String(row.afternoon_liters)) : null;
    const evening = row.evening_liters ? parseFloat(String(row.evening_liters)) : null;
    let total = row.total_liters ? parseFloat(String(row.total_liters)) : null;
    
    // Calculate total if not provided
    if (!total && (morning || afternoon || evening)) {
      total = (morning || 0) + (afternoon || 0) + (evening || 0);
    }

    return {
      animal_tag: row.animal_tag,
      production_date: row.production_date,
      morning_liters: morning,
      afternoon_liters: afternoon,
      evening_liters: evening,
      total_liters: total,
      fat_percentage: row.fat_percentage ? parseFloat(String(row.fat_percentage)) : null,
      protein_percentage: row.protein_percentage ? parseFloat(String(row.protein_percentage)) : null,
      somatic_cell_count: row.somatic_cell_count ? parseInt(String(row.somatic_cell_count)) : null,
      notes: row.notes || null,
      organization_id: organizationId,
    };
  },
};

export const meatImportConfig: ImportConfig = {
  title: 'Importar Registros de Peso',
  description: 'Importa pesajes y registros de engorde desde Excel',
  tableName: 'weight_records',
  requiredColumns: [
    { db: 'animal_tag', labels: ['arete', 'id', 'tag_id', 'animal', 'identificacion'] },
    { db: 'weight_date', labels: ['fecha', 'date', 'fecha_pesaje'] },
    { db: 'weight_kg', labels: ['peso', 'weight', 'kg', 'peso_kg', 'peso_vivo', 'peso_actual'] },
  ],
  optionalColumns: [
    { db: 'weight_type', labels: ['tipo', 'type', 'tipo_pesaje', 'motivo'] },
    { db: 'condition_score', labels: ['condicion', 'cc', 'score', 'condicion_corporal'] },
    { db: 'notes', labels: ['notas', 'observaciones', 'notes', 'comentarios'] },
  ],
  templateData: [
    ['Arete', 'Fecha', 'Peso_Kg', 'Tipo_Pesaje', 'Condicion_Corporal', 'Notas'],
    ['001', '2025-01-15', '350', 'control', '3.5', ''],
    ['002', '2025-01-15', '420', 'control', '4.0', 'Buen estado'],
    ['003', '2025-01-15', '280', 'ingreso', '3.0', 'Nuevo animal'],
  ],
  templateFileName: 'plantilla_produccion_carne.xlsx',
  validateRow: (row, existingData) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.animal_tag) {
      errors.push('Arete es obligatorio');
    }

    if (!row.weight_date) {
      errors.push('Fecha es obligatoria');
    }

    if (!row.weight_kg) {
      errors.push('Peso es obligatorio');
    } else {
      const weight = parseFloat(String(row.weight_kg));
      if (isNaN(weight) || weight <= 0) {
        errors.push('Peso debe ser un número positivo');
      } else if (weight > 1500) {
        warnings.push('Peso inusualmente alto (>1500 kg)');
      }
    }

    return { errors, warnings };
  },
  transformRow: (row, existingData, organizationId) => {
    return {
      animal_tag: row.animal_tag,
      weight_date: row.weight_date,
      weight_kg: parseFloat(String(row.weight_kg)),
      weight_type: row.weight_type || 'control',
      condition_score: row.condition_score ? parseFloat(String(row.condition_score)) : null,
      notes: row.notes || null,
      organization_id: organizationId,
    };
  },
};
