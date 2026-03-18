import { useAnimals } from '@/hooks/useAnimals';
import { useHealth } from '@/hooks/useHealth';
import { useWeightRecords } from '@/hooks/useWeightRecords';
import { differenceInDays, parseISO } from 'date-fns';

const CALF_CATEGORIES = ['ternero', 'ternera', 'becerro', 'becerra'];

export const useTerneros = () => {
  const { animals, loading: loadingAnimals } = useAnimals();
  const { healthEvents, addHealthEvent, vaccinations } = useHealth();
  const { records: weightRecords, addRecord: addWeightRecord, loading: loadingWeights } = useWeightRecords();

  const terneros = animals.filter(a =>
    CALF_CATEGORIES.includes(a.category) && a.status === 'activo'
  );

  // Alertas de calostro: terneros ≤ 3 días sin nota de calostro en salud
  const colostrumAlerts = terneros.filter(t => {
    if (!t.birth_date) return false;
    const daysSinceBirth = differenceInDays(new Date(), parseISO(t.birth_date));
    if (daysSinceBirth > 3) return false;
    return !healthEvents.some(e =>
      e.animal_id === t.id && (e.notes?.toLowerCase().includes('calostro') || e.notes?.toLowerCase().includes('colostro'))
    );
  });

  // Alertas de destete: terneros 60-120 días sin peso de destete
  const weaningAlerts = terneros.filter(t => {
    if (!t.birth_date) return false;
    const days = differenceInDays(new Date(), parseISO(t.birth_date));
    if (days < 60 || days > 120) return false;
    return !weightRecords.some(r => r.animal_id === t.id && r.weight_type === 'destete');
  });

  const getCalfGrowthRate = (calfId: string): number | null => {
    const weights = weightRecords
      .filter(r => r.animal_id === calfId)
      .sort((a, b) => new Date(a.weight_date).getTime() - new Date(b.weight_date).getTime());
    if (weights.length < 2) return null;
    const first = weights[0];
    const last = weights[weights.length - 1];
    const days = differenceInDays(parseISO(last.weight_date), parseISO(first.weight_date));
    return days > 0 ? ((last.weight_kg - first.weight_kg) / days * 1000) : null; // g/día
  };

  const getDaysOfLife = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    return differenceInDays(new Date(), parseISO(birthDate));
  };

  const avgGDP = terneros.reduce((acc, t) => {
    const gdp = getCalfGrowthRate(t.id);
    if (gdp !== null) acc.push(gdp);
    return acc;
  }, [] as number[]);

  const avgGDPValue = avgGDP.length > 0 ? avgGDP.reduce((a, b) => a + b, 0) / avgGDP.length : null;

  return {
    terneros,
    colostrumAlerts,
    weaningAlerts,
    getCalfGrowthRate,
    getDaysOfLife,
    avgGDP: avgGDPValue,
    addHealthEvent,
    addWeightRecord,
    weightRecords,
    loading: loadingAnimals || loadingWeights,
  };
};
