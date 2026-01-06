import { TrendingUp, Clock, DollarSign, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const UseCasesSection = () => {
  const cases = [
    {
      icon: TrendingUp,
      category: "Producción",
      title: "Aumenta la producción de leche un 15% en 6 meses",
      description: "Identifica vacas de bajo rendimiento, optimiza la alimentación según curvas de lactancia y detecta problemas de salud antes de que afecten la producción.",
      results: [
        "Curvas de producción por vaca",
        "Alertas de baja producción",
        "Recomendaciones de alimentación",
      ],
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Heart,
      category: "Reproducción",
      title: "Mejora la tasa de preñez del 55% al 70%",
      description: "Monitorea ciclos reproductivos, detecta celos automáticamente y programa inseminaciones en el momento óptimo.",
      results: [
        "Calendario de celos",
        "Historial reproductivo",
        "Proyección de partos",
      ],
      color: "from-rose-500 to-rose-600",
    },
    {
      icon: Clock,
      category: "Eficiencia",
      title: "Reduce el tiempo de registro en un 70%",
      description: "Integra lectores RFID, básculas automáticas y app móvil para capturar datos sin digitación manual.",
      results: [
        "Escaneo automático RFID",
        "Pesaje sin digitación",
        "Registro en campo",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: DollarSign,
      category: "Finanzas",
      title: "Identifica qué animales son rentables y cuáles no",
      description: "Análisis de costos por animal, retorno de inversión y decisiones de descarte basadas en datos económicos reales.",
      results: [
        "Costo por litro producido",
        "Rentabilidad por vaca",
        "Análisis de descarte",
      ],
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <section id="use-cases" className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
            Casos de Éxito
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Resultados Reales con
            <span className="text-primary block">Agro Data</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Descubre cómo otros ganaderos han transformado sus operaciones 
            con decisiones basadas en datos.
          </p>
        </div>

        {/* Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {cases.map((useCase, index) => (
            <div
              key={useCase.title}
              className="group bg-card rounded-2xl p-8 shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${useCase.color}`}>
                  <useCase.icon size={16} />
                  {useCase.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-foreground mb-4 leading-tight">
                {useCase.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-6">
                {useCase.description}
              </p>

              {/* Results */}
              <div className="space-y-2 mb-6">
                {useCase.results.map((result) => (
                  <div key={result} className="flex items-center gap-3 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${useCase.color}`} />
                    <span className="text-foreground">{result}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
                Ver caso completo
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-card rounded-2xl border border-border/50 shadow-lg">
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-foreground mb-1">¿Quieres resultados como estos?</h4>
              <p className="text-sm text-muted-foreground">Comienza tu prueba gratuita hoy mismo</p>
            </div>
            <Button size="lg">
              Comenzar Gratis
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
