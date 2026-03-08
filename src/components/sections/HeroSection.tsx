import { Button } from "@/components/ui/button";
import { ChevronRight, Play, Milk, Beef, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-background.png";

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const rotatingMessages = [
    "IA que detecta problemas antes de que te cuesten dinero",
    "Funciona sin internet — ideal para zonas rurales",
    "Compatible con básculas, lectores RFID y sensores",
    "Sincronización automática entre campo y oficina",
  ];

  const categories = [
    { icon: Milk, label: "Lechería" },
    { icon: Target, label: "Doble Propósito" },
    { icon: Beef, label: "Cría y Recría" },
    { icon: Target, label: "Engorde" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % rotatingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              Usado por +10,000 fincas en 15 países
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up leading-tight">
            Deja de Perder Dinero por
            <span className="block text-accent mt-2">Falta de Datos en tu Ganadería</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Controla cada animal, cada litro y cada peso invertido.
            Toma decisiones con datos reales y aumenta la rentabilidad de tu finca hasta un 35%.
          </p>

          {/* Rotating Messages */}
          <div className="mb-10 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative h-10 overflow-hidden">
              {rotatingMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                    index === currentSlide
                      ? "opacity-100 translate-y-0"
                      : index < currentSlide
                      ? "opacity-0 -translate-y-full"
                      : "opacity-0 translate-y-full"
                  }`}
                >
                  <span className="px-5 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 text-primary-foreground font-medium text-sm md:text-base">
                    {msg}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-3">
              {rotatingMessages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-accent w-6"
                      : "bg-primary-foreground/30 hover:bg-primary-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
              Empieza Gratis — Sin Tarjeta
              <ChevronRight className="ml-1" />
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2" size={18} />
              Ver Cómo Funciona
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {categories.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 text-primary-foreground/90 text-sm transition-all hover:bg-primary-foreground/20 hover:scale-105 cursor-pointer"
              >
                <cat.icon size={16} />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 md:gap-20 mt-16 pt-12 border-t border-primary-foreground/10 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            {[
              { value: "10,000+", label: "Fincas Activas" },
              { value: "2M+", label: "Animales Registrados" },
              { value: "15+", label: "Países" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-primary-foreground/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
