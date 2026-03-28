import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { differenceInDays, parseISO, addDays } from 'date-fns';

// Constantes de hallazgos de ovarios
export const OVARY_FINDINGS = {
  normal: [
    { id: 'follicle_left', label: 'Folículo – ovario izquierdo', category: 'normal' },
    { id: 'follicle_right', label: 'Folículo – ovario derecho', category: 'normal' },
    { id: 'multiple_follicles', label: 'Múltiples folículos (ovarios activos)', category: 'normal' },
    { id: 'cl_left', label: 'Cuerpo lúteo (CL) – ovario izquierdo', category: 'normal' },
    { id: 'cl_right', label: 'Cuerpo lúteo (CL) – ovario derecho', category: 'normal' },
    { id: 'cl_follicle', label: 'CL + folículo (actividad mixta)', category: 'normal' },
  ],
  inactive: [
    { id: 'inactive_ovaries', label: 'Ovarios inactivos / anestro', category: 'inactive' },
  ],
  alterations: [
    { id: 'ovarian_cyst', label: 'Quiste ovárico', category: 'alteration' },
    { id: 'follicular_cyst', label: 'Quiste folicular', category: 'alteration', subOf: 'ovarian_cyst' },
    { id: 'luteal_cyst', label: 'Quiste luteal', category: 'alteration', subOf: 'ovarian_cyst' },
    { id: 'single_ovary', label: 'Ovario único palpable', category: 'alteration' },
    { id: 'ovarian_adhesions', label: 'Adherencias ováricas', category: 'alteration' },
    { id: 'ovarian_hypoplasia', label: 'Hipoplasia ovárica', category: 'alteration' },
  ],
};

// Constantes de hallazgos de útero
export const UTERUS_FINDINGS = {
  normal: [
    { id: 'normal_uterus', label: 'Útero normal', category: 'normal' },
    { id: 'flaccid_uterus', label: 'Útero flácido', category: 'normal' },
    { id: 'tonic_uterus', label: 'Útero tónico (celo)', category: 'normal' },
  ],
  alterations: [
    { id: 'uterine_content', label: 'Contenido uterino sin preñez', category: 'alteration' },
    { id: 'mild_endometritis', label: 'Endometritis leve', category: 'alteration' },
    { id: 'pyometra', label: 'Piómetra (pus + CL persistente)', category: 'alteration' },
    { id: 'asymmetric_uterus', label: 'Útero asimétrico sin preñez', category: 'alteration' },
  ],
};

// Condiciones reproductivas
export const REPRODUCTIVE_CONDITIONS = [
  { id: 'empty_cycling', label: 'Vacía cíclica', description: 'Hembra no preñada con actividad ovárica' },
  { id: 'empty_anestrus', label: 'Vacía en anestro', description: 'Hembra sin actividad ovárica' },
  { id: 'early_postpartum', label: 'Postparto temprano (útero en involución)', description: 'Período de recuperación' },
  { id: 'repeat_breeder', label: 'Repetidora (≥3 servicios sin preñez)', description: 'Problema de fertilidad' },
];

export interface PalpationRecord {
  id: string;
  organization_id: string;
  animal_id: string;
  reproductive_event_id?: string;
  palpation_date: string;
  veterinarian?: string;
  species: 'bovino' | 'bufalino';
  is_pregnant: boolean;
  gestation_days?: number;
  body_condition_score?: number;
  ovary_findings: string[];
  uterus_findings: string[];
  reproductive_condition?: string;
  ai_diagnosis?: string;
  ai_recommendations?: string[];
  ai_alert_level?: 'normal' | 'warning' | 'urgent';
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface BirthDelayConfig {
  id: string;
  organization_id: string;
  warning_days: number;
  urgent_days: number;
  bovine_gestation_days: number;
  buffalo_gestation_days: number;
}

export interface BirthDelayAlert {
  animalId: string;
  tagId: string;
  name?: string;
  expectedDate: string;
  daysOverdue: number;
  alertLevel: 'warning' | 'urgent';
  species: 'bovino' | 'bufalino';
  lastPalpation?: PalpationRecord;
  suggestedCauses: string[];
}

export interface UpcomingBirth {
  animalId: string;
  tagId: string;
  name?: string;
  expectedDate: string;
  daysUntilBirth: number;
  species: 'bovino' | 'bufalino';
}

export const usePalpationRecords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgId = async () => {
      if (!user) {
        setOrganizationId(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setOrganizationId(data?.organization_id || null);
    };
    
    fetchOrgId();
  }, [user]);

