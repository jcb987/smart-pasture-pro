import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Beef, Milk, Heart, Baby, Activity, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACTIONS = [
  {
    label: 'Nuevo Animal',
    icon: Beef,
    color: 'bg-green-600 hover:bg-green-700 text-white',
    url: '/animales?action=new',
  },
  {
    label: 'Registrar Leche',
    icon: Milk,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    url: '/produccion-leche?action=new',
  },
  {
    label: 'Evento Salud',
    icon: Heart,
    color: 'bg-red-500 hover:bg-red-600 text-white',
    url: '/salud?action=new',
  },
  {
    label: 'Evento Reproductivo',
    icon: Activity,
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
    url: '/reproduccion?action=new',
  },
  {
    label: 'Registrar Peso',
    icon: Scale,
    color: 'bg-amber-500 hover:bg-amber-600 text-white',
    url: '/animales?action=weight',
  },
];

export const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Speed dial */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
        {/* Action buttons */}
        {ACTIONS.map((action, i) => (
          <div
            key={action.url}
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              open
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-4 pointer-events-none'
            )}
            style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
          >
            <span className="text-xs font-medium bg-background border border-border rounded-md px-2 py-1 shadow-sm whitespace-nowrap">
              {action.label}
            </span>
            <Button
              size="icon"
              className={cn('h-10 w-10 rounded-full shadow-md', action.color)}
              onClick={() => handleAction(action.url)}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Main FAB button */}
        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-xl transition-all duration-200',
            open
              ? 'bg-muted hover:bg-muted/80 text-foreground rotate-45'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
          onClick={() => setOpen(prev => !prev)}
          title="Acciones rápidas"
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </>
  );
};
