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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "Asistente Inteligente",
    description: "Algoritmos que analizan tu ganadería, detectan problemas y sugieren acciones basadas en datos.",
    tooltip: "IA que analiza tu ganadería y sugiere acciones basadas en datos.",
  },
  {
    icon: BarChart3,
    title: "Tablero de KPIs",
    description: "Indicadores clave claros, alertas visuales y tendencias en tiempo real.",
    tooltip: "Indicadores clave, alertas visuales y tendencias en tiempo real.",
  },
  {
    icon: Smartphone,
    title: "App Móvil Sincronizada",
    description: "Registra y consulta información desde el campo, incluso sin internet.",
    tooltip: "Registra datos desde el campo, incluso sin conexión.",
  },
  {
    icon: Cloud,
    title: "Respaldo en la Nube",
    description: "Datos seguros, automáticos y accesibles desde cualquier dispositivo.",
    tooltip: "Datos seguros, automáticos y siempre disponibles.",
  },
  {
    icon: BookOpen,
    title: "Fácil de Aprender",
    description: "Manual, videos tutoriales y ayuda contextual integrada.",
    tooltip: "Diseñado para ganaderos, sin curva técnica.",
  },
  {
    icon: Infinity,
    title: "Sin Límites",
    description: "Gestiona todas tus fincas y animales sin restricciones ni costos ocultos.",
    tooltip: "Gestiona todas tus fincas y animales sin restricciones.",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/auth');
  };

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
            <Tooltip key={feature.title}>
              <TooltipTrigger asChild>
                <div
                  className="group bg-card border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30"
                  onClick={handleExploreClick}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{feature.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="lg" className="group" onClick={handleExploreClick}>
                Explorar todas las funciones
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Accede al sistema y descubre todas las herramientas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
