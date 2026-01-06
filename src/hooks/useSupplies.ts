import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Supply {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number | null;
  supplier: string | null;
  location: string | null;
  withdrawal_days: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplyLot {
  id: string;
  organization_id: string;
  supply_id: string;
  lot_number: string;
  quantity: number;
  expiration_date: string | null;
  manufacture_date: string | null;
  purchase_date: string | null;
  unit_cost: number | null;
  supplier: string | null;
  notes: string | null;
  is_depleted: boolean;
  created_at: string;
  supply?: Supply;
}

export interface SupplyMovement {
  id: string;
  organization_id: string;
  supply_id: string;
  lot_id: string | null;
  movement_type: 'entrada' | 'salida' | 'ajuste';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string | null;
  reference_number: string | null;
  animal_id: string | null;
  lot_name: string | null;
  movement_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  supply?: Supply;
  supply_lot?: SupplyLot;
  animals?: { tag_id: string; name: string | null } | null;
}

export const SUPPLY_CATEGORIES = [
  { value: 'medicamento', label: 'Medicamentos' },
  { value: 'vacuna', label: 'Vacunas' },
  { value: 'desparasitante', label: 'Desparasitantes' },
  { value: 'vitamina', label: 'Vitaminas/Suplementos' },
  { value: 'antibiotico', label: 'Antibióticos' },
  { value: 'hormonal', label: 'Hormonales' },
  { value: 'limpieza', label: 'Productos de Limpieza' },
  { value: 'sellador', label: 'Selladores de Pezón' },
  { value: 'herramienta', label: 'Herramientas' },
  { value: 'equipo', label: 'Equipos' },
  { value: 'repuesto', label: 'Repuestos' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'fertilizante', label: 'Fertilizantes' },
  { value: 'semilla', label: 'Semillas' },
  { value: 'otro', label: 'Otros' },
];

export const MOVEMENT_REASONS = {
  entrada: [
    { value: 'compra', label: 'Compra' },
    { value: 'donacion', label: 'Donación' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'inventario_inicial', label: 'Inventario Inicial' },
  ],
  salida: [
    { value: 'uso_animal', label: 'Uso en Animal' },
    { value: 'uso_general', label: 'Uso General' },
    { value: 'vencimiento', label: 'Vencimiento/Caducidad' },
    { value: 'perdida', label: 'Pérdida/Daño' },
    { value: 'venta', label: 'Venta' },
    { value: 'transferencia', label: 'Transferencia' },
  ],
  ajuste: [
    { value: 'inventario', label: 'Ajuste de Inventario' },
    { value: 'correccion', label: 'Corrección' },
  ],
};

export const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'litro', label: 'Litros' },
  { value: 'gramo', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'dosis', label: 'Dosis' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'caja', label: 'Caja' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'galon', label: 'Galón' },
];

