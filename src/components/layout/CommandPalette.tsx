import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard, Beef, Milk, Heart, Activity, Leaf, BarChart2,
  DollarSign, Package, Users, Settings, HelpCircle, Baby, FileCheck,
  Dna, ArrowLeftRight, Brain, Wrench, Smartphone, Plus, Scale,
  Search, Eye,
} from 'lucide-react';
import { useAnimals } from '@/hooks/useAnimals';

const PAGES = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, group: 'Principal' },
  { title: 'Consultar Animal', url: '/consultar-animal', icon: Search, group: 'Principal' },
  { title: 'Animales', url: '/animales', icon: Beef, group: 'Producción' },
  { title: 'Reproducción', url: '/reproduccion', icon: Activity, group: 'Producción' },
  { title: 'Producción Leche', url: '/produccion-leche', icon: Milk, group: 'Producción' },
  { title: 'Producción Carne', url: '/produccion-carne', icon: BarChart2, group: 'Producción' },
  { title: 'Terneros', url: '/terneros', icon: Baby, group: 'Producción' },
  { title: 'Salud', url: '/salud', icon: Heart, group: 'Gestión' },
  { title: 'Documentos', url: '/documentos', icon: FileCheck, group: 'Gestión' },
  { title: 'Alimentación', url: '/alimentacion', icon: Leaf, group: 'Gestión' },
  { title: 'Praderas', url: '/praderas', icon: Leaf, group: 'Gestión' },
  { title: 'Reportes', url: '/reportes', icon: BarChart2, group: 'Análisis' },
  { title: 'Simulaciones', url: '/simulaciones', icon: Brain, group: 'Análisis' },
  { title: 'Costos', url: '/costos', icon: DollarSign, group: 'Finanzas' },
  { title: 'Insumos', url: '/insumos', icon: Package, group: 'Finanzas' },
  { title: 'Genética', url: '/genetica', icon: Dna, group: 'Avanzado' },
  { title: 'Intercambio', url: '/intercambio', icon: ArrowLeftRight, group: 'Avanzado' },
  { title: 'Inteligencia', url: '/inteligencia', icon: Brain, group: 'Avanzado' },
  { title: 'Herramientas', url: '/herramientas', icon: Wrench, group: 'Avanzado' },
  { title: 'Usuarios', url: '/usuarios', icon: Users, group: 'Sistema' },
  { title: 'Configuración', url: '/configuracion', icon: Settings, group: 'Sistema' },
  { title: 'Ayuda', url: '/ayuda', icon: HelpCircle, group: 'Sistema' },
  { title: 'App Móvil', url: '/app-movil', icon: Smartphone, group: 'Sistema' },
];

const QUICK_ACTIONS = [
  { title: 'Nuevo Animal', url: '/animales?action=new', icon: Plus, shortcut: 'A' },
  { title: 'Registrar Leche', url: '/produccion-leche?action=new', icon: Milk, shortcut: 'L' },
  { title: 'Evento Salud', url: '/salud?action=new', icon: Heart, shortcut: 'S' },
  { title: 'Evento Reproductivo', url: '/reproduccion?action=new', icon: Activity, shortcut: 'R' },
  { title: 'Registrar Peso', url: '/animales?action=weight', icon: Scale, shortcut: 'P' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { animals } = useAnimals();
  const [query, setQuery] = useState('');

  const run = useCallback((url: string) => {
    onOpenChange(false);
    setQuery('');
    navigate(url);
  }, [navigate, onOpenChange]);

  // Filter animals by tag_id or name
  const matchedAnimals = query.length >= 1
    ? animals
        .filter(a =>
          a.status === 'activo' && (
            a.tag_id.toLowerCase().includes(query.toLowerCase()) ||
            (a.name && a.name.toLowerCase().includes(query.toLowerCase()))
          )
        )
        .slice(0, 6)
    : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar animal por arete o nombre, o ir a un módulo..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sin resultados para "{query}"</CommandEmpty>

        {/* Matched animals */}
        {matchedAnimals.length > 0 && (
          <>
            <CommandGroup heading={`Animales (${matchedAnimals.length})`}>
              {matchedAnimals.map(animal => (
                <CommandItem
                  key={animal.id}
                  onSelect={() => run(`/consultar-animal?tag=${encodeURIComponent(animal.tag_id)}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{animal.tag_id}</span>
                    {animal.name && (
                      <span className="text-muted-foreground ml-2">{animal.name}</span>
                    )}
                    <span className="text-muted-foreground text-xs ml-2 capitalize">{animal.category}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-accent cursor-pointer"
                      onClick={e => { e.stopPropagation(); run(`/salud?action=new`); }}
                    >
                      Salud
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-accent cursor-pointer"
                      onClick={e => { e.stopPropagation(); run(`/produccion-leche?action=new`); }}
                    >
                      Leche
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick actions — always shown */}
        <CommandGroup heading="Acciones Rápidas">
          {QUICK_ACTIONS.map(action => (
            <CommandItem
              key={action.url}
              onSelect={() => run(action.url)}
              className="flex items-center gap-2"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span>{action.title}</span>
              <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Page navigation — only show when no animal results or always */}
        <CommandGroup heading="Ir a...">
          {PAGES
            .filter(p =>
              !query ||
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.group.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, query ? undefined : 8)
            .map(page => (
              <CommandItem
                key={page.url}
                onSelect={() => run(page.url)}
                className="flex items-center gap-2"
              >
                <page.icon className="h-4 w-4 text-muted-foreground" />
                <span>{page.title}</span>
                <CommandShortcut className="text-muted-foreground/60">{page.group}</CommandShortcut>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
