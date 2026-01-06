import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie, Settings, BarChart3, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Cookies = () => {
  const cookieTypes = [
    {
      type: "Esenciales",
      badge: "Obligatorias",
      badgeVariant: "default" as const,
      icon: Settings,
      description: "Necesarias para el funcionamiento básico del sistema",
      examples: [
        { name: "session_token", purpose: "Mantener tu sesión iniciada", duration: "Hasta cerrar sesión" },
        { name: "csrf_token", purpose: "Proteger contra ataques de seguridad", duration: "Por sesión" },
        { name: "user_preferences", purpose: "Recordar tema claro/oscuro", duration: "1 año" },
      ],
    },
    {
      type: "Funcionales",
      badge: "Opcionales",
      badgeVariant: "secondary" as const,
      icon: Cookie,
      description: "Mejoran tu experiencia pero no son obligatorias",
      examples: [
        { name: "last_visited", purpose: "Recordar última sección visitada", duration: "30 días" },
        { name: "dashboard_layout", purpose: "Guardar configuración del dashboard", duration: "1 año" },
        { name: "notification_pref", purpose: "Preferencias de notificaciones", duration: "1 año" },
      ],
    },
    {
      type: "Analíticas",
      badge: "Opcionales",
      badgeVariant: "outline" as const,
      icon: BarChart3,
      description: "Nos ayudan a entender cómo usas la plataforma",
      examples: [
        { name: "_ga", purpose: "Estadísticas de uso anónimas", duration: "2 años" },
        { name: "page_views", purpose: "Contar páginas visitadas", duration: "30 días" },
      ],
    },
  ];

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
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Política de Cookies</h1>
                <p className="text-muted-foreground">Última actualización: Enero 2026</p>
              </div>
            </div>
          </div>

          {/* Summary Banner */}
          <Card className="bg-accent/10 border-accent/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-accent flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Resumen</h3>
                  <p className="text-muted-foreground text-sm">
                    Usamos cookies de forma mínima y responsable. Solo las esenciales son obligatorias. 
                    Las demás puedes desactivarlas en cualquier momento. <strong>No usamos cookies de publicidad 
                    ni tracking invasivo.</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <ScrollArea className="h-auto">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              
              {/* Qué son las Cookies */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">1. ¿Qué son las Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Las cookies son pequeños archivos de texto que se guardan en tu dispositivo cuando 
                  visitas un sitio web. Nos permiten recordar tus preferencias, mantener tu sesión 
                  activa y entender cómo usas la plataforma para mejorarla.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  En Agro Data usamos cookies de forma <strong>mínima y transparente</strong>. 
                  No las usamos para publicidad ni para seguirte por internet.
                </p>
              </section>

              {/* Tipos de Cookies */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">2. Cookies que Utilizamos</h2>
                
                <div className="space-y-6 mt-6">
                  {cookieTypes.map((category) => (
                    <Card key={category.type}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <category.icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{category.type}</CardTitle>
                          </div>
                          <Badge variant={category.badgeVariant}>{category.badge}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-foreground">Cookie</th>
                                <th className="text-left py-2 font-medium text-foreground">Propósito</th>
                                <th className="text-left py-2 font-medium text-foreground">Duración</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.examples.map((cookie) => (
                                <tr key={cookie.name} className="border-b last:border-0">
                                  <td className="py-2 text-muted-foreground font-mono text-xs">{cookie.name}</td>
                                  <td className="py-2 text-muted-foreground">{cookie.purpose}</td>
                                  <td className="py-2 text-muted-foreground">{cookie.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* No Usamos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">3. Lo que NO Hacemos</h2>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <ul className="list-none space-y-2 text-foreground text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span>NO usamos cookies de publicidad ni remarketing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span>NO compartimos datos de cookies con redes publicitarias</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span>NO te seguimos por otros sitios web</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span>NO vendemos información de tu comportamiento de navegación</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Gestionar Cookies */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">4. Cómo Gestionar tus Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Tienes control sobre las cookies que aceptas:
                </p>
                
                <h3 className="text-lg font-medium text-foreground mt-4">Desde Agro Data</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Al entrar por primera vez, verás un banner donde puedes aceptar todas o solo las esenciales</li>
                  <li>En Configuración → Privacidad puedes cambiar tus preferencias en cualquier momento</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4">Desde tu Navegador</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                  <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                  <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                  <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
                </ul>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mt-4">
                  <p className="text-foreground text-sm">
                    <strong>⚠️ Nota:</strong> Si bloqueas las cookies esenciales, algunas funciones 
                    del sistema podrían no funcionar correctamente (como mantener tu sesión iniciada).
                  </p>
                </div>
              </section>

              {/* Terceros */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">5. Cookies de Terceros</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Usamos servicios de terceros que pueden establecer sus propias cookies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Google Analytics:</strong> Para estadísticas de uso (anónimas y agregadas)</li>
                  <li><strong>Supabase:</strong> Para autenticación y almacenamiento de datos</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Estos servicios tienen sus propias políticas de privacidad. Puedes optar por no 
                  participar en Google Analytics instalando el 
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" 
                     className="text-primary hover:underline ml-1">
                    complemento de exclusión
                  </a>.
                </p>
              </section>

              {/* Actualizaciones */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">6. Cambios en esta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si modificamos esta política de cookies, te lo notificaremos mediante un aviso 
                  visible en la plataforma. Los cambios entrarán en vigor 30 días después de la 
                  publicación.
                </p>
              </section>

              {/* Contacto */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">7. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si tienes preguntas sobre nuestra política de cookies:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> privacidad@agrodata.com</li>
                  <li><strong>WhatsApp:</strong> +57 300 123 4567</li>
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

export default Cookies;
