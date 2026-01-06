import { Smartphone, Wifi, WifiOff, RefreshCw, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileAppSection = () => {
  const features = [
    {
      icon: WifiOff,
      title: "Funciona Sin Internet",
      description: "Registra datos en campo sin conexión. Se sincroniza automáticamente cuando hay señal.",
    },
    {
      icon: RefreshCw,
      title: "Sincronización Automática",
      description: "Tus datos del escritorio y móvil siempre actualizados y sincronizados.",
    },
    {
      icon: Camera,
      title: "Escaneo RFID",
      description: "Identifica animales con lector RFID conectado a tu teléfono o tablet.",
    },
    {
      icon: MapPin,
      title: "Registro en Campo",
      description: "Partos, celos, pesajes, vacunas y más desde donde estés en la finca.",
    },
  ];

  const fieldActions = [
    "Registrar partos",
    "Detectar celos",
    "Aplicar vacunas",
    "Pesar animales",
    "Registrar ventas",
    "Mover lotes",
  ];

  return (
    <section id="mobile-app" className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary rounded-full" />
        <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-accent rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Phone Mockup */}
          <div className="relative order-2 lg:order-1 flex justify-center">
            {/* Phone frame */}
            <div className="relative w-64 h-[520px] bg-foreground rounded-[3rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden relative">
                {/* Status bar */}
                <div className="bg-primary/10 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Agro Data</span>
                  <div className="flex items-center gap-2">
                    <Wifi size={12} className="text-primary" />
                    <div className="w-6 h-3 bg-primary/30 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-primary rounded-full" />
                    </div>
                  </div>
                </div>

                {/* App content */}
                <div className="p-4 space-y-4">
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-primary">247</p>
                      <p className="text-[10px] text-muted-foreground">Animales</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-accent">12</p>
                      <p className="text-[10px] text-muted-foreground">Pendientes</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Acciones Rápidas</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fieldActions.slice(0, 6).map((action) => (
                        <div
                          key={action}
                          className="bg-primary/10 rounded-lg p-2 text-center"
                        >
                          <p className="text-[9px] text-primary font-medium leading-tight">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sync status */}
                  <div className="bg-emerald-500/10 rounded-xl p-3 flex items-center gap-2">
                    <RefreshCw size={14} className="text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-medium">Sincronizado hace 2 min</span>
                  </div>

                  {/* Recent activity */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Último Registro</p>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] text-foreground font-medium">Vaca #183 - Parto registrado</p>
                      <p className="text-[9px] text-muted-foreground">Hace 15 minutos • Potrero Norte</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Floating elements */}
            <div className="absolute top-10 -left-4 bg-card rounded-xl p-3 shadow-lg border border-border/50 animate-pulse">
              <WifiOff size={20} className="text-primary" />
            </div>
            <div className="absolute bottom-20 -right-4 bg-card rounded-xl p-3 shadow-lg border border-border/50">
              <Smartphone size={20} className="text-accent" />
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-4">
              App Móvil
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Tu Ganadería en
              <span className="text-primary block">Tu Bolsillo</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Lleva el control de tu finca a cualquier parte. Registra eventos en campo, 
              consulta información de animales y trabaja sin depender de Internet.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg">
                Descargar App
              </Button>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
