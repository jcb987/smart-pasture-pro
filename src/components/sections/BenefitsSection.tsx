import { Check, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BenefitsSection = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumenta la Productividad",
      description: "Identifica los animales más productivos y optimiza la alimentación basándote en datos reales.",
      stats: "+35%",
      statsLabel: "producción promedio",
      tooltip: "Mejora tu producción identificando qué funciona mejor.",
    },
    {
      icon: Clock,
      title: "Ahorra Tiempo",
      description: "Automatiza registros, genera reportes instantáneos y reduce el trabajo manual repetitivo.",
      stats: "70%",
      statsLabel: "menos tiempo en reportes",
      tooltip: "Dedica menos tiempo al papeleo, más tiempo al campo.",
    },
    {
      icon: DollarSign,
      title: "Reduce Costos",
      description: "Detecta problemas antes de que se agraven y optimiza recursos con decisiones basadas en datos.",
      stats: "25%",
      statsLabel: "reducción de pérdidas",
      tooltip: "Evita pérdidas detectando problemas a tiempo.",
    },
  ];

  const checkpoints = [
    { text: "Control total del ciclo reproductivo", tooltip: "Gestiona celos, inseminaciones y partos" },
    { text: "Monitoreo de salud y vacunación", tooltip: "Historial médico y alertas sanitarias" },
    { text: "Gestión de alimentación y pastoreo", tooltip: "Dietas optimizadas y rotación de potreros" },
    { text: "Trazabilidad completa del ganado", tooltip: "Hoja de vida de cada animal desde nacimiento" },
    { text: "Reportes personalizables", tooltip: "Exporta a Excel y PDF cuando necesites" },
    { text: "Integración con hardware", tooltip: "Básculas, lectores RFID y más" },
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
                <Tooltip key={item.text}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-primary" />
                      </div>
                      <span className="text-foreground text-sm">{item.text}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="lg" onClick={() => navigate('/auth')}>
                    Descubre Más Beneficios
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Explora todas las funcionalidades del sistema</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.open('https://wa.me/573001234567?text=Hola,%20quiero%20solicitar%20una%20demo', '_blank')}
                  >
                    Solicitar Demo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Te mostramos el sistema en una llamada</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right Content - Benefits Cards */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <Tooltip key={benefit.title}>
                <TooltipTrigger asChild>
                  <div
                    className="group bg-card rounded-2xl p-6 shadow-md border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-x-2 cursor-pointer"
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
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">{benefit.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
