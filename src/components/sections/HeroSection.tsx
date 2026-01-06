import { Button } from "@/components/ui/button";
import { Play, ChevronRight, Milk, Beef, Target, Cpu, Smartphone, BarChart3, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import heroBackground from "@/assets/hero-background.png";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories = [
    { icon: Milk, label: "Lechería" },
    { icon: Target, label: "Doble Propósito" },
    { icon: Beef, label: "Cría y Recría" },
    { icon: Target, label: "Engorde" },
  ];

  const rotatingMessages = [
    {
      icon: BarChart3,
      text: "Algoritmos inteligentes para detectar problemas",
    },
    {
      icon: Smartphone,
      text: "App móvil para consultar datos sin Internet",
    },
    {
      icon: Cpu,
      text: "Compatible con básculas, lectores y sensores",
    },
    {
      icon: Wifi,
      text: "Sincronización automática con la nube",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % rotatingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              Líder en Latinoamérica en Gestión Ganadera
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up leading-tight">
            El Sistema de Gestión Ganadera
            <span className="block text-accent mt-2">Más Completo</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-6 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Sistematiza y administra tu ganadería con inteligencia artificial. 
            Sin límite de fincas ni animales. Funciona offline y se sincroniza en la nube.
          </p>

          {/* Rotating Messages Banner */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative h-12 overflow-hidden">
              {rotatingMessages.map((msg, index) => {
                const Icon = msg.icon;
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 flex items-center justify-center gap-3 transition-all duration-500 ${
                      index === currentSlide
                        ? "opacity-100 translate-y-0"
                        : index < currentSlide
                        ? "opacity-0 -translate-y-full"
                        : "opacity-0 translate-y-full"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
                      <Icon size={18} className="text-accent" />
                      <span className="text-primary-foreground font-medium text-sm md:text-base">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Dots indicator */}
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
            <Button variant="hero" size="xl">
              Comenzar Gratis
              <ChevronRight className="ml-1" />
            </Button>
            <Button variant="heroOutline" size="xl">
              <Play className="mr-2" size={18} />
              Ver Demo
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {categories.map((cat, index) => (
              <div
                key={cat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 text-primary-foreground/90 text-sm transition-all hover:bg-primary-foreground/20 hover:scale-105 cursor-default"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <cat.icon size={16} />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-primary-foreground/10 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            {[
              { value: "10,000+", label: "Fincas Activas" },
              { value: "2M+", label: "Animales Registrados" },
              { value: "15+", label: "Países" },
              { value: "99.9%", label: "Uptime" },
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
