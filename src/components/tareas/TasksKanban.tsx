import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlayCircle,
  Calendar,
  User,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { FieldTask } from '@/hooks/useFieldTasks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksKanbanProps {
  tasks: FieldTask[];
  loading: boolean;
  onUpdateStatus: (taskId: string, status: FieldTask['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: FieldTask) => void;
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const categoryLabels = {
  general: 'General',
  health: 'Salud',
  feeding: 'Alimentación',
  reproduction: 'Reproducción',
  maintenance: 'Mantenimiento',
  other: 'Otro',
};

const TaskCard = ({ 
  task, 
  onUpdateStatus, 
  onDelete,
  onEdit,
}: { 
  task: FieldTask; 
  onUpdateStatus: (taskId: string, status: FieldTask['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: FieldTask) => void;
}) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {task.status === 'pending' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'in_progress')}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Iniciar
                </DropdownMenuItem>
              )}
              {task.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'completed')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[task.category]}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          {task.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'dd MMM', { locale: es })}
            </div>
          )}
          {task.assigned_user?.full_name && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assigned_user.full_name.split(' ')[0]}
            </div>
          )}
        </div>

        {task.related_animal && (
          <div className="mt-2 text-xs text-muted-foreground">
            🐄 {task.related_animal.tag_id}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Column = ({ 
  title, 
  icon: Icon, 
  tasks, 
  color,
  loading,
  onUpdateStatus,
  onDelete,
  onEdit,
}: { 
  title: string; 
  icon: React.ElementType; 
  tasks: FieldTask[];
  color: string;
  loading: boolean;
  onUpdateStatus: (taskId: string, status: FieldTask['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: FieldTask) => void;
}) => (
  <div className="flex-1 min-w-[280px]">
    <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${color}`}>
      <Icon className="h-5 w-5" />
      <span className="font-medium">{title}</span>
      <Badge variant="secondary" className="ml-auto">
        {tasks.length}
      </Badge>
    </div>
    <div className="space-y-2">
      {loading ? (
        <>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay tareas
        </p>
      ) : (
        tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
    </div>
  </div>
);

export const TasksKanban = ({ 
  tasks, 
  loading, 
  onUpdateStatus, 
  onDelete,
  onEdit,
}: TasksKanbanProps) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed').slice(0, 10);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <Column
        title="Pendientes"
        icon={Clock}
        tasks={pendingTasks}
        color="bg-amber-50 text-amber-700"
        loading={loading}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <Column
        title="En Progreso"
        icon={PlayCircle}
        tasks={inProgressTasks}
        color="bg-blue-50 text-blue-700"
        loading={loading}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <Column
        title="Completadas"
        icon={CheckCircle2}
        tasks={completedTasks}
        color="bg-green-50 text-green-700"
        loading={loading}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
};
