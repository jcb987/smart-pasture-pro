import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportReproduction() {
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
      .select('id, tag_id')
      .eq('organization_id', profile.organization_id);

    const animalMap = new Map((animals || []).map(a => [a.tag_id.toLowerCase(), a.id]));

    const eventsToInsert = [];
    const errors: string[] = [];

    for (const row of data) {
      const animalTag = String(row.animal_tag || '').trim().toLowerCase();
      const animalId = animalMap.get(animalTag);

      if (!animalId) {
        errors.push(`Animal ${row.animal_tag} no encontrado`);
        continue;
      }

      // Lookup bull if provided
      let bullId = null;
      if (row.bull_tag) {
        const bullTag = String(row.bull_tag).trim().toLowerCase();
        bullId = animalMap.get(bullTag) || null;
      }

      eventsToInsert.push({
        animal_id: animalId,
        event_type: row.event_type,
        event_date: row.event_date,
        bull_id: bullId,
        semen_batch: row.semen_batch,
        technician: row.technician,
        pregnancy_result: row.pregnancy_result,
        notes: row.notes,
        organization_id: profile.organization_id,
      });
    }

    if (eventsToInsert.length === 0) {
      const sampleErrors = errors.slice(0, 3).join('; ');
      throw new Error(`No hay registros válidos para importar. Errores: ${sampleErrors}${errors.length > 3 ? ` (+${errors.length - 3} más)` : ''}`);
    }

    // Pre-check duplicates (animal_id + event_type + event_date)
    const animalIds = [...new Set(eventsToInsert.map(r => r.animal_id))];
    const dates = [...new Set(eventsToInsert.map(r => String(r.event_date)))];
    const { data: existingEvents } = await supabase
      .from('reproductive_events')
      .select('animal_id, event_type, event_date')
      .in('animal_id', animalIds)
      .in('event_date', dates)
      .eq('organization_id', profile.organization_id);

    const existingKeys = new Set((existingEvents || []).map(r => `${r.animal_id}|${r.event_type}|${r.event_date}`));
    const keys = eventsToInsert.map(r => `${r.animal_id}|${r.event_type}|${r.event_date}`);
    const duplicateCount = keys.filter(k => existingKeys.has(k)).length;
    const newCount = keys.length - duplicateCount;

    const { error } = await supabase
      .from('reproductive_events')
      .insert(eventsToInsert);

    if (error) throw error;

    const parts: string[] = [];
    if (newCount > 0) parts.push(`${newCount} nuevos eventos`);
    if (duplicateCount > 0) parts.push(`${duplicateCount} posibles duplicados`);
    if (errors.length > 0) parts.push(`${errors.length} omitidos`);

    toast({
      title: errors.length > 0 && newCount === 0
        ? 'Importación con errores'
        : 'Importación exitosa',
      description: parts.join(', ') + (errors.length > 0 ? `. Ej: ${errors[0]}` : ''),
      variant: errors.length > 0 && newCount === 0 ? 'destructive' : 'default',
    });
  };

  return { importData };
}
