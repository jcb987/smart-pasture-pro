import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export interface Employee {
  id: string;
  organization_id: string;
  full_name: string;
  document_id?: string;
  position: string;
  department?: string;
  hire_date: string;
  termination_date?: string;
  base_salary: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  bank_name?: string;
  bank_account?: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonuses: number;
  bonus_description?: string;
  deductions: number;
  deduction_description?: string;
  health_insurance: number;
  pension_contribution: number;
  tax_withholding: number;
  other_deductions: number;
  gross_pay: number;
  net_pay: number;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

export const DEPARTMENTS = [
  'Campo',
  'Ordeño',
  'Administración',
  'Mantenimiento',
  'Veterinaria',
  'Seguridad',
  'Otro',
];

export const POSITIONS = [
  'Capataz',
  'Vaquero',
  'Ordeñador',
  'Tractorista',
  'Veterinario',
  'Auxiliar de campo',
  'Vigilante',
  'Administrador',
  'Contador',
  'Otro',
];

export const usePayroll = () => {
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

  // Fetch employees
  const { data: employees = [], isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ['employees', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!organizationId,
  });

  // Fetch payroll records
  const { data: payrollRecords = [], isLoading: loadingPayroll, refetch: refetchPayroll } = useQuery({
    queryKey: ['payroll-records', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, employees(*)')
        .order('period_end', { ascending: false });

      if (error) throw error;
      return data as PayrollRecord[];
    },
    enabled: !!organizationId,
  });

  // Calculate payroll for an employee
  const calculatePayroll = (employee: Employee, params: {
    periodStart: string;
    periodEnd: string;
    overtimeHours?: number;
    bonuses?: number;
    deductions?: number;
  }) => {
    const { overtimeHours = 0, bonuses = 0, deductions = 0 } = params;

    // Calculate overtime pay (1.25x for daytime, 1.75x for nighttime/holidays)
    const hourlyRate = employee.base_salary / 240; // Assuming 240 work hours/month
    const overtimePay = overtimeHours * hourlyRate * 1.25;

    // Calculate deductions (Colombia: health 4%, pension 4%)
    const healthInsurance = employee.base_salary * 0.04;
    const pensionContribution = employee.base_salary * 0.04;

    // Calculate gross and net pay
    const grossPay = employee.base_salary + overtimePay + bonuses;
    const totalDeductions = healthInsurance + pensionContribution + deductions;
    const netPay = grossPay - totalDeductions;

    return {
      base_salary: employee.base_salary,
      overtime_hours: overtimeHours,
      overtime_pay: overtimePay,
      bonuses,
      health_insurance: healthInsurance,
      pension_contribution: pensionContribution,
      deductions,
      other_deductions: 0,
      tax_withholding: 0,
      gross_pay: grossPay,
      net_pay: netPay,
    };
  };

  // Create employee
  const createEmployee = useMutation({
    mutationFn: async (data: Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organizationId) throw new Error('No organization');

      const { error } = await supabase
        .from('employees')
        .insert({
          ...data,
          organization_id: organizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Empleado registrado correctamente');
    },
    onError: (error) => {
      toast.error('Error al registrar empleado: ' + error.message);
    },
  });

  // Update employee
  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Empleado actualizado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Delete employee
  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Empleado eliminado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Create payroll record
  const createPayrollRecord = useMutation({
    mutationFn: async (data: Omit<PayrollRecord, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'employees'>) => {
      if (!organizationId) throw new Error('No organization');

      const { error } = await supabase
        .from('payroll_records')
        .insert({
          ...data,
          organization_id: organizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Nómina registrada');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Update payroll status
  const updatePayrollStatus = useMutation({
    mutationFn: async ({ id, status, paymentDate, paymentMethod, paymentReference }: { 
      id: string; 
      status: PayrollRecord['status'];
      paymentDate?: string;
      paymentMethod?: string;
      paymentReference?: string;
    }) => {
      const { error } = await supabase
        .from('payroll_records')
        .update({ 
          status,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Calculate totals
  const payrollSummary = {
    totalEmployees: employees.filter(e => e.is_active).length,
    totalMonthlyPayroll: employees.filter(e => e.is_active).reduce((sum, e) => sum + Number(e.base_salary), 0),
    pendingPayments: payrollRecords.filter(p => p.status === 'pending').length,
    paidThisMonth: payrollRecords
      .filter(p => {
        const now = new Date();
        const payDate = p.payment_date ? new Date(p.payment_date) : null;
        return payDate && payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear() && p.status === 'paid';
      })
      .reduce((sum, p) => sum + Number(p.net_pay), 0),
  };

  return {
    employees,
    payrollRecords,
    loadingEmployees,
    loadingPayroll,
    refetchEmployees,
    refetchPayroll,
    calculatePayroll,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createPayrollRecord,
    updatePayrollStatus,
    payrollSummary,
  };
};
