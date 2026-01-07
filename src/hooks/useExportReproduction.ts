import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReproductionExportRow {
  arete: string;
  nombre: string | null;
  categoria: string;
  estado_reproductivo: string | null;
  fecha_ultimo_parto: string | null;
  fecha_ultimo_servicio: string | null;
  fecha_parto_esperado: string | null;
  total_partos: number | null;
  ultimo_evento_tipo: string | null;
  ultimo_evento_fecha: string | null;
  toro_servicio: string | null;
  lote_semen: string | null;
  notas: string | null;
}

export function useExportReproduction() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      // Fetch females with reproductive data
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('sex', 'hembra')
        .in('category', ['vaca', 'novilla', 'bufala'])
        .eq('status', 'activo');

      if (animalsError) throw animalsError;

      // Fetch reproductive events
      const { data: events } = await supabase
        .from('reproductive_events')
        .select('*, bull:animals!reproductive_events_bull_id_fkey(tag_id, name)')
        .eq('organization_id', profile.organization_id)
        .order('event_date', { ascending: false });

      const rows: ReproductionExportRow[] = (animals || []).map(animal => {
        const animalEvents = (events || []).filter(e => e.animal_id === animal.id);
        const lastEvent = animalEvents[0];
        const lastService = animalEvents.find(e => 
          e.event_type === 'inseminacion' || e.event_type === 'monta_natural'
        );

        return {
          arete: animal.tag_id,
          nombre: animal.name,
          categoria: animal.category,
          estado_reproductivo: animal.reproductive_status,
          fecha_ultimo_parto: animal.last_calving_date,
          fecha_ultimo_servicio: animal.last_service_date,
          fecha_parto_esperado: animal.expected_calving_date,
          total_partos: animal.total_calvings,
          ultimo_evento_tipo: lastEvent?.event_type || null,
          ultimo_evento_fecha: lastEvent?.event_date || null,
          toro_servicio: lastService?.bull 
            ? `${(lastService.bull as any).tag_id}${(lastService.bull as any).name ? ` - ${(lastService.bull as any).name}` : ''}`
            : lastService?.semen_batch || null,
          lote_semen: lastService?.semen_batch || null,
          notas: lastEvent?.notes || null,
        };
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // arete
        { wch: 15 }, // nombre
        { wch: 12 }, // categoria
        { wch: 18 }, // estado_reproductivo
        { wch: 18 }, // fecha_ultimo_parto
        { wch: 20 }, // fecha_ultimo_servicio
        { wch: 18 }, // fecha_parto_esperado
        { wch: 12 }, // total_partos
        { wch: 18 }, // ultimo_evento_tipo
        { wch: 18 }, // ultimo_evento_fecha
        { wch: 20 }, // toro_servicio
        { wch: 15 }, // lote_semen
        { wch: 30 }, // notas
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reproduccion');

      const fileName = `reproduccion_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${rows.length} registros reproductivos`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error en exportación',
        description: 'No se pudo exportar los datos reproductivos',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exporting };
}
