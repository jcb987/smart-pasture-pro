import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type ReportType = 'produccion_leche' | 'produccion_carne' | 'reproduccion' | 'salud' | 'inventario' | 'costos' | 'alimentacion' | 'terneros' | 'integral';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  status?: string;
  lotName?: string;
}

export interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: string;
  category: 'produccion' | 'reproduccion' | 'salud' | 'economico';
}

export interface ReportSection {
  title: string;
  summary: Record<string, string | number>;
  headers: string[];
  rows: (string | number)[][];
}

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: Record<string, string | number>;
  headers: string[];
  rows: (string | number)[][];
  chartData?: { label: string; value: number }[];
  topProducers?: { name: string; total: string; avg: string }[];
  sections?: ReportSection[];
}

export const REPORT_CONFIGS: ReportConfig[] = [
  {
    id: 'produccion_leche',
    name: 'Producción de Leche',
    description: 'Resumen de producción láctea por período',
    icon: 'milk',
    category: 'produccion',
  },
  {
    id: 'produccion_carne',
    name: 'Producción de Carne',
    description: 'Análisis de ganancia de peso y engorde',
    icon: 'beef',
    category: 'produccion',
  },
  {
    id: 'reproduccion',
    name: 'Reproducción',
    description: 'Estado reproductivo y eventos del hato',
    icon: 'baby',
    category: 'reproduccion',
  },
  {
    id: 'salud',
    name: 'Sanidad',
    description: 'Tratamientos, vacunaciones y alertas',
    icon: 'heart-pulse',
    category: 'salud',
  },
  {
    id: 'inventario',
    name: 'Inventario de Animales',
    description: 'Listado completo del hato con detalles',
    icon: 'clipboard-list',
    category: 'produccion',
  },
  {
    id: 'costos',
    name: 'Análisis de Costos',
    description: 'Gastos en alimentación, salud y operación',
    icon: 'dollar-sign',
    category: 'economico',
  },
  {
    id: 'alimentacion',
    name: 'Alimentación',
    description: 'Consumo de alimento e inventario',
    icon: 'wheat',
    category: 'economico',
  },
  {
    id: 'terneros',
    name: 'Terneros y Cría',
    description: 'Estado de terneros, alertas de calostro y destete',
    icon: 'baby',
    category: 'produccion',
  },
  {
    id: 'integral',
    name: 'Informe Integral del Predio',
    description: 'Resumen ejecutivo completo — todos los módulos en un documento',
    icon: 'file-text',
    category: 'economico',
  },
];

const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-ES');
};

const formatNumber = (num: number | null, decimals = 2): string => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatCurrency = (num: number | null): string => {
  if (num === null || num === undefined) return '-';
  return `$${num.toLocaleString('es-ES')}`;
};

