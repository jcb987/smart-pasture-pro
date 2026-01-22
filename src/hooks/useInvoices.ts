import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string | null;
  invoice_type: 'purchase' | 'sale' | 'expense' | 'other';
  supplier_name: string | null;
  supplier_id: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  file_url: string | null;
  file_name: string | null;
  parsed_data: Record<string, any> | null;
  items: InvoiceItem[] | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreateInvoiceData {
  invoice_number?: string;
  invoice_type: 'purchase' | 'sale' | 'expense' | 'other';
  supplier_name?: string;
  supplier_id?: string;
  issue_date?: string;
  due_date?: string;
  subtotal: number;
  tax_amount?: number;
  total_amount: number;
  currency?: string;
  items?: InvoiceItem[];
  notes?: string;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(invoice => ({
        ...invoice,
        items: invoice.items as unknown as InvoiceItem[] | null,
        parsed_data: invoice.parsed_data as Record<string, any> | null,
      })) as Invoice[];
      
      setInvoices(transformedData);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: CreateInvoiceData) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, user_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const insertData = {
        organization_id: profile.organization_id,
        created_by: profile.user_id,
        invoice_number: invoiceData.invoice_number,
        invoice_type: invoiceData.invoice_type,
        supplier_name: invoiceData.supplier_name,
        supplier_id: invoiceData.supplier_id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.tax_amount || 0,
        total_amount: invoiceData.total_amount,
        currency: invoiceData.currency || 'COP',
        items: invoiceData.items as unknown as Json,
        notes: invoiceData.notes,
      };

      const { error } = await supabase.from('invoices').insert(insertData);

      if (error) throw error;

      toast({
        title: '¡Factura creada!',
        description: 'La factura se ha registrado correctamente.',
      });

      await fetchInvoices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>) => {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.invoice_number !== undefined) updateData.invoice_number = updates.invoice_number;
      if (updates.supplier_name !== undefined) updateData.supplier_name = updates.supplier_name;
      if (updates.total_amount !== undefined) updateData.total_amount = updates.total_amount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.items !== undefined) updateData.items = updates.items as unknown as Json;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: '¡Factura actualizada!',
        description: 'Los cambios se han guardado.',
      });

      await fetchInvoices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: '¡Factura eliminada!',
        description: 'La factura se ha eliminado correctamente.',
      });

      await fetchInvoices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    return updateInvoice(invoiceId, { status: 'paid' });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const overdueInvoices = invoices.filter(i => 
    i.status === 'pending' && 
    i.due_date && 
    new Date(i.due_date) < new Date()
  );

  const totalPending = pendingInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  return {
    invoices,
    loading,
    pendingInvoices,
    paidInvoices,
    overdueInvoices,
    totalPending,
    totalPaid,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    refetch: fetchInvoices,
  };
};
