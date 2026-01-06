import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Brain, 
  Smartphone, 
  Cloud, 
  Shield, 
  Zap,
  BookOpen,
  Headphones,
  ChevronRight
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Asistente Inteligente",
      description: "Algoritmos que analizan tu ganadería, detectan problemas críticos y sugieren soluciones.",
      highlight: true,
    },
    {
      icon: BarChart3,
      title: "Tablero de KPIs",
      description: "Panel de control con indicadores clave, tendencias y alertas visuales en tiempo real.",
    },
    {
      icon: Smartphone,
      title: "App Móvil Sincronizada",
      description: "Consulta y registra datos desde tu teléfono, incluso sin conexión a internet.",
    },
    {
      icon: Cloud,
      title: "Respaldo en la Nube",
      description: "Tus datos siempre seguros y accesibles desde cualquier dispositivo.",
    },
    {
      icon: Zap,
      title: "Sin Límites",
      description: "Gestiona todas tus fincas y animales sin restricciones ni costos adicionales.",
    },
    {
      icon: BookOpen,
      title: "Fácil de Aprender",
      description: "Manual completo, videos tutoriales y ayuda contextual con F1.",
    },
    {
      icon: Shield,
      title: "Funciona Offline",
      description: "No dependes de internet. El software funciona localmente en Windows.",
    },
    {
      icon: Headphones,
      title: "Soporte Dedicado",
      description: "Asistencia por WhatsApp, teléfono y correo con capacitaciones virtuales.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Características
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Todo lo que Necesitas para
            <span className="text-primary block">Gestionar tu Ganadería</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Un sistema completo que combina tecnología avanzada con facilidad de uso 
            para optimizar cada aspecto de tu operación ganadera.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                feature.highlight
                  ? "bg-primary text-primary-foreground shadow-lg col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2"
                  : "bg-card shadow-md hover:shadow-lg border border-border/50"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  feature.highlight
                    ? "bg-primary-foreground/20"
                    : "bg-primary/10"
                }`}
              >
                <feature.icon
                  size={28}
                  className={feature.highlight ? "text-primary-foreground" : "text-primary"}
                />
              </div>

              {/* Content */}
              <h3
                className={`text-xl font-bold mb-3 ${
                  feature.highlight ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`leading-relaxed ${
                  feature.highlight
                    ? "text-primary-foreground/80 text-lg"
                    : "text-muted-foreground"
                }`}
              >
                {feature.description}
              </p>

              {/* Highlighted feature extra content */}
              {feature.highlight && (
                <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-primary-foreground/30 border-2 border-primary flex items-center justify-center text-xs font-bold"
                        >
                          AI
                        </div>
                      ))}
                    </div>
                    <p className="text-primary-foreground/80 text-sm">
                      Análisis predictivo basado en datos históricos
                    </p>
                  </div>
                </div>
              )}

              {/* Hover effect */}
              {!feature.highlight && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg">
            Explorar Todas las Funciones
            <ChevronRight className="ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
