import { useMemo } from 'react';

export interface FertilityMetrics {
  animalId: string;
  tagId: string;
  name: string | null;
  totalServices: number;
  totalPregnancies: number;
  conceptionRate: number;
  avgServicesPerConception: number;
  avgOpenDays: number;
  avgCalvingInterval: number;
  firstServiceConception: boolean;
  fertilityScore: number;
  recommendation: string;
  predictedNextConception: number; // probabilidad %
}

export interface HerdFertilityStats {
  avgConceptionRate: number;
  avgServicesPerConception: number;
  avgOpenDays: number;
  avgCalvingInterval: number;
  firstServiceConceptionRate: number;
  topFertile: FertilityMetrics[];
  needsAttention: FertilityMetrics[];
}

interface ReproductiveEvent {
  id: string;
  animal_id: string;
  event_type: string;
  event_date: string;
  pregnancy_result?: string | null;
  bull_id?: string | null;
  calf_id?: string | null;
  notes?: string | null;
}

interface Female {
  id: string;
  tag_id: string;
  name: string | null;
  category: string;
  reproductive_status?: string | null;
  last_calving_date?: string | null;
  last_service_date?: string | null;
  first_calving_date?: string | null;
  total_calvings?: number | null;
}

/**
 * Hook para análisis predictivo de fertilidad
 * Funcionalidad de alta prioridad del análisis InterHerd
 */
