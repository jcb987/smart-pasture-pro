import { useState, useEffect, useCallback } from 'react';
import { useAnimals } from '@/hooks/useAnimals';
import { useMilkProduction } from '@/hooks/useMilkProduction';
import { useWeightRecords } from '@/hooks/useWeightRecords';
import { useHealth } from '@/hooks/useHealth';
import { useFeeding } from '@/hooks/useFeeding';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  variables: SimulationVariables;
  results: SimulationResults;
  createdAt: Date;
}

export interface SimulationVariables {
  // Production variables (%)
  milkProductionChange: number;
  meatProductionChange: number;
  dailyGainChange: number;
  
  // Cost variables (%)
  feedCostChange: number;
  healthCostChange: number;
  laborCostChange: number;
  
  // Herd variables (%)
  mortalityRate: number;
  replacementRate: number;
  cullingRate: number;
  
  // Reproductive variables (%)
  pregnancyRate: number;
  calvingInterval: number;
  
  // Time horizon (months)
  projectionMonths: number;
}

export interface SimulationResults {
  // Monthly projections
  monthlyData: MonthlyProjection[];
  
  // Summary
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  roi: number;
  
  // Comparisons
  revenueChange: number;
  costChange: number;
  profitChange: number;
  
  // Data source tracking
  dataSource: 'user_input' | 'system_data' | 'mixed';
  assumptions: string[];
}

export interface MonthlyProjection {
  month: number;
  label: string;
  milkProduction: number;
  meatProduction: number;
  feedCosts: number;
  healthCosts: number;
  totalCosts: number;
  revenue: number;
  profit: number;
  herdSize: number;
}

export interface CurrentMetrics {
  totalAnimals: number;
  activeAnimals: number;
  femalesCount: number;
  malesCount: number;
  avgDailyMilk: number | null;
  avgDailyGain: number | null;
  monthlyFeedCost: number | null;
  monthlyHealthCost: number | null;
  avgMilkPrice: number | null;
  avgMeatPrice: number | null;
}

export interface BaseDataConfig {
  milkPricePerLiter: number;
  meatPricePerKg: number;
  currency: string;
  monthlyFeedCost: number;
  monthlyHealthCost: number;
  monthlyLaborCost: number;
  otherOperationalCosts: number;
  avgDailyMilkPerFemale: number;
  avgMonthlyMeatKg: number;
  avgDailyWeightGain: number;
  projectionMonths: number;
  productionType: 'lecheria' | 'carne' | 'doble_proposito';
}

export interface ExistingDataStatus {
  hasAnimals: boolean;
  hasMilkRecords: boolean;
  hasWeightRecords: boolean;
  hasFeedingData: boolean;
  hasHealthData: boolean;
  calculatedMilkAvg: number | null;
  calculatedWeightGain: number | null;
  calculatedFeedCost: number | null;
  calculatedHealthCost: number | null;
}

export interface SimulationValidation {
  isValid: boolean;
  missingData: string[];
  warnings: string[];
}

const DEFAULT_VARIABLES: SimulationVariables = {
  milkProductionChange: 0,
  meatProductionChange: 0,
  dailyGainChange: 0,
  feedCostChange: 0,
  healthCostChange: 0,
  laborCostChange: 0,
  mortalityRate: 2,
  replacementRate: 20,
  cullingRate: 15,
  pregnancyRate: 60,
  calvingInterval: 13,
  projectionMonths: 12,
};

