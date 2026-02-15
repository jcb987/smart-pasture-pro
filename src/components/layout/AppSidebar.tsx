import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useFounder } from '@/contexts/FounderContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
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
  Activity,
  BarChart3,
  PieChart,
  Layers,
  Bell,
  UserCog,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Zap,
  Globe,
  Wrench,
  Radio,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

// Map sidebar URLs to permission module names
const urlToModule: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/usuarios': 'usuarios',
  '/consultar-animal': 'animales',
  '/animales': 'animales',
  '/reproduccion': 'reproduccion',
  '/produccion-leche': 'produccion-leche',
  '/produccion-carne': 'produccion-carne',
  '/salud': 'salud',
  '/alimentacion': 'alimentacion',
  '/praderas': 'praderas',
  '/simulaciones': 'simulaciones',
  '/reportes': 'reportes',
  '/costos': 'costos',
  '/insumos': 'insumos',
  '/genetica': 'genetica',
  '/intercambio': 'intercambio',
  '/inteligencia': 'inteligencia',
  '/herramientas': 'herramientas',
  '/app-movil': 'app-movil',
  '/configuracion': 'configuracion',
  '/ayuda': 'ayuda',
};

// Menú para usuarios normales
const userMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, group: 'principal' },
  { title: 'Usuarios', url: '/usuarios', icon: Users, group: 'principal' },
  { title: 'Consultar Animales', url: '/consultar-animal', icon: Search, group: 'principal' },
  { title: 'Animales', url: '/animales', icon: Beef, group: 'produccion' },
  { title: 'Reproducción', url: '/reproduccion', icon: Heart, group: 'produccion' },
  { title: 'Producción Leche', url: '/produccion-leche', icon: Milk, group: 'produccion' },
  { title: 'Producción Carne', url: '/produccion-carne', icon: Drumstick, group: 'produccion' },
  { title: 'Salud', url: '/salud', icon: Stethoscope, group: 'gestion' },
  { title: 'Alimentación', url: '/alimentacion', icon: Utensils, group: 'gestion' },
  { title: 'Praderas', url: '/praderas', icon: Sprout, group: 'gestion' },
  { title: 'Simulaciones', url: '/simulaciones', icon: LineChart, group: 'analisis' },
  { title: 'Reportes', url: '/reportes', icon: FileBarChart, group: 'analisis' },
  { title: 'Costos', url: '/costos', icon: DollarSign, group: 'finanzas' },
  { title: 'Insumos', url: '/insumos', icon: Package, group: 'finanzas' },
  { title: 'Genética', url: '/genetica', icon: Dna, group: 'avanzado' },
  { title: 'Intercambio', url: '/intercambio', icon: FileText, group: 'avanzado' },
  { title: 'Inteligencia', url: '/inteligencia', icon: Brain, group: 'avanzado' },
  { title: 'Herramientas', url: '/herramientas', icon: Wrench, group: 'avanzado' },
  { title: 'App Móvil', url: '/app-movil', icon: Smartphone, group: 'sistema' },
  { title: 'Configuración', url: '/configuracion', icon: Settings, group: 'sistema' },
  { title: 'Ayuda', url: '/ayuda', icon: HelpCircle, group: 'sistema' },
];

// Menú exclusivo para Founders - más completo y organizado
const founderMenuItems = [
  // Dashboard & Resumen
  { title: 'Resumen General', section: 'overview', icon: Shield, group: 'founder_dashboard' },
  { title: 'KPIs del Negocio', section: 'kpis', icon: BarChart3, group: 'founder_dashboard' },
  { title: 'Métricas de Ganado', section: 'livestock', icon: PieChart, group: 'founder_dashboard' },
  
  // Análisis Avanzado
  { title: 'Crecimiento', section: 'growth', icon: TrendingUp, group: 'founder_analytics' },
  { title: 'Retención', section: 'retention', icon: Activity, group: 'founder_analytics' },
  { title: 'Uso de Módulos', section: 'modules', icon: Layers, group: 'founder_analytics' },
  
  // Toma de Decisiones
  { title: 'Insights', section: 'insights', icon: Zap, group: 'founder_decisions' },
  { title: 'Decisiones Pendientes', section: 'decisions', icon: Target, group: 'founder_decisions' },
  { title: 'Solicitudes de Features', section: 'features', icon: MessageSquare, group: 'founder_decisions' },
  
  // Moderación y Usuarios
  { title: 'Gestión de Usuarios', section: 'users', icon: UserCog, group: 'founder_moderation' },
  { title: 'Usuarios Bloqueados', section: 'blocked', icon: Gavel, group: 'founder_moderation' },
  { title: 'Historial Moderación', section: 'moderation_logs', icon: FileSpreadsheet, group: 'founder_moderation' },
  
  // Datos de Clientes
  { title: 'Listado de Clientes', section: 'clients', icon: Building2, group: 'founder_clients' },
  { title: 'Encuestas Onboarding', section: 'surveys', icon: ClipboardList, group: 'founder_clients' },
  { title: 'Logs de Acceso', section: 'logs', icon: Activity, group: 'founder_clients' },
  
  // Configuración
  { title: 'Centro de Ayuda', section: 'help', icon: HelpCircle, group: 'founder_config' },
  { title: 'Configuración Global', section: 'settings', icon: Settings, group: 'founder_config' },
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
  { id: 'founder_dashboard', label: '📊 Dashboard' },
  { id: 'founder_analytics', label: '📈 Análisis' },
  { id: 'founder_decisions', label: '🎯 Decisiones' },
  { id: 'founder_moderation', label: '⚖️ Moderación' },
  { id: 'founder_clients', label: '🏢 Clientes' },
  { id: 'founder_config', label: '⚙️ Configuración' },
];

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const { isFounder, isFounderMode } = useFounder();
  const collapsed = state === 'collapsed';

  const { hasModuleAccess } = useUserPermissions();

  const showFounderMenu = isFounder && !isFounderMode;
  
  const allMenuItems = showFounderMenu ? founderMenuItems : userMenuItems;
  
  // Filter menu items based on user permissions (only for user menu)
  const menuItems = showFounderMenu 
    ? allMenuItems 
    : allMenuItems.filter(item => {
        if (!('url' in item)) return true;
        const moduleName = urlToModule[item.url as string];
        if (!moduleName) return true;
        return hasModuleAccess(moduleName);
      });
  
  const groups = showFounderMenu ? founderGroups : userGroups;

  const isActive = (item: typeof menuItems[0]) => {
    if ('section' in item && item.section) {
      return activeSection === item.section;
    }
    if ('url' in item && item.url) {
      return location.pathname === item.url;
    }
    return false;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach(g => { initial[g.id] = true; });
    return initial;
  });

  // Reset openGroups when switching between founder and user menu
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach(g => { initial[g.id] = true; });
    setOpenGroups(initial);
  }, [showFounderMenu]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigation = (item: typeof menuItems[0]) => {
    if ('section' in item && item.section && onSectionChange) {
      onSectionChange(item.section);
    } else if ('url' in item && item.url) {
      navigate(item.url);
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

          const isGroupActive = groupItems.some(item => isActive(item));

          if (collapsed) {
            return (
              <SidebarGroup key={group.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item)}
                          isActive={isActive(item)}
                          tooltip={item.title}
                          className={cn(
                            'transition-colors',
                            isActive(item) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
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
                            onClick={() => handleNavigation(item)}
                            isActive={isActive(item)}
                            className={cn(
                              'transition-colors',
                              isActive(item) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
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
