import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type ReportType = 'produccion_leche' | 'produccion_carne' | 'reproduccion' | 'salud' | 'inventario' | 'costos' | 'alimentacion';

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

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: Record<string, string | number>;
  headers: string[];
  rows: (string | number)[][];
  chartData?: { label: string; value: number }[];
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

    // Summary sheet
    const summaryRows = Object.entries(reportData.summary).map(([key, value]) => ({ Concepto: key, Valor: value }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

    // Data sheet
    const dataWs = XLSX.utils.aoa_to_sheet([reportData.headers, ...reportData.rows]);
    dataWs['!cols'] = reportData.headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, dataWs, 'Datos');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, filename || `${reportData.title.replace(/\s+/g, '_')}_${today}.xlsx`);

    toast({ title: 'Exportado', description: 'El reporte se ha descargado en formato Excel' });
  };

  // Export to PDF
  const exportToPDF = (reportData: ReportData, filename?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.subtitle, pageWidth / 2, 28, { align: 'center' });

    // Generated date
    doc.setFontSize(10);
    doc.text(`Generado: ${formatDate(reportData.generatedAt)}`, pageWidth / 2, 35, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, 48);

    let yPos = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPos);
      yPos += 6;
    });

    // Data table
    if (reportData.rows.length > 0) {
      autoTable(doc, {
        head: [reportData.headers],
        body: reportData.rows,
        startY: yPos + 10,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 87, 122], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
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
