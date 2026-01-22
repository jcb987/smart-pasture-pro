import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FieldTask {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  category: 'general' | 'health' | 'feeding' | 'reproduction' | 'maintenance' | 'other';
  related_animal_id: string | null;
  related_paddock_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assigned_user?: { full_name: string | null };
  related_animal?: { tag_id: string; name: string | null };
  related_paddock?: { name: string };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  category?: 'general' | 'health' | 'feeding' | 'reproduction' | 'maintenance' | 'other';
  related_animal_id?: string;
  related_paddock_id?: string;
  notes?: string;
}

export const useFieldTasks = () => {
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('field_tasks')
        .select(`
          *,
          assigned_user:profiles!field_tasks_assigned_to_fkey(full_name),
          related_animal:animals(tag_id, name),
          related_paddock:paddocks(name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as any[]) || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskData) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, user_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase.from('field_tasks').insert({
        organization_id: profile.organization_id,
        created_by: profile.user_id,
        ...taskData,
      });

      if (error) throw error;

      toast({
        title: '¡Tarea creada!',
        description: 'La tarea se ha creado correctamente.',
      });

      await fetchTasks();
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

  const updateTask = async (taskId: string, updates: Partial<FieldTask>) => {
    try {
      const updateData: any = { ...updates };
      
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('field_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: '¡Tarea actualizada!',
        description: 'Los cambios se han guardado.',
      });

      await fetchTasks();
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

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('field_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: '¡Tarea eliminada!',
        description: 'La tarea se ha eliminado correctamente.',
      });

      await fetchTasks();
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.due_date && 
    new Date(t.due_date) < new Date()
  );

  return {
    tasks,
    loading,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};
