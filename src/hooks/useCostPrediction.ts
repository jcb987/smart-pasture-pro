import { useMemo } from 'react';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: 'ingreso' | 'egreso';
  amount: number;
  category: string;
  subcategory?: string | null;
  description?: string | null;
}

export interface MonthlySummary {
  month: string;
  year: number;
  ingresos: number;
  egresos: number;
  balance: number;
}

export interface CategoryTrend {
  category: string;
  currentMonth: number;
  previousMonth: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  projected: number;
}

export interface CostPrediction {
  month: string;
  predictedIngresos: number;
  predictedEgresos: number;
  predictedBalance: number;
  confidence: number;
}

export interface FinancialForecast {
  predictions: CostPrediction[];
  categoryTrends: CategoryTrend[];
  seasonalPattern: { month: number; avgBalance: number }[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  projectedAnnualBalance: number;
}

/**
 * Hook para predicción de costos futuros
 * Funcionalidad de alta prioridad del análisis InterHerd
 */
export function useCostPrediction(transactions: Transaction[]) {

  /**
   * Obtener resumen mensual de transacciones
   */
  const monthlySummaries = useMemo((): MonthlySummary[] => {
    const monthlyData: Record<string, { ingresos: number; egresos: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { ingresos: 0, egresos: 0 };
      }

      if (t.transaction_type === 'ingreso') {
        monthlyData[key].ingresos += t.amount;
      } else {
        monthlyData[key].egresos += t.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        return {
          month: key,
          year: parseInt(year),
          ingresos: data.ingresos,
          egresos: data.egresos,
          balance: data.ingresos - data.egresos
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  /**
   * Calcular tendencias por categoría
   */
  const categoryTrends = useMemo((): CategoryTrend[] => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const categoryData: Record<string, { current: number; previous: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!categoryData[t.category]) {
        categoryData[t.category] = { current: 0, previous: 0 };
      }

      const amount = t.transaction_type === 'egreso' ? t.amount : -t.amount;
      
      if (month === currentMonth) {
        categoryData[t.category].current += amount;
      } else if (month === previousMonth) {
        categoryData[t.category].previous += amount;
      }
    });

    return Object.entries(categoryData)
      .map(([category, data]) => {
        const changePercent = data.previous !== 0 
          ? Math.round(((data.current - data.previous) / Math.abs(data.previous)) * 100)
          : 0;

        let trend: 'up' | 'down' | 'stable';
        if (changePercent > 10) trend = 'up';
        else if (changePercent < -10) trend = 'down';
        else trend = 'stable';

        // Proyección simple: promedio ponderado
        const projected = data.current * 0.6 + data.previous * 0.4;

        return {
          category,
          currentMonth: Math.abs(data.current),
          previousMonth: Math.abs(data.previous),
          trend,
          changePercent,
          projected: Math.abs(projected)
        };
      })
      .filter(c => c.currentMonth > 0 || c.previousMonth > 0)
      .sort((a, b) => b.currentMonth - a.currentMonth);
  }, [transactions]);

  /**
   * Generar predicciones para los próximos meses
   */
  const generatePredictions = useMemo((): CostPrediction[] => {
    if (monthlySummaries.length < 3) return [];

    const predictions: CostPrediction[] = [];
    const lastMonths = monthlySummaries.slice(-6);

    // Calcular promedios y tendencias
    const avgIngresos = lastMonths.reduce((s, m) => s + m.ingresos, 0) / lastMonths.length;
    const avgEgresos = lastMonths.reduce((s, m) => s + m.egresos, 0) / lastMonths.length;

    // Calcular tendencia lineal simple
    let ingresosTrend = 0;
    let egresosTrend = 0;

    if (lastMonths.length >= 2) {
      const first = lastMonths[0];
      const last = lastMonths[lastMonths.length - 1];
      ingresosTrend = (last.ingresos - first.ingresos) / lastMonths.length;
      egresosTrend = (last.egresos - first.egresos) / lastMonths.length;
    }

    // Generar predicciones para los próximos 6 meses
    const today = new Date();
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const month = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

      // Aplicar estacionalidad si hay suficientes datos
      let seasonalFactor = 1;
      const sameMonthLastYear = monthlySummaries.find(m => {
        const mDate = new Date(m.month);
        return mDate.getMonth() === futureDate.getMonth() && m.year === futureDate.getFullYear() - 1;
      });
      
      if (sameMonthLastYear && avgIngresos > 0) {
        seasonalFactor = sameMonthLastYear.ingresos / avgIngresos;
        seasonalFactor = Math.max(0.5, Math.min(2, seasonalFactor)); // Limitar entre 0.5x y 2x
      }

      const predictedIngresos = Math.max(0, (avgIngresos + ingresosTrend * i) * seasonalFactor);
      const predictedEgresos = Math.max(0, avgEgresos + egresosTrend * i);

      // Calcular confianza basada en variabilidad de datos
      const ingresosVariance = lastMonths.reduce((s, m) => 
        s + Math.pow(m.ingresos - avgIngresos, 2), 0) / lastMonths.length;
      const coefficientOfVariation = Math.sqrt(ingresosVariance) / (avgIngresos || 1);
      const confidence = Math.max(30, Math.min(95, 100 - coefficientOfVariation * 100 - i * 5));

      predictions.push({
        month,
        predictedIngresos: Math.round(predictedIngresos),
        predictedEgresos: Math.round(predictedEgresos),
        predictedBalance: Math.round(predictedIngresos - predictedEgresos),
        confidence: Math.round(confidence)
      });
    }

    return predictions;
  }, [monthlySummaries]);

  /**
   * Calcular patrón estacional
   */
  const seasonalPattern = useMemo(() => {
    const monthlyAvg: Record<number, number[]> = {};

    monthlySummaries.forEach(m => {
      const monthNum = parseInt(m.month.split('-')[1]);
      if (!monthlyAvg[monthNum]) monthlyAvg[monthNum] = [];
      monthlyAvg[monthNum].push(m.balance);
    });

    return Object.entries(monthlyAvg)
      .map(([month, balances]) => ({
        month: parseInt(month),
        avgBalance: Math.round(balances.reduce((a, b) => a + b, 0) / balances.length)
      }))
      .sort((a, b) => a.month - b.month);
  }, [monthlySummaries]);

  /**
   * Generar pronóstico completo
   */
  const forecast = useMemo((): FinancialForecast => {
    const predictions = generatePredictions;
    
    // Calcular balance anual proyectado
    const projectedAnnualBalance = predictions.reduce((s, p) => s + p.predictedBalance, 0);

    // Determinar nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const negativeMonths = predictions.filter(p => p.predictedBalance < 0).length;
    
    if (negativeMonths >= 4 || projectedAnnualBalance < -1000000) {
      riskLevel = 'high';
    } else if (negativeMonths >= 2 || projectedAnnualBalance < 0) {
      riskLevel = 'medium';
    }

    // Generar recomendaciones
    const recommendations: string[] = [];

    const increasingCosts = categoryTrends.filter(c => c.trend === 'up' && c.changePercent > 20);
    if (increasingCosts.length > 0) {
      recommendations.push(
        `📈 Costos en aumento: ${increasingCosts.map(c => c.category).join(', ')}. Considere revisar proveedores.`
      );
    }

    if (riskLevel === 'high') {
      recommendations.push('🔴 Alerta: Se proyectan varios meses con balance negativo. Revise gastos no esenciales.');
    }

    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length 
      : 0;
    
    if (avgConfidence < 60) {
      recommendations.push('📊 La precisión de las predicciones mejorará con más datos históricos.');
    }

    // Buscar meses con mejores y peores balances
    const bestMonth = seasonalPattern.reduce((best, curr) => 
      curr.avgBalance > best.avgBalance ? curr : best
    , seasonalPattern[0] || { month: 0, avgBalance: 0 });

    const worstMonth = seasonalPattern.reduce((worst, curr) => 
      curr.avgBalance < worst.avgBalance ? curr : worst
    , seasonalPattern[0] || { month: 0, avgBalance: 0 });

    if (seasonalPattern.length >= 6) {
      const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      recommendations.push(
        `💡 Patrón estacional: Mejor mes típico: ${monthNames[bestMonth.month]}, peor: ${monthNames[worstMonth.month]}`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Las finanzas se proyectan estables. Continúe monitoreando.');
    }

    return {
      predictions,
      categoryTrends,
      seasonalPattern,
      recommendations,
      riskLevel,
      projectedAnnualBalance
    };
  }, [generatePredictions, categoryTrends, seasonalPattern]);

  return {
    monthlySummaries,
    categoryTrends,
    predictions: generatePredictions,
    seasonalPattern,
    forecast
  };
}
