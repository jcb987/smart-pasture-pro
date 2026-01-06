import { 
  Package, 
  Milk, 
  Heart, 
  Stethoscope, 
  Leaf, 
  Users, 
  DollarSign,
  BarChart3
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdvantagesSection = () => {
  const capabilities = [
    {
      icon: Package,
      title: "Inventario",
      description: "Control total de animales e insumos en tiempo real",
      tooltip: "Controla todos tus animales e insumos en tiempo real, con trazabilidad completa.",
      section: "#animals",
    },
    {
      icon: Milk,
      title: "Producción",
      description: "Seguimiento de leche y/o carne por animal",
      tooltip: "Registra y analiza producción de leche y/o carne por animal.",
      section: "#production",
    },
    {
      icon: Heart,
      title: "Reproducción",
      description: "Ciclos reproductivos, celos y fertilidad",
      tooltip: "Gestiona ciclos reproductivos, celos, inseminaciones y partos.",
      section: "#reproduction",
    },
    {
      icon: Stethoscope,
      title: "Salud y Mastitis",
      description: "Historial médico, tratamientos y alertas",
      tooltip: "Historial médico, tratamientos, alertas sanitarias y control de mastitis.",
      section: "#health",
    },
    {
      icon: Leaf,
      title: "Praderas y Aforo",
      description: "Gestión de pasturas y rotación de potreros",
      tooltip: "Gestión de pasturas, rotación de potreros y capacidad de carga.",
      section: "#paddocks",
    },
    {
      icon: Users,
      title: "Grupos y Genética",
      description: "Lotes, linajes y mejoramiento genético",
      tooltip: "Clasifica animales por lotes, linajes y mejora genética.",
      section: "#genetics",
    },
    {
      icon: DollarSign,
      title: "Costos y Finanzas",
      description: "Rentabilidad por animal y análisis económico",
      tooltip: "Controla gastos, rentabilidad por animal y resultados económicos.",
      section: "#costs",
    },
    {
      icon: BarChart3,
      title: "Reportes",
      description: "Informes personalizables y exportables",
      tooltip: "Reportes claros, exportables y listos para auditorías.",
      section: "#reports",
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="advantages" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Todo en Uno
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Un Sistema
            <span className="text-primary"> Centralizado</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Monitorea y controla cada aspecto de tu ganadería desde una sola plataforma. 
            Sin complicaciones, sin múltiples herramientas.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {capabilities.map((item, index) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => scrollToSection('#features')}
                  className="group relative bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.icon size={28} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Bottom highlight */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-accent/10 border border-accent/20">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-foreground font-medium">
              Todo sincronizado en tiempo real, sin límite de fincas ni animales
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;
