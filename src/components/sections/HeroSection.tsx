import { Button } from "@/components/ui/button";
import { Play, ChevronRight, Milk, Beef, Target, Cpu, Smartphone, BarChart3, Wifi, Download, Apple, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import heroBackground from "@/assets/hero-background.png";

// SVG Icons for stores
const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.624 7.222c-.876 0-2.232-.996-3.66-.96-1.884.024-3.612 1.092-4.584 2.784-1.956 3.396-.504 8.412 1.404 11.172.936 1.344 2.04 2.856 3.504 2.808 1.404-.06 1.932-.912 3.636-.912 1.692 0 2.172.912 3.66.876 1.512-.024 2.472-1.368 3.396-2.724 1.068-1.56 1.512-3.072 1.536-3.156-.036-.012-2.94-1.128-2.976-4.488-.024-2.808 2.292-4.152 2.4-4.212-1.32-1.932-3.348-2.148-4.056-2.196-1.848-.144-3.396 1.008-4.26 1.008zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54-1.116.048-2.46.744-3.264 1.68-.72.828-1.344 2.16-1.176 3.432 1.236.096 2.508-.636 3.288-1.572z"/>
  </svg>
);

const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
  </svg>
);

// Detect user's operating system
const getOS = (): 'windows' | 'ios' | 'android' | 'mac' | 'unknown' => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/mac/.test(userAgent)) return 'mac';
  if (/win/.test(userAgent)) return 'windows';
  return 'unknown';
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [userOS] = useState(getOS());

  const categories = [
    { icon: Milk, label: "Lechería", tooltip: "Gestión completa de producción lechera" },
    { icon: Target, label: "Doble Propósito", tooltip: "Control de leche y carne en un solo sistema" },
    { icon: Beef, label: "Cría y Recría", tooltip: "Seguimiento del crecimiento y desarrollo" },
    { icon: Target, label: "Engorde", tooltip: "Optimiza la ganancia de peso diaria" },
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

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleStartFree = () => {
    navigate('/auth');
  };

  const handleWatchDemo = () => {
    const featuresSection = document.querySelector('#features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('¡Aplicación instalada correctamente!');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback instructions based on OS
      if (userOS === 'ios') {
        toast.info('Para instalar en iOS: toca el botón Compartir y selecciona "Agregar a pantalla de inicio"', { duration: 6000 });
      } else if (userOS === 'android') {
        toast.info('Para instalar en Android: toca el menú del navegador y selecciona "Instalar aplicación"', { duration: 6000 });
      } else {
        toast.info('Para instalar: usa el menú del navegador y busca "Instalar aplicación"', { duration: 6000 });
      }
    }
  };

  const handleWindowsDownload = () => {
    if (isInstallable && deferredPrompt) {
      handleInstallPWA();
    } else {
      toast.info('Para Windows: usa Chrome o Edge y haz clic en el icono de instalación en la barra de direcciones', { duration: 6000 });
    }
  };

  const handleIOSDownload = () => {
    if (userOS === 'ios') {
      toast.info('Toca el botón Compartir (📤) en Safari y selecciona "Agregar a pantalla de inicio"', { duration: 6000 });
    } else {
      toast.info('Para instalar en iPhone/iPad: abre esta página en Safari, toca Compartir y selecciona "Agregar a pantalla de inicio"', { duration: 6000 });
    }
  };

  const handleAndroidDownload = () => {
    if (isInstallable && deferredPrompt) {
      handleInstallPWA();
    } else if (userOS === 'android') {
      toast.info('Toca el menú (⋮) del navegador y selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"', { duration: 6000 });
    } else {
      toast.info('Para instalar en Android: abre esta página en Chrome y toca el menú para "Instalar aplicación"', { duration: 6000 });
    }
  };

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
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-in cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-primary-foreground/90 text-sm font-medium">
                  Líder en Latinoamérica en Gestión Ganadera
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-background text-foreground">
              <p className="text-sm">Más de 10,000 fincas confían en nosotros</p>
            </TooltipContent>
          </Tooltip>

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

          {/* Download Buttons */}
          <div className="flex flex-col items-center gap-3 mb-12 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <p className="text-primary-foreground/60 text-sm">
              {isInstallable ? '¡Instala la app ahora!' : 'Descarga la app para tu dispositivo:'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleWindowsDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                  >
                    <WindowsIcon />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-primary-foreground/60 leading-none">Descargar para</span>
                      <span className="text-sm font-semibold leading-tight">Windows</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-background text-foreground">
                  <p className="text-sm">Instala la aplicación en tu PC con Windows</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleIOSDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                  >
                    <AppStoreIcon />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-primary-foreground/60 leading-none">Instalar en</span>
                      <span className="text-sm font-semibold leading-tight">iPhone/iPad</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-background text-foreground">
                  <p className="text-sm">Instrucciones para instalar en iOS</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleAndroidDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all hover:scale-105"
                  >
                    <PlayStoreIcon />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-primary-foreground/60 leading-none">Instalar en</span>
                      <span className="text-sm font-semibold leading-tight">Android</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-background text-foreground">
                  <p className="text-sm">{isInstallable ? 'Toca para instalar ahora' : 'Instrucciones para instalar en Android'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="hero" size="xl" onClick={handleStartFree}>
                  Comenzar Gratis
                  <ChevronRight className="ml-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background text-foreground">
                <p className="text-sm">Prueba gratis por 30 días, sin tarjeta de crédito</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="heroOutline" size="xl" onClick={handleWatchDemo}>
                  <Play className="mr-2" size={18} />
                  Ver Demo
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background text-foreground">
                <p className="text-sm">Mira cómo funciona el sistema en 2 minutos</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {categories.map((cat, index) => (
              <Tooltip key={cat.label}>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 text-primary-foreground/90 text-sm transition-all hover:bg-primary-foreground/20 hover:scale-105 cursor-pointer"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <cat.icon size={16} />
                    <span>{cat.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-background text-foreground">
                  <p className="text-sm">{cat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 md:gap-20 mt-16 pt-12 border-t border-primary-foreground/10 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            {[
              { value: "10,000+", label: "Fincas Activas", tooltip: "Fincas usando Agro Data activamente" },
              { value: "2M+", label: "Animales Registrados", tooltip: "Animales gestionados en la plataforma" },
              { value: "15+", label: "Países", tooltip: "Presencia en toda Latinoamérica" },
            ].map((stat) => (
              <Tooltip key={stat.label}>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-pointer">
                    <div className="text-3xl md:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                    <div className="text-primary-foreground/60 text-sm">{stat.label}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-background text-foreground">
                  <p className="text-sm">{stat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
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
