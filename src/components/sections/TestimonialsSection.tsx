import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Carlos Mendoza",
      initials: "CM",
      role: "Hacienda La Esperanza",
      location: "Colombia",
      content: "Llevamos 3 años con Agro Data. Antes perdíamos horas en registros manuales, ahora tomo decisiones con datos reales. La producción de leche subió un 22%.",
      result: "+22% producción",
      animals: "850 cabezas",
      useCase: "Lechería especializada",
    },
    {
      name: "María Elena Gutiérrez",
      initials: "MG",
      role: "Rancho San José",
      location: "México",
      content: "El asistente inteligente me alertó de un problema reproductivo que no habíamos detectado. Evitamos pérdidas de más de $15,000 USD en un solo trimestre.",
      result: "$15K ahorrados",
      animals: "2,400 cabezas",
      useCase: "Doble propósito",
    },
    {
      name: "Roberto Fernández",
      initials: "RF",
      role: "Estancia El Porvenir",
      location: "Argentina",
      content: "Tenemos 5 fincas y antes era un caos coordinar información. Ahora todo está centralizado y veo los KPIs desde el teléfono. Se paga solo.",
      result: "5 fincas unificadas",
      animals: "4,200 cabezas",
      useCase: "Cría y engorde multi-finca",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-subtle relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
            Casos de Éxito
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ganaderos Reales,
            <span className="text-primary block">Resultados Reales</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            No lo decimos nosotros. Lo dicen miles de ganaderos que ya transformaron su operación.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div
              key={t.name}
              className="group bg-card rounded-2xl p-8 shadow-md border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 relative"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} className="text-primary" />
              </div>

              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} className="text-accent fill-accent" />
                ))}
              </div>

              <p className="text-foreground leading-relaxed mb-4">"{t.content}"</p>

              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                {t.useCase}
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                    <p className="text-muted-foreground text-xs">{t.role} • {t.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-accent">{t.result}</div>
                  <div className="text-xs text-muted-foreground">{t.animals}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 bg-card rounded-2xl p-8 shadow-lg border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: "⭐", value: "4.9/5", label: "Calificación promedio" },
              { icon: "🏘️", value: "10,000+", label: "Fincas activas" },
              { icon: "🌎", value: "15+", label: "Países" },
              { icon: "🔄", value: "98%", label: "Tasa de renovación" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