export const useReports = () => {
  const [loading, setLoading] = useState(false);
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

  const generateReport = async (reportType: ReportType, filters: ReportFilters): Promise<ReportData | null> => {
    try {
      setLoading(true);
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error('Organización no encontrada');

      const today = new Date().toISOString().split('T')[0];
      const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.dateTo || today;

      let reportData: ReportData;

      switch (reportType) {
        case 'produccion_leche':
          reportData = await generateMilkReport(orgId, dateFrom, dateTo);
          break;
        case 'produccion_carne':
          reportData = await generateMeatReport(orgId, dateFrom, dateTo);
          break;
        case 'reproduccion':
          reportData = await generateReproductionReport(orgId, dateFrom, dateTo);
          break;
        case 'salud':
          reportData = await generateHealthReport(orgId, dateFrom, dateTo, filters);
          break;
        case 'inventario':
          reportData = await generateInventoryReport(orgId, filters);
          break;
        case 'costos':
          reportData = await generateCostReport(orgId, dateFrom, dateTo);
          break;
        case 'alimentacion':
          reportData = await generateFeedingReport(orgId, dateFrom, dateTo);
          break;
        case 'terneros':
          reportData = await generateTernerosReport(orgId, dateFrom, dateTo);
          break;
        case 'integral':
          reportData = await generateIntegralReport(orgId, dateFrom, dateTo);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      return { ...reportData, filters };
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo generar el reporte',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate Milk Production Report
  const generateMilkReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const { data: records } = await supabase
      .from('milk_production')
      .select('*, animal:animals(tag_id, name)')
      .gte('production_date', dateFrom)
      .lte('production_date', dateTo)
      .order('production_date', { ascending: false });

    const totalLiters = records?.reduce((sum, r) => sum + (r.total_liters || 0), 0) || 0;
    const uniqueCows = new Set(records?.map(r => r.animal_id)).size;
    const avgPerCow = uniqueCows > 0 ? totalLiters / uniqueCows : 0;
    const avgFat = records?.filter(r => r.fat_percentage).reduce((sum, r) => sum + (r.fat_percentage || 0), 0) / (records?.filter(r => r.fat_percentage).length || 1);
    const avgProtein = records?.filter(r => r.protein_percentage).reduce((sum, r) => sum + (r.protein_percentage || 0), 0) / (records?.filter(r => r.protein_percentage).length || 1);

    // Calculate top producers
    const animalMap = new Map<string, { total: number; count: number; name: string }>();
    records?.forEach(r => {
      const existing = animalMap.get(r.animal_id);
      const animalName = r.animal?.name || r.animal?.tag_id || '-';
      if (existing) {
        existing.total += r.total_liters || 0;
        existing.count += 1;
      } else {
        animalMap.set(r.animal_id, { total: r.total_liters || 0, count: 1, name: animalName });
      }
    });
    const topProducers = Array.from(animalMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        total: formatNumber(p.total, 1),
        avg: formatNumber(p.count > 0 ? p.total / p.count : 0, 1),
      }));

    return {
      title: 'Reporte de Producción de Leche',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Total Litros': formatNumber(totalLiters, 0),
        'Vacas en Ordeño': uniqueCows,
        'Promedio por Vaca': formatNumber(avgPerCow, 1) + ' L',
        'Grasa Promedio': formatNumber(avgFat, 2) + '%',
        'Proteína Promedio': formatNumber(avgProtein, 2) + '%',
        'Registros': records?.length || 0,
      },
      headers: ['Fecha', 'Animal', 'Mañana (L)', 'Tarde (L)', 'Noche (L)', 'Total (L)', 'Grasa %', 'Proteína %'],
      rows: records?.map(r => [
        formatDate(r.production_date),
        r.animal?.name || r.animal?.tag_id || '-',
        formatNumber(r.morning_liters || 0, 1),
        formatNumber(r.afternoon_liters || 0, 1),
        formatNumber(r.evening_liters || 0, 1),
        formatNumber(r.total_liters || 0, 1),
        r.fat_percentage ? formatNumber(r.fat_percentage, 2) : '-',
        r.protein_percentage ? formatNumber(r.protein_percentage, 2) : '-',
      ]) || [],
      chartData: aggregateByDate(records || [], 'production_date', 'total_liters'),
      topProducers,
    };
  };

  // Generate Meat Production Report
  const generateMeatReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const { data: records } = await supabase
      .from('weight_records')
      .select('*, animal:animals(tag_id, name, category)')
      .gte('weight_date', dateFrom)
      .lte('weight_date', dateTo)
      .order('weight_date', { ascending: false });

    const totalWeight = records?.reduce((sum, r) => sum + (r.weight_kg || 0), 0) || 0;
    const avgWeight = records?.length ? totalWeight / records.length : 0;
    const avgDailyGain = records?.filter(r => r.daily_gain).reduce((sum, r) => sum + (r.daily_gain || 0), 0) / (records?.filter(r => r.daily_gain).length || 1);
    const uniqueAnimals = new Set(records?.map(r => r.animal_id)).size;

    return {
      title: 'Reporte de Producción de Carne',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Animales Pesados': uniqueAnimals,
        'Peso Promedio': formatNumber(avgWeight, 1) + ' kg',
        'GDP Promedio': formatNumber(avgDailyGain, 3) + ' kg/día',
        'Registros': records?.length || 0,
      },
      headers: ['Fecha', 'Animal', 'Categoría', 'Peso (kg)', 'GDP (kg/día)', 'Condición', 'Notas'],
      rows: records?.map(r => [
        formatDate(r.weight_date),
        r.animal?.name || r.animal?.tag_id || '-',
        r.animal?.category || '-',
        formatNumber(r.weight_kg, 1),
        r.daily_gain ? formatNumber(r.daily_gain, 3) : '-',
        r.condition_score ? formatNumber(r.condition_score, 1) : '-',
        r.notes || '-',
      ]) || [],
      chartData: aggregateByDate(records || [], 'weight_date', 'weight_kg'),
    };
  };

  // Generate Reproduction Report
  const generateReproductionReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const { data: events } = await supabase
      .from('reproductive_events')
      .select('*, animal:animals!reproductive_events_animal_id_fkey(tag_id, name)')
      .gte('event_date', dateFrom)
      .lte('event_date', dateTo)
      .order('event_date', { ascending: false });

    const { data: females } = await supabase
      .from('animals')
      .select('*')
      .eq('sex', 'hembra')
      .eq('status', 'activo');

    const pregnantCount = females?.filter(f => f.reproductive_status === 'preñada').length || 0;
    const servicedCount = events?.filter(e => e.event_type === 'servicio' || e.event_type === 'inseminacion').length || 0;
    const birthsCount = events?.filter(e => e.event_type === 'parto').length || 0;
    const pregnancyRate = servicedCount > 0 ? (pregnantCount / servicedCount) * 100 : 0;

    return {
      title: 'Reporte de Reproducción',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Hembras Activas': females?.length || 0,
        'Preñadas': pregnantCount,
        'Servicios/Inseminaciones': servicedCount,
        'Partos': birthsCount,
        'Tasa de Preñez': formatNumber(pregnancyRate, 1) + '%',
      },
      headers: ['Fecha', 'Animal', 'Evento', 'Lote Semen', 'Resultado', 'Fecha Prob. Parto', 'Notas'],
      rows: events?.map(e => [
        formatDate(e.event_date),
        (e.animal as any)?.name || (e.animal as any)?.tag_id || '-',
        e.event_type,
        e.semen_batch || '-',
        e.pregnancy_result || '-',
        formatDate(e.expected_birth_date),
        e.notes || '-',
      ]) || [],
    };
  };

  // Generate Health Report
  const generateHealthReport = async (orgId: string, dateFrom: string, dateTo: string, filters: ReportFilters): Promise<ReportData> => {
    const { data: events } = await supabase
      .from('health_events')
      .select('*, animal:animals(tag_id, name)')
      .gte('event_date', dateFrom)
      .lte('event_date', dateTo)
      .order('event_date', { ascending: false });

    const { data: vaccinations } = await supabase
      .from('vaccination_schedule')
      .select('*, animal:animals(tag_id, name)')
      .gte('scheduled_date', dateFrom)
      .lte('scheduled_date', dateTo);

    const treatmentCount = events?.filter(e => e.event_type === 'tratamiento').length || 0;
    const activeCount = events?.filter(e => e.status === 'activo').length || 0;
    const totalCost = events?.reduce((sum, e) => sum + (e.cost || 0), 0) || 0;
    const appliedVaccines = vaccinations?.filter(v => v.is_applied).length || 0;

    return {
      title: 'Reporte de Sanidad',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Eventos de Salud': events?.length || 0,
        'Tratamientos Activos': activeCount,
        'Vacunas Aplicadas': appliedVaccines,
        'Costo Total': formatCurrency(totalCost),
      },
      headers: ['Fecha', 'Animal', 'Tipo', 'Diagnóstico', 'Tratamiento', 'Medicamento', 'Estado', 'Costo'],
      rows: events?.map(e => [
        formatDate(e.event_date),
        e.animal?.name || e.animal?.tag_id || '-',
        e.event_type,
        e.diagnosis || '-',
        e.treatment || '-',
        e.medication || '-',
        e.status || '-',
        e.cost ? formatCurrency(e.cost) : '-',
      ]) || [],
    };
  };

  // Generate Inventory Report
  const generateInventoryReport = async (orgId: string, filters: ReportFilters): Promise<ReportData> => {
    let query = supabase.from('animals').select('*').eq('status', 'activo');
    
    if (filters.category) {
      query = query.eq('category', filters.category as any);
    }
    if (filters.lotName) {
      query = query.eq('lot_name', filters.lotName);
    }

    const { data: animals } = await query.order('tag_id');

    const byCategory: Record<string, number> = {};
    animals?.forEach(a => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    });

    return {
      title: 'Inventario de Animales',
      subtitle: `Generado: ${formatDate(new Date().toISOString())}`,
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        'Total Animales': animals?.length || 0,
        'Hembras': animals?.filter(a => a.sex === 'hembra').length || 0,
        'Machos': animals?.filter(a => a.sex === 'macho').length || 0,
        ...byCategory,
      },
      headers: ['Arete', 'Nombre', 'Categoría', 'Sexo', 'Raza', 'Nacimiento', 'Peso Actual', 'Lote', 'Estado Repro.'],
      rows: animals?.map(a => [
        a.tag_id,
        a.name || '-',
        a.category,
        a.sex === 'macho' ? 'Macho' : 'Hembra',
        a.breed || '-',
        formatDate(a.birth_date),
        a.current_weight ? formatNumber(a.current_weight, 1) + ' kg' : '-',
        a.lot_name || '-',
        a.reproductive_status || '-',
      ]) || [],
      chartData: Object.entries(byCategory).map(([label, value]) => ({ label, value })),
    };
  };

  // Generate Cost Report
  const generateCostReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const [{ data: feedConsumption }, { data: healthEvents }] = await Promise.all([
      supabase.from('feed_consumption').select('*').gte('consumption_date', dateFrom).lte('consumption_date', dateTo),
      supabase.from('health_events').select('*').gte('event_date', dateFrom).lte('event_date', dateTo),
    ]);

    const feedCost = feedConsumption?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;
    const healthCost = healthEvents?.reduce((sum, e) => sum + (e.cost || 0), 0) || 0;
    const totalCost = feedCost + healthCost;

    const costByCategory = [
      { category: 'Alimentación', cost: feedCost },
      { category: 'Salud/Medicamentos', cost: healthCost },
    ];

    return {
      title: 'Análisis de Costos',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Costo Total': formatCurrency(totalCost),
        'Alimentación': formatCurrency(feedCost),
        'Salud': formatCurrency(healthCost),
        '% Alimentación': formatNumber((feedCost / totalCost) * 100 || 0, 1) + '%',
        '% Salud': formatNumber((healthCost / totalCost) * 100 || 0, 1) + '%',
      },
      headers: ['Categoría', 'Costo Total', 'Porcentaje'],
      rows: costByCategory.map(c => [
        c.category,
        formatCurrency(c.cost),
        formatNumber((c.cost / totalCost) * 100 || 0, 1) + '%',
      ]),
      chartData: costByCategory.map(c => ({ label: c.category, value: c.cost })),
    };
  };

  // Generate Feeding Report
  const generateFeedingReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const [{ data: consumption }, { data: inventory }] = await Promise.all([
      supabase.from('feed_consumption').select('*, feed:feed_inventory(name, category)').gte('consumption_date', dateFrom).lte('consumption_date', dateTo),
      supabase.from('feed_inventory').select('*'),
    ]);

    const totalKg = consumption?.reduce((sum, c) => sum + (c.quantity_kg || 0), 0) || 0;
    const totalCost = consumption?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;
    const lowStock = inventory?.filter(i => (i.current_stock || 0) <= (i.min_stock || 0)).length || 0;

    return {
      title: 'Reporte de Alimentación',
      subtitle: `Período: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`,
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Consumo Total': formatNumber(totalKg, 0) + ' kg',
        'Costo Total': formatCurrency(totalCost),
        'Items en Inventario': inventory?.length || 0,
        'Items con Stock Bajo': lowStock,
      },
      headers: ['Fecha', 'Alimento', 'Categoría', 'Cantidad (kg)', 'Costo', 'Lote/Animal'],
      rows: consumption?.map(c => [
        formatDate(c.consumption_date),
        c.feed?.name || '-',
        c.feed?.category || '-',
        formatNumber(c.quantity_kg, 1),
        c.cost ? formatCurrency(c.cost) : '-',
        c.lot_name || c.animal_id || '-',
      ]) || [],
      chartData: aggregateByDate(consumption || [], 'consumption_date', 'quantity_kg'),
    };
  };

  // Generate Terneros Report
  const generateTernerosReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const { data: calves } = await supabase
      .from('animals')
      .select('*')
      .in('category', ['ternero', 'ternera', 'becerro', 'becerra'])
      .eq('status', 'activo')
      .order('birth_date', { ascending: false });

    const today = new Date();
    const calvesMapped = (calves || []).map(c => {
      const days = c.birth_date
        ? Math.floor((today.getTime() - new Date(c.birth_date).getTime()) / 86400000)
        : null;
      return { ...c, daysOld: days };
    });

    const colostrumAlert = calvesMapped.filter(c => c.daysOld !== null && c.daysOld <= 3).length;
    const weaningAlert = calvesMapped.filter(c => c.daysOld !== null && c.daysOld >= 60 && c.daysOld <= 120).length;
    const avgDays = calvesMapped.filter(c => c.daysOld !== null).reduce((s, c) => s + (c.daysOld || 0), 0) / (calvesMapped.filter(c => c.daysOld !== null).length || 1);

    const ageBuckets: Record<string, number> = { '0-30 días': 0, '31-60 días': 0, '61-90 días': 0, '91-120 días': 0, '>120 días': 0 };
    calvesMapped.forEach(c => {
      if (c.daysOld === null) return;
      if (c.daysOld <= 30) ageBuckets['0-30 días']++;
      else if (c.daysOld <= 60) ageBuckets['31-60 días']++;
      else if (c.daysOld <= 90) ageBuckets['61-90 días']++;
      else if (c.daysOld <= 120) ageBuckets['91-120 días']++;
      else ageBuckets['>120 días']++;
    });

    return {
      title: 'Reporte de Terneros y Cría',
      subtitle: `Generado: ${formatDate(today.toISOString())}`,
      generatedAt: today.toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Total Terneros': calvesMapped.length,
        'Alertas Calostro (≤3 días)': colostrumAlert,
        'Próximos a Destetar (60-120 días)': weaningAlert,
        'Promedio Días de Vida': formatNumber(avgDays, 0),
      },
      headers: ['Arete', 'Nombre', 'Categoría', 'Sexo', 'Fecha Nac.', 'Días de Vida', 'Peso Nac. (kg)', 'Peso Actual (kg)', 'Lote'],
      rows: calvesMapped.map(c => [
        c.tag_id,
        c.name || '-',
        c.category,
        c.sex === 'macho' ? 'Macho' : 'Hembra',
        formatDate(c.birth_date),
        c.daysOld !== null ? c.daysOld : '-',
        c.birth_weight ? formatNumber(c.birth_weight, 1) : '-',
        c.current_weight ? formatNumber(c.current_weight, 1) : '-',
        c.lot_name || '-',
      ]),
      chartData: Object.entries(ageBuckets).map(([label, value]) => ({ label, value })),
    };
  };

  // Generate Integral (Comprehensive Farm) Report
  const generateIntegralReport = async (orgId: string, dateFrom: string, dateTo: string): Promise<ReportData> => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];

    const [
      { data: animals },
      { data: milkRecords },
      { data: weightRecords },
      { data: reproEvents },
      { data: females },
      { data: healthEvents },
      { data: vaccinations },
      { data: feedConsumption },
    ] = await Promise.all([
      supabase.from('animals').select('*').eq('status', 'activo'),
      supabase.from('milk_production').select('animal_id, total_liters, fat_percentage, protein_percentage, production_date').gte('production_date', thirtyDaysAgo),
      supabase.from('weight_records').select('animal_id, weight_kg, daily_gain, weight_date').gte('weight_date', dateFrom).lte('weight_date', dateTo),
      supabase.from('reproductive_events').select('event_type, event_date, animal_id').gte('event_date', dateFrom).lte('event_date', dateTo),
      supabase.from('animals').select('reproductive_status').eq('sex', 'hembra').eq('status', 'activo'),
      supabase.from('health_events').select('event_type, status, cost, event_date').gte('event_date', dateFrom).lte('event_date', dateTo),
      supabase.from('vaccination_schedule').select('is_applied, scheduled_date').gte('scheduled_date', dateFrom).lte('scheduled_date', dateTo),
      supabase.from('feed_consumption').select('quantity_kg, cost, consumption_date').gte('consumption_date', dateFrom).lte('consumption_date', dateTo),
    ]);

    // --- Inventory ---
    const totalAnimals = animals?.length || 0;
    const hembras = animals?.filter(a => a.sex === 'hembra').length || 0;
    const machos = animals?.filter(a => a.sex === 'macho').length || 0;
    const byCategory: Record<string, number> = {};
    animals?.forEach(a => { byCategory[a.category] = (byCategory[a.category] || 0) + 1; });

    // --- Milk ---
    const totalLiters = milkRecords?.reduce((s, r) => s + (r.total_liters || 0), 0) || 0;
    const milkCows = new Set(milkRecords?.map(r => r.animal_id)).size;
    const avgLitersPerCow = milkCows > 0 ? totalLiters / milkCows : 0;

    // --- Weight ---
    const avgWeight = weightRecords?.length
      ? weightRecords.reduce((s, r) => s + (r.weight_kg || 0), 0) / weightRecords.length
      : 0;
    const avgGDP = weightRecords?.filter(r => r.daily_gain).length
      ? weightRecords!.filter(r => r.daily_gain).reduce((s, r) => s + (r.daily_gain || 0), 0) / weightRecords!.filter(r => r.daily_gain).length
      : 0;

    // --- Reproduction ---
    const pregnantCount = females?.filter(f => f.reproductive_status === 'preñada').length || 0;
    const servicedCount = reproEvents?.filter(e => e.event_type === 'servicio' || e.event_type === 'inseminacion').length || 0;
    const birthsCount = reproEvents?.filter(e => e.event_type === 'parto').length || 0;
    const pregnancyRate = (females?.length || 0) > 0 ? (pregnantCount / (females?.length || 1)) * 100 : 0;

    // --- Health ---
    const activeHealth = healthEvents?.filter(e => e.status === 'activo').length || 0;
    const healthCost = healthEvents?.reduce((s, e) => s + (e.cost || 0), 0) || 0;
    const appliedVaccines = vaccinations?.filter(v => v.is_applied).length || 0;
    const pendingVaccines = vaccinations?.filter(v => !v.is_applied).length || 0;

    // --- Costs ---
    const feedCost = feedConsumption?.reduce((s, c) => s + (c.cost || 0), 0) || 0;
    const totalCost = feedCost + healthCost;

    // --- Terneros ---
    const calves = animals?.filter(a => ['ternero', 'ternera', 'becerro', 'becerra'].includes(a.category)) || [];
    const colostrumNeeded = calves.filter(c => {
      if (!c.birth_date) return false;
      const days = Math.floor((today.getTime() - new Date(c.birth_date).getTime()) / 86400000);
      return days <= 3;
    }).length;

    const sections: ReportSection[] = [
      {
        title: 'Inventario del Hato',
        summary: { 'Total Animales': totalAnimals, Hembras: hembras, Machos: machos, ...byCategory },
        headers: ['Categoría', 'Cantidad', '% del Hato'],
        rows: Object.entries(byCategory).map(([cat, cnt]) => [
          cat,
          cnt,
          formatNumber((cnt / totalAnimals) * 100, 1) + '%',
        ]),
      },
      {
        title: 'Producción de Leche (últimos 30 días)',
        summary: {
          'Total Litros': formatNumber(totalLiters, 0),
          'Vacas en Ordeño': milkCows,
          'Promedio/Vaca': formatNumber(avgLitersPerCow, 1) + ' L',
        },
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Total Litros Producidos', formatNumber(totalLiters, 0)],
          ['Vacas en Ordeño', milkCows],
          ['Promedio por Vaca', formatNumber(avgLitersPerCow, 1) + ' L/día'],
        ],
      },
      {
        title: 'Reproducción',
        summary: {
          'Hembras Activas': females?.length || 0,
          'Preñadas': pregnantCount,
          'Tasa Preñez': formatNumber(pregnancyRate, 1) + '%',
          'Partos en Período': birthsCount,
          'Servicios/Inseminaciones': servicedCount,
        },
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Hembras Activas', females?.length || 0],
          ['Preñadas', pregnantCount],
          ['Tasa de Preñez', formatNumber(pregnancyRate, 1) + '%'],
          ['Partos en el Período', birthsCount],
          ['Servicios/Inseminaciones', servicedCount],
        ],
      },
      {
        title: 'Sanidad',
        summary: {
          'Tratamientos Activos': activeHealth,
          'Costo Médico': formatCurrency(healthCost),
          'Vacunas Aplicadas': appliedVaccines,
          'Vacunas Pendientes': pendingVaccines,
        },
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Tratamientos Activos', activeHealth],
          ['Costo Total Médico', formatCurrency(healthCost)],
          ['Vacunas Aplicadas en Período', appliedVaccines],
          ['Vacunas Pendientes', pendingVaccines],
        ],
      },
      {
        title: 'Costos del Período',
        summary: {
          'Costo Total': formatCurrency(totalCost),
          'Alimentación': formatCurrency(feedCost),
          'Salud': formatCurrency(healthCost),
        },
        headers: ['Categoría', 'Costo', '% del Total'],
        rows: [
          ['Alimentación', formatCurrency(feedCost), totalCost > 0 ? formatNumber((feedCost / totalCost) * 100, 1) + '%' : '-'],
          ['Salud/Medicamentos', formatCurrency(healthCost), totalCost > 0 ? formatNumber((healthCost / totalCost) * 100, 1) + '%' : '-'],
          ['TOTAL', formatCurrency(totalCost), '100%'],
        ],
      },
      {
        title: 'Terneros y Cría',
        summary: {
          'Total Terneros': calves.length,
          'Alertas Calostro': colostrumNeeded,
          'Peso Prom. Actual': avgWeight > 0 ? formatNumber(avgWeight, 1) + ' kg' : '-',
        },
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Total Terneros', calves.length],
          ['Alertas Calostro (≤3 días)', colostrumNeeded],
          ['GDP Promedio Hato', avgGDP > 0 ? formatNumber(avgGDP * 1000, 0) + ' g/día' : '-'],
        ],
      },
    ];

    return {
      title: 'Informe Integral del Predio',
      subtitle: `Período: ${formatDate(dateFrom)} — ${formatDate(dateTo)}`,
      generatedAt: today.toISOString(),
      filters: { dateFrom, dateTo },
      summary: {
        'Total Animales': totalAnimals,
        'Leche 30 días (L)': formatNumber(totalLiters, 0),
        'Tasa Preñez': formatNumber(pregnancyRate, 1) + '%',
        'Tratamientos Activos': activeHealth,
        'Costo Total Período': formatCurrency(totalCost),
        'Terneros': calves.length,
      },
      headers: ['Módulo', 'Indicador Principal', 'Valor'],
      rows: sections.map(s => [s.title, Object.keys(s.summary)[0], String(Object.values(s.summary)[0])]),
      chartData: Object.entries(byCategory).map(([label, value]) => ({ label, value })),
      sections,
    };
  };

  // Helper: Aggregate data by date
  const aggregateByDate = (data: any[], dateField: string, valueField: string): { label: string; value: number }[] => {
    const byDate: Record<string, number> = {};
    data.forEach(item => {
      const date = item[dateField];
      if (date) {
        byDate[date] = (byDate[date] || 0) + (item[valueField] || 0);
      }
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([label, value]) => ({ label: formatDate(label), value }));
  };

  // Export to Excel
  const exportToExcel = (reportData: ReportData, filename?: string) => {
    const wb = XLSX.utils.book_new();
    const today = new Date().toISOString().split('T')[0];

    if (reportData.sections && reportData.sections.length > 0) {
      // Integral report: one sheet per section + executive summary
      const execRows = Object.entries(reportData.summary).map(([key, value]) => ({ Concepto: key, Valor: value }));
      const execWs = XLSX.utils.json_to_sheet(execRows);
      XLSX.utils.book_append_sheet(wb, execWs, 'Resumen Ejecutivo');

      reportData.sections.forEach(section => {
        const sheetData = [
          Object.entries(section.summary).map(([k]) => k),
          Object.entries(section.summary).map(([, v]) => v),
          [],
          section.headers,
          ...section.rows,
        ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = section.headers.map(() => ({ wch: 20 }));
        const sheetName = section.title.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
    } else {
      // Standard report: summary + data sheets
      const summaryRows = Object.entries(reportData.summary).map(([key, value]) => ({ Concepto: key, Valor: value }));
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

      const dataWs = XLSX.utils.aoa_to_sheet([reportData.headers, ...reportData.rows]);
      dataWs['!cols'] = reportData.headers.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, dataWs, 'Datos');
    }

    XLSX.writeFile(wb, filename || `${reportData.title.replace(/\s+/g, '_')}_${today}.xlsx`);
    toast({ title: 'Exportado', description: 'El reporte se ha descargado en formato Excel' });
  };

  // Export Integral PDF (multi-section)
  const exportIntegralPDF = (reportData: ReportData, filename?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cover page
    doc.setFillColor(26, 92, 46);
    doc.rect(0, 0, pageWidth, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Agro Data', pageWidth / 2, 80, { align: 'center' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe Integral del Predio', pageWidth / 2, 100, { align: 'center' });
    doc.setFontSize(12);
    doc.text(reportData.subtitle, pageWidth / 2, 115, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generado: ${formatDate(reportData.generatedAt)}`, pageWidth / 2, 130, { align: 'center' });

    // Executive summary on cover
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', pageWidth / 2, 155, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryEntries = Object.entries(reportData.summary);
    summaryEntries.forEach(([key, value], i) => {
      const col = i % 2 === 0 ? 30 : pageWidth / 2 + 10;
      const row = Math.floor(i / 2);
      doc.text(`${key}: ${value}`, col, 165 + row * 8);
    });

    const SECTION_COLORS: [number, number, number][] = [
      [34, 87, 122], [52, 131, 79], [180, 100, 20], [150, 50, 50], [80, 60, 150], [60, 120, 130],
    ];

    (reportData.sections || []).forEach((section, idx) => {
      doc.addPage();
      const color = SECTION_COLORS[idx % SECTION_COLORS.length];
      doc.setFillColor(...color);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 14, 12);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let y = 28;
      const summaryItems = Object.entries(section.summary);
      summaryItems.forEach(([k, v], i) => {
        const col = i % 2 === 0 ? 14 : pageWidth / 2 + 5;
        const row = Math.floor(i / 2);
        doc.setFont('helvetica', 'bold');
        doc.text(`${k}:`, col, 28 + row * 6);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${v}`, col + doc.getTextWidth(`${k}: `), 28 + row * 6);
        y = 28 + row * 6 + 6;
      });

      if (section.rows.length > 0) {
        autoTable(doc, {
          head: [section.headers],
          body: section.rows,
          startY: y + 4,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: color, textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 },
        });
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (i === 1) {
        doc.setTextColor(200, 200, 200);
      } else {
        doc.setTextColor(128, 128, 128);
      }
      doc.text('Agro Data — Informe Integral del Predio', 14, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    const today = new Date().toISOString().split('T')[0];
    doc.save(filename || `Informe_Integral_${today}.pdf`);
    toast({ title: 'Exportado', description: 'El Informe Integral se ha descargado en PDF' });
  };

  // Export to PDF
  const exportToPDF = (reportData: ReportData, filename?: string) => {
    if (reportData.sections && reportData.sections.length > 0) {
      return exportIntegralPDF(reportData, filename);
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with branding
    doc.setFillColor(34, 87, 122);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Agro Data', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Software Ganadero Inteligente', 14, 25);

    doc.setFontSize(9);
    doc.text(`Generado: ${formatDate(reportData.generatedAt)}`, pageWidth - 14, 18, { align: 'right' });
    if (reportData.filters.dateFrom && reportData.filters.dateTo) {
      doc.text(`Período: ${formatDate(reportData.filters.dateFrom)} - ${formatDate(reportData.filters.dateTo)}`, pageWidth - 14, 25, { align: 'right' });
    }

    // Report title
    doc.setTextColor(34, 87, 122);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, 14, 52);

    // Divider
    doc.setDrawColor(34, 87, 122);
    doc.setLineWidth(0.5);
    doc.line(14, 55, pageWidth - 14, 55);

    // Summary section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, 64);

    let yPos = 72;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryEntries = Object.entries(reportData.summary);
    const colWidth = (pageWidth - 28) / 2;
    summaryEntries.forEach(([key, value], i) => {
      const x = i % 2 === 0 ? 14 : 14 + colWidth;
      const row = Math.floor(i / 2);
      const y = 72 + row * 7;
      doc.setFont('helvetica', 'bold');
      doc.text(`${key}:`, x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${value}`, x + doc.getTextWidth(`${key}: `), y);
      yPos = y + 7;
    });

    // Top producers (for milk reports)
    if (reportData.topProducers && reportData.topProducers.length > 0) {
      yPos += 4;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 87, 122);
      doc.text('Top Productoras', 14, yPos);
      yPos += 2;
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        head: [['#', 'Animal', 'Total (L)', 'Promedio (L/día)']],
        body: reportData.topProducers.map((p, i) => [
          i + 1,
          p.name,
          p.total,
          p.avg,
        ]),
        startY: yPos,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [52, 131, 79], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 240] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Production curve chart placeholder (textual summary)
    if (reportData.chartData && reportData.chartData.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 87, 122);
      doc.text('Curva de Producción', 14, yPos);
      yPos += 2;
      doc.setTextColor(0, 0, 0);

      // Draw a simple bar chart
      const chartStartY = yPos + 2;
      const chartHeight = 40;
      const maxVal = Math.max(...reportData.chartData.map(d => d.value), 1);
      const barWidth = Math.min(6, (pageWidth - 28) / reportData.chartData.length);
      
      doc.setFillColor(34, 87, 122);
      reportData.chartData.forEach((d, i) => {
        const barHeight = (d.value / maxVal) * chartHeight;
        const x = 14 + i * barWidth;
        doc.rect(x, chartStartY + chartHeight - barHeight, barWidth - 1, barHeight, 'F');
      });

      // Axis labels
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      if (reportData.chartData.length <= 15) {
        reportData.chartData.forEach((d, i) => {
          const x = 14 + i * barWidth;
          doc.text(d.label.substring(0, 5), x, chartStartY + chartHeight + 5, { angle: 45 });
        });
      }

      yPos = chartStartY + chartHeight + 12;
    }

    // Detailed records table
    if (reportData.rows.length > 0) {
      if (yPos > 200) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 87, 122);
      doc.text('Registros Detallados', 14, yPos);
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        head: [reportData.headers],
        body: reportData.rows,
        startY: yPos + 4,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [34, 87, 122], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(`Agro Data - Reporte generado automáticamente`, 14, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    const today = new Date().toISOString().split('T')[0];
    doc.save(filename || `${reportData.title.replace(/\s+/g, '_')}_${today}.pdf`);

    toast({ title: 'Exportado', description: 'El reporte se ha descargado en formato PDF' });
  };

  return {
    loading,
    generateReport,
    exportToExcel,
    exportToPDF,
    REPORT_CONFIGS,
  };
};
