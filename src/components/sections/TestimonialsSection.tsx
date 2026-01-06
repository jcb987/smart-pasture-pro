import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Carlos Mendoza",
      role: "Ganadero, Hacienda La Esperanza",
      location: "Colombia",
      content: "Llevamos 3 años usando Agro Data y la diferencia es impresionante. Antes perdíamos horas en registros manuales, ahora todo está sistematizado y puedo tomar decisiones con datos reales.",
      rating: 5,
      animals: "850 cabezas",
    },
    {
      name: "María Elena Gutiérrez",
      role: "Administradora, Rancho San José",
      location: "México",
      content: "Lo mejor es el asistente inteligente. Me alertó de un problema reproductivo que no habíamos detectado. Gracias a eso evitamos pérdidas importantes en la producción.",
      rating: 5,
      animals: "2,400 cabezas",
    },
    {
      name: "Roberto Fernández",
      role: "Propietario, Estancia El Porvenir",
      location: "Argentina",
      content: "Tenemos 5 fincas y antes era un caos coordinar información. Con Agro Data todo está centralizado y puedo ver los KPIs de cada propiedad desde mi teléfono.",
      rating: 5,
      animals: "4,200 cabezas",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Lo que Dicen
            <span className="text-primary block">Nuestros Clientes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Miles de ganaderos en Latinoamérica confían en Agro Data 
            para gestionar sus operaciones diarias.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group bg-card rounded-2xl p-8 shadow-md border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 relative"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} className="text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="text-accent fill-accent"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div>
                  <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                  <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {testimonial.animals}
                  </div>
                  <div className="text-xs text-muted-foreground">gestionadas</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 bg-card rounded-2xl p-8 shadow-lg border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="text-accent fill-accent" />
                ))}
              </div>
              <div className="text-2xl font-bold text-foreground">4.9/5</div>
              <div className="text-sm text-muted-foreground">Calificación promedio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">10,000+</div>
              <div className="text-sm text-muted-foreground">Usuarios activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">15+</div>
              <div className="text-sm text-muted-foreground">Países</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground">Tasa de renovación</div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm">Confiado por ganaderos en toda Latinoamérica</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-60">
            {["🇨🇴 Colombia", "🇲🇽 México", "🇦🇷 Argentina", "🇧🇷 Brasil", "🇵🇪 Perú", "🇪🇨 Ecuador", "🇨🇱 Chile"].map(
              (country) => (
                <span key={country} className="text-foreground font-medium text-sm">
                  {country}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
