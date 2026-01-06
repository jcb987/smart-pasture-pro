import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface TraceabilityRecord {
  id: string;
  organization_id: string;
  animal_id: string;
  record_type: 'export' | 'import' | 'transfer' | 'audit';
  record_date: string;
  source_organization?: string;
  destination_organization?: string;
  export_data?: Record<string, unknown>;
  document_hash?: string;
  verification_code?: string;
  notes?: string;
  created_by?: string;
}

export interface AnimalLifeSheet {
  animal: {
    id: string;
    tag_id: string;
    name?: string;
    sex: string;
    breed?: string;
    category: string;
    status: string;
    birth_date?: string;
    entry_date?: string;
    current_weight?: number;
    lot_name?: string;
    origin?: string;
    notes?: string;
  };
  pedigree: {
    mother?: { tag_id: string; name?: string };
    father?: { tag_id: string; name?: string };
  };
  events: Array<{
    date: string;
    type: string;
    category: string;
    description: string;
    details?: Record<string, unknown>;
  }>;
  weightHistory: Array<{
    date: string;
    weight: number;
    daily_gain?: number;
  }>;
  healthEvents: Array<{
    date: string;
    type: string;
    diagnosis?: string;
    treatment?: string;
    veterinarian?: string;
  }>;
  reproductiveEvents: Array<{
    date: string;
    type: string;
    result?: string;
    notes?: string;
  }>;
  milkProduction?: Array<{
    date: string;
    liters: number;
  }>;
  generatedAt: string;
  verificationCode: string;
}

