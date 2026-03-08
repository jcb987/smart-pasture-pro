import { Check, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BenefitsSection = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumenta la Productividad",
      description: "Identifica los animales más productivos y optimiza la alimentación con datos reales.",
      before: "Decisiones a ciegas",
      after: "+35% producción promedio",
    },
    {
      icon: Clock,
      title: "Ahorra Tiempo",
      description: "Automatiza registros y genera reportes instantáneos. Menos papeleo, más campo.",
      before: "Horas en cuadernos",
      after: "70% menos tiempo administrativo",
    },
    {
      icon: DollarSign,
      title: "Reduce Pérdidas",
      description: "Detecta problemas antes de que se agraven. Cada alerta temprana es dinero que salvas.",
      before: "Pérdidas inesperadas",
      after: "25% menos en pérdidas",
    },
  ];

  const checkpoints = [
    "Control total del ciclo reproductivo",
    "Monitoreo de salud y vacunación",
    "Gestión de alimentación y pastoreo",
    "Trazabilidad completa del ganado",
    "Reportes exportables a Excel y PDF",
    "Integración con hardware ganadero",
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-subtle relative overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
              Resultados Reales
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Resultados que se Ven
              <span className="text-primary block">en el Bolsillo</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No es solo software. Es la diferencia entre adivinar y saber.
              Ganaderos que usan Agro Data ven resultados desde el primer mes.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {checkpoints.map((item) => (
                <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="default" size="lg" onClick={() => navigate('/auth')}>
                Ver Todos los Beneficios
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://wa.me/573001234567?text=Hola,%20quiero%20una%20demo%20de%20Agro%20Data', '_blank')}
              >
                Solicitar Demo
              </Button>
            </div>
          </div>

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
                    <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{benefit.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="line-through text-muted-foreground/60">{benefit.before}</span>
                      <span className="text-primary font-bold">→</span>
                      <span className="font-bold text-accent">{benefit.after}</span>
                    </div>
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
