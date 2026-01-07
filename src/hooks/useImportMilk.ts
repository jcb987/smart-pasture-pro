import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportMilk() {
  const { toast } = useToast();

  const importData = async (data: Record<string, unknown>[]) => {
    // Get organization ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .single();

    if (!profile?.organization_id) {
      throw new Error('No organization found');
    }

    // Get all animals for tag lookup
    const { data: animals } = await supabase
      .from('animals')
      .select('id, tag_id')
      .eq('organization_id', profile.organization_id);

    const animalMap = new Map((animals || []).map(a => [a.tag_id.toLowerCase(), a.id]));

    const recordsToInsert = [];
    const errors: string[] = [];

    for (const row of data) {
      const animalTag = String(row.animal_tag || '').trim().toLowerCase();
      const animalId = animalMap.get(animalTag);

      if (!animalId) {
        errors.push(`Animal ${row.animal_tag} no encontrado`);
        continue;
      }

      recordsToInsert.push({
        animal_id: animalId,
        production_date: row.production_date,
        morning_liters: row.morning_liters,
        afternoon_liters: row.afternoon_liters,
        evening_liters: row.evening_liters,
        total_liters: row.total_liters,
        fat_percentage: row.fat_percentage,
        protein_percentage: row.protein_percentage,
        somatic_cell_count: row.somatic_cell_count,
        notes: row.notes,
        organization_id: profile.organization_id,
      });
    }

    if (recordsToInsert.length === 0) {
      throw new Error('No hay registros válidos para importar');
    }

    const { error } = await supabase
      .from('milk_production')
      .insert(recordsToInsert);

    if (error) throw error;

    if (errors.length > 0) {
      toast({
        title: 'Importación parcial',
        description: `${recordsToInsert.length} importados, ${errors.length} errores`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Importación exitosa',
        description: `${recordsToInsert.length} registros de leche importados`,
      });
    }
  };

  return { importData };
}