export function useFertilityAnalysis(females: Female[], events: ReproductiveEvent[]) {
  
  /**
   * Calcula métricas de fertilidad para un animal específico
   */
  const getAnimalFertility = (animalId: string): FertilityMetrics | null => {
    const female = females.find(f => f.id === animalId);
    if (!female) return null;

    const animalEvents = events
      .filter(e => e.animal_id === animalId)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    // Contar servicios y preñeces
    const services = animalEvents.filter(e => 
      e.event_type === 'servicio' || e.event_type === 'inseminacion'
    );
    
    const palpations = animalEvents.filter(e => 
      e.event_type === 'palpacion' && e.pregnancy_result === 'positivo'
    );

    const calvings = animalEvents.filter(e => e.event_type === 'parto');

    const totalServices = services.length;
    const totalPregnancies = Math.max(palpations.length, calvings.length);

    // Tasa de concepción
    const conceptionRate = totalServices > 0 
      ? Math.round((totalPregnancies / totalServices) * 100) 
      : 0;

    // Servicios por concepción
    const avgServicesPerConception = totalPregnancies > 0 
      ? Math.round((totalServices / totalPregnancies) * 10) / 10 
      : totalServices;

    // Calcular días abiertos promedio (del parto al siguiente servicio)
    let totalOpenDays = 0;
    let openDaysCount = 0;

    for (let i = 0; i < calvings.length; i++) {
      const calving = calvings[i];
      const nextService = services.find(s => 
        new Date(s.event_date) > new Date(calving.event_date)
      );
      
      if (nextService) {
        const days = Math.ceil(
          (new Date(nextService.event_date).getTime() - new Date(calving.event_date).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        totalOpenDays += days;
        openDaysCount++;
      }
    }

    const avgOpenDays = openDaysCount > 0 ? Math.round(totalOpenDays / openDaysCount) : 0;

    // Calcular intervalo entre partos
    let totalInterval = 0;
    let intervalCount = 0;

    for (let i = 1; i < calvings.length; i++) {
      const days = Math.ceil(
        (new Date(calvings[i].event_date).getTime() - new Date(calvings[i-1].event_date).getTime())
        / (1000 * 60 * 60 * 24)
      );
      totalInterval += days;
      intervalCount++;
    }

    const avgCalvingInterval = intervalCount > 0 ? Math.round(totalInterval / intervalCount) : 0;

    // Concepción al primer servicio
    let firstServiceConception = false;
    if (services.length > 0 && palpations.length > 0) {
      const firstService = services[0];
      const nextPalpation = palpations.find(p => 
        new Date(p.event_date) > new Date(firstService.event_date)
      );
      if (nextPalpation) {
        const daysDiff = Math.ceil(
          (new Date(nextPalpation.event_date).getTime() - new Date(firstService.event_date).getTime())
          / (1000 * 60 * 60 * 24)
        );
        // Si la palpación positiva fue 30-60 días después del primer servicio
        firstServiceConception = daysDiff >= 30 && daysDiff <= 90;
      }
    }

    // Calcular score de fertilidad (0-100)
    let fertilityScore = 50; // base

    // Ajustar por tasa de concepción
    if (conceptionRate >= 60) fertilityScore += 20;
    else if (conceptionRate >= 40) fertilityScore += 10;
    else if (conceptionRate < 20) fertilityScore -= 20;

    // Ajustar por servicios por concepción
    if (avgServicesPerConception <= 1.5) fertilityScore += 15;
    else if (avgServicesPerConception <= 2) fertilityScore += 5;
    else if (avgServicesPerConception > 3) fertilityScore -= 15;

    // Ajustar por días abiertos
    if (avgOpenDays > 0) {
      if (avgOpenDays <= 90) fertilityScore += 10;
      else if (avgOpenDays > 150) fertilityScore -= 15;
    }

    // Ajustar por intervalo entre partos
    if (avgCalvingInterval > 0) {
      if (avgCalvingInterval <= 365) fertilityScore += 10;
      else if (avgCalvingInterval > 450) fertilityScore -= 10;
    }

    // Bonus por concepción al primer servicio
    if (firstServiceConception) fertilityScore += 5;

    fertilityScore = Math.max(0, Math.min(100, fertilityScore));

    // Generar recomendación
    let recommendation = '';
    if (fertilityScore >= 80) {
      recommendation = '🌟 Excelente fertilidad. Candidata para donadora de embriones.';
    } else if (fertilityScore >= 60) {
      recommendation = '✅ Buena fertilidad. Mantener manejo actual.';
    } else if (fertilityScore >= 40) {
      recommendation = '⚠️ Fertilidad moderada. Revisar nutrición y detección de celo.';
    } else {
      recommendation = '🔴 Fertilidad baja. Evaluar causas: nutrición, salud uterina, toro.';
    }

    // Predicción de próxima concepción basada en historial
    let predictedNextConception = 50; // base
    if (conceptionRate > 0) predictedNextConception = conceptionRate;
    if (firstServiceConception) predictedNextConception += 10;
    predictedNextConception = Math.min(95, predictedNextConception);

    return {
      animalId,
      tagId: female.tag_id,
      name: female.name,
      totalServices,
      totalPregnancies,
      conceptionRate,
      avgServicesPerConception,
      avgOpenDays,
      avgCalvingInterval,
      firstServiceConception,
      fertilityScore,
      recommendation,
      predictedNextConception
    };
  };

  /**
   * Obtener análisis de fertilidad de todo el hato
   */
  const getAllFertilityAnalysis = useMemo(() => {
    return females
      .map(f => getAnimalFertility(f.id))
      .filter((m): m is FertilityMetrics => m !== null)
      .sort((a, b) => b.fertilityScore - a.fertilityScore);
  }, [females, events]);

  /**
   * Estadísticas generales del hato
   */
  const herdStats = useMemo((): HerdFertilityStats => {
    const validMetrics = getAllFertilityAnalysis.filter(m => m.totalServices > 0);
    
    if (validMetrics.length === 0) {
      return {
        avgConceptionRate: 0,
        avgServicesPerConception: 0,
        avgOpenDays: 0,
        avgCalvingInterval: 0,
        firstServiceConceptionRate: 0,
        topFertile: [],
        needsAttention: []
      };
    }

    const avgConceptionRate = Math.round(
      validMetrics.reduce((s, m) => s + m.conceptionRate, 0) / validMetrics.length
    );

    const avgServicesPerConception = Math.round(
      validMetrics.reduce((s, m) => s + m.avgServicesPerConception, 0) / validMetrics.length * 10
    ) / 10;

    const withOpenDays = validMetrics.filter(m => m.avgOpenDays > 0);
    const avgOpenDays = withOpenDays.length > 0
      ? Math.round(withOpenDays.reduce((s, m) => s + m.avgOpenDays, 0) / withOpenDays.length)
      : 0;

    const withInterval = validMetrics.filter(m => m.avgCalvingInterval > 0);
    const avgCalvingInterval = withInterval.length > 0
      ? Math.round(withInterval.reduce((s, m) => s + m.avgCalvingInterval, 0) / withInterval.length)
      : 0;

    const firstServiceCount = validMetrics.filter(m => m.firstServiceConception).length;
    const firstServiceConceptionRate = Math.round((firstServiceCount / validMetrics.length) * 100);

    const topFertile = getAllFertilityAnalysis
      .filter(m => m.fertilityScore >= 70)
      .slice(0, 10);

    const needsAttention = getAllFertilityAnalysis
      .filter(m => m.fertilityScore < 40)
      .slice(0, 10);

    return {
      avgConceptionRate,
      avgServicesPerConception,
      avgOpenDays,
      avgCalvingInterval,
      firstServiceConceptionRate,
      topFertile,
      needsAttention
    };
  }, [getAllFertilityAnalysis]);

  /**
   * Obtener hembras con mejor probabilidad de preñez para próximo ciclo
   */
  const bestCandidatesForService = useMemo(() => {
    return females
      .filter(f => f.reproductive_status === 'vacia' || f.reproductive_status === 'servida')
      .map(f => {
        const metrics = getAnimalFertility(f.id);
        return { female: f, metrics };
      })
      .filter(({ metrics }) => metrics !== null)
      .sort((a, b) => (b.metrics?.predictedNextConception || 0) - (a.metrics?.predictedNextConception || 0))
      .slice(0, 10);
  }, [females, events]);

  return {
    getAnimalFertility,
    getAllFertilityAnalysis,
    herdStats,
    bestCandidatesForService
  };
}
