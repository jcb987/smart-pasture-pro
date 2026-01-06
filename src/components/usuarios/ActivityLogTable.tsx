import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ActivityLog } from '@/hooks/useUsers';

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'login': { label: 'Inicio de sesión', variant: 'default' },
  'logout': { label: 'Cierre de sesión', variant: 'secondary' },
  'create': { label: 'Creación', variant: 'default' },
  'update': { label: 'Actualización', variant: 'secondary' },
  'delete': { label: 'Eliminación', variant: 'destructive' },
  'view': { label: 'Visualización', variant: 'outline' },
};

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    const config = actionLabels[action.toLowerCase()] || { label: action, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay registros de actividad
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Módulo</TableHead>
            <TableHead>Detalles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                {formatDate(log.created_at)}
              </TableCell>
              <TableCell>
                {getActionBadge(log.action)}
              </TableCell>
              <TableCell className="text-sm capitalize">
                {log.module_name || '-'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {log.details ? JSON.stringify(log.details) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
