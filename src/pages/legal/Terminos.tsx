import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Terminos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Términos de Servicio</h1>
                <p className="text-muted-foreground">Última actualización: Enero 2026</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-auto">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              
              {/* Introducción */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">1. Introducción</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bienvenido a Agro Data. Al acceder y utilizar nuestra plataforma de gestión ganadera, 
                  usted acepta cumplir con estos términos de servicio. Le recomendamos leerlos detenidamente 
                  antes de usar el sistema.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Agro Data es un software diseñado para ayudar a ganaderos a administrar sus operaciones 
                  de manera eficiente, incluyendo el control de animales, producción, reproducción, salud, 
                  alimentación y finanzas.
                </p>
              </section>

              {/* Uso Permitido */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">2. Uso Permitido de la Plataforma</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Agro Data está diseñado exclusivamente para la gestión de operaciones ganaderas. 
                  El uso permitido incluye:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Registro y seguimiento de animales de su propiedad o bajo su administración</li>
                  <li>Monitoreo de producción de leche y/o carne</li>
                  <li>Control reproductivo y sanitario del ganado</li>
                  <li>Gestión de alimentación, praderas e insumos</li>
                  <li>Análisis financiero y generación de reportes</li>
                  <li>Uso de herramientas de inteligencia artificial para optimización</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Queda prohibido:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Usar la plataforma para actividades ilegales o fraudulentas</li>
                  <li>Intentar acceder a cuentas de otros usuarios sin autorización</li>
                  <li>Modificar, copiar o distribuir el software sin permiso</li>
                  <li>Usar el sistema para enviar spam o contenido malicioso</li>
                  <li>Revender o sublicenciar el acceso a la plataforma</li>
                </ul>
              </section>

              {/* Responsabilidades del Usuario */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">3. Responsabilidades del Usuario</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Como usuario de Agro Data, usted es responsable de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                  <li>Proporcionar información veraz y actualizada sobre sus animales y operaciones</li>
                  <li>Usar el sistema de acuerdo con las leyes de su país</li>
                  <li>Realizar respaldos periódicos de sus datos cuando sea posible</li>
                  <li>Notificar inmediatamente cualquier acceso no autorizado a su cuenta</li>
                  <li>Asegurar que los dispositivos desde los que accede sean seguros</li>
                </ul>
              </section>

              {/* Datos Ganaderos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">4. Uso de Datos Ganaderos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Los datos que registre en Agro Data (información de animales, producción, costos, etc.) 
                  son de su propiedad. Nosotros actuamos como custodios de esta información.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Sus datos ganaderos se almacenan de forma segura y encriptada</li>
                  <li>Solo usted y los usuarios que autorice pueden acceder a su información</li>
                  <li>Puede exportar todos sus datos en cualquier momento en formato Excel</li>
                  <li>Al cancelar su cuenta, puede solicitar una copia completa de sus datos</li>
                  <li>No vendemos ni compartimos sus datos ganaderos con terceros</li>
                </ul>
              </section>

              {/* Limitación de Responsabilidad */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">5. Limitación de Responsabilidad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Agro Data es una herramienta de apoyo a la gestión ganadera. Aunque nos esforzamos por 
                  proporcionar información precisa y recomendaciones útiles:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Las sugerencias de la IA son orientativas y no reemplazan el criterio profesional</li>
                  <li>Las decisiones sobre salud animal deben consultarse con un veterinario</li>
                  <li>Los análisis financieros son estimaciones basadas en los datos ingresados</li>
                  <li>No nos hacemos responsables por pérdidas derivadas de decisiones basadas en el sistema</li>
                  <li>El servicio se proporciona "tal cual" sin garantías de disponibilidad del 100%</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  En ningún caso nuestra responsabilidad excederá el monto pagado por el servicio 
                  en los últimos 12 meses.
                </p>
              </section>

              {/* Suspensión y Cancelación */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">6. Suspensión y Cancelación</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Por parte del usuario:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Puede cancelar su cuenta en cualquier momento desde Configuración</li>
                  <li>Al cancelar, tendrá 30 días para exportar sus datos</li>
                  <li>Los pagos realizados no son reembolsables, excepto prorratas en planes anuales</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Por parte de Agro Data:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Podemos suspender cuentas que violen estos términos</li>
                  <li>Se notificará por email antes de cualquier suspensión, excepto en casos graves</li>
                  <li>En caso de uso fraudulento, la suspensión puede ser inmediata y permanente</li>
                </ul>
              </section>

              {/* Propiedad Intelectual */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">7. Propiedad Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  El software Agro Data, incluyendo su código, diseño, algoritmos e inteligencia artificial, 
                  es propiedad exclusiva de Agro Data y está protegido por leyes de propiedad intelectual.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Se le otorga una licencia limitada y no exclusiva para usar el software</li>
                  <li>No puede descompilar, modificar o crear obras derivadas del software</li>
                  <li>Las marcas, logos y nombres comerciales son propiedad de Agro Data</li>
                  <li>Los datos que usted ingresa siguen siendo de su propiedad</li>
                </ul>
              </section>

              {/* Modificaciones */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">8. Modificaciones a los Términos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Cuando lo hagamos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Publicaremos la versión actualizada en la plataforma</li>
                  <li>Notificaremos cambios importantes por email con 30 días de anticipación</li>
                  <li>El uso continuado del servicio implica aceptación de los nuevos términos</li>
                  <li>Si no está de acuerdo, puede cancelar su cuenta sin penalidad</li>
                </ul>
              </section>

              {/* Jurisdicción */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">9. Jurisdicción y Ley Aplicable</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta 
                  en los tribunales de Bogotá, Colombia. Para usuarios de otros países, respetamos 
                  las normativas locales de protección al consumidor cuando apliquen.
                </p>
              </section>

              {/* Contacto */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">10. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para preguntas sobre estos términos, contáctenos:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> legal@agrodata.com</li>
                  <li><strong>WhatsApp:</strong> +57 300 123 4567</li>
                  <li><strong>Dirección:</strong> Bogotá, Colombia</li>
                </ul>
              </section>

            </div>
          </ScrollArea>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terminos;
