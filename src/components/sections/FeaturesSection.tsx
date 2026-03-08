import { Button } from "@/components/ui/button";
import {
  Brain,
  BarChart3,
  Smartphone,
  Cloud,
  BookOpen,
  Infinity,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "Asistente con IA",
    description: "Detecta problemas, sugiere acciones y predice tendencias antes de que impacten tu bolsillo.",
    stat: "Detecta problemas 3x más rápido",
  },
  {
    icon: BarChart3,
    title: "Tablero de KPIs",
    description: "Indicadores claros con alertas visuales. Sabrás en segundos si tu finca va bien o necesita atención.",
    stat: "Decisiones en segundos, no en horas",
  },
  {
    icon: Smartphone,
    title: "App Móvil Offline",
    description: "Registra datos en el campo sin internet. Se sincroniza automáticamente cuando hay conexión.",
    stat: "Funciona sin señal en el potrero",
  },
  {
    icon: Cloud,
    title: "Respaldo Automático",
    description: "Tus datos seguros en la nube, accesibles desde cualquier dispositivo, sin configurar nada.",
    stat: "Nunca más pierdas información",
  },
  {
    icon: BookOpen,
    title: "Fácil de Aprender",
    description: "Diseñado para ganaderos, no para ingenieros. Videos, guías y ayuda integrada en cada pantalla.",
    stat: "Aprende en menos de 1 hora",
  },
  {
    icon: Infinity,
    title: "Sin Límites",
    description: "Gestiona todas tus fincas y animales sin restricciones. Un solo precio, todo incluido.",
    stat: "Fincas y animales ilimitados",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todo lo que Necesitas, Nada que No
          </h2>
          <p className="text-muted-foreground text-lg">
            Cada función fue diseñada escuchando a ganaderos reales como tú.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer"
              onClick={() => navigate('/auth')}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">{feature.description}</p>
              <span className="text-xs font-semibold text-accent">{feature.stat}</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="group" onClick={() => navigate('/auth')}>
            Explorar todas las funciones
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
