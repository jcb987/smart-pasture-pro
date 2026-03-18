import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MeatExportRow {
  fecha: string;
  arete: string;
  nombre: string | null;
  categoria: string | null;
  peso_kg: number;
  tipo_pesaje: string;
  ganancia_diaria_g: number | null;
  condicion_corporal: number | null;
  notas: string | null;
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

      const rows: MeatExportRow[] = (records || []).map(record => ({
        fecha: record.weight_date,
        arete: (record.animal as any)?.tag_id || '',
        nombre: (record.animal as any)?.name || null,
        categoria: (record.animal as any)?.category || null,
        peso_kg: record.weight_kg,
        tipo_pesaje: record.weight_type,
        ganancia_diaria_g: record.daily_gain ? Math.round(record.daily_gain * 1000) : null,
        condicion_corporal: record.condition_score,
        notas: record.notes,
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(rows);
      
      ws['!cols'] = [
        { wch: 12 }, // fecha
        { wch: 12 }, // arete
        { wch: 15 }, // nombre
        { wch: 12 }, // categoria
        { wch: 10 }, // peso_kg
        { wch: 14 }, // tipo_pesaje
        { wch: 16 }, // ganancia_diaria_g
        { wch: 16 }, // condicion_corporal
        { wch: 30 }, // notas
      ];

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
