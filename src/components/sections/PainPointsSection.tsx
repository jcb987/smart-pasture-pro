import { AlertTriangle, Clock, HelpCircle, TrendingDown } from "lucide-react";

const painPoints = [
  {
    icon: TrendingDown,
    title: "Pierdes animales sin saber por qué",
    description: "Sin datos históricos ni alertas, los problemas de salud se detectan cuando ya es tarde. Una vaca enferma puede costarte millones.",
  },
  {
    icon: Clock,
    title: "Gastas horas en cuadernos y Excel",
    description: "Registros manuales que se pierden, se dañan o no se pueden analizar. Información valiosa atrapada en papel.",
  },
  {
    icon: HelpCircle,
    title: "No sabes cuáles vacas son rentables",
    description: "Sin métricas claras de producción por animal, alimentas vacas que te cuestan más de lo que producen.",
  },
  {
    icon: AlertTriangle,
    title: "Tomas decisiones a ciegas",
    description: "Sin indicadores en tiempo real, cada decisión es una apuesta. Compras, ventas y tratamientos sin respaldo de datos.",
  },
];

const PainPointsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-semibold mb-4">
            ¿Te suena familiar?
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Estos Problemas le Cuestan
            <span className="text-destructive block">Miles de Dólares a tu Finca</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="group bg-card rounded-2xl p-6 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 hover:border-destructive/20"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/15 transition-colors">
                <point.icon className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{point.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            No es tu culpa. Es que <span className="text-foreground font-semibold">no tienes las herramientas correctas</span>.
            Hasta ahora.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
