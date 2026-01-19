import { Check, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Trimestral",
    duration: "3 meses",
    price: 49900,
    total: 149700,
    icon: Zap,
    popular: false,
    features: [
      "Acceso completo a todas las funciones",
      "Animales ilimitados",
      "Usuarios ilimitados",
      "App móvil incluida",
      "Soporte técnico",
      "Actualizaciones gratuitas",
    ],
    description: "Ideal para probar la plataforma",
  },
  {
    name: "Semestral",
    duration: "6 meses",
    price: 39900,
    total: 239400,
    savings: 60000,
    discount: 20,
    icon: Star,
    popular: true,
    features: [
      "Todo del plan Trimestral",
      "Soporte prioritario",
      "Capacitación personalizada",
      "Reportes avanzados",
      "Integraciones premium",
      "Backup automático",
    ],
    description: "Recomendado para resultados sostenibles",
  },
  {
    name: "Anual",
    duration: "12 meses",
    price: 29900,
    total: 358800,
    savings: 240000,
    discount: 40,
    icon: Crown,
    popular: false,
    best: true,
    features: [
      "Todo del plan Semestral",
      "Acceso anticipado a nuevas funciones",
      "Asesoría técnica dedicada",
      "Exportación ilimitada",
      "API para integraciones",
      "SLA garantizado",
    ],
    description: "Mejor valor para operaciones profesionales",
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const PricingSection = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    // Open WhatsApp with pre-filled message
    const message = encodeURIComponent(`Hola, quiero suscribirme al plan ${planName} de SmartPasture Pro`);
    window.open(`https://wa.me/573001234567?text=${message}`, "_blank");
  };

  return (
    <section id="precios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Planes y Precios
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Elige el plan perfecto para tu finca
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todos los planes incluyen acceso completo a la plataforma, sin límites de animales ni usuarios.
            Paga menos al suscribirte por más tiempo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular ? "border-primary border-2 shadow-lg scale-105" : ""
                } ${plan.best ? "border-accent" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    ⭐ RECOMENDADO
                  </div>
                )}
                {plan.best && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    💎 MEJOR VALOR
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto mb-3 p-3 rounded-full ${
                    plan.popular ? "bg-primary/10" : plan.best ? "bg-accent/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      plan.popular ? "text-primary" : plan.best ? "text-accent" : "text-muted-foreground"
                    }`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.duration} • Total: {formatPrice(plan.total)}
                    </p>
                    {plan.savings && (
                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                        Ahorra {formatPrice(plan.savings)} ({plan.discount}% dto.)
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`w-full ${
                      plan.popular 
                        ? "bg-primary hover:bg-primary/90" 
                        : plan.best 
                          ? "bg-accent hover:bg-accent/90 text-accent-foreground" 
                          : ""
                    }`}
                    variant={plan.popular || plan.best ? "default" : "outline"}
                    size="lg"
                  >
                    Elegir {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Tienes una operación grande? Contáctanos para planes empresariales personalizados.
          </p>
          <Button variant="link" onClick={() => window.open("https://wa.me/573001234567?text=Hola,%20necesito%20un%20plan%20empresarial", "_blank")}>
            Contactar ventas →
          </Button>
        </div>
      </div>
    </section>
  );
};
