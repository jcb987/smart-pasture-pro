import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportMilk() {
  const { toast } = useToast();

  const importData = async (data: Record<string, unknown>[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error('No organization found');
    }

    // Get all animals for tag lookup
    const { data: animals } = await supabase
      .from('animals')
      .select('id, tag_id')
      .eq('organization_id', profile.organization_id);

    const normalizeTag = (tag: string) =>
      tag.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/^0+/, '');

    const animalMap = new Map<string, string>();
    for (const a of animals || []) {
      animalMap.set(a.tag_id.toLowerCase().trim(), a.id);
      animalMap.set(normalizeTag(a.tag_id), a.id);
    }

    const recordsToInsert = [];
    const errors: string[] = [];

    for (const row of data) {
      const animalTag = String(row.animal_tag || '').trim().toLowerCase();
      
      if (!animalTag) {
        errors.push('Fila sin arete');
        continue;
      }

      const animalId = animalMap.get(animalTag) ?? animalMap.get(normalizeTag(animalTag));

      if (!animalId) {
        errors.push(`Animal "${row.animal_tag}" no encontrado en el sistema`);
        continue;
      }

      if (!row.production_date) {
        errors.push(`Animal "${row.animal_tag}" sin fecha`);
        continue;
      }

      // Parse numeric values safely
      const parseNum = (v: unknown): number | null => {
        if (v === null || v === undefined || v === '') return null;
        const n = parseFloat(String(v));
        return isNaN(n) ? null : n;
      };

      const morning = parseNum(row.morning_liters);
      const afternoon = parseNum(row.afternoon_liters);
      const evening = parseNum(row.evening_liters);
      const totalOnly = parseNum(row.total_liters);

      // Skip rows with no production data at all
      if (morning === null && afternoon === null && evening === null && totalOnly === null) {
        errors.push(`Animal "${row.animal_tag}" fecha ${row.production_date} sin datos de producción`);
        continue;
      }

      // Pivot table images only provide total_liters — store as morning_liters so data is not lost
      const effectiveMorning = morning ?? (afternoon === null && evening === null ? totalOnly : null);
      const total = totalOnly ?? ((morning ?? 0) + (afternoon ?? 0) + (evening ?? 0));

      recordsToInsert.push({
        animal_id: animalId,
        production_date: row.production_date,
        morning_liters: effectiveMorning,
        afternoon_liters: afternoon,
        evening_liters: evening,
        total_liters: total,
        fat_percentage: parseNum(row.fat_percentage),
        protein_percentage: parseNum(row.protein_percentage),
        somatic_cell_count: row.somatic_cell_count ? parseInt(String(row.somatic_cell_count)) : null,
        notes: row.notes ? String(row.notes) : null,
        organization_id: profile.organization_id,
      });
    }

    if (recordsToInsert.length === 0) {
      const sampleErrors = errors.slice(0, 5).join('; ');
      throw new Error(`No hay registros válidos para importar. Errores: ${sampleErrors}${errors.length > 5 ? ` (+${errors.length - 5} más)` : ''}`);
    }

    // Insert in batches of 50 to avoid timeouts
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      const { error, data: inserted } = await supabase
        .from('milk_production')
        .upsert(batch, { onConflict: 'animal_id,production_date', ignoreDuplicates: true })
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        throw new Error(`Error al insertar lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
      totalInserted += inserted?.length || batch.length;
    }

    if (errors.length > 0) {
      toast({
        title: 'Importación parcial',
        description: `${totalInserted} importados, ${errors.length} omitidos (ej: ${errors[0]})`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Importación exitosa',
        description: `${totalInserted} registros de leche importados`,
      });
    }
  };

  return { importData };
}
