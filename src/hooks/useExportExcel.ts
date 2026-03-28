import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ExportFilters {
  status?: 'all' | 'activo' | 'vendido' | 'muerto' | 'descartado';
  category?: string;
  lotName?: string;
  sex?: 'all' | 'macho' | 'hembra';
}

export interface ExportedAnimalRow {
  // 1️⃣ Identificación y Registro Básico
  'ID/Arete': string;
  'Nombre': string;
  'Categoría': string;
  'Raza': string;
  'Sexo': string;
  'Fecha de Nacimiento': string;
  'Edad (días)': number | string;
  'Estado': string;
  'Fecha de Estado': string;
  'Motivo de Estado': string;
  
  // 2️⃣ Control de Producción
  'Peso al Nacer (kg)': number | string;
  'Peso Actual (kg)': number | string;
  'Fecha Último Pesaje': string;
  'GDP (kg/día)': number | string;
  'Producción Leche (L/día)': number | string;
  'Etapa Productiva': string;
  
  // 3️⃣ Salud y Sanidad
  'Última Vacuna': string;
  'Fecha Última Vacuna': string;
  'Último Tratamiento': string;
  'Fecha Último Tratamiento': string;
  'Fecha Retiro': string;
  'Observaciones Sanitarias': string;
  
  // 4️⃣ Reproducción (Hembras)
  'Fecha Último Parto': string;
  'Estado Reproductivo': string;
  'Fecha Servicio/Monta': string;
  'Toro Utilizado': string;
  'Fecha Probable Parto': string;
  'Total Partos': number | string;
  
  // 5️⃣ Ubicación y Costos
  'Lote/Potrero': string;
  'Valor de Compra': number | string;
  'Gastos Alimentación': number | string;
  'Gastos Medicamentos': number | string;
  'Gastos Totales': number | string;
  'Notas': string;
}

const calculateAge = (birthDate: string | null): number | string => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-ES');
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    vaca: 'Vaca', toro: 'Toro', novilla: 'Novilla', novillo: 'Novillo',
    ternera: 'Ternera', ternero: 'Ternero', becerra: 'Becerra', becerro: 'Becerro',
    bufala: 'Búfala', bufalo: 'Búfalo',
  };
  return labels[category] || category;
};

const getProductiveStage = (category: string): string => {
  const stages: Record<string, string> = {
    vaca: 'Producción',
    toro: 'Reproductor',
    novilla: 'Recría',
    novillo: 'Engorde',
    ternera: 'Cría',
    ternero: 'Cría',
    becerra: 'Lactancia',
    becerro: 'Lactancia',
  };
  return stages[category] || '';
};