export const useTraceability = () => {
  const [records, setRecords] = useState<TraceabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();

  const getOrganizationId = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .single();
    return profile?.organization_id || null;
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('traceability_records')
      .select('*')
      .order('record_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros de trazabilidad',
        variant: 'destructive',
      });
    } else {
      const mappedData: TraceabilityRecord[] = (data || []).map(r => ({
        ...r,
        record_type: r.record_type as 'export' | 'import' | 'transfer' | 'audit',
        export_data: r.export_data as Record<string, unknown> | undefined,
      }));
      setRecords(mappedData);
    }
  };

  const generateVerificationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generateLifeSheet = async (animalId: string): Promise<AnimalLifeSheet | null> => {
    try {
      // Obtener datos del animal
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('*')
        .eq('id', animalId)
        .single();

      if (animalError || !animal) {
        toast({
          title: 'Error',
          description: 'No se encontró el animal',
          variant: 'destructive',
        });
        return null;
      }

      // Obtener padres
      let mother = null;
      let father = null;
      
      if (animal.mother_id) {
        const { data } = await supabase
          .from('animals')
          .select('tag_id, name')
          .eq('id', animal.mother_id)
          .single();
        mother = data;
      }

      if (animal.father_id) {
        const { data } = await supabase
          .from('animals')
          .select('tag_id, name')
          .eq('id', animal.father_id)
          .single();
        father = data;
      }

      // Obtener eventos generales
      const { data: events } = await supabase
        .from('animal_events')
        .select('*')
        .eq('animal_id', animalId)
        .order('event_date', { ascending: true });

      // Obtener registros de peso
      const { data: weights } = await supabase
        .from('weight_records')
        .select('*')
        .eq('animal_id', animalId)
        .order('weight_date', { ascending: true });

      // Obtener eventos de salud
      const { data: healthEvents } = await supabase
        .from('health_events')
        .select('*')
        .eq('animal_id', animalId)
        .order('event_date', { ascending: true });

      // Obtener eventos reproductivos
      const { data: reproEvents } = await supabase
        .from('reproductive_events')
        .select('*')
        .eq('animal_id', animalId)
        .order('event_date', { ascending: true });

      // Obtener producción de leche si es hembra
      let milkProduction = null;
      if (animal.sex === 'hembra') {
        const { data: milk } = await supabase
          .from('milk_production')
          .select('*')
          .eq('animal_id', animalId)
          .order('production_date', { ascending: true });
        milkProduction = milk?.map(m => ({
          date: m.production_date,
          liters: m.total_liters || 0,
        }));
      }

      const verificationCode = generateVerificationCode();

      const lifeSheet: AnimalLifeSheet = {
        animal: {
          id: animal.id,
          tag_id: animal.tag_id,
          name: animal.name || undefined,
          sex: animal.sex,
          breed: animal.breed || undefined,
          category: animal.category,
          status: animal.status,
          birth_date: animal.birth_date || undefined,
          entry_date: animal.entry_date || undefined,
          current_weight: animal.current_weight || undefined,
          lot_name: animal.lot_name || undefined,
          origin: animal.origin || undefined,
          notes: animal.notes || undefined,
        },
        pedigree: {
          mother: mother ? { tag_id: mother.tag_id, name: mother.name } : undefined,
          father: father ? { tag_id: father.tag_id, name: father.name } : undefined,
        },
        events: (events || []).map(e => ({
          date: e.event_date,
          type: e.event_type,
          category: 'general',
          description: e.notes || e.event_type,
          details: e.details as Record<string, unknown> || undefined,
        })),
        weightHistory: (weights || []).map(w => ({
          date: w.weight_date,
          weight: w.weight_kg,
          daily_gain: w.daily_gain || undefined,
        })),
        healthEvents: (healthEvents || []).map(h => ({
          date: h.event_date,
          type: h.event_type,
          diagnosis: h.diagnosis || undefined,
          treatment: h.treatment || undefined,
          veterinarian: h.veterinarian || undefined,
        })),
        reproductiveEvents: (reproEvents || []).map(r => ({
          date: r.event_date,
          type: r.event_type,
          result: r.pregnancy_result || undefined,
          notes: r.notes || undefined,
        })),
        milkProduction: milkProduction || undefined,
        generatedAt: new Date().toISOString(),
        verificationCode,
      };

      return lifeSheet;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al generar la hoja de vida',
        variant: 'destructive',
      });
      return null;
    }
  };

  const createExportRecord = async (animalId: string, lifeSheet: AnimalLifeSheet, destination?: string) => {
    if (!organizationId) return false;

    const { error } = await supabase
      .from('traceability_records')
      .insert([{
        organization_id: organizationId,
        animal_id: animalId,
        record_type: 'export',
        destination_organization: destination,
        export_data: JSON.parse(JSON.stringify(lifeSheet)) as Json,
        verification_code: lifeSheet.verificationCode,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la exportación',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Éxito',
      description: 'Exportación registrada correctamente',
    });
    fetchRecords();
    return true;
  };

  const createImportRecord = async (animalData: Record<string, unknown>, source: string, verificationCode?: string) => {
    if (!organizationId) return false;

    const { error } = await supabase
      .from('traceability_records')
      .insert([{
        organization_id: organizationId,
        animal_id: animalData.id as string,
        record_type: 'import',
        source_organization: source,
        export_data: JSON.parse(JSON.stringify(animalData)) as Json,
        verification_code: verificationCode,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la importación',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Éxito',
      description: 'Importación registrada correctamente',
    });
    fetchRecords();
    return true;
  };

  const getAnimalTimeline = async (animalId: string) => {
    const timeline: Array<{
      date: string;
      type: string;
      category: string;
      description: string;
      icon: string;
    }> = [];

    // Eventos generales
    const { data: events } = await supabase
      .from('animal_events')
      .select('*')
      .eq('animal_id', animalId);

    events?.forEach(e => {
      timeline.push({
        date: e.event_date,
        type: e.event_type,
        category: 'evento',
        description: e.notes || e.event_type,
        icon: 'Calendar',
      });
    });

    // Pesajes
    const { data: weights } = await supabase
      .from('weight_records')
      .select('*')
      .eq('animal_id', animalId);

    weights?.forEach(w => {
      timeline.push({
        date: w.weight_date,
        type: 'pesaje',
        category: 'peso',
        description: `Peso: ${w.weight_kg} kg`,
        icon: 'Scale',
      });
    });

    // Salud
    const { data: health } = await supabase
      .from('health_events')
      .select('*')
      .eq('animal_id', animalId);

    health?.forEach(h => {
      timeline.push({
        date: h.event_date,
        type: h.event_type,
        category: 'salud',
        description: h.diagnosis || h.event_type,
        icon: 'Heart',
      });
    });

    // Reproducción
    const { data: repro } = await supabase
      .from('reproductive_events')
      .select('*')
      .eq('animal_id', animalId);

    repro?.forEach(r => {
      timeline.push({
        date: r.event_date,
        type: r.event_type,
        category: 'reproduccion',
        description: `${r.event_type}${r.pregnancy_result ? `: ${r.pregnancy_result}` : ''}`,
        icon: 'Baby',
      });
    });

    // Ordenar por fecha
    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getTraceabilityStats = () => {
    const exports = records.filter(r => r.record_type === 'export').length;
    const imports = records.filter(r => r.record_type === 'import').length;
    const transfers = records.filter(r => r.record_type === 'transfer').length;
    const audits = records.filter(r => r.record_type === 'audit').length;

    return {
      totalRecords: records.length,
      exports,
      imports,
      transfers,
      audits,
    };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      await fetchRecords();
      setLoading(false);
    };
    init();
  }, []);

  return {
    records,
    loading,
    generateLifeSheet,
    createExportRecord,
    createImportRecord,
    getAnimalTimeline,
    getTraceabilityStats,
    refetch: fetchRecords,
  };
};
