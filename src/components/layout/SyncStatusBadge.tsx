import { CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusBadgeProps {
  status: 'synced' | 'pending' | 'error' | 'syncing';
  className?: string;
  showText?: boolean;
}

export const SyncStatusBadge = ({ status, className, showText = false }: SyncStatusBadgeProps) => {
  const config = {
    synced: {
      icon: CheckCircle2,
      text: 'Sincronizado',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    pending: {
      icon: Clock,
      text: 'Pendiente',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    error: {
      icon: AlertTriangle,
      text: 'Error',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    syncing: {
      icon: Loader2,
      text: 'Sincronizando...',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  };

  const { icon: Icon, text, color, bgColor } = config[status];

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        bgColor,
        color,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'syncing' && 'animate-spin')} />
      {showText && <span>{text}</span>}
    </div>
  );
};
