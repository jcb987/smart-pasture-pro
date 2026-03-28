import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MilkExportRow {
  'Fecha': string;
  'Arete': string;
  'Nombre': string;
  'Litros Mañana': number | string;
  'Litros Tarde': number | string;
  'Litros Noche': number | string;
  'Total Litros': number | string;
  'Grasa %': number | string;
  'Proteína %': number | string;
  'Células Somáticas': number | string;
  'Observaciones': string;
}

export function useExportMilk() {
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

      // Fetch milk production records with animal data
      const { data: records, error } = await supabase
        .from('milk_production')
        .select(`
          *,
          animal:animals(tag_id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('production_date', { ascending: false });

      if (error) throw error;

      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('es-CO') : d;
      const rows: MilkExportRow[] = (records || []).map(record => ({
        'Fecha': fmt(record.production_date),
        'Arete': (record.animal as any)?.tag_id || '',
        'Nombre': (record.animal as any)?.name || '',
        'Litros Mañana': record.morning_liters ?? '',
        'Litros Tarde': record.afternoon_liters ?? '',
        'Litros Noche': record.evening_liters ?? '',
        'Total Litros': record.total_liters ?? '',
        'Grasa %': record.fat_percentage ?? '',
        'Proteína %': record.protein_percentage ?? '',
        'Células Somáticas': record.somatic_cell_count ?? '',
        'Observaciones': record.notes || '',
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);

      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
        { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 10 },
        { wch: 12 }, { wch: 18 }, { wch: 30 },
      ];
      ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
      ws['!autofilter'] = { ref: 'A1:K1' };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ProduccionLeche');

      const fileName = `produccion_leche_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${rows.length} registros de producción de leche`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error en exportación',
        description: 'No se pudo exportar los datos de producción de leche',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exporting };
}
