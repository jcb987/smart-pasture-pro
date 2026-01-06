import { useState, useEffect } from 'react';
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
  avgDailyMilk: number;
  avgDailyGain: number;
  monthlyFeedCost: number;
  monthlyHealthCost: number;
  avgMilkPrice: number;
  avgMeatPrice: number;
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

// Default prices (can be customized)
const DEFAULT_MILK_PRICE = 1500; // COP per liter
const DEFAULT_MEAT_PRICE = 8500; // COP per kg

export const useSimulations = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [currentVariables, setCurrentVariables] = useState<SimulationVariables>(DEFAULT_VARIABLES);
  const [baselineMetrics, setBaselineMetrics] = useState<CurrentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const { animals, getStats: getAnimalStats } = useAnimals();
  const { records: milkRecords, getStats: getMilkStats } = useMilkProduction();
  const { records: weightRecords, getStats: getMeatStats } = useWeightRecords();
  const { healthEvents, getStats: getHealthStats } = useHealth();
  const { consumption, getStats: getFeedStats } = useFeeding();

  // Calculate current baseline metrics from real data
  useEffect(() => {
    if (animals.length === 0) {
      setLoading(false);
      return;
    }

    const calculateMetrics = async () => {
      const animalStats = getAnimalStats();
      const milkStats = getMilkStats();
      const meatStats = await getMeatStats();
      const healthStats = getHealthStats();
      const feedStats = getFeedStats();

      // Calculate health costs from events
      const totalHealthCost = healthEvents?.reduce((sum, e) => sum + (e.cost || 0), 0) || 0;
      
      const metrics: CurrentMetrics = {
        totalAnimals: animalStats.total,
        activeAnimals: animalStats.total,
        femalesCount: animalStats.hembras,
        malesCount: animalStats.machos,
        avgDailyMilk: milkStats.avgPerCow || 15, // Default 15L if no data
        avgDailyGain: meatStats.avgDailyGain || 0.8, // Default 0.8kg/day
        monthlyFeedCost: feedStats.monthlyFeedCost || 0,
        monthlyHealthCost: totalHealthCost,
        avgMilkPrice: DEFAULT_MILK_PRICE,
        avgMeatPrice: DEFAULT_MEAT_PRICE,
      };

      setBaselineMetrics(metrics);
      setLoading(false);
    };

    calculateMetrics();
  }, [animals, milkRecords, weightRecords, healthEvents, consumption]);

  const runSimulation = (variables: SimulationVariables): SimulationResults => {
    if (!baselineMetrics) {
      return {
        monthlyData: [],
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0,
        roi: 0,
        revenueChange: 0,
        costChange: 0,
        profitChange: 0,
      };
    }

    const monthlyData: MonthlyProjection[] = [];
    let cumulativeRevenue = 0;
    let cumulativeCosts = 0;
    
    // Calculate baseline monthly values
    const baseMonthlyMilk = baselineMetrics.avgDailyMilk * baselineMetrics.femalesCount * 30;
    const baseMonthlyMeat = baselineMetrics.avgDailyGain * baselineMetrics.malesCount * 30;
    const baseFeedCost = baselineMetrics.monthlyFeedCost || (baselineMetrics.totalAnimals * 150000); // Default cost estimate
    const baseHealthCost = baselineMetrics.monthlyHealthCost || (baselineMetrics.totalAnimals * 20000);
    
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
      const laborCosts = (baseFeedCost * 0.3) * (1 + variables.laborCostChange / 100); // Labor ~30% of feed
      const totalCosts = feedCosts + healthCosts + laborCosts;

      // Calculate revenue
      const milkRevenue = milkProduction * baselineMetrics.avgMilkPrice;
      const meatRevenue = meatProduction * baselineMetrics.avgMeatPrice;
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

    // Calculate baseline totals for comparison
    const baselineTotalRevenue = (baseMonthlyMilk * DEFAULT_MILK_PRICE + baseMonthlyMeat * DEFAULT_MEAT_PRICE) * variables.projectionMonths;
    const baselineTotalCosts = (baseFeedCost + baseHealthCost + baseFeedCost * 0.3) * variables.projectionMonths;
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
    };
  };

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
      },
    },
  ];

  return {
    scenarios,
    currentVariables,
    setCurrentVariables,
    baselineMetrics,
    loading,
    runSimulation,
    createScenario,
    deleteScenario,
    compareScenarios,
    getPresetScenarios,
    DEFAULT_VARIABLES,
  };
};