export const useExportExcel = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getOrganizationId = async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  };

  const exportToExcel = async (filters: ExportFilters = {}) => {
    try {
      setExporting(true);
      
      const orgId = await getOrganizationId();
      if (!orgId) {
        toast({ title: 'Error', description: 'No se encontró la organización', variant: 'destructive' });
        return;
      }

      // Fetch all animals with filters
      let animalsQuery = supabase
        .from('animals')
        .select('*')
        .eq('organization_id', orgId);

      if (filters.status && filters.status !== 'all') {
        animalsQuery = animalsQuery.eq('status', filters.status);
      }
      if (filters.category) {
        animalsQuery = animalsQuery.eq('category', filters.category as any);
      }
      if (filters.lotName) {
        animalsQuery = animalsQuery.eq('lot_name', filters.lotName);
      }
      if (filters.sex && filters.sex !== 'all') {
        animalsQuery = animalsQuery.eq('sex', filters.sex);
      }

      const { data: animals, error: animalsError } = await animalsQuery;
      if (animalsError) throw animalsError;

      if (!animals || animals.length === 0) {
        toast({ title: 'Sin datos', description: 'No hay animales para exportar con los filtros seleccionados', variant: 'destructive' });
        return;
      }

      const animalIds = animals.map(a => a.id);

      // Fetch related data in parallel
      const [
        { data: weightRecords },
        { data: milkRecords },
        { data: healthEvents },
        { data: vaccinations },
        { data: reproEvents },
        { data: feedConsumption },
        { data: bulls },
      ] = await Promise.all([
        supabase.from('weight_records').select('*').in('animal_id', animalIds).order('weight_date', { ascending: false }),
        supabase.from('milk_production').select('*').in('animal_id', animalIds).order('production_date', { ascending: false }),
        supabase.from('health_events').select('*').in('animal_id', animalIds).order('event_date', { ascending: false }),
        supabase.from('vaccination_schedule').select('*').in('animal_id', animalIds).eq('is_applied', true).order('applied_date', { ascending: false }),
        supabase.from('reproductive_events').select('*').in('animal_id', animalIds).order('event_date', { ascending: false }),
        supabase.from('feed_consumption').select('*').in('animal_id', animalIds),
        supabase.from('animals').select('id, tag_id, name').eq('sex', 'macho'),
      ]);

      // Build lookup maps
      const latestWeight = new Map<string, any>();
      const birthWeight = new Map<string, number>();
      const latestGDP = new Map<string, number>();
      
      weightRecords?.forEach(w => {
        if (!latestWeight.has(w.animal_id)) {
          latestWeight.set(w.animal_id, w);
        }
        if (w.weight_type === 'nacimiento') {
          birthWeight.set(w.animal_id, w.weight_kg);
        }
        if (w.daily_gain && !latestGDP.has(w.animal_id)) {
          latestGDP.set(w.animal_id, w.daily_gain);
        }
      });

      const latestMilk = new Map<string, number>();
      milkRecords?.forEach(m => {
        if (!latestMilk.has(m.animal_id)) {
          latestMilk.set(m.animal_id, m.total_liters || 0);
        }
      });

      const latestTreatment = new Map<string, any>();
      const withdrawalDates = new Map<string, string>();
      const healthNotes = new Map<string, string>();
      
      healthEvents?.forEach(h => {
        if (!latestTreatment.has(h.animal_id)) {
          latestTreatment.set(h.animal_id, h);
        }
        if (h.withdrawal_end_date && !withdrawalDates.has(h.animal_id)) {
          withdrawalDates.set(h.animal_id, h.withdrawal_end_date);
        }
        if (h.notes) {
          const existing = healthNotes.get(h.animal_id) || '';
          if (!existing.includes(h.notes)) {
            healthNotes.set(h.animal_id, existing ? `${existing}; ${h.notes}` : h.notes);
          }
        }
      });

      const latestVaccine = new Map<string, any>();
      vaccinations?.forEach(v => {
        if (!latestVaccine.has(v.animal_id || '')) {
          latestVaccine.set(v.animal_id || '', v);
        }
      });

      const latestRepro = new Map<string, any>();
      const lastService = new Map<string, any>();
      
      reproEvents?.forEach(r => {
        if (!latestRepro.has(r.animal_id)) {
          latestRepro.set(r.animal_id, r);
        }
        if ((r.event_type === 'servicio' || r.event_type === 'inseminacion') && !lastService.has(r.animal_id)) {
          lastService.set(r.animal_id, r);
        }
      });

      // Calculate feed costs per animal
      const feedCosts = new Map<string, number>();
      feedConsumption?.forEach(f => {
        if (f.animal_id) {
          const current = feedCosts.get(f.animal_id) || 0;
          feedCosts.set(f.animal_id, current + (f.cost || 0));
        }
      });

      // Calculate health costs per animal
      const healthCosts = new Map<string, number>();
      healthEvents?.forEach(h => {
        const current = healthCosts.get(h.animal_id) || 0;
        healthCosts.set(h.animal_id, current + (h.cost || 0));
      });

      // Bulls lookup
      const bullsMap = new Map<string, string>();
      bulls?.forEach(b => {
        bullsMap.set(b.id, b.name || b.tag_id);
      });

      // Build export rows
      const exportRows: ExportedAnimalRow[] = animals.map(animal => {
        const weight = latestWeight.get(animal.id);
        const milk = latestMilk.get(animal.id);
        const treatment = latestTreatment.get(animal.id);
        const vaccine = latestVaccine.get(animal.id);
        const repro = latestRepro.get(animal.id);
        const service = lastService.get(animal.id);
        const feedCost = feedCosts.get(animal.id) || 0;
        const healthCost = healthCosts.get(animal.id) || 0;
        const totalCosts = feedCost + healthCost + (animal.purchase_price || 0);

        return {
          // 1️⃣ Identificación
          'ID/Arete': animal.tag_id,
          'Nombre': animal.name || '',
          'Categoría': getCategoryLabel(animal.category),
          'Raza': animal.breed || '',
          'Sexo': animal.sex === 'macho' ? 'Macho' : 'Hembra',
          'Fecha de Nacimiento': formatDate(animal.birth_date),
          'Edad (días)': calculateAge(animal.birth_date),
          'Estado': animal.status.charAt(0).toUpperCase() + animal.status.slice(1),
          'Fecha de Estado': formatDate(animal.status_date),
          'Motivo de Estado': animal.status_reason || '',

          // 2️⃣ Producción
          'Peso al Nacer (kg)': birthWeight.get(animal.id) || '',
          'Peso Actual (kg)': animal.current_weight || '',
          'Fecha Último Pesaje': formatDate(animal.last_weight_date),
          'GDP (kg/día)': latestGDP.get(animal.id) || '',
          'Producción Leche (L/día)': milk || '',
          'Etapa Productiva': getProductiveStage(animal.category),

          // 3️⃣ Salud
          'Última Vacuna': vaccine?.vaccine_name || '',
          'Fecha Última Vacuna': formatDate(vaccine?.applied_date),
          'Último Tratamiento': treatment?.treatment || treatment?.diagnosis || '',
          'Fecha Último Tratamiento': formatDate(treatment?.event_date),
          'Fecha Retiro': formatDate(withdrawalDates.get(animal.id) || null),
          'Observaciones Sanitarias': healthNotes.get(animal.id) || '',

          // 4️⃣ Reproducción
          'Fecha Último Parto': formatDate(animal.last_calving_date),
          'Estado Reproductivo': animal.reproductive_status || '',
          'Fecha Servicio/Monta': formatDate(animal.last_service_date),
          'Toro Utilizado': service?.bull_id ? bullsMap.get(service.bull_id) || '' : '',
          'Fecha Probable Parto': formatDate(animal.expected_calving_date),
          'Total Partos': animal.total_calvings || '',

          // 5️⃣ Ubicación y Costos
          'Lote/Potrero': animal.lot_name || '',
          'Valor de Compra': animal.purchase_price || '',
          'Gastos Alimentación': feedCost || '',
          'Gastos Medicamentos': healthCost || '',
          'Gastos Totales': totalCosts || '',
          'Notas': animal.notes || '',
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);

      // Set column widths for better readability
      const colWidths = [
        { wch: 15 }, // ID/Arete
        { wch: 20 }, // Nombre
        { wch: 12 }, // Categoría
        { wch: 15 }, // Raza
        { wch: 10 }, // Sexo
        { wch: 15 }, // Fecha Nacimiento
        { wch: 12 }, // Edad
        { wch: 12 }, // Estado
        { wch: 15 }, // Fecha Estado
        { wch: 20 }, // Motivo Estado
        { wch: 15 }, // Peso Nacer
        { wch: 15 }, // Peso Actual
        { wch: 18 }, // Fecha Pesaje
        { wch: 12 }, // GDP
        { wch: 18 }, // Producción Leche
        { wch: 15 }, // Etapa Productiva
        { wch: 20 }, // Última Vacuna
        { wch: 18 }, // Fecha Vacuna
        { wch: 25 }, // Último Tratamiento
        { wch: 18 }, // Fecha Tratamiento
        { wch: 15 }, // Fecha Retiro
        { wch: 30 }, // Observaciones
        { wch: 18 }, // Fecha Parto
        { wch: 18 }, // Estado Repro
        { wch: 18 }, // Fecha Servicio
        { wch: 20 }, // Toro
        { wch: 18 }, // Fecha Prob Parto
        { wch: 12 }, // Total Partos
        { wch: 15 }, // Lote
        { wch: 15 }, // Valor Compra
        { wch: 18 }, // Gastos Alim
        { wch: 18 }, // Gastos Med
        { wch: 15 }, // Gastos Totales
        { wch: 30 }, // Notas
      ];
      ws['!cols'] = colWidths;
      ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
      ws['!autofilter'] = { ref: `A1:AH1` };

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario Ganadero');

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filterSuffix = filters.status && filters.status !== 'all' ? `_${filters.status}` : '';
      const filename = `Inventario_Ganadero_${today}${filterSuffix}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${exportRows.length} animales a ${filename}`,
      });

    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Error al exportar',
        description: error.message || 'No se pudo generar el archivo Excel',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return {
    exportToExcel,
    exporting,
  };
};
