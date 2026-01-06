import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Scale, 
  Baby, 
  Syringe, 
  TrendingDown,
  Calendar
} from "lucide-react";

const ActionListsSection = () => {
  const todayTasks = [
    {
      icon: Baby,
      priority: "urgent",
      title: "Vacas próximas a parir",
      count: 3,
      detail: "#183, #247, #312",
    },
    {
      icon: Scale,
      priority: "high",
      title: "Animales pendientes de pesaje",
      count: 12,
      detail: "Última pesada hace 45 días",
    },
    {
      icon: Syringe,
      priority: "medium",
      title: "Vacunación programada",
      count: 28,
      detail: "Lote Norte - Aftosa",
    },
    {
      icon: TrendingDown,
      priority: "warning",
      title: "Producción baja detectada",
      count: 5,
      detail: "Requieren revisión",
    },
    {
      icon: Clock,
      priority: "normal",
      title: "Secado programado",
      count: 2,
      detail: "#156, #289 - Esta semana",
    },
  ];

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 border-red-500/30 text-red-600";
      case "high":
        return "bg-amber-500/10 border-amber-500/30 text-amber-600";
      case "medium":
        return "bg-primary/10 border-primary/30 text-primary";
      case "warning":
        return "bg-orange-500/10 border-orange-500/30 text-orange-600";
      default:
        return "bg-muted/50 border-border/50 text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "warning":
        return "Atención";
      default:
        return "Normal";
    }
  };

  return (
    <section id="action-lists" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Task List Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Lista de Trabajo</h3>
                      <p className="text-xs text-muted-foreground">Hoy, 6 de Enero 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{todayTasks.reduce((acc, t) => acc + t.count, 0)}</span>
                    <span className="text-xs text-muted-foreground">tareas<br/>pendientes</span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-border/30">
                {todayTasks.map((task, index) => (
                  <div
                    key={task.title}
                    className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getPriorityStyles(task.priority)}`}>
                        <task.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">{task.title}</h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getPriorityStyles(task.priority)}`}>
                            {getPriorityBadge(task.priority)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{task.detail}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-foreground">{task.count}</span>
                        <p className="text-[10px] text-muted-foreground">animales</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>4 tareas completadas hoy</span>
                  </div>
                  <button className="text-sm font-medium text-primary hover:underline">
                    Ver historial →
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
              Organización
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Tu Lista de
              <span className="text-primary block">Trabajo Diario</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Cada día sabrás exactamente qué hacer primero. Listas dinámicas que se 
              actualizan automáticamente según eventos programados y alertas del sistema.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                <AlertTriangle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground mb-1">Priorización Automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Las tareas urgentes aparecen primero. Nunca te perderás un evento crítico.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                <Clock size={24} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground mb-1">Eventos Programados</h4>
                  <p className="text-sm text-muted-foreground">
                    Vacunas, controles, partos esperados... todo aparece cuando corresponde.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground mb-1">Registro Rápido</h4>
                  <p className="text-sm text-muted-foreground">
                    Marca tareas como completadas con un clic y el sistema registra automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActionListsSection;
