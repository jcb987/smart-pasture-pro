import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MilkExportRow {
  fecha: string;
  arete: string;
  nombre: string | null;
  litros_manana: number | null;
  litros_tarde: number | null;
  litros_noche: number | null;
  total_litros: number | null;
  grasa_pct: number | null;
  proteina_pct: number | null;
  celulas_somaticas: number | null;
  notas: string | null;
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

      const rows: MilkExportRow[] = (records || []).map(record => ({
        fecha: record.production_date,
        arete: (record.animal as any)?.tag_id || '',
        nombre: (record.animal as any)?.name || null,
        litros_manana: record.morning_liters,
        litros_tarde: record.afternoon_liters,
        litros_noche: record.evening_liters,
        total_litros: record.total_liters,
        grasa_pct: record.fat_percentage,
        proteina_pct: record.protein_percentage,
        celulas_somaticas: record.somatic_cell_count,
        notas: record.notes,
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);
      
      ws['!cols'] = [
        { wch: 12 }, // fecha
        { wch: 12 }, // arete
        { wch: 15 }, // nombre
        { wch: 14 }, // litros_manana
        { wch: 14 }, // litros_tarde
        { wch: 14 }, // litros_noche
        { wch: 14 }, // total_litros
        { wch: 10 }, // grasa_pct
        { wch: 12 }, // proteina_pct
        { wch: 16 }, // celulas_somaticas
        { wch: 30 }, // notas
      ];

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
