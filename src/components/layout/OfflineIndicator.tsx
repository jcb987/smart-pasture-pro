import { useOffline } from '@/contexts/OfflineContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Cloud, 
  CloudOff,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingChanges, lastSyncDate, syncNow } = useOffline();

  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (pendingChanges > 0) {
      return <Cloud className="h-4 w-4" />;
    }
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400';
    if (pendingChanges > 0) return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Modo Offline';
    if (pendingChanges > 0) return `${pendingChanges} pendientes`;
    return 'Sincronizado';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 gap-2 px-2.5 ${getStatusColor()} hover:bg-opacity-20`}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline text-xs font-medium">
            {getStatusText()}
          </span>
          {pendingChanges > 0 && isOnline && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {pendingChanges}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isOnline ? 'Conectado' : 'Sin Conexión'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOnline
                    ? 'Todos los cambios se sincronizan automáticamente'
                    : 'Los cambios se guardan localmente'}
                </p>
              </div>
            </div>
          </div>

          {/* Pending changes */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cambios pendientes</span>
              <Badge variant={pendingChanges > 0 ? 'default' : 'secondary'}>
                {pendingChanges}
              </Badge>
            </div>
            {lastSyncDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última sincronización</span>
                <span className="text-xs">
                  {format(new Date(lastSyncDate), "d MMM, HH:mm", { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Sync button */}
          <Button
            onClick={syncNow}
            disabled={!isOnline || isSyncing || pendingChanges === 0}
            className="w-full"
            size="sm"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Ahora
              </>
            )}
          </Button>

          {!isOnline && (
            <p className="text-xs text-center text-muted-foreground">
              La sincronización se realizará automáticamente cuando se restaure la conexión
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
