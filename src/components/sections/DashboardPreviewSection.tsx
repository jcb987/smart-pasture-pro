import { TrendingUp, TrendingDown, Eye, AlertTriangle, Droplets, Activity } from "lucide-react";

const DashboardPreviewSection = () => {
  const kpis = [
    {
      label: "Producción Diaria",
      value: "2,450",
      unit: "litros",
      change: "+8.2%",
      trending: "up",
      color: "text-emerald-500",
    },
    {
      label: "Vacas en Lactancia",
      value: "124",
      unit: "animales",
      change: "+3",
      trending: "up",
      color: "text-emerald-500",
    },
    {
      label: "Tasa de Preñez",
      value: "68%",
      unit: "",
      change: "-2.1%",
      trending: "down",
      color: "text-amber-500",
    },
    {
      label: "Alertas Activas",
      value: "7",
      unit: "pendientes",
      change: "",
      trending: "alert",
      color: "text-red-500",
    },
  ];

  const alerts = [
    { type: "warning", message: "3 vacas con baja producción detectadas", icon: Droplets },
    { type: "info", message: "12 animales requieren pesaje esta semana", icon: Activity },
    { type: "urgent", message: "Vaca #247 requiere atención veterinaria", icon: AlertTriangle },
  ];

  return (
    <section id="dashboard" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Tablero de Control
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              KPIs en
              <span className="text-primary block">Tiempo Real</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Visualiza el estado de tu ganadería con indicadores clave. Colores intuitivos 
              que te muestran tendencias y te alertan cuando algo necesita atención.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Vista Rápida</h4>
                  <p className="text-sm text-muted-foreground">Interpreta datos en segundos con colores</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Tendencias</h4>
                  <p className="text-sm text-muted-foreground">Identifica patrones de crecimiento o decrecimiento</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Alertas Inteligentes</h4>
                  <p className="text-sm text-muted-foreground">Notificaciones automáticas de problemas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            {/* Dashboard mockup */}
            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <h3 className="font-bold text-foreground">Panel Principal</h3>
                <span className="text-xs text-muted-foreground">Actualizado hace 5 min</span>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 gap-4">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-muted/50 rounded-xl p-4 border border-border/30"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                      <span className="text-xs text-muted-foreground mb-1">{kpi.unit}</span>
                    </div>
                    {kpi.change && (
                      <div className={`flex items-center gap-1 mt-2 ${kpi.color}`}>
                        {kpi.trending === "up" ? (
                          <TrendingUp size={14} />
                        ) : kpi.trending === "down" ? (
                          <TrendingDown size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        <span className="text-xs font-medium">{kpi.change}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Alerts Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Alertas Recientes</h4>
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                      alert.type === "urgent"
                        ? "bg-destructive/10 text-destructive"
                        : alert.type === "warning"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <alert.icon size={16} />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;
