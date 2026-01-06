import { Check, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumenta la Productividad",
      description: "Identifica los animales más productivos y optimiza la alimentación basándote en datos reales.",
      stats: "+35%",
      statsLabel: "producción promedio",
    },
    {
      icon: Clock,
      title: "Ahorra Tiempo",
      description: "Automatiza registros, genera reportes instantáneos y reduce el trabajo manual repetitivo.",
      stats: "70%",
      statsLabel: "menos tiempo en reportes",
    },
    {
      icon: DollarSign,
      title: "Reduce Costos",
      description: "Detecta problemas antes de que se agraven y optimiza recursos con decisiones basadas en datos.",
      stats: "25%",
      statsLabel: "reducción de pérdidas",
    },
  ];

  const checkpoints = [
    "Control total del ciclo reproductivo",
    "Monitoreo de salud y vacunación",
    "Gestión de alimentación y pastoreo",
    "Trazabilidad completa del ganado",
    "Reportes personalizables",
    "Integración con hardware",
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
              Beneficios
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Toma Decisiones
              <span className="text-primary block">Basadas en Datos</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Transforma información en acción. Nuestro sistema analiza tu ganadería 
              y te muestra exactamente qué hacer para mejorar los resultados.
            </p>

            {/* Checkpoints */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {checkpoints.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Button variant="default" size="lg">
              Descubre Más Beneficios
            </Button>
          </div>

          {/* Right Content - Benefits Cards */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group bg-card rounded-2xl p-6 shadow-md border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-x-2"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <benefit.icon size={28} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {benefit.title}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent">
                          {benefit.stats}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {benefit.statsLabel}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