export const useSimulations = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [currentVariables, setCurrentVariables] = useState<SimulationVariables>(DEFAULT_VARIABLES);
  const [baselineMetrics, setBaselineMetrics] = useState<CurrentMetrics | null>(null);
  const [baseDataConfig, setBaseDataConfig] = useState<BaseDataConfig | null>(null);
  const [existingDataStatus, setExistingDataStatus] = useState<ExistingDataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const { animals, getStats: getAnimalStats } = useAnimals();
  const { records: milkRecords, getStats: getMilkStats } = useMilkProduction();
  const { records: weightRecords, getStats: getMeatStats } = useWeightRecords();
  const { healthEvents, getStats: getHealthStats } = useHealth();
  const { consumption, getStats: getFeedStats } = useFeeding();

  // Calculate existing data status from real data
  useEffect(() => {
    const calculateDataStatus = async () => {
      const animalStats = getAnimalStats();
      const milkStats = getMilkStats();
      const meatStats = await getMeatStats();
      const feedStats = getFeedStats();
      
      const totalHealthCost = healthEvents?.reduce((sum, e) => sum + (e.cost || 0), 0) || 0;
      
      const status: ExistingDataStatus = {
        hasAnimals: animals.length > 0,
        hasMilkRecords: (milkRecords?.length || 0) > 0,
        hasWeightRecords: (weightRecords?.length || 0) > 0,
        hasFeedingData: (consumption?.length || 0) > 0,
        hasHealthData: (healthEvents?.length || 0) > 0,
        calculatedMilkAvg: milkStats.avgPerCow > 0 ? milkStats.avgPerCow : null,
        calculatedWeightGain: meatStats.avgDailyGain > 0 ? meatStats.avgDailyGain : null,
        calculatedFeedCost: feedStats.monthlyFeedCost > 0 ? feedStats.monthlyFeedCost : null,
        calculatedHealthCost: totalHealthCost > 0 ? totalHealthCost : null,
      };
      
      setExistingDataStatus(status);
      
      // Set baseline metrics
      const metrics: CurrentMetrics = {
        totalAnimals: animalStats.total,
        activeAnimals: animalStats.total,
        femalesCount: animalStats.hembras,
        malesCount: animalStats.machos,
        avgDailyMilk: status.calculatedMilkAvg,
        avgDailyGain: status.calculatedWeightGain,
        monthlyFeedCost: status.calculatedFeedCost,
        monthlyHealthCost: status.calculatedHealthCost,
        avgMilkPrice: null, // Must be provided by user
        avgMeatPrice: null, // Must be provided by user
      };
      
      setBaselineMetrics(metrics);
      setLoading(false);
    };

    calculateDataStatus();
  }, [animals, milkRecords, weightRecords, healthEvents, consumption]);

  // Validate if simulation can run
  const validateSimulation = useCallback((): SimulationValidation => {
    const missingData: string[] = [];
    const warnings: string[] = [];

    if (!baselineMetrics || baselineMetrics.totalAnimals === 0) {
      missingData.push('No hay animales registrados en el sistema');
    }

    if (!baseDataConfig) {
      missingData.push('Configuración base no completada');
      return { isValid: false, missingData, warnings };
    }

    const { productionType, milkPricePerLiter, meatPricePerKg, monthlyFeedCost, avgDailyMilkPerFemale, avgDailyWeightGain } = baseDataConfig;

    if (productionType !== 'carne' && milkPricePerLiter <= 0) {
      missingData.push('Precio de venta de leche');
    }

    if (productionType !== 'lecheria' && meatPricePerKg <= 0) {
      missingData.push('Precio de venta de carne');
    }

    if (monthlyFeedCost <= 0) {
      missingData.push('Costo mensual de alimentación');
    }

    if (productionType !== 'carne') {
      const milkValue = existingDataStatus?.calculatedMilkAvg || avgDailyMilkPerFemale;
      if (!milkValue || milkValue <= 0) {
        missingData.push('Producción promedio de leche por hembra');
      }
    }

    if (productionType !== 'lecheria') {
      const gainValue = existingDataStatus?.calculatedWeightGain || avgDailyWeightGain;
      if (!gainValue || gainValue <= 0) {
        missingData.push('Ganancia diaria de peso');
      }
    }

    // Add warnings for data sources
    if (!existingDataStatus?.hasMilkRecords && productionType !== 'carne') {
      warnings.push('Producción de leche basada en valor manual ingresado');
    }

    if (!existingDataStatus?.hasWeightRecords && productionType !== 'lecheria') {
      warnings.push('Ganancia de peso basada en valor manual ingresado');
    }

    return {
      isValid: missingData.length === 0,
      missingData,
      warnings,
    };
  }, [baselineMetrics, baseDataConfig, existingDataStatus]);

  // Configure base data
  const configureBaseData = (config: BaseDataConfig) => {
    setBaseDataConfig(config);
    setCurrentVariables(prev => ({
      ...prev,
      projectionMonths: config.projectionMonths,
    }));
    setIsConfigured(true);
  };

  // Run simulation with ONLY real/configured data - NO RANDOM VALUES
  const runSimulation = useCallback((variables: SimulationVariables): SimulationResults => {
    const validation = validateSimulation();
    
    if (!validation.isValid || !baselineMetrics || !baseDataConfig) {
      return {
        monthlyData: [],
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0,
        roi: 0,
        revenueChange: 0,
        costChange: 0,
        profitChange: 0,
        dataSource: 'user_input',
        assumptions: validation.missingData.map(d => `Falta: ${d}`),
      };
    }

    const { 
      milkPricePerLiter, 
      meatPricePerKg, 
      monthlyFeedCost, 
      monthlyHealthCost, 
      monthlyLaborCost,
      otherOperationalCosts,
      avgDailyMilkPerFemale,
      avgDailyWeightGain,
      productionType,
    } = baseDataConfig;

    // Use system data if available, otherwise use configured values
    const actualMilkProduction = existingDataStatus?.calculatedMilkAvg || avgDailyMilkPerFemale;
    const actualWeightGain = existingDataStatus?.calculatedWeightGain || avgDailyWeightGain;
    const actualFeedCost = existingDataStatus?.calculatedFeedCost || monthlyFeedCost;
    const actualHealthCost = existingDataStatus?.calculatedHealthCost || monthlyHealthCost;

    const assumptions: string[] = [];
    let dataSource: 'user_input' | 'system_data' | 'mixed' = 'user_input';

    if (existingDataStatus?.calculatedMilkAvg || existingDataStatus?.calculatedWeightGain) {
      dataSource = existingDataStatus?.calculatedMilkAvg && existingDataStatus?.calculatedWeightGain 
        ? 'system_data' 
        : 'mixed';
    }

    assumptions.push(`Precio leche: $${milkPricePerLiter.toLocaleString()}/L (ingresado por usuario)`);
    assumptions.push(`Precio carne: $${meatPricePerKg.toLocaleString()}/kg (ingresado por usuario)`);
    
    if (existingDataStatus?.calculatedMilkAvg) {
      assumptions.push(`Producción leche: ${actualMilkProduction.toFixed(1)} L/día (del sistema)`);
    } else {
      assumptions.push(`Producción leche: ${actualMilkProduction.toFixed(1)} L/día (ingresado por usuario)`);
    }

    const monthlyData: MonthlyProjection[] = [];
    let cumulativeRevenue = 0;
    let cumulativeCosts = 0;
    
    // Calculate baseline monthly values using ONLY real/configured data
    const baseMonthlyMilk = productionType !== 'carne' 
      ? actualMilkProduction * baselineMetrics.femalesCount * 30 
      : 0;
    const baseMonthlyMeat = productionType !== 'lecheria'
      ? actualWeightGain * baselineMetrics.malesCount * 30 
      : 0;
    const baseFeedCost = actualFeedCost;
    const baseHealthCost = actualHealthCost;
    const baseLaborCost = monthlyLaborCost;
    const baseOtherCost = otherOperationalCosts;
    
    let currentHerdSize = baselineMetrics.totalAnimals;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();

    for (let i = 0; i < variables.projectionMonths; i++) {
      // Apply herd dynamics
      const monthlyMortality = currentHerdSize * (variables.mortalityRate / 100 / 12);
      const monthlyReplacement = currentHerdSize * (variables.replacementRate / 100 / 12);
      const monthlyCulling = currentHerdSize * (variables.cullingRate / 100 / 12);
      
      currentHerdSize = currentHerdSize - monthlyMortality - monthlyCulling + monthlyReplacement;
      currentHerdSize = Math.max(1, Math.round(currentHerdSize));

      // Calculate production with adjustments
      const herdRatio = currentHerdSize / baselineMetrics.totalAnimals;
      const milkProduction = baseMonthlyMilk * herdRatio * (1 + variables.milkProductionChange / 100);
      const meatProduction = baseMonthlyMeat * herdRatio * (1 + variables.meatProductionChange / 100) * (1 + variables.dailyGainChange / 100);

      // Calculate costs with adjustments
      const feedCosts = baseFeedCost * herdRatio * (1 + variables.feedCostChange / 100);
      const healthCosts = baseHealthCost * herdRatio * (1 + variables.healthCostChange / 100);
      const laborCosts = baseLaborCost * (1 + variables.laborCostChange / 100);
      const otherCosts = baseOtherCost;
      const totalCosts = feedCosts + healthCosts + laborCosts + otherCosts;

      // Calculate revenue using user-provided prices
      const milkRevenue = milkProduction * milkPricePerLiter;
      const meatRevenue = meatProduction * meatPricePerKg;
      const revenue = milkRevenue + meatRevenue;

      const profit = revenue - totalCosts;

      cumulativeRevenue += revenue;
      cumulativeCosts += totalCosts;

      const monthIndex = (currentMonth + i + 1) % 12;

      monthlyData.push({
        month: i + 1,
        label: monthNames[monthIndex],
        milkProduction: Math.round(milkProduction),
        meatProduction: Math.round(meatProduction),
        feedCosts: Math.round(feedCosts),
        healthCosts: Math.round(healthCosts),
        totalCosts: Math.round(totalCosts),
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        herdSize: currentHerdSize,
      });
    }

    // Calculate baseline totals for comparison (without any variable changes)
    const baselineTotalRevenue = (baseMonthlyMilk * milkPricePerLiter + baseMonthlyMeat * meatPricePerKg) * variables.projectionMonths;
    const baselineTotalCosts = (baseFeedCost + baseHealthCost + baseLaborCost + baseOtherCost) * variables.projectionMonths;
    const baselineProfit = baselineTotalRevenue - baselineTotalCosts;

    const netProfit = cumulativeRevenue - cumulativeCosts;

    return {
      monthlyData,
      totalRevenue: Math.round(cumulativeRevenue),
      totalCosts: Math.round(cumulativeCosts),
      netProfit: Math.round(netProfit),
      roi: cumulativeCosts > 0 ? Math.round((netProfit / cumulativeCosts) * 100) : 0,
      revenueChange: baselineTotalRevenue > 0 ? Math.round(((cumulativeRevenue - baselineTotalRevenue) / baselineTotalRevenue) * 100) : 0,
      costChange: baselineTotalCosts > 0 ? Math.round(((cumulativeCosts - baselineTotalCosts) / baselineTotalCosts) * 100) : 0,
      profitChange: baselineProfit !== 0 ? Math.round(((netProfit - baselineProfit) / Math.abs(baselineProfit)) * 100) : 0,
      dataSource,
      assumptions,
    };
  }, [baselineMetrics, baseDataConfig, existingDataStatus, validateSimulation]);

  const createScenario = (name: string, description: string, variables: SimulationVariables): SimulationScenario => {
    const results = runSimulation(variables);
    const scenario: SimulationScenario = {
      id: crypto.randomUUID(),
      name,
      description,
      variables,
      results,
      createdAt: new Date(),
    };
    setScenarios(prev => [...prev, scenario]);
    return scenario;
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const compareScenarios = (scenarioIds: string[]): SimulationScenario[] => {
    return scenarios.filter(s => scenarioIds.includes(s.id));
  };

  const getPresetScenarios = (): { name: string; description: string; variables: SimulationVariables }[] => [
    {
      name: 'Optimista',
      description: 'Aumento de producción con reducción de costos',
      variables: {
        ...DEFAULT_VARIABLES,
        milkProductionChange: 15,
        meatProductionChange: 10,
        dailyGainChange: 10,
        feedCostChange: -5,
        mortalityRate: 1,
        pregnancyRate: 75,
        projectionMonths: baseDataConfig?.projectionMonths || 12,
      },
    },
    {
      name: 'Pesimista',
      description: 'Reducción de producción con aumento de costos',
      variables: {
        ...DEFAULT_VARIABLES,
        milkProductionChange: -10,
        meatProductionChange: -15,
        feedCostChange: 20,
        healthCostChange: 30,
        mortalityRate: 5,
        pregnancyRate: 45,
        projectionMonths: baseDataConfig?.projectionMonths || 12,
      },
    },
    {
      name: 'Crisis Sanitaria',
      description: 'Impacto de brote de enfermedad en el hato',
      variables: {
        ...DEFAULT_VARIABLES,
        milkProductionChange: -25,
        meatProductionChange: -20,
        healthCostChange: 100,
        mortalityRate: 8,
        cullingRate: 25,
        projectionMonths: baseDataConfig?.projectionMonths || 12,
      },
    },
    {
      name: 'Mejora Genética',
      description: 'Inversión en genética superior a largo plazo',
      variables: {
        ...DEFAULT_VARIABLES,
        milkProductionChange: 25,
        dailyGainChange: 20,
        feedCostChange: 10,
        replacementRate: 30,
        pregnancyRate: 70,
        projectionMonths: 24,
      },
    },
    {
      name: 'Reducción de Costos',
      description: 'Optimización operativa sin afectar producción',
      variables: {
        ...DEFAULT_VARIABLES,
        feedCostChange: -15,
        healthCostChange: -10,
        laborCostChange: -20,
        projectionMonths: baseDataConfig?.projectionMonths || 12,
      },
    },
  ];

  const resetConfiguration = () => {
    setBaseDataConfig(null);
    setIsConfigured(false);
    setCurrentVariables(DEFAULT_VARIABLES);
  };

  return {
    scenarios,
    currentVariables,
    setCurrentVariables,
    baselineMetrics,
    baseDataConfig,
    existingDataStatus,
    loading,
    isConfigured,
    runSimulation,
    createScenario,
    deleteScenario,
    compareScenarios,
    getPresetScenarios,
    configureBaseData,
    resetConfiguration,
    validateSimulation,
    DEFAULT_VARIABLES,
  };
};
