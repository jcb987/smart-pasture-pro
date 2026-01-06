import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const Privacidad = () => {
  const highlights = [
    { icon: Lock, title: "Datos Encriptados", desc: "Cifrado de extremo a extremo" },
    { icon: Eye, title: "Sin Venta de Datos", desc: "Nunca vendemos tu información" },
    { icon: Database, title: "Tus Datos, Tu Control", desc: "Exporta o elimina cuando quieras" },
    { icon: UserCheck, title: "Acceso Restringido", desc: "Solo tú y quien autorices" },
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
                <p className="text-muted-foreground">Última actualización: Enero 2026</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {highlights.map((item) => (
              <Card key={item.title} className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <item.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content */}
          <ScrollArea className="h-auto">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              
              {/* Introducción */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">1. Compromiso con tu Privacidad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  En Agro Data, entendemos que la información de tu ganadería es valiosa y confidencial. 
                  Esta política explica de manera clara y directa cómo manejamos tus datos, qué hacemos 
                  con ellos y, sobre todo, qué NO hacemos.
                </p>
                <div className="bg-accent/10 p-4 rounded-lg border border-accent/20 mt-4">
                  <p className="text-foreground font-medium text-sm">
                    🔒 Resumen: Tus datos son tuyos. No los vendemos. No los compartimos. 
                    Tú decides qué hacer con ellos.
                  </p>
                </div>
              </section>

              {/* Datos que Recopilamos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">2. Qué Datos Recopilamos</h2>
                
                <h3 className="text-lg font-medium text-foreground mt-4">2.1 Datos de Usuario</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Registro:</strong> Nombre, email, teléfono, nombre de finca</li>
                  <li><strong>Autenticación:</strong> Contraseña (almacenada de forma encriptada)</li>
                  <li><strong>Perfil:</strong> Foto (opcional), ubicación de finca, tipo de producción</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4">2.2 Datos de Animales</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Identificación (número de arete, RFID, nombre)</li>
                  <li>Información básica (sexo, raza, fecha de nacimiento, color)</li>
                  <li>Genealogía (padre, madre, linaje)</li>
                  <li>Estado (activo, vendido, descartado)</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4">2.3 Datos Productivos</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Producción de leche (litros, calidad, fechas)</li>
                  <li>Pesajes y ganancia de peso</li>
                  <li>Eventos reproductivos (celos, inseminaciones, partos)</li>
                  <li>Historial de salud (vacunas, tratamientos, diagnósticos)</li>
                  <li>Alimentación y consumo</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4">2.4 Datos Económicos</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Ingresos por venta de productos y animales</li>
                  <li>Gastos operativos por categoría</li>
                  <li>Costos de insumos y servicios</li>
                  <li>Análisis de rentabilidad</li>
                </ul>
              </section>

              {/* Cómo Usamos los Datos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">3. Cómo Usamos tus Datos</h2>
                
                <h3 className="text-lg font-medium text-foreground mt-4">3.1 Para tu Gestión Ganadera</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Mostrar información en el dashboard y reportes</li>
                  <li>Generar alertas de vacunas, partos y eventos importantes</li>
                  <li>Calcular indicadores de producción y rentabilidad</li>
                  <li>Permitir exportación a Excel y PDF</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4">3.2 Para la Inteligencia Artificial</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Analizar patrones para sugerir mejoras</li>
                  <li>Predecir posibles problemas de salud</li>
                  <li>Optimizar dietas y alimentación</li>
                  <li>Recomendar cruzamientos genéticos</li>
                </ul>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mt-4">
                  <p className="text-foreground text-sm">
                    <strong>Importante:</strong> La IA analiza TUS datos de forma aislada. 
                    No combinamos tu información con la de otros usuarios para entrenar modelos.
                  </p>
                </div>

                <h3 className="text-lg font-medium text-foreground mt-4">3.3 Para Mejorar el Servicio</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Estadísticas agregadas y anónimas para mejorar funciones</li>
                  <li>Detectar y corregir errores técnicos</li>
                  <li>Optimizar rendimiento del sistema</li>
                </ul>
              </section>

              {/* Qué NO Hacemos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">4. Qué NO Hacemos con tus Datos</h2>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <ul className="list-none space-y-3 text-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>NO vendemos</strong> tu información a terceros, jamás.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>NO compartimos</strong> datos individuales sin tu consentimiento explícito.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>NO usamos</strong> tus datos para publicidad de terceros.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>NO transferimos</strong> información a países sin protección adecuada.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>NO permitimos</strong> acceso a empleados sin necesidad operativa.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Seguridad */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">5. Seguridad de tus Datos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos múltiples capas de seguridad para proteger tu información:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-card border rounded-lg">
                    <Lock className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Cifrado</h4>
                    <p className="text-sm text-muted-foreground">
                      Todos los datos se transmiten y almacenan con cifrado AES-256
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <Shield className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Acceso Restringido</h4>
                    <p className="text-sm text-muted-foreground">
                      Solo personal autorizado con verificación en dos pasos
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <Database className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Respaldo Automático</h4>
                    <p className="text-sm text-muted-foreground">
                      Copias de seguridad diarias en servidores redundantes
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <Eye className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Monitoreo 24/7</h4>
                    <p className="text-sm text-muted-foreground">
                      Detección de accesos sospechosos en tiempo real
                    </p>
                  </div>
                </div>
              </section>

              {/* Derechos del Usuario */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">6. Tus Derechos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Tienes control total sobre tus datos. Puedes ejercer estos derechos en cualquier momento:
                </p>
                <div className="space-y-4 mt-4">
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Eye className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Derecho de Acceso</h4>
                      <p className="text-sm text-muted-foreground">
                        Solicita una copia completa de todos los datos que tenemos sobre ti.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <UserCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Derecho de Modificación</h4>
                      <p className="text-sm text-muted-foreground">
                        Corrige o actualiza cualquier información incorrecta o desactualizada.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Database className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Derecho de Eliminación</h4>
                      <p className="text-sm text-muted-foreground">
                        Solicita la eliminación permanente de tu cuenta y todos tus datos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Download className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Derecho de Portabilidad</h4>
                      <p className="text-sm text-muted-foreground">
                        Exporta todos tus datos en formato Excel para usarlos donde quieras.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para ejercer cualquier derecho, escríbenos a <strong>privacidad@agrodata.com</strong> 
                  o usa la opción en Configuración → Privacidad.
                </p>
              </section>

              {/* Retención de Datos */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">7. Retención de Datos</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Cuenta activa:</strong> Mantenemos tus datos mientras uses el servicio</li>
                  <li><strong>Cuenta inactiva:</strong> Después de 2 años sin uso, te contactamos antes de eliminar</li>
                  <li><strong>Cancelación:</strong> Eliminamos datos en 30 días (puedes exportar antes)</li>
                  <li><strong>Datos legales:</strong> Algunos registros se conservan por obligación legal (ej: facturas)</li>
                </ul>
              </section>

              {/* Cumplimiento */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">8. Cumplimiento Normativo</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cumplimos con las principales regulaciones de privacidad:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Ley 1581 de 2012 (Colombia):</strong> Protección de datos personales</li>
                  <li><strong>RGPD/GDPR:</strong> Principios de privacidad de la Unión Europea</li>
                  <li><strong>Buenas prácticas:</strong> Estándares ISO 27001 de seguridad de la información</li>
                </ul>
              </section>

              {/* Contacto */}
              <section>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">9. Contacto de Privacidad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para cualquier consulta sobre privacidad de datos:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> privacidad@agrodata.com</li>
                  <li><strong>Oficial de Datos:</strong> datospersonales@agrodata.com</li>
                  <li><strong>WhatsApp:</strong> +57 300 123 4567</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Respondemos todas las consultas en máximo 15 días hábiles.
                </p>
              </section>

            </div>
          </ScrollArea>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacidad;
