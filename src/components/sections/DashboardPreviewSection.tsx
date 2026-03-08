import { TrendingUp, TrendingDown, Eye, AlertTriangle, Droplets, Activity, CheckCircle2 } from "lucide-react";

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
    <section id="dashboard" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Tablero de Control
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Mira tu Finca
            <span className="text-primary block">Como Nunca Antes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            KPIs en tiempo real, alertas inteligentes y tu lista de trabajo diaria. Todo en una sola pantalla.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {/* Dashboard mockup - 3 cols */}
          <div className="lg:col-span-3 bg-card rounded-2xl shadow-2xl border border-border/50 p-6 space-y-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="font-bold text-foreground">Panel Principal</h3>
              <span className="text-xs text-muted-foreground">Actualizado hace 5 min</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-muted/50 rounded-xl p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                    <span className="text-xs text-muted-foreground mb-1">{kpi.unit}</span>
                  </div>
                  {kpi.change && (
                    <div className={`flex items-center gap-1 mt-2 ${kpi.color}`}>
                      {kpi.trending === "up" ? <TrendingUp size={14} /> : kpi.trending === "down" ? <TrendingDown size={14} /> : <AlertTriangle size={14} />}
                      <span className="text-xs font-medium">{kpi.change}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Alertas Recientes</h4>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                    alert.type === "urgent" ? "bg-destructive/10 text-destructive"
                    : alert.type === "warning" ? "bg-accent/10 text-accent-foreground"
                    : "bg-primary/10 text-primary"
                  }`}
                >
                  <alert.icon size={16} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>

          {/* Task list - 2 cols */}
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-xl border border-border/50 p-6">
            <h3 className="font-bold text-foreground mb-1">Lista de Trabajo</h3>
            <p className="text-xs text-muted-foreground mb-5">Tareas pendientes para hoy</p>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.text} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.done ? "bg-primary/20" : "border-2 border-border"}`}>
                    {task.done && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className={`text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-3">
              <Eye size={18} className="text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Vista Personalizable</h4>
                <p className="text-xs text-muted-foreground">Configura tu tablero según tu operación</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;
