import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReproductionExportRow {
  'Arete': string;
  'Nombre': string;
  'Categoría': string;
  'Estado Reproductivo': string;
  'Último Parto': string;
  'Último Servicio': string;
  'Parto Esperado': string;
  'Total Partos': number | string;
  'Último Evento': string;
  'Fecha Último Evento': string;
  'Toro / Semental': string;
  'Lote Semen': string;
  'Notas': string;
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

        const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CO') : '';
        const eventTypeLabel: Record<string, string> = {
          celo: 'Celo', servicio: 'Servicio', inseminacion: 'Inseminación',
          palpacion: 'Palpación', parto: 'Parto', aborto: 'Aborto', secado: 'Secado',
        };
        return {
          'Arete': animal.tag_id,
          'Nombre': animal.name || '',
          'Categoría': animal.category,
          'Estado Reproductivo': animal.reproductive_status || '',
          'Último Parto': fmt(animal.last_calving_date),
          'Último Servicio': fmt(animal.last_service_date),
          'Parto Esperado': fmt(animal.expected_calving_date),
          'Total Partos': animal.total_calvings ?? '',
          'Último Evento': lastEvent ? (eventTypeLabel[lastEvent.event_type] || lastEvent.event_type) : '',
          'Fecha Último Evento': fmt(lastEvent?.event_date || null),
          'Toro / Semental': lastService?.bull
            ? `${(lastService.bull as any).tag_id}${(lastService.bull as any).name ? ` - ${(lastService.bull as any).name}` : ''}`
            : lastService?.semen_batch || '',
          'Lote Semen': lastService?.semen_batch || '',
          'Notas': lastEvent?.notes || '',
        };
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);

      ws['!cols'] = [
        { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
        { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 30 },
      ];
      ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
      ws['!autofilter'] = { ref: 'A1:M1' };

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
