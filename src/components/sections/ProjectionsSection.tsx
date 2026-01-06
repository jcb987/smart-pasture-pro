import { Calculator, TrendingUp, Lightbulb, BarChart } from "lucide-react";

const ProjectionsSection = () => {
  const simulations = [
    {
      variable: "Días en Leche",
      current: "180",
      simulated: "200",
      impact: "+12% producción mensual",
      positive: true,
    },
    {
      variable: "Tasa de Mortalidad",
      current: "4.2%",
      simulated: "2.5%",
      impact: "+8 animales/año",
      positive: true,
    },
    {
      variable: "Intervalo Entre Partos",
      current: "420 días",
      simulated: "380 días",
      impact: "+15% fertilidad",
      positive: true,
    },
  ];

  return (
    <section id="projections" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Simulaciones
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              ¿Qué Pasaría
              <span className="text-primary block">Si...?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Modelos de simulación inteligente que te muestran el impacto de cambiar 
              variables en tu negocio. Toma decisiones informadas antes de actuar.
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calculator size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Proyecciones Automáticas</h4>
                  <p className="text-sm text-muted-foreground">Algoritmos que calculan escenarios futuros</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Lightbulb size={24} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Recomendaciones</h4>
                  <p className="text-sm text-muted-foreground">Sugerencias basadas en tus datos reales</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BarChart size={24} className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Visualización Clara</h4>
                  <p className="text-sm text-muted-foreground">Gráficas que muestran el impacto de cada cambio</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Simulation Preview */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Simulador de Escenarios</h3>
                    <p className="text-xs text-muted-foreground">Proyección a 12 meses</p>
                  </div>
                </div>
              </div>

              {/* Simulations */}
              <div className="space-y-4">
                {simulations.map((sim, index) => (
                  <div
                    key={sim.variable}
                    className="bg-muted/30 rounded-xl p-4 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">{sim.variable}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        sim.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {sim.impact}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1">Actual</p>
                        <div className="bg-muted/50 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-foreground">{sim.current}</span>
                        </div>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1">Simulado</p>
                        <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                          <span className="text-sm font-medium text-primary">{sim.simulated}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graph placeholder */}
              <div className="bg-muted/20 rounded-xl p-4 border border-dashed border-border">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart size={16} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">Proyección de Producción</span>
                </div>
                <div className="h-24 flex items-end gap-2">
                  {[40, 55, 45, 60, 75, 85, 95, 100].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                </div>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectionsSection;
