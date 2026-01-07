import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImportReproduction() {
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
      throw new Error('No hay registros válidos para importar');
    }

    const { error } = await supabase
      .from('reproductive_events')
      .insert(eventsToInsert);

    if (error) throw error;

    if (errors.length > 0) {
      toast({
        title: 'Importación parcial',
        description: `${eventsToInsert.length} importados, ${errors.length} errores`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Importación exitosa',
        description: `${eventsToInsert.length} eventos importados`,
      });
    }
  };

  return { importData };
}
