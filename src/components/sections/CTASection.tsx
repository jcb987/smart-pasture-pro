import { Button } from "@/components/ui/button";
import { ChevronRight, Phone, Mail, MessageCircle } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Comienza a Transformar
            <span className="text-accent block mt-2">Tu Ganadería Hoy</span>
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Únete a miles de ganaderos que ya optimizaron su producción con Agro Data. 
            Prueba gratis por 30 días, sin compromiso.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl">
              Comenzar Prueba Gratis
              <ChevronRight className="ml-1" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Solicitar Demo
            </Button>
          </div>

          {/* Contact Options */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-primary-foreground/20">
            <a
              href="#"
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors"
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors"
            >
              <Phone size={20} />
              <span className="text-sm font-medium">Llamar Ahora</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors"
            >
              <Mail size={20} />
              <span className="text-sm font-medium">Correo</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
