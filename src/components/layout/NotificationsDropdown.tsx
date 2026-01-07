import { useState } from 'react';
import { Bell, AlertTriangle, Heart, Syringe, Scale, Package, Clock } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts, AlertItem } from '@/hooks/useAlerts';
import { useNavigate } from 'react-router-dom';

const alertIcons: Record<AlertItem['type'], typeof Bell> = {
  reproduction: Heart,
  health: AlertTriangle,
  vaccination: Syringe,
  weight: Scale,
  stock: Package,
  expiration: Clock,
};

const severityColors: Record<AlertItem['severity'], string> = {
  critical: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  info: 'bg-primary text-primary-foreground',
};

export function NotificationsDropdown() {
  const { alerts, counts, loading } = useAlerts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleAlertClick = (alert: AlertItem) => {
    setOpen(false);
    // Navigate based on alert type
    switch (alert.type) {
      case 'reproduction':
        navigate('/reproduccion');
        break;
      case 'health':
        navigate('/salud');
        break;
      case 'vaccination':
        navigate('/salud');
        break;
      case 'weight':
        navigate('/produccion-carne');
        break;
      case 'stock':
      case 'expiration':
        navigate('/insumos');
        break;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {counts.total > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {counts.total > 99 ? '99+' : counts.total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {counts.total > 0 && (
            <div className="flex gap-1">
              {counts.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {counts.critical} críticas
                </Badge>
              )}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Cargando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No hay alertas pendientes
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {alerts.slice(0, 20).map((alert) => {
              const Icon = alertIcons[alert.type];
              return (
                <DropdownMenuItem 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className={`p-1.5 rounded-full ${severityColors[alert.severity]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            {alerts.length > 20 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                +{alerts.length - 20} alertas más
              </div>
            )}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center justify-center text-primary text-sm font-medium"
          onClick={() => {
            setOpen(false);
            navigate('/configuracion');
          }}
        >
          Configurar alertas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
