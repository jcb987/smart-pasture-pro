import { Check, Star, Crown, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    description: "Ideal para conocer la plataforma",
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
    description: "El más elegido por ganaderos",
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
    description: "Mejor valor para profesionales",
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
  const handleSelectPlan = (planName: string) => {
    const message = encodeURIComponent(`Hola, quiero suscribirme al plan ${planName} de Agro Data`);
    window.open(`https://wa.me/573001234567?text=${message}`, "_blank");
  };

  return (
    <section id="precios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Planes y Precios</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Invierte Menos de lo que Cuesta Perder una Vaca
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sin límites. Sin sorpresas. Sin contratos forzosos.
            Todos los planes incluyen acceso completo.
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
                      <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
                        Ahorra {formatPrice(plan.savings)} ({plan.discount}% dto.)
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    className="w-full"
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

        {/* Guarantee */}
        <div className="text-center mt-12 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Garantía de Satisfacción</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Prueba gratis por 30 días. Si no ves resultados, te devolvemos tu dinero sin preguntas.
          </p>
        </div>
      </div>
    </section>
  );
};
