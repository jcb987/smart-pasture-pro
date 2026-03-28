import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MeatExportRow {
  'Fecha': string;
  'Arete': string;
  'Nombre': string;
  'Categoría': string;
  'Peso (kg)': number;
  'Tipo de Pesaje': string;
  'Ganancia Diaria (g/día)': number | string;
  'Condición Corporal': number | string;
  'Observaciones': string;
}

export function useExportMeat() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToExcel = async () => {
    setExporting(true);
    try {
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

      // Fetch weight records with animal data
      const { data: records, error } = await supabase
        .from('weight_records')
        .select(`
          *,
          animal:animals(tag_id, name, category)
        `)
        .eq('organization_id', profile.organization_id)
        .order('weight_date', { ascending: false });

      if (error) throw error;

      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('es-CO') : d;
      const tipoLabel: Record<string, string> = {
        control: 'Control', ingreso: 'Ingreso', destete: 'Destete',
        venta: 'Venta', nacimiento: 'Nacimiento',
      };
      const rows: MeatExportRow[] = (records || []).map(record => ({
        'Fecha': fmt(record.weight_date),
        'Arete': (record.animal as any)?.tag_id || '',
        'Nombre': (record.animal as any)?.name || '',
        'Categoría': (record.animal as any)?.category || '',
        'Peso (kg)': record.weight_kg,
        'Tipo de Pesaje': tipoLabel[record.weight_type] || record.weight_type,
        'Ganancia Diaria (g/día)': record.daily_gain ? Math.round(record.daily_gain * 1000) : '',
        'Condición Corporal': record.condition_score ?? '',
        'Observaciones': record.notes || '',
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);

      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
        { wch: 11 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 30 },
      ];
      ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
      ws['!autofilter'] = { ref: 'A1:I1' };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ProduccionCarne');

      const fileName = `produccion_carne_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${rows.length} registros de pesajes`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error en exportación',
        description: 'No se pudo exportar los datos de producción de carne',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exporting };
}