  // Obtener registros de palpación
  const { data: palpationRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['palpation-records', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('palpation_records')
        .select('*')
        .eq('organization_id', organizationId)
        .order('palpation_date', { ascending: false });
      
      if (error) throw error;
      return data as PalpationRecord[];
    },
    enabled: !!organizationId,
  });

  // Obtener configuración de alertas de parto retrasado
  const { data: birthDelayConfig } = useQuery({
    queryKey: ['birth-delay-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('birth_delay_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Retornar valores por defecto si no existe configuración
      return data as BirthDelayConfig || {
        warning_days: 10,
        urgent_days: 15,
        bovine_gestation_days: 283,
        buffalo_gestation_days: 310,
      };
    },
    enabled: !!organizationId,
  });

  // Obtener animales preñados para alertas
  const { data: pregnantAnimals = [] } = useQuery({
    queryKey: ['pregnant-animals-alerts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('animals')
        .select('id, tag_id, name, expected_calving_date, reproductive_status, breed')
        .eq('organization_id', organizationId)
        .eq('reproductive_status', 'preñada')
        .not('expected_calving_date', 'is', null);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Calcular alertas de parto retrasado
  const birthDelayAlerts = useMemo((): BirthDelayAlert[] => {
    if (!birthDelayConfig || !pregnantAnimals.length) return [];

    const today = new Date();
    const alerts: BirthDelayAlert[] = [];

    pregnantAnimals.forEach(animal => {
      if (!animal.expected_calving_date) return;

      const expectedDate = parseISO(animal.expected_calving_date);
      const daysOverdue = differenceInDays(today, expectedDate);

      // Solo alertar si está pasada la fecha
      if (daysOverdue <= 0) return;

      // Determinar especie (asumimos bovino por defecto)
      const species: 'bovino' | 'bufalino' = animal.breed?.toLowerCase().includes('bufal')
        ? 'bufalino'
        : 'bovino';

      // Determinar nivel de alerta
      const isUrgent = daysOverdue >= birthDelayConfig.urgent_days;
      const isWarning = daysOverdue >= birthDelayConfig.warning_days;

      if (!isWarning) return;

      // Buscar última palpación del animal
      const lastPalpation = palpationRecords.find(p => p.animal_id === animal.id);

      // Generar causas sugeridas basadas en IA
      const suggestedCauses = generateSuggestedCauses(
        daysOverdue,
        lastPalpation,
        species
      );

      alerts.push({
        animalId: animal.id,
        tagId: animal.tag_id,
        name: animal.name || undefined,
        expectedDate: animal.expected_calving_date,
        daysOverdue,
        alertLevel: isUrgent ? 'urgent' : 'warning',
        species,
        lastPalpation,
        suggestedCauses,
      });
    });

    // Ordenar por días de retraso (más urgentes primero)
    return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [pregnantAnimals, birthDelayConfig, palpationRecords]);

  // Partos próximos (dentro de los próximos 14 días)
  const upcomingBirths = useMemo((): UpcomingBirth[] => {
    if (!pregnantAnimals.length) return [];

    const today = new Date();
    const upcoming: UpcomingBirth[] = [];

    pregnantAnimals.forEach(animal => {
      if (!animal.expected_calving_date) return;

      const expectedDate = parseISO(animal.expected_calving_date);
      const daysOverdue = differenceInDays(today, expectedDate);
      const daysUntilBirth = -daysOverdue; // positive = future

      // Solo incluir partos futuros dentro de 14 días
      if (daysUntilBirth <= 0 || daysUntilBirth > 14) return;

      const species: 'bovino' | 'bufalino' = animal.breed?.toLowerCase().includes('bufal')
        ? 'bufalino'
        : 'bovino';

      upcoming.push({
        animalId: animal.id,
        tagId: animal.tag_id,
        name: animal.name || undefined,
        expectedDate: animal.expected_calving_date,
        daysUntilBirth,
        species,
      });
    });

    return upcoming.sort((a, b) => a.daysUntilBirth - b.daysUntilBirth);
  }, [pregnantAnimals]);

  // Agregar registro de palpación
  const addPalpationMutation = useMutation({
    mutationFn: async (record: Omit<PalpationRecord, 'id' | 'created_at' | 'organization_id'>) => {
      if (!organizationId || !user) throw new Error('No organization');
      
      // Generar diagnóstico IA
      const aiAnalysis = generateAIDiagnosis(record);
      
      const { data, error } = await supabase
        .from('palpation_records')
        .insert({
          ...record,
          organization_id: organizationId,
          created_by: user.id,
          ai_diagnosis: aiAnalysis.diagnosis,
          ai_recommendations: aiAnalysis.recommendations,
          ai_alert_level: aiAnalysis.alertLevel,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Actualizar estado reproductivo del animal
      await updateAnimalReproductiveStatus(record);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['palpation-records'] });
      queryClient.invalidateQueries({ queryKey: ['reproductive-females'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      
      const aiAnalysis = generateAIDiagnosis(variables);
      if (aiAnalysis.alertLevel === 'urgent') {
        toast.error('⚠️ Caso veterinario urgente detectado', {
          description: aiAnalysis.diagnosis,
          duration: 8000,
        });
      } else if (aiAnalysis.alertLevel === 'warning') {
        toast.warning('Atención requerida', {
          description: aiAnalysis.diagnosis,
          duration: 6000,
        });
      } else {
        toast.success('Palpación registrada correctamente');
      }
    },
    onError: (error) => {
      toast.error('Error al registrar palpación: ' + error.message);
    },
  });

  // Actualizar estado reproductivo del animal
  const updateAnimalReproductiveStatus = async (record: Omit<PalpationRecord, 'id' | 'created_at' | 'organization_id'>) => {
    let status: string;
    const updates: Record<string, unknown> = {};
    
    if (record.is_pregnant) {
      status = 'preñada';
      if (record.gestation_days) {
        const gestationDays = record.species === 'bufalino' 
          ? (birthDelayConfig?.buffalo_gestation_days || 310)
          : (birthDelayConfig?.bovine_gestation_days || 283);
        const remainingDays = gestationDays - record.gestation_days;
        const expectedDate = addDays(parseISO(record.palpation_date), remainingDays);
        updates.expected_calving_date = expectedDate.toISOString().split('T')[0];
      }
    } else {
      // Determinar status basado en condición reproductiva
      if (record.reproductive_condition === 'empty_anestrus') {
        status = 'vacia'; // Puede necesitar tratamiento
      } else if (record.reproductive_condition === 'early_postpartum') {
        status = 'lactando';
      } else {
        status = 'vacia';
      }
      updates.expected_calving_date = null;
    }
    
    await supabase
      .from('animals')
      .update({
        reproductive_status: status,
        ...updates,
      })
      .eq('id', record.animal_id);
  };

  // Eliminar registro de palpación
  const deletePalpationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('palpation_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['palpation-records'] });
      toast.success('Registro eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Guardar configuración de alertas
  const saveConfigMutation = useMutation({
    mutationFn: async (config: Partial<BirthDelayConfig>) => {
      if (!organizationId) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('birth_delay_config')
        .upsert({
          organization_id: organizationId,
          ...config,
        }, { onConflict: 'organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birth-delay-config'] });
      toast.success('Configuración guardada');
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    },
  });

  // Obtener historial de palpaciones de un animal
  const getAnimalPalpationHistory = (animalId: string) => {
    return palpationRecords.filter(p => p.animal_id === animalId);
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = palpationRecords.length;
    const pregnant = palpationRecords.filter(p => p.is_pregnant).length;
    const empty = total - pregnant;
    const withAlterations = palpationRecords.filter(p => 
      p.ovary_findings.some(f => OVARY_FINDINGS.alterations.some(a => a.id === f)) ||
      p.uterus_findings.some(f => UTERUS_FINDINGS.alterations.some(a => a.id === f))
    ).length;
    const urgentCases = palpationRecords.filter(p => p.ai_alert_level === 'urgent').length;
    const lowBCS = palpationRecords.filter(p => p.body_condition_score && p.body_condition_score < 2.75).length;
    
    return {
      total,
      pregnant,
      empty,
      pregnancyRate: total > 0 ? Math.round((pregnant / total) * 100) : 0,
      withAlterations,
      urgentCases,
      lowBCS,
      birthDelayAlerts: birthDelayAlerts.length,
    };
  }, [palpationRecords, birthDelayAlerts]);

  return {
    palpationRecords,
    birthDelayAlerts,
    upcomingBirths,
    birthDelayConfig,
    stats,
    isLoading: loadingRecords,
    addPalpation: addPalpationMutation.mutate,
    deletePalpation: deletePalpationMutation.mutate,
    saveConfig: saveConfigMutation.mutate,
    getAnimalPalpationHistory,
    OVARY_FINDINGS,
    UTERUS_FINDINGS,
    REPRODUCTIVE_CONDITIONS,
  };
};

// Función para generar diagnóstico IA
function generateAIDiagnosis(record: Omit<PalpationRecord, 'id' | 'created_at' | 'organization_id'>): {
  diagnosis: string;
  recommendations: string[];
  alertLevel: 'normal' | 'warning' | 'urgent';
} {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let alertLevel: 'normal' | 'warning' | 'urgent' = 'normal';
  
  // Analizar hallazgos de ovarios
  const hasActiveOvaries = record.ovary_findings.some(f => 
    ['follicle_left', 'follicle_right', 'multiple_follicles', 'cl_left', 'cl_right', 'cl_follicle'].includes(f)
  );
  const hasInactiveOvaries = record.ovary_findings.includes('inactive_ovaries');
  const hasCyst = record.ovary_findings.some(f => 
    ['ovarian_cyst', 'follicular_cyst', 'luteal_cyst'].includes(f)
  );
  
  // Analizar útero
  const hasPyometra = record.uterus_findings.includes('pyometra');
  const hasEndometritis = record.uterus_findings.includes('mild_endometritis');
  const hasUterineContent = record.uterus_findings.includes('uterine_content');
  
  // Analizar BCS
  const bcs = record.body_condition_score;
  const isLowBCS = bcs && bcs < 2.75;
  const isHighBCS = bcs && bcs > 4.0;
  
  // Diagnóstico para animal preñado
  if (record.is_pregnant) {
    findings.push(`Preñez confirmada (${record.gestation_days || 'N/D'} días)`);
    
    if (isLowBCS) {
      findings.push('BCS bajo para gestación');
      recommendations.push('Mejorar nutrición para asegurar desarrollo fetal');
      alertLevel = 'warning';
    }
    
    return {
      diagnosis: findings.join('. '),
      recommendations,
      alertLevel,
    };
  }
  
  // Diagnóstico para animal NO preñado
  if (record.is_pregnant === false) {
    // Casos urgentes
    if (hasPyometra) {
      findings.push('Piómetra detectada');
      recommendations.push('Tratamiento veterinario urgente');
      recommendations.push('Considerar PGF2α o tratamiento hormonal');
      alertLevel = 'urgent';
    }
    
    if (hasCyst) {
      findings.push('Quiste ovárico presente');
      recommendations.push('Evaluación veterinaria recomendada');
      recommendations.push('Considerar tratamiento hormonal');
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    }
    
    // Casos de advertencia
    if (hasEndometritis) {
      findings.push('Endometritis leve');
      recommendations.push('Tratamiento con antibióticos intrauterinos');
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    }
    
    if (hasInactiveOvaries) {
      findings.push('Ovarios inactivos / anestro');
      if (isLowBCS) {
        recommendations.push('Mejorar nutrición antes de tratamiento hormonal');
      } else {
        recommendations.push('Evaluar tratamiento hormonal (GnRH, progesterona)');
      }
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    }
    
    // Casos normales con recomendaciones
    if (hasActiveOvaries && !hasCyst) {
      if (record.ovary_findings.includes('cl_left') || record.ovary_findings.includes('cl_right')) {
        findings.push('Cuerpo lúteo activo');
        recommendations.push('Esperar próximo celo en 7-14 días');
      }
      
      if (record.ovary_findings.some(f => f.includes('follicle'))) {
        findings.push('Folículo dominante presente');
        recommendations.push('Candidata a servicio/inseminación');
      }
    }
    
    // BCS
    if (isLowBCS) {
      findings.push(`BCS bajo (${bcs})`);
      recommendations.push('Revisar programa nutricional');
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    } else if (isHighBCS) {
      findings.push(`BCS alto (${bcs})`);
      recommendations.push('Riesgo metabólico - ajustar dieta');
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    }
    
    // Condición reproductiva
    if (record.reproductive_condition === 'repeat_breeder') {
      findings.push('Repetidora');
      recommendations.push('Evaluar calidad seminal y técnica de inseminación');
      recommendations.push('Considerar exámenes complementarios');
      alertLevel = alertLevel === 'urgent' ? 'urgent' : 'warning';
    }
    
    // Bufalinos - consideraciones especiales
    if (record.species === 'bufalino') {
      if (hasInactiveOvaries) {
        recommendations.push('En bufalinos el anestro postparto es más prolongado - evaluar días postparto');
      }
    }
  }
  
  // Si no hay hallazgos específicos
  if (findings.length === 0) {
    findings.push('Examen sin hallazgos significativos');
    recommendations.push('Continuar monitoreo regular');
  }
  
  return {
    diagnosis: findings.join('. '),
    recommendations,
    alertLevel,
  };
}

// Función para generar causas sugeridas de retraso de parto
function generateSuggestedCauses(
  daysOverdue: number,
  lastPalpation?: PalpationRecord,
  species?: 'bovino' | 'bufalino'
): string[] {
  const causes: string[] = [];
  
  // Causas comunes
  if (daysOverdue > 15) {
    causes.push('Retención fetal');
    causes.push('Feto muerto');
  }
  
  causes.push('Gestación prolongada normal');
  causes.push('Error en fecha de servicio/inseminación');
  
  // Basado en última palpación
  if (lastPalpation) {
    if (lastPalpation.body_condition_score && lastPalpation.body_condition_score < 2.75) {
      causes.push('Mal estado corporal puede retrasar parto');
    }
    
    if (lastPalpation.uterus_findings.includes('uterine_content') || 
        lastPalpation.uterus_findings.includes('mild_endometritis')) {
      causes.push('Infecciones uterinas previas');
    }
  }
  
  // Por especie
  if (species === 'bufalino') {
    causes.push('Gestación naturalmente más larga en bufalinos (310+ días)');
  }
  
  // Causas hormonales
  causes.push('Problemas hormonales');
  causes.push('Hipocalcemia subclínica');
  
  return causes;
}
