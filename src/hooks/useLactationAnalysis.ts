import { useMemo } from 'react';
import { MilkRecord } from './useMilkProduction';

export interface LactationCurvePoint {
  day: number;
  actual: number;
  predicted: number;
  date: string;
}

export interface LactationAnalysis {
  animalId: string;
  tagId: string;
  name: string | null;
  lactationDays: number;
  peakProduction: number;
  peakDay: number;
  currentProduction: number;
  projectedTotal: number;
  projectedDays305: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  persistency: number;
  curve: LactationCurvePoint[];
}

export interface SomaticCellAnalysis {
  animalId: string;
  tagId: string;
  name: string | null;
  avgSCC: number;
  lastSCC: number | null;
  trend: 'improving' | 'stable' | 'worsening';
  mastitisRisk: 'low' | 'medium' | 'high' | 'critical';
  alerts: string[];
  history: { date: string; scc: number }[];
}

/**
 * Hook para análisis de curvas de lactancia y células somáticas
 * Funcionalidad de alta prioridad del análisis InterHerd
 */
export function useLactationAnalysis(records: MilkRecord[]) {
  
  /**
   * Calcula la curva de lactancia individual con predicción usando modelo Wood
   * Y = a * t^b * e^(-ct) donde:
   * a = producción inicial, b = incremento, c = persistencia
   */
  const getLactationCurve = (animalId: string): LactationAnalysis | null => {
    const animalRecords = records
      .filter(r => r.animal_id === animalId)
      .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date).getTime());

    if (animalRecords.length < 5) return null;

    const firstRecord = animalRecords[0];
    const lastRecord = animalRecords[animalRecords.length - 1];
    const startDate = new Date(firstRecord.production_date);
    
    // Calcular días de lactancia
    const lactationDays = Math.ceil(
      (new Date(lastRecord.production_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Encontrar pico de producción
    const peakRecord = animalRecords.reduce((max, r) => 
      (r.total_liters || 0) > (max.total_liters || 0) ? r : max
    , animalRecords[0]);
    
    const peakDay = Math.ceil(
      (new Date(peakRecord.production_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular parámetros del modelo Wood (simplificado)
    const productions = animalRecords.map((r, i) => ({
      day: i + 1,
      production: r.total_liters || 0
    }));

    const avgProduction = productions.reduce((s, p) => s + p.production, 0) / productions.length;
    const peakProduction = peakRecord.total_liters || 0;
    const currentProduction = lastRecord.total_liters || 0;

    // Calcular tendencia
    const recentRecords = animalRecords.slice(-7);
    const recentAvg = recentRecords.reduce((s, r) => s + (r.total_liters || 0), 0) / recentRecords.length;
    const olderRecords = animalRecords.slice(-14, -7);
    const olderAvg = olderRecords.length > 0 
      ? olderRecords.reduce((s, r) => s + (r.total_liters || 0), 0) / olderRecords.length 
      : recentAvg;

    let trend: 'increasing' | 'stable' | 'decreasing';
    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (diff > 5) trend = 'increasing';
    else if (diff < -5) trend = 'decreasing';
    else trend = 'stable';

    // Calcular persistencia (% de producción mantenida mes a mes después del pico)
    const persistency = peakProduction > 0 
      ? Math.round((currentProduction / peakProduction) * 100) 
      : 100;

    // Proyección a 305 días usando modelo Wood simplificado
    const a = avgProduction * 0.8;
    const b = 0.2;
    const c = 0.003;
    
    let projected305 = 0;
    const curve: LactationCurvePoint[] = [];
    
    for (let day = 1; day <= 305; day++) {
      const predicted = a * Math.pow(day, b) * Math.exp(-c * day);
      projected305 += predicted;
      
      const actualRecord = animalRecords.find((r, i) => i + 1 === day);
      const date = new Date(startDate);
      date.setDate(date.getDate() + day - 1);
      
      curve.push({
        day,
        actual: actualRecord?.total_liters || 0,
        predicted: Math.round(predicted * 10) / 10,
        date: date.toISOString().split('T')[0]
      });
    }

    // Total proyectado actual
    const projectedTotal = animalRecords.reduce((s, r) => s + (r.total_liters || 0), 0);

    return {
      animalId,
      tagId: firstRecord.animal?.tag_id || '',
      name: firstRecord.animal?.name || null,
      lactationDays,
      peakProduction,
      peakDay,
      currentProduction,
      projectedTotal,
      projectedDays305: Math.round(projected305),
      trend,
      persistency,
      curve
    };
  };

  /**
   * Análisis de células somáticas y riesgo de mastitis
   */
  const getSomaticCellAnalysis = (animalId: string): SomaticCellAnalysis | null => {
    const animalRecords = records
      .filter(r => r.animal_id === animalId && r.somatic_cell_count !== null)
      .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date).getTime());

    if (animalRecords.length === 0) {
      const allRecords = records.filter(r => r.animal_id === animalId);
      if (allRecords.length === 0) return null;
      
      return {
        animalId,
        tagId: allRecords[0].animal?.tag_id || '',
        name: allRecords[0].animal?.name || null,
        avgSCC: 0,
        lastSCC: null,
        trend: 'stable',
        mastitisRisk: 'low',
        alerts: ['Sin datos de CCS registrados'],
        history: []
      };
    }

    const history = animalRecords.map(r => ({
      date: r.production_date,
      scc: r.somatic_cell_count || 0
    }));

    const avgSCC = history.reduce((s, h) => s + h.scc, 0) / history.length;
    const lastSCC = history[history.length - 1]?.scc || null;

    // Calcular tendencia
    const recentRecords = history.slice(-5);
    const olderRecords = history.slice(-10, -5);
    
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (recentRecords.length >= 2 && olderRecords.length >= 2) {
      const recentAvg = recentRecords.reduce((s, h) => s + h.scc, 0) / recentRecords.length;
      const olderAvg = olderRecords.reduce((s, h) => s + h.scc, 0) / olderRecords.length;
      const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (diff < -10) trend = 'improving';
      else if (diff > 10) trend = 'worsening';
    }

    // Determinar riesgo de mastitis basado en CCS
    // < 200,000 = bajo, 200-400k = medio, 400-750k = alto, >750k = crítico
    let mastitisRisk: 'low' | 'medium' | 'high' | 'critical';
    const sccValue = lastSCC || avgSCC;
    
    if (sccValue < 200000) mastitisRisk = 'low';
    else if (sccValue < 400000) mastitisRisk = 'medium';
    else if (sccValue < 750000) mastitisRisk = 'high';
    else mastitisRisk = 'critical';

    // Generar alertas
    const alerts: string[] = [];
    
    if (mastitisRisk === 'critical') {
      alerts.push('⚠️ CCS crítico: posible mastitis clínica');
    } else if (mastitisRisk === 'high') {
      alerts.push('🔴 CCS elevado: revisar cuartos');
    }
    
    if (trend === 'worsening') {
      alerts.push('📈 Tendencia ascendente de CCS');
    }
    
    if (lastSCC && avgSCC > 0 && lastSCC > avgSCC * 1.5) {
      alerts.push('⚡ Aumento repentino de CCS');
    }

    return {
      animalId,
      tagId: animalRecords[0].animal?.tag_id || '',
      name: animalRecords[0].animal?.name || null,
      avgSCC: Math.round(avgSCC),
      lastSCC,
      trend,
      mastitisRisk,
      alerts,
      history
    };
  };

  /**
   * Obtener todos los análisis de lactancia
   */
  const getAllLactationAnalysis = useMemo(() => {
    const uniqueAnimals = [...new Set(records.map(r => r.animal_id))];
    return uniqueAnimals
      .map(animalId => getLactationCurve(animalId))
      .filter((a): a is LactationAnalysis => a !== null)
      .sort((a, b) => b.currentProduction - a.currentProduction);
  }, [records]);

  /**
   * Obtener todos los análisis de CCS
   */
  const getAllSCCAnalysis = useMemo(() => {
    const uniqueAnimals = [...new Set(records.map(r => r.animal_id))];
    return uniqueAnimals
      .map(animalId => getSomaticCellAnalysis(animalId))
      .filter((a): a is SomaticCellAnalysis => a !== null);
  }, [records]);

  /**
   * Animales con alto riesgo de mastitis
   */
  const mastitisAlerts = useMemo(() => {
    return getAllSCCAnalysis.filter(a => 
      a.mastitisRisk === 'high' || a.mastitisRisk === 'critical'
    );
  }, [getAllSCCAnalysis]);

  /**
   * Animales con mejor persistencia
   */
  const topPersistency = useMemo(() => {
    return getAllLactationAnalysis
      .filter(a => a.lactationDays > 60)
      .sort((a, b) => b.persistency - a.persistency)
      .slice(0, 10);
  }, [getAllLactationAnalysis]);

  return {
    getLactationCurve,
    getSomaticCellAnalysis,
    getAllLactationAnalysis,
    getAllSCCAnalysis,
    mastitisAlerts,
    topPersistency
  };
}
