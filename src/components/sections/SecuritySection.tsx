import { Shield, Users, FileCheck, History, Lock, Eye } from "lucide-react";

const SecuritySection = () => {
  const features = [
    {
      icon: History,
      title: "Auditoría Completa",
      description: "Registro de qué datos se modificaron, cuándo y por quién. Trazabilidad total.",
    },
    {
      icon: Users,
      title: "Control de Usuarios",
      description: "Define roles y permisos para cada miembro del equipo. Acceso controlado.",
    },
    {
      icon: Lock,
      title: "Datos Protegidos",
      description: "Respaldos automáticos en la nube y encriptación de información sensible.",
    },
    {
      icon: FileCheck,
      title: "Validación de Datos",
      description: "El sistema detecta errores y muestra qué datos son incorrectos para corregirlos.",
    },
  ];

  return (
    <section id="security" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Seguridad
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Datos Seguros y
              <span className="text-primary block">100% Auditables</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Cumple con estándares de certificación y auditoría. Cada cambio queda 
              registrado para que siempre sepas qué pasó y cuándo.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Registro de Actividad</h3>
                    <p className="text-xs text-muted-foreground">Últimos cambios en el sistema</p>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="space-y-3">
                {[
                  { user: "Carlos M.", action: "Registró parto", animal: "#247", time: "Hace 5 min", type: "success" },
                  { user: "María G.", action: "Actualizó peso", animal: "#183", time: "Hace 15 min", type: "info" },
                  { user: "Admin", action: "Modificó rol de usuario", animal: "Juan P.", time: "Hace 1 hora", type: "warning" },
                  { user: "Carlos M.", action: "Registró venta", animal: "Lote #12", time: "Hace 2 horas", type: "success" },
                ].map((log, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {log.user.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.user}</span>
                        {" "}{log.action}{" "}
                        <span className="text-primary font-medium">{log.animal}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                    <Eye size={14} className="text-muted-foreground" />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">1,247 registros este mes</span>
                  <button className="text-primary font-medium hover:underline">
                    Ver historial completo →
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