export const useSupplies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

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

  // Fetch supplies
  const { data: supplies = [], isLoading: loadingSupplies } = useQuery({
    queryKey: ['supplies', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Supply[];
    },
    enabled: !!organizationId,
  });

  // Fetch lots
  const { data: lots = [], isLoading: loadingLots } = useQuery({
    queryKey: ['supply-lots', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_lots')
        .select('*, supply:supplies(*)')
        .eq('is_depleted', false)
        .order('expiration_date', { ascending: true });
      if (error) throw error;
      return data as SupplyLot[];
    },
    enabled: !!organizationId,
  });

  // Fetch movements (kardex)
  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['supply-movements', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_movements')
        .select('*, supply:supplies(*), supply_lot:supply_lots(*), animals(tag_id, name)')
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as SupplyMovement[];
    },
    enabled: !!organizationId,
  });

  // Add supply
  const addSupply = useMutation({
    mutationFn: async (data: Omit<Supply, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organizationId) throw new Error('No organization');
      const { error } = await supabase
        .from('supplies')
        .insert({ ...data, organization_id: organizationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast.success('Insumo agregado correctamente');
    },
    onError: (error) => toast.error('Error: ' + error.message),
  });

  // Update supply
  const updateSupply = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supply> & { id: string }) => {
      const { error } = await supabase
        .from('supplies')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast.success('Insumo actualizado');
    },
    onError: (error) => toast.error('Error: ' + error.message),
  });

  // Delete supply
  const deleteSupply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast.success('Insumo eliminado');
    },
    onError: (error) => toast.error('Error: ' + error.message),
  });

  // Add lot
  const addLot = useMutation({
    mutationFn: async (data: Omit<SupplyLot, 'id' | 'organization_id' | 'created_at' | 'supply' | 'is_depleted'>) => {
      if (!organizationId) throw new Error('No organization');
      const { error } = await supabase
        .from('supply_lots')
        .insert({ ...data, organization_id: organizationId });
      if (error) throw error;

      // Update supply stock
      const supply = supplies.find(s => s.id === data.supply_id);
      if (supply) {
        await supabase
          .from('supplies')
          .update({ current_stock: supply.current_stock + data.quantity })
          .eq('id', data.supply_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-lots'] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast.success('Lote agregado correctamente');
    },
    onError: (error) => toast.error('Error: ' + error.message),
  });

  // Add movement (kardex entry)
  const addMovement = useMutation({
    mutationFn: async (data: Omit<SupplyMovement, 'id' | 'organization_id' | 'created_at' | 'supply' | 'supply_lot' | 'animals'>) => {
      if (!organizationId) throw new Error('No organization');

      const supply = supplies.find(s => s.id === data.supply_id);
      if (!supply) throw new Error('Insumo no encontrado');

      // Calculate new stock
      let newStock = supply.current_stock;
      if (data.movement_type === 'entrada') {
        newStock += data.quantity;
      } else if (data.movement_type === 'salida') {
        if (data.quantity > supply.current_stock) {
          throw new Error('Stock insuficiente');
        }
        newStock -= data.quantity;
      } else {
        // ajuste - quantity is the new absolute value
        newStock = data.quantity;
      }

      // Insert movement
      const { error: movementError } = await supabase
        .from('supply_movements')
        .insert({
          ...data,
          organization_id: organizationId,
          created_by: user?.id,
          total_cost: data.unit_cost ? data.quantity * data.unit_cost : null,
        });
      if (movementError) throw movementError;

      // Update supply stock
      const { error: stockError } = await supabase
        .from('supplies')
        .update({ current_stock: newStock })
        .eq('id', data.supply_id);
      if (stockError) throw stockError;

      // Update lot if applicable
      if (data.lot_id && data.movement_type === 'salida') {
        const lot = lots.find(l => l.id === data.lot_id);
        if (lot) {
          const newLotQty = lot.quantity - data.quantity;
          await supabase
            .from('supply_lots')
            .update({ 
              quantity: Math.max(0, newLotQty),
              is_depleted: newLotQty <= 0 
            })
            .eq('id', data.lot_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-movements'] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['supply-lots'] });
      toast.success('Movimiento registrado');
    },
    onError: (error) => toast.error('Error: ' + error.message),
  });

  // Get alerts
  const getAlerts = () => {
    const lowStockAlerts = supplies.filter(s => s.current_stock <= s.min_stock && s.is_active);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringLots = lots.filter(l => {
      if (!l.expiration_date) return false;
      const expDate = new Date(l.expiration_date);
      return expDate <= thirtyDaysFromNow && l.quantity > 0;
    });

    const expiredLots = lots.filter(l => {
      if (!l.expiration_date) return false;
      const expDate = new Date(l.expiration_date);
      return expDate < today && l.quantity > 0;
    });

    return { lowStockAlerts, expiringLots, expiredLots };
  };

  // Get kardex for a specific supply
  const getKardex = (supplyId: string) => {
    return movements
      .filter(m => m.supply_id === supplyId)
      .sort((a, b) => {
        const dateCompare = new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  };

  // Get stats
  const getStats = () => {
    const totalValue = supplies.reduce((sum, s) => {
      return sum + (s.current_stock * (s.unit_cost || 0));
    }, 0);

    const { lowStockAlerts, expiringLots, expiredLots } = getAlerts();

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthMovements = movements.filter(m => m.movement_date >= monthAgo);
    const monthlyConsumption = monthMovements
      .filter(m => m.movement_type === 'salida')
      .reduce((sum, m) => sum + (m.total_cost || 0), 0);

    return {
      totalItems: supplies.length,
      totalValue,
      lowStockCount: lowStockAlerts.length,
      expiringCount: expiringLots.length,
      expiredCount: expiredLots.length,
      monthlyConsumption,
      totalLots: lots.length,
    };
  };

  return {
    supplies,
    lots,
    movements,
    loading: loadingSupplies || loadingLots || loadingMovements,
    addSupply,
    updateSupply,
    deleteSupply,
    addLot,
    addMovement,
    getAlerts,
    getKardex,
    getStats,
    organizationId,
  };
};
