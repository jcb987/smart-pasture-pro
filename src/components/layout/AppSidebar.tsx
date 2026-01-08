import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useFounder } from '@/contexts/FounderContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  Beef, 
  Heart, 
  Milk, 
  Drumstick, 
  Stethoscope, 
  Utensils, 
  Sprout, 
  LineChart, 
  FileBarChart, 
  DollarSign, 
  Package, 
  Dna, 
  FileText, 
  Smartphone, 
  Settings, 
  HelpCircle,
  Leaf,
  ChevronDown,
  Search,
  Shield,
  TrendingUp,
  Target,
  Gavel,
  Building2,
  ClipboardList,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

// Menú para usuarios normales
const userMenuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    group: 'principal',
  },
  {
    title: 'Usuarios',
    url: '/usuarios',
    icon: Users,
    group: 'principal',
  },
  {
    title: 'Consultar Animales',
    url: '/consultar-animal',
    icon: Search,
    group: 'principal',
  },
  {
    title: 'Animales',
    url: '/animales',
    icon: Beef,
    group: 'produccion',
  },
  {
    title: 'Reproducción',
    url: '/reproduccion',
    icon: Heart,
    group: 'produccion',
  },
  {
    title: 'Producción Leche',
    url: '/produccion-leche',
    icon: Milk,
    group: 'produccion',
  },
  {
    title: 'Producción Carne',
    url: '/produccion-carne',
    icon: Drumstick,
    group: 'produccion',
  },
  {
    title: 'Salud',
    url: '/salud',
    icon: Stethoscope,
    group: 'gestion',
  },
  {
    title: 'Alimentación',
    url: '/alimentacion',
    icon: Utensils,
    group: 'gestion',
  },
  {
    title: 'Praderas',
    url: '/praderas',
    icon: Sprout,
    group: 'gestion',
  },
  {
    title: 'Simulaciones',
    url: '/simulaciones',
    icon: LineChart,
    group: 'analisis',
  },
  {
    title: 'Reportes',
    url: '/reportes',
    icon: FileBarChart,
    group: 'analisis',
  },
  {
    title: 'Costos',
    url: '/costos',
    icon: DollarSign,
    group: 'finanzas',
  },
  {
    title: 'Insumos',
    url: '/insumos',
    icon: Package,
    group: 'finanzas',
  },
  {
    title: 'Genética',
    url: '/genetica',
    icon: Dna,
    group: 'avanzado',
  },
  {
    title: 'Intercambio',
    url: '/intercambio',
    icon: FileText,
    group: 'avanzado',
  },
  {
    title: 'App Móvil',
    url: '/app-movil',
    icon: Smartphone,
    group: 'sistema',
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
    group: 'sistema',
  },
  {
    title: 'Ayuda',
    url: '/ayuda',
    icon: HelpCircle,
    group: 'sistema',
  },
];

// Menú exclusivo para Founders
const founderMenuItems = [
  {
    title: 'Panel Founder',
    url: '/founder',
    icon: Shield,
    group: 'founder_main',
  },
  {
    title: 'Análisis Global',
    url: '/founder?tab=analytics',
    icon: TrendingUp,
    group: 'founder_main',
  },
  {
    title: 'Centro de Decisiones',
    url: '/founder?tab=decisions',
    icon: Target,
    group: 'founder_tools',
  },
  {
    title: 'Moderación',
    url: '/founder?tab=moderation',
    icon: Gavel,
    group: 'founder_tools',
  },
  {
    title: 'Clientes',
    url: '/founder?tab=clients',
    icon: Building2,
    group: 'founder_data',
  },
  {
    title: 'Encuestas',
    url: '/founder?tab=surveys',
    icon: ClipboardList,
    group: 'founder_data',
  },
  {
    title: 'Logs de Acceso',
    url: '/founder?tab=logs',
    icon: Activity,
    group: 'founder_data',
  },
  {
    title: 'Centro de Ayuda',
    url: '/ayuda',
    icon: HelpCircle,
    group: 'founder_config',
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
    group: 'founder_config',
  },
];

const userGroups = [
  { id: 'principal', label: 'Principal' },
  { id: 'produccion', label: 'Producción' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'analisis', label: 'Análisis' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'avanzado', label: 'Avanzado' },
  { id: 'sistema', label: 'Sistema' },
];

const founderGroups = [
  { id: 'founder_main', label: 'Principal' },
  { id: 'founder_tools', label: 'Herramientas' },
  { id: 'founder_data', label: 'Datos' },
  { id: 'founder_config', label: 'Configuración' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const { isFounder, isFounderMode } = useFounder();
  const collapsed = state === 'collapsed';

  // Determinar si mostrar menú de Founder o de usuario normal
  // Si está en modo Founder (viendo cuenta de cliente), mostrar menú normal
  // Si es Founder y NO está en modo founder, mostrar menú de Founder
  const showFounderMenu = isFounder && !isFounderMode;
  
  const menuItems = showFounderMenu ? founderMenuItems : userMenuItems;
  const groups = showFounderMenu ? founderGroups : userGroups;

  const isActive = (path: string) => {
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      const tabParam = new URLSearchParams(query).get('tab');
      const currentTab = new URLSearchParams(location.search).get('tab');
      return location.pathname === basePath && currentTab === tabParam;
    }
    return location.pathname === path;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach(g => { initial[g.id] = true; });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigation = (url: string) => {
    if (url.includes('?tab=')) {
      const [basePath, query] = url.split('?');
      const tabParam = new URLSearchParams(query).get('tab');
      navigate(basePath);
      // Dispatch custom event to change tab
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('founder-tab-change', { detail: tabParam }));
      }, 100);
    } else {
      navigate(url);
    }
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            showFounderMenu ? "bg-amber-500" : "bg-primary"
          )}>
            {showFounderMenu ? (
              <Shield className="h-5 w-5 text-white" />
            ) : (
              <Leaf className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground">
                {showFounderMenu ? 'Founder' : 'Agro Data'}
              </span>
              {showFounderMenu && (
                <Badge variant="outline" className="text-[10px] w-fit border-amber-500/30 text-amber-600">
                  Admin
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {groups.map((group) => {
          const groupItems = menuItems.filter((item) => item.group === group.id);
          if (groupItems.length === 0) return null;

          const isGroupActive = groupItems.some(item => isActive(item.url));

          if (collapsed) {
            return (
              <SidebarGroup key={group.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.url)}
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                          className={cn(
                            'transition-colors',
                            isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible
              key={group.id}
              open={openGroups[group.id] ?? true}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel 
                    className={cn(
                      'flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors',
                      isGroupActive && 'text-primary font-medium'
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronDown 
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        (openGroups[group.id] ?? true) && 'rotate-180'
                      )}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            onClick={() => handleNavigation(item.url)}
                            isActive={isActive(item.url)}
                            className={cn(
                              'transition-colors',
                              isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <p className="text-xs text-muted-foreground text-center">
            {showFounderMenu ? 'Panel de Administración' : 'v1.0.0 • © 2024 Agro Data'}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
