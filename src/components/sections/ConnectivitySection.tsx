import { 
  Wifi, 
  WifiOff, 
  Laptop, 
  Smartphone, 
  Cloud,
  RefreshCw,
  Cpu,
  Radio
} from "lucide-react";

const ConnectivitySection = () => {
  const connections = [
    {
      icon: Laptop,
      title: "PC Windows",
      description: "Funciona localmente sin dependencia de internet",
    },
    {
      icon: Smartphone,
      title: "App Móvil",
      description: "Sincroniza datos con tu teléfono o tablet",
    },
    {
      icon: Cloud,
      title: "Nube",
      description: "Respaldo y acceso desde cualquier lugar",
    },
    {
      icon: RefreshCw,
      title: "Multiusuario",
      description: "Trabajo en red local o remoto",
    },
  ];

  const hardware = [
    { icon: Radio, name: "Lectores RFID" },
    { icon: Cpu, name: "Básculas Electrónicas" },
    { icon: Radio, name: "Collares Inteligentes" },
    { icon: Cpu, name: "Equipos de Ordeño" },
  ];

  return (
    <section id="connectivity" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Conectividad
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Trabaja Donde Estés,
            <span className="text-primary block">Como Prefieras</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Flexibilidad total para adaptarse a las condiciones de tu finca. 
            Con o sin internet, tus datos siempre están disponibles.
          </p>
        </div>

        {/* Main Feature - Offline/Online */}
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-lg border border-border/50 mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Offline Mode */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent/20 rounded-full blur-xl" />
              <div className="relative bg-secondary rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                    <WifiOff size={28} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Modo Sin Conexión</h3>
                    <p className="text-muted-foreground text-sm">Funciona 100% offline</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Software instalado en tu PC",
                    "No requiere internet para funcionar",
                    "Datos guardados localmente",
                    "Ideal para zonas rurales",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Online Mode */}
            <div className="relative">
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
              <div className="relative bg-secondary rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                    <Wifi size={28} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Modo Conectado</h3>
                    <p className="text-muted-foreground text-sm">Sincronización en la nube</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Sincroniza con la app móvil",
                    "Respaldo automático en la nube",
                    "Acceso desde múltiples dispositivos",
                    "Consulta datos en tiempo real",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-foreground">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {connections.map((conn) => (
            <div
              key={conn.title}
              className="group bg-card rounded-2xl p-6 shadow-md border border-border/50 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <conn.icon size={28} className="text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">{conn.title}</h4>
              <p className="text-muted-foreground text-sm">{conn.description}</p>
            </div>
          ))}
        </div>

        {/* Hardware Compatibility */}
        <div className="bg-primary rounded-3xl p-8 md:p-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              Compatible con tu Hardware
            </h3>
            <p className="text-primary-foreground/70">
              Integración automática con los principales equipos ganaderos
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hardware.map((item) => (
              <div
                key={item.name}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 text-center border border-primary-foreground/10 transition-all hover:bg-primary-foreground/20"
              >
                <item.icon size={32} className="text-accent mx-auto mb-3" />
                <span className="text-primary-foreground font-medium text-sm">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConnectivitySection;
