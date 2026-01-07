import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from './useSettings';

export interface AlertItem {
  id: string;
  type: 'reproduction' | 'health' | 'vaccination' | 'weight' | 'stock' | 'expiration';
  title: string;
  description: string;
  animalId?: string;
  animalTag?: string;
  severity: 'info' | 'warning' | 'critical';
  date: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  const fetchAlerts = async () => {
    setLoading(true);
    const newAlerts: AlertItem[] = [];

    try {
      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      const orgId = profile.organization_id;
      const today = new Date();

      // === Reproductive Alerts ===
      if (settings.reproductionAlerts) {
        // Expected births (within 7 days)
        const { data: pregnantAnimals } = await supabase
          .from('animals')
          .select('id, tag_id, name, expected_calving_date')
          .eq('organization_id', orgId)
          .eq('status', 'activo')
          .eq('reproductive_status', 'preñada')
          .not('expected_calving_date', 'is', null);

        pregnantAnimals?.forEach(animal => {
          if (animal.expected_calving_date) {
            const dueDate = new Date(animal.expected_calving_date);
            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 7 && daysUntil >= -3) {
              newAlerts.push({
                id: `birth-${animal.id}`,
                type: 'reproduction',
                title: daysUntil < 0 ? 'Parto atrasado' : 'Parto próximo',
                description: `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}: ${daysUntil < 0 ? `${Math.abs(daysUntil)} días de atraso` : `${daysUntil} días`}`,
                animalId: animal.id,
                animalTag: animal.tag_id,
                severity: daysUntil < 0 ? 'critical' : 'warning',
                date: animal.expected_calving_date,
              });
            }
          }
        });

        // Heat detection (21 day cycle from last service)
        const { data: servicedAnimals } = await supabase
          .from('animals')
          .select('id, tag_id, name, last_service_date')
          .eq('organization_id', orgId)
          .eq('status', 'activo')
          .eq('reproductive_status', 'servida')
          .not('last_service_date', 'is', null);

        servicedAnimals?.forEach(animal => {
          if (animal.last_service_date) {
            const serviceDate = new Date(animal.last_service_date);
            const daysSince = Math.floor((today.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
            const nextHeat = 21 - (daysSince % 21);
            
            if (nextHeat <= 3) {
              newAlerts.push({
                id: `heat-${animal.id}`,
                type: 'reproduction',
                title: 'Posible celo',
                description: `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}: Revisar en ${nextHeat} días`,
                animalId: animal.id,
                animalTag: animal.tag_id,
                severity: 'info',
                date: today.toISOString(),
              });
            }
          }
        });
      }

      // === Health Alerts ===
      if (settings.healthAlerts) {
        const { data: healthEvents } = await supabase
          .from('health_events')
          .select('id, animal_id, event_type, next_dose_date, animals!inner(tag_id, name)')
          .eq('organization_id', orgId)
          .eq('status', 'activo')
          .not('next_dose_date', 'is', null);

        healthEvents?.forEach(event => {
          if (event.next_dose_date) {
            const nextDate = new Date(event.next_dose_date);
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 3 && daysUntil >= -7) {
              const animal = event.animals as any;
              newAlerts.push({
                id: `health-${event.id}`,
                type: 'health',
                title: daysUntil < 0 ? 'Tratamiento atrasado' : 'Tratamiento pendiente',
                description: `${animal?.tag_id || ''}: ${event.event_type}`,
                animalId: event.animal_id,
                animalTag: animal?.tag_id,
                severity: daysUntil < 0 ? 'critical' : 'warning',
                date: event.next_dose_date,
              });
            }
          }
        });
      }

      // === Vaccination Alerts ===
      if (settings.vaccinationAlerts) {
        const { data: vaccinations } = await supabase
          .from('vaccination_schedule')
          .select('id, animal_id, vaccine_name, scheduled_date, is_applied, animals(tag_id, name)')
          .eq('organization_id', orgId)
          .eq('is_applied', false);

        vaccinations?.forEach(vax => {
          if (vax.scheduled_date) {
            const schedDate = new Date(vax.scheduled_date);
            const daysUntil = Math.ceil((schedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 7 && daysUntil >= -14) {
              const animal = vax.animals as any;
              newAlerts.push({
                id: `vax-${vax.id}`,
                type: 'vaccination',
                title: daysUntil < 0 ? 'Vacuna vencida' : 'Vacuna próxima',
                description: `${animal?.tag_id || 'Lote'}: ${vax.vaccine_name}`,
                animalId: vax.animal_id || undefined,
                animalTag: animal?.tag_id,
                severity: daysUntil < 0 ? 'critical' : 'info',
                date: vax.scheduled_date,
              });
            }
          }
        });
      }

      // === Weight Alerts ===
      if (settings.weightAlertDays > 0) {
        const thresholdDate = new Date(today.getTime() - settings.weightAlertDays * 24 * 60 * 60 * 1000);
        
        const { data: animals } = await supabase
          .from('animals')
          .select('id, tag_id, name, last_weight_date')
          .eq('organization_id', orgId)
          .eq('status', 'activo')
          .in('category', ['novillo', 'novilla', 'ternero', 'ternera']);

        animals?.forEach(animal => {
          const lastWeight = animal.last_weight_date ? new Date(animal.last_weight_date) : null;
          if (!lastWeight || lastWeight < thresholdDate) {
            newAlerts.push({
              id: `weight-${animal.id}`,
              type: 'weight',
              title: 'Sin pesaje reciente',
              description: `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}: ${lastWeight ? `Último: ${lastWeight.toLocaleDateString('es-ES')}` : 'Nunca pesado'}`,
              animalId: animal.id,
              animalTag: animal.tag_id,
              severity: 'info',
              date: today.toISOString(),
            });
          }
        });
      }

      // === Stock Alerts ===
      if (settings.lowStockAlert) {
        const { data: supplies } = await supabase
          .from('supplies')
          .select('id, name, current_stock, min_stock')
          .eq('organization_id', orgId)
          .eq('is_active', true);

        supplies?.forEach(supply => {
          const percentage = supply.min_stock > 0 
            ? (supply.current_stock / supply.min_stock) * 100 
            : 100;
          
          if (percentage <= settings.lowStockThreshold) {
            newAlerts.push({
              id: `stock-${supply.id}`,
              type: 'stock',
              title: 'Stock bajo',
              description: `${supply.name}: ${supply.current_stock} unidades`,
              severity: percentage <= 10 ? 'critical' : 'warning',
              date: today.toISOString(),
            });
          }
        });
      }

      // === Expiration Alerts ===
      if (settings.expirationAlertDays > 0) {
        const expirationThreshold = new Date(today.getTime() + settings.expirationAlertDays * 24 * 60 * 60 * 1000);

        const { data: lots } = await supabase
          .from('supply_lots')
          .select('id, lot_number, expiration_date, supplies!inner(name)')
          .eq('organization_id', orgId)
          .eq('is_depleted', false)
          .not('expiration_date', 'is', null)
          .lte('expiration_date', expirationThreshold.toISOString().split('T')[0]);

        lots?.forEach(lot => {
          const expDate = new Date(lot.expiration_date!);
          const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const supply = lot.supplies as any;
          
          newAlerts.push({
            id: `exp-${lot.id}`,
            type: 'expiration',
            title: daysUntil < 0 ? 'Insumo vencido' : 'Próximo a vencer',
            description: `${supply?.name || ''} (Lote: ${lot.lot_number}): ${daysUntil < 0 ? 'Vencido' : `${daysUntil} días`}`,
            severity: daysUntil < 0 ? 'critical' : 'warning',
            date: lot.expiration_date!,
          });
        });
      }

      // Sort by severity and date
      newAlerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [settings]);

  const counts = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }), [alerts]);

  return {
    alerts,
    counts,
    loading,
    refetch: fetchAlerts,
  };
}
