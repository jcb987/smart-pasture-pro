import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useHealth } from './useHealth';
import { useAnimals } from './useAnimals';

export interface MedicationAuditReport {
  id: string;
  organization_id: string;
  report_name: string;
  report_period_start: string;
  report_period_end: string;
  certification_standard?: string;
  total_treatments: number;
  total_animals_treated: number;
  total_medications_used: number;
  withdrawal_violations: number;
  animals_in_withdrawal: number;
  report_data: any;
  generated_by?: string;
  generated_at: string;
  status: 'draft' | 'final' | 'submitted';
}

export interface MedicationSummary {
  medicationName: string;
  timesUsed: number;
  animalsAffected: number;
  totalCost: number;
  avgWithdrawalDays: number;
}

export interface AnimalTreatmentHistory {
  animalId: string;
  tagId: string;
  animalName?: string;
  treatments: {
    date: string;
    medication: string;
    dosage?: string;
    withdrawalEndDate?: string;
    isInWithdrawal: boolean;
  }[];
}

export const CERTIFICATION_STANDARDS = [
  { value: 'bord_bia', label: 'Bord Bia (Irlanda)' },
  { value: 'global_gap', label: 'Global G.A.P.' },
  { value: 'usda_organic', label: 'USDA Organic' },
  { value: 'ica_colombia', label: 'ICA Colombia' },
  { value: 'senasa', label: 'SENASA' },
  { value: 'other', label: 'Otro' },
];

export const useMedicationAudit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { healthEvents } = useHealth();
  const { animals } = useAnimals();

  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setOrganizationId(data?.organization_id || null);
    };
    getOrgId();
  }, [user]);

  // Fetch audit reports
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['medication-audit-reports', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('medication_audit_reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as MedicationAuditReport[];
    },
    enabled: !!organizationId,
  });

  // Generate medication summary for a period
  const generateMedicationSummary = (startDate: string, endDate: string): MedicationSummary[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const treatmentEvents = (healthEvents || []).filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= start && eventDate <= end && e.medication;
    });

    const medicationMap = new Map<string, MedicationSummary>();

    treatmentEvents.forEach(event => {
      const medName = event.medication || 'Sin especificar';
      const existing = medicationMap.get(medName) || {
        medicationName: medName,
        timesUsed: 0,
        animalsAffected: 0,
        totalCost: 0,
        avgWithdrawalDays: 0,
      };

      existing.timesUsed++;
      existing.totalCost += Number(event.cost || 0);
      existing.avgWithdrawalDays = (existing.avgWithdrawalDays * (existing.timesUsed - 1) + Number(event.withdrawal_days || 0)) / existing.timesUsed;

      medicationMap.set(medName, existing);
    });

    // Count unique animals per medication
    medicationMap.forEach((summary, medName) => {
      const uniqueAnimals = new Set(
        treatmentEvents
          .filter(e => e.medication === medName)
          .map(e => e.animal_id)
      );
      summary.animalsAffected = uniqueAnimals.size;
    });

    return Array.from(medicationMap.values()).sort((a, b) => b.timesUsed - a.timesUsed);
  };

  // Get animals treatment history
  const getAnimalTreatmentHistory = (startDate: string, endDate: string): AnimalTreatmentHistory[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const treatmentEvents = (healthEvents || []).filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= start && eventDate <= end && e.medication;
    });

    const animalMap = new Map<string, AnimalTreatmentHistory>();

    treatmentEvents.forEach(event => {
      const animal = (animals || []).find(a => a.id === event.animal_id);
      if (!animal) return;

      const existing = animalMap.get(event.animal_id) || {
        animalId: event.animal_id,
        tagId: animal.tag_id,
        animalName: animal.name || undefined,
        treatments: [],
      };

      const withdrawalEndDate = event.withdrawal_end_date;
      const isInWithdrawal = withdrawalEndDate ? new Date(withdrawalEndDate) > now : false;

      existing.treatments.push({
        date: event.event_date,
        medication: event.medication || '',
        dosage: event.dosage || undefined,
        withdrawalEndDate: event.withdrawal_end_date || undefined,
        isInWithdrawal,
      });

      animalMap.set(event.animal_id, existing);
    });

    return Array.from(animalMap.values());
  };

  // Get animals currently in withdrawal
  const getAnimalsInWithdrawal = (): { animal: any; withdrawalEndDate: string; medication: string }[] => {
    const now = new Date();

    return (healthEvents || [])
      .filter(e => e.withdrawal_end_date && new Date(e.withdrawal_end_date) > now)
      .map(e => {
        const animal = (animals || []).find(a => a.id === e.animal_id);
        return {
          animal,
          withdrawalEndDate: e.withdrawal_end_date!,
          medication: e.medication || '',
        };
      })
      .filter(item => item.animal);
  };

  // Generate audit report
  const generateReport = useMutation({
    mutationFn: async (params: {
      reportName: string;
      startDate: string;
      endDate: string;
      certificationStandard?: string;
    }) => {
      if (!organizationId) throw new Error('No organization');

      const { reportName, startDate, endDate, certificationStandard } = params;

      // Calculate all metrics
      const medicationSummary = generateMedicationSummary(startDate, endDate);
      const animalHistory = getAnimalTreatmentHistory(startDate, endDate);
      const animalsInWithdrawal = getAnimalsInWithdrawal();

      const totalTreatments = medicationSummary.reduce((sum, m) => sum + m.timesUsed, 0);
      const totalAnimals = new Set(animalHistory.map(a => a.animalId)).size;
      const totalMedications = medicationSummary.length;
      const withdrawalViolations = 0; // Would need sales data to calculate

      const reportData = {
        medicationSummary,
        animalHistory,
        animalsInWithdrawal: animalsInWithdrawal.map(item => ({
          tagId: item.animal?.tag_id,
          name: item.animal?.name,
          medication: item.medication,
          withdrawalEndDate: item.withdrawalEndDate,
        })),
      };

      const { error } = await supabase
        .from('medication_audit_reports')
        .insert([{
          organization_id: organizationId,
          report_name: reportName,
          report_period_start: startDate,
          report_period_end: endDate,
          certification_standard: certificationStandard,
          total_treatments: totalTreatments,
          total_animals_treated: totalAnimals,
          total_medications_used: totalMedications,
          withdrawal_violations: withdrawalViolations,
          animals_in_withdrawal: animalsInWithdrawal.length,
          report_data: JSON.parse(JSON.stringify(reportData)),
          status: 'draft',
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-audit-reports'] });
      toast.success('Reporte generado correctamente');
    },
    onError: (error) => {
      toast.error('Error al generar reporte: ' + error.message);
    },
  });

  // Update report status
  const updateReportStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MedicationAuditReport['status'] }) => {
      const { error } = await supabase
        .from('medication_audit_reports')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-audit-reports'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Delete report
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medication_audit_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-audit-reports'] });
      toast.success('Reporte eliminado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  return {
    reports,
    isLoading,
    refetch,
    generateMedicationSummary,
    getAnimalTreatmentHistory,
    getAnimalsInWithdrawal,
    generateReport,
    updateReportStatus,
    deleteReport,
  };
};
