import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  HelpCircle, 
  ClipboardList, 
  Activity,
  Settings,
  Shield
} from 'lucide-react';

interface FounderQuickActionsProps {
  onSearchClient: () => void;
}

export function FounderQuickActions({ onSearchClient }: FounderQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Users,
      label: 'Entrar a cuenta de cliente',
      description: 'Buscar y acceder a cualquier cuenta',
      onClick: onSearchClient,
      variant: 'default' as const,
    },
    {
      icon: HelpCircle,
      label: 'Administrar Centro de Ayuda',
      description: 'Gestionar guías y tutoriales',
      onClick: () => navigate('/ayuda'),
      variant: 'outline' as const,
    },
    {
      icon: ClipboardList,
      label: 'Ver Encuestas',
      description: 'Respuestas de onboarding',
      onClick: () => {}, // Scroll to surveys section
      variant: 'outline' as const,
    },
    {
      icon: Activity,
      label: 'Ver Logs de Actividad',
      description: 'Historial de acciones Founder',
      onClick: () => {}, // Scroll to logs section
      variant: 'outline' as const,
    },
    {
      icon: Settings,
      label: 'Configuración Global',
      description: 'Ajustes del sistema',
      onClick: () => navigate('/configuracion'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2 items-start text-left"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-5 w-5" />
                <span className="font-medium">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
