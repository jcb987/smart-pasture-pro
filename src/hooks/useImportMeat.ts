import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportMeat() {
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
      .select('id, tag_id, current_weight, last_weight_date')
      .eq('organization_id', profile.organization_id);

    const animalMap = new Map((animals || []).map(a => [a.tag_id.toLowerCase(), a]));

    const recordsToInsert = [];
    const animalsToUpdate: { id: string; weight: number; date: string }[] = [];
    const errors: string[] = [];

    for (const row of data) {
      const animalTag = String(row.animal_tag || '').trim().toLowerCase();
      const animal = animalMap.get(animalTag);

      if (!animal) {
        errors.push(`Animal ${row.animal_tag} no encontrado`);
        continue;
      }

      const weightKg = Number(row.weight_kg);
      const weightDate = String(row.weight_date);

      // Calculate daily gain if there's a previous weight
      let dailyGain = null;
      if (animal.current_weight && animal.last_weight_date) {
        const daysDiff = Math.floor(
          (new Date(weightDate).getTime() - new Date(animal.last_weight_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 0) {
          dailyGain = (weightKg - animal.current_weight) / daysDiff;
        }
      }

      recordsToInsert.push({
        animal_id: animal.id,
        weight_date: weightDate,
        weight_kg: weightKg,
        weight_type: row.weight_type || 'control',
        condition_score: row.condition_score || null,
        daily_gain: dailyGain,
        notes: row.notes || null,
        organization_id: profile.organization_id,
      });

      // Track animal weight updates (use latest date)
      const existingUpdate = animalsToUpdate.find(u => u.id === animal.id);
      if (!existingUpdate || new Date(weightDate) > new Date(existingUpdate.date)) {
        if (existingUpdate) {
          animalsToUpdate.splice(animalsToUpdate.indexOf(existingUpdate), 1);
        }
        animalsToUpdate.push({ id: animal.id, weight: weightKg, date: weightDate });
      }
    }

    if (recordsToInsert.length === 0) {
      throw new Error('No hay registros válidos para importar');
    }

    // Insert weight records
    const { error: insertError } = await supabase
      .from('weight_records')
      .insert(recordsToInsert);

    if (insertError) throw insertError;

    // Update animal current weights
    for (const update of animalsToUpdate) {
      await supabase
        .from('animals')
        .update({
          current_weight: update.weight,
          last_weight_date: update.date,
        })
        .eq('id', update.id);
    }

    if (errors.length > 0) {
      toast({
        title: 'Importación parcial',
        description: `${recordsToInsert.length} importados, ${errors.length} errores`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Importación exitosa',
        description: `${recordsToInsert.length} pesajes importados`,
      });
    }
  };

  return { importData };
}
