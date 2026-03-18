import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportMeat() {
  const { toast } = useToast();

  const importData = async (data: Record<string, unknown>[]) => {
    // Get organization ID
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
      const sampleErrors = errors.slice(0, 3).join('; ');
      throw new Error(`No hay registros válidos para importar. Errores: ${sampleErrors}${errors.length > 3 ? ` (+${errors.length - 3} más)` : ''}`);
    }

    // Pre-check duplicates (animal_id + weight_date)
    const animalIds = [...new Set(recordsToInsert.map(r => r.animal_id))];
    const dates = [...new Set(recordsToInsert.map(r => r.weight_date))];
    const { data: existingRecords } = await supabase
      .from('weight_records')
      .select('animal_id, weight_date')
      .in('animal_id', animalIds)
      .in('weight_date', dates)
      .eq('organization_id', profile.organization_id);

    const existingKeys = new Set((existingRecords || []).map(r => `${r.animal_id}|${r.weight_date}`));
    const keys = recordsToInsert.map(r => `${r.animal_id}|${r.weight_date}`);
    const duplicateCount = keys.filter(k => existingKeys.has(k)).length;
    const newCount = keys.length - duplicateCount;

    // Insert weight records (upsert to handle duplicates gracefully)
    const { error: insertError } = await supabase
      .from('weight_records')
      .upsert(recordsToInsert, { onConflict: 'animal_id,weight_date' });

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

    const parts: string[] = [];
    if (newCount > 0) parts.push(`${newCount} nuevos registros`);
    if (duplicateCount > 0) parts.push(`${duplicateCount} actualizados (ya existían)`);
    if (errors.length > 0) parts.push(`${errors.length} omitidos`);

    toast({
      title: errors.length > 0 && newCount === 0 && duplicateCount === 0
        ? 'Importación con errores'
        : duplicateCount > 0 && newCount === 0
        ? 'Registros actualizados'
        : 'Importación exitosa',
      description: parts.join(', ') + (errors.length > 0 ? `. Ej: ${errors[0]}` : ''),
      variant: errors.length > 0 && newCount === 0 && duplicateCount === 0 ? 'destructive' : 'default',
    });
  };

  return { importData };
}
