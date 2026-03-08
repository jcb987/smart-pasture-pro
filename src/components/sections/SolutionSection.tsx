import { Database, BarChart3, ShieldCheck } from "lucide-react";

const pillars = [
  {
    icon: Database,
    title: "Centraliza Todo",
    description: "Animales, producción, costos, salud, reproducción y alimentación en un solo lugar. Adiós a los cuadernos y las hojas de cálculo.",
    highlight: "Un sistema, toda tu finca",
  },
  {
    icon: BarChart3,
    title: "Decide con Datos",
    description: "KPIs en tiempo real, alertas inteligentes y tendencias que te muestran exactamente qué hacer para mejorar resultados.",
    highlight: "Información → Acción → Resultados",
  },
  {
    icon: ShieldCheck,
    title: "Protege tu Inversión",
    description: "Respaldos automáticos en la nube, auditoría completa y seguridad de nivel empresarial. Tus datos nunca se pierden.",
    highlight: "Seguridad sin esfuerzo",
  },
];

const SolutionSection = () => {
  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            La Solución
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Agro Data: El Copiloto
            <span className="text-primary block">Inteligente de tu Ganadería</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un sistema diseñado por y para ganaderos. Fácil de usar, potente en resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group bg-card rounded-2xl p-8 border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{pillar.description}</p>
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {pillar.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
