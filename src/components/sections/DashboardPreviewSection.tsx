import { TrendingUp, TrendingDown, Eye, AlertTriangle, Droplets, Activity, CheckCircle2 } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const DashboardPreviewSection = () => {
  const kpis = [
    { label: "Producción Diaria", value: "2,450", unit: "litros", change: "+8.2%", trending: "up", color: "text-primary" },
    { label: "Vacas en Lactancia", value: "124", unit: "animales", change: "+3", trending: "up", color: "text-primary" },
    { label: "Tasa de Preñez", value: "68%", unit: "", change: "-2.1%", trending: "down", color: "text-accent" },
    { label: "Alertas Activas", value: "7", unit: "pendientes", change: "", trending: "alert", color: "text-destructive" },
  ];

  const alerts = [
    { type: "warning", message: "3 vacas con baja producción detectadas", icon: Droplets },
    { type: "info", message: "12 animales requieren pesaje esta semana", icon: Activity },
    { type: "urgent", message: "Vaca #247 requiere atención veterinaria", icon: AlertTriangle },
  ];

  const tasks = [
    { text: "Pesar lote de engorde (15 animales)", done: false },
    { text: "Vacunación lote terneras", done: true },
    { text: "Revisar vaca #247 — alerta sanitaria", done: false },
    { text: "Registrar producción ordeño tarde", done: false },
  ];

  return (
    <section id="dashboard" className="relative overflow-hidden bg-muted/30">
      <ContainerScroll
        titleComponent={
          <div className="mb-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Tablero de Control
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Mira tu Finca
              <span className="text-primary block">Como Nunca Antes</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              KPIs en tiempo real, alertas inteligentes y tu lista de trabajo diaria. Todo en una sola pantalla.
            </p>
          </div>
        }
      >
        <div className="grid lg:grid-cols-5 gap-4 h-full p-2 md:p-4 overflow-y-auto">
          {/* Dashboard mockup - 3 cols */}
          <div className="lg:col-span-3 bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="font-bold text-foreground text-sm md:text-base">Panel Principal</h3>
              <span className="text-xs text-muted-foreground">Actualizado hace 5 min</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-muted/50 rounded-xl p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-xl md:text-2xl font-bold text-foreground">{kpi.value}</span>
                    <span className="text-xs text-muted-foreground mb-0.5">{kpi.unit}</span>
                  </div>
                  {kpi.change && (
                    <div className={`flex items-center gap-1 mt-1.5 ${kpi.color}`}>
                      {kpi.trending === "up" ? <TrendingUp size={12} /> : kpi.trending === "down" ? <TrendingDown size={12} /> : <AlertTriangle size={12} />}
                      <span className="text-xs font-medium">{kpi.change}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Alertas Recientes</h4>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                    alert.type === "urgent" ? "bg-destructive/10 text-destructive"
                    : alert.type === "warning" ? "bg-accent/10 text-accent-foreground"
                    : "bg-primary/10 text-primary"
                  }`}
                >
                  <alert.icon size={14} />
                  <span className="text-xs md:text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>

          {/* Task list - 2 cols */}
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-xl border border-border/50 p-4 md:p-6">
            <h3 className="font-bold text-foreground text-sm md:text-base mb-1">Lista de Trabajo</h3>
            <p className="text-xs text-muted-foreground mb-4">Tareas pendientes para hoy</p>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.text} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.done ? "bg-primary/20" : "border-2 border-border"}`}>
                    {task.done && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className={`text-xs md:text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center gap-3">
              <Eye size={16} className="text-primary" />
              <div>
                <h4 className="text-xs md:text-sm font-semibold text-foreground">Vista Personalizable</h4>
                <p className="text-xs text-muted-foreground">Configura tu tablero según tu operación</p>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
};

export default DashboardPreviewSection;
