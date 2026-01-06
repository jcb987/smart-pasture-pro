import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
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

const groups = [
  { id: 'principal', label: 'Principal' },
  { id: 'produccion', label: 'Producción' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'analisis', label: 'Análisis' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'avanzado', label: 'Avanzado' },
  { id: 'sistema', label: 'Sistema' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  // Estado controlado para mantener múltiples grupos abiertos - todos abiertos por defecto
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    principal: true,
    produccion: true,
    gestion: true,
    analisis: true,
    finanzas: true,
    avanzado: true,
    sistema: true,
  });

  // toggleGroup solo cambia el grupo clickeado, sin afectar los demás

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Navegar sin cerrar la barra lateral en desktop
  const handleNavigation = (url: string) => {
    navigate(url);
    // Solo cerrar en móvil después de navegar
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">Agro Data</span>
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
              open={openGroups[group.id]}
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
                        openGroups[group.id] && 'rotate-180'
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
            v1.0.0 • © 2024 Agro Data
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
