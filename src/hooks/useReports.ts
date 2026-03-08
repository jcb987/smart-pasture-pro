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
  topProducers?: { name: string; total: string; avg: string }[];
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
