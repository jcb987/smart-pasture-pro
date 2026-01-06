import { Button } from "@/components/ui/button";
import { 
  Brain, 
  BarChart3, 
  Smartphone, 
  Cloud, 
  BookOpen, 
  Infinity,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Asistente Inteligente",
    description: "Algoritmos que analizan tu ganadería, detectan problemas y sugieren acciones basadas en datos.",
  },
  {
    icon: BarChart3,
    title: "Tablero de KPIs",
    description: "Indicadores clave claros, alertas visuales y tendencias en tiempo real.",
  },
  {
    icon: Smartphone,
    title: "App Móvil Sincronizada",
    description: "Registra y consulta información desde el campo, incluso sin internet.",
  },
  {
    icon: Cloud,
    title: "Respaldo en la Nube",
    description: "Datos seguros, automáticos y accesibles desde cualquier dispositivo.",
  },
  {
    icon: BookOpen,
    title: "Fácil de Aprender",
    description: "Manual, videos tutoriales y ayuda contextual integrada.",
  },
  {
    icon: Infinity,
    title: "Sin Límites",
    description: "Gestiona todas tus fincas y animales sin restricciones ni costos ocultos.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todo lo que necesitas para gestionar tu ganadería
          </h2>
          <p className="text-muted-foreground text-lg">
            Controla, analiza y optimiza tu operación ganadera desde un solo lugar, sin complicaciones.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" className="group">
            Explorar todas las funciones
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
