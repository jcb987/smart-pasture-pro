import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const MODULE_ROUTES: Record<string, string> = {
  reproduccion: '/reproduccion',
  'produccion-leche': '/produccion-leche',
  'produccion-carne': '/produccion-carne',
  salud: '/salud',
  insumos: '/insumos',
  terneros: '/terneros',
};

const TYPE_COLORS: Record<string, string> = {
  parto_atrasado: 'text-red-600',
  secado_proximo: 'text-amber-600',
  vacuna_vencida: 'text-orange-600',
  stock_bajo: 'text-yellow-600',
  ccs_alto: 'text-purple-600',
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, generateAlerts, loading } = useNotifications();

  const handleClick = async (notif: typeof notifications[0]) => {
    await markAsRead(notif.id);
    if (notif.module && MODULE_ROUTES[notif.module]) {
      navigate(MODULE_ROUTES[notif.module]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.preventDefault(); generateAlerts(); }}
              title="Actualizar alertas"
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sin notificaciones</p>
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className={cn(
                'flex flex-col items-start gap-1 cursor-pointer p-3',
                !notif.is_read && 'bg-muted/50'
              )}
              onClick={() => handleClick(notif)}
            >
              <div className="flex items-center justify-between w-full">
                <span className={cn('text-sm font-medium', TYPE_COLORS[notif.type] || '')}>
                  {notif.title}
                </span>
                <div className="flex gap-1 ml-2 shrink-0">
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{notif.message}</p>
              <span className="text-xs text-muted-foreground/60">
                {new Date(notif.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
