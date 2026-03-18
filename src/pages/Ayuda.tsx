import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TutorialContent, moduleTutorials } from '@/components/ayuda/TutorialContent';
import { HelpAdminPanel } from '@/components/ayuda/HelpAdminPanel';
import { useHelpCenter, HelpGuide, HELP_MODULES } from '@/hooks/useHelpCenter';
import { useFounder } from '@/contexts/FounderContext';
import {
  HelpCircle, Book, Video, MessageCircle, Phone, Search,
  FileText, PlayCircle, Mail, ExternalLink, ChevronRight,
  Smartphone, BarChart3, Heart, Baby, Beef, Scale, Leaf, DollarSign,
  Settings, Users, Dna, Package, ArrowLeftRight, Clock, Edit, Link,
  Calendar, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const WHATSAPP_NUMBER = '573000000000'; // Actualizar con número real
const SUPPORT_EMAIL = 'soporte@agrodata.com.co';   // Actualizar con email real

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Primeros pasos
  {
    question: '¿Cómo configuro mi finca por primera vez?',
    answer: 'Al hacer login por primera vez aparecerá el Asistente de Configuración. En 3 pasos rápidos ingresarás el nombre de la finca, la ubicación (municipio y departamento) y el tipo de producción. Esta información se usa automáticamente en documentos y certificados.',
    category: 'inicio',
  },
  {
    question: '¿Cómo registro un nuevo animal?',
    answer: 'Ve al módulo Animales y haz clic en "Nuevo Animal" (o usa el atajo Ctrl+K → "Nuevo Animal"). Completa el formulario con ID, sexo, categoría y fecha de nacimiento. También puedes usar el botón flotante "+" en la esquina inferior derecha.',
    category: 'animales',
  },
  {
    question: '¿Puedo trabajar sin internet?',
    answer: 'Sí. La aplicación muestra un indicador de estado de conexión. Los datos ya cargados siguen accesibles. La app móvil funciona completamente offline y sincroniza al recuperar conexión.',
    category: 'app',
  },
  // Animales
  {
    question: '¿Cómo busco un animal rápidamente?',
    answer: 'Presiona Ctrl+K (o Cmd+K en Mac) para abrir el buscador. Escribe el número de arete o nombre y selecciona el animal. También puedes ir a Consultar Animal y usar el buscador con filtros.',
    category: 'animales',
  },
  {
    question: '¿Cómo descargo el código QR de un animal?',
    answer: 'En la página Consultar Animal, busca el animal y haz clic en el ícono QR. Se abrirá un diálogo con la tarjeta de identificación que puedes descargar como PDF para imprimir.',
    category: 'animales',
  },
  // Documentos
  {
    question: '¿Cómo genero una Guía de Movilización?',
    answer: 'Ve al módulo Documentos, selecciona "Guía de Movilización" y completa el formulario (predio, propietario, origen, destino, transportador). Selecciona los animales a mover y haz clic en "Generar PDF". Si configuraste tu finca en el asistente inicial, los campos se llenan automáticamente.',
    category: 'documentos',
  },
  {
    question: '¿Cómo genero un Certificado de Vacunación?',
    answer: 'En el módulo Documentos, selecciona "Certificado de Vacunación". Elige el animal, la vacuna aplicada, dosis, lote y veterinario. El sistema genera un PDF oficial listo para firmar.',
    category: 'documentos',
  },
  {
    question: '¿Los datos del predio se llenan solos en los documentos?',
    answer: 'Sí. Cuando configuras tu finca en el Asistente Inicial (nombre, municipio, departamento), esos datos se pre-llenan automáticamente en la Guía de Movilización y el Certificado de Vacunación. Puedes editarlos antes de generar el PDF.',
    category: 'documentos',
  },
  // Producción
  {
    question: '¿Cómo registro un pesaje?',
    answer: 'Desde el módulo Producción de Carne o desde la ficha del animal, haz clic en "Nuevo Pesaje". Ingresa el peso y la fecha. El sistema calcula automáticamente la ganancia diaria de peso (GDP).',
    category: 'produccion',
  },
  {
    question: '¿Cómo registro la producción de leche?',
    answer: 'Ve al módulo Producción de Leche y usa "Nuevo Registro" (o Ctrl+K → "Registrar Leche"). Puedes registrar por animal individual o en lote. El sistema genera gráficos de tendencia y estadísticas.',
    category: 'produccion',
  },
  // Reproducción
  {
    question: '¿Cómo registro una inseminación?',
    answer: 'En el módulo Reproducción, haz clic en "Registrar Evento". Selecciona el tipo "Inseminación", elige la hembra y completa los datos del toro/semen. El sistema calculará automáticamente la fecha estimada de parto.',
    category: 'reproduccion',
  },
  {
    question: '¿Cómo registro un parto?',
    answer: 'En Reproducción, crea un evento de tipo "Parto". Ingresa la madre, fecha y datos del ternero. El sistema registrará automáticamente el ternero como nuevo animal en el inventario.',
    category: 'reproduccion',
  },
  // Salud
  {
    question: '¿Cómo programo vacunaciones?',
    answer: 'En el módulo Salud, ve a la pestaña "Vacunas". Registra la vacuna aplicada con fecha, dosis y lote. El sistema genera alertas para la próxima aplicación según el protocolo configurado.',
    category: 'salud',
  },
  // Reportes
  {
    question: '¿Cómo exporto un reporte?',
    answer: 'En el módulo Reportes, selecciona el tipo de informe y configura los filtros. Haz clic en "Generar" y luego "Exportar PDF" o "Exportar Excel". El Informe Integral del Predio incluye todos los módulos en un solo documento.',
    category: 'reportes',
  },
  // Configuración
  {
    question: '¿Cómo cambio la información de mi finca después del setup inicial?',
    answer: 'Ve a Configuración y busca la sección "Datos del Predio" o "Ubicación". También puedes encontrar estas opciones en Configuración → Organización. Los cambios se reflejarán en los próximos documentos generados.',
    category: 'configuracion',
  },
  {
    question: '¿Cómo asigno permisos a otros usuarios?',
    answer: 'En el módulo Usuarios, selecciona el usuario y haz clic en "Permisos". Puedes asignar roles: Administrador, Ganadero, Técnico o Veterinario, cada uno con diferentes niveles de acceso a los módulos.',
    category: 'usuarios',
  },
  {
    question: '¿Cómo sincronizo con la app móvil?',
    answer: 'Descarga la app desde el módulo "App Móvil", inicia sesión con tus credenciales y la sincronización es automática. Los datos se sincronizan en tiempo real cuando hay conexión.',
    category: 'app',
  },
  {
    question: '¿Cómo hago un backup de mis datos?',
    answer: 'Ve a Configuración → Backup y haz clic en "Exportar Backup". Se descargará un archivo JSON con todos tus datos que podrás restaurar en cualquier momento desde la misma sección.',
    category: 'configuracion',
  },
];

const staticGuides = [
  { id: 'inicio', title: 'Primeros Pasos', icon: Book, description: 'Configuración inicial del sistema', category: 'inicio' },
  { id: 'animales', title: 'Animales', icon: Beef, description: 'Registro e identificación del ganado', category: 'animales' },
  { id: 'produccion-leche', title: 'Producción de Leche', icon: Scale, description: 'Registro de ordeños diarios', category: 'produccion' },
  { id: 'produccion-carne', title: 'Producción de Carne', icon: Beef, description: 'Pesajes y engorde', category: 'produccion' },
  { id: 'reproduccion', title: 'Reproducción', icon: Baby, description: 'Ciclo reproductivo y partos', category: 'reproduccion' },
  { id: 'salud', title: 'Salud', icon: Heart, description: 'Control sanitario y vacunas', category: 'salud' },
  { id: 'documentos', title: 'Documentos', icon: FileText, description: 'Guías de movilización y certificados', category: 'documentos' },
  { id: 'reportes', title: 'Reportes', icon: BarChart3, description: 'Informes y análisis', category: 'reportes' },
  { id: 'alimentacion', title: 'Alimentación', icon: Leaf, description: 'Dietas y nutrición', category: 'alimentacion' },
  { id: 'costos', title: 'Costos', icon: DollarSign, description: 'Gastos y rentabilidad', category: 'costos' },
  { id: 'app-movil', title: 'App Móvil', icon: Smartphone, description: 'Uso sin conexión', category: 'app' },
  { id: 'configuracion', title: 'Configuración', icon: Settings, description: 'Ajustes del sistema', category: 'configuracion' },
];

const moduleIcons: Record<string, any> = {
  inicio: Book,
  animales: Beef,
  produccion: Scale,
  reproduccion: Baby,
  salud: Heart,
  alimentacion: Leaf,
  praderas: Leaf,
  reportes: BarChart3,
  simulaciones: BarChart3,
  costos: DollarSign,
  configuracion: Settings,
  documentos: FileText,
};

const faqCategories = [
  { id: 'all', label: 'Todas' },
  { id: 'inicio', label: 'Primeros Pasos' },
  { id: 'animales', label: 'Animales' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'produccion', label: 'Producción' },
  { id: 'reproduccion', label: 'Reproducción' },
  { id: 'salud', label: 'Salud' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'configuracion', label: 'Config.' },
  { id: 'app', label: 'App Móvil' },
];

const Ayuda = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [faqCategory, setFaqCategory] = useState<string>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<HelpGuide | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('guides');

  const { isFounder } = useFounder();
  const { guides, loading, fetchGuides } = useHelpCenter();

  useEffect(() => {
    fetchGuides(true);
  }, [fetchGuides]);

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = faqCategory === 'all' || f.category === faqCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredGuides = guides.filter(g => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.module === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayGuides = guides.length > 0
    ? filteredGuides
    : staticGuides.filter(g => {
        const matchesSearch =
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });

  const categories = [
    { id: 'all', label: 'Todos' },
    ...HELP_MODULES.map(m => ({ id: m.value, label: m.label })),
  ];

  if (selectedTutorial) {
    return (
      <DashboardLayout>
        <TutorialContent
          moduleId={selectedTutorial}
          onBack={() => setSelectedTutorial(null)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
            <p className="text-muted-foreground">Manuales, tutoriales paso a paso y soporte técnico</p>
          </div>
          {isFounder && (
            <Button onClick={() => setShowAdminPanel(true)} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Edit className="h-4 w-4" />
              Administrar Ayuda
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la ayuda..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick access cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => { setActiveTab('guides'); setSelectedTutorial('inicio'); }}
          >
            <CardHeader className="pb-2">
              <Book className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Primeros Pasos</CardTitle>
              <CardDescription>Configura tu finca en minutos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                <FileText className="mr-2 h-4 w-4" />
                Ver Guía
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setActiveTab('guides')}
          >
            <CardHeader className="pb-2">
              <PlayCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Tutoriales Interactivos</CardTitle>
              <CardDescription>{staticGuides.length} guías paso a paso</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                <PlayCircle className="mr-2 h-4 w-4" />
                Ver Tutoriales
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setActiveTab('faq')}
          >
            <CardHeader className="pb-2">
              <HelpCircle className="h-8 w-8 text-amber-500 mb-2" />
              <CardTitle className="text-lg">Preguntas Frecuentes</CardTitle>
              <CardDescription>{faqs.length} respuestas disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                <HelpCircle className="mr-2 h-4 w-4" />
                Ver FAQ
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setActiveTab('contacto')}
          >
            <CardHeader className="pb-2">
              <MessageCircle className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Soporte Directo</CardTitle>
              <CardDescription>WhatsApp y email disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contactar
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="guides">
              <Book className="mr-2 h-4 w-4" />
              Tutoriales
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="mr-2 h-4 w-4" />
              Preguntas Frecuentes
            </TabsTrigger>
            <TabsTrigger value="contacto">
              <Phone className="mr-2 h-4 w-4" />
              Soporte
            </TabsTrigger>
          </TabsList>

          {/* ── TUTORIALES ── */}
          <TabsContent value="guides" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {guides.length > 0 ? (
                  filteredGuides.map(guide => {
                    const IconComponent = moduleIcons[guide.module] || Book;
                    return (
                      <Card
                        key={guide.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedGuide(guide)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <IconComponent className="h-8 w-8 text-primary" />
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(guide.updated_at), 'dd/MM/yy', { locale: es })}
                            </div>
                          </div>
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {HELP_MODULES.find(m => m.value === guide.module)?.label}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Ver guía <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  staticGuides
                    .filter(g => {
                      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map(guide => {
                      const tutorial = moduleTutorials.find(t => t.id === guide.id);
                      return (
                        <Card
                          key={guide.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setSelectedTutorial(guide.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <guide.icon className="h-8 w-8 text-primary" />
                              {tutorial && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {tutorial.duration}
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                            <CardDescription>{guide.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              {tutorial && (
                                <Badge
                                  variant={tutorial.difficulty === 'básico' ? 'secondary' : 'default'}
                                  className="text-xs"
                                >
                                  {tutorial.difficulty}
                                </Badge>
                              )}
                              <Button variant="ghost" size="sm" className="ml-auto">
                                Ver guía <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                )}

                {filteredGuides.length === 0 && guides.length > 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No se encontraron guías para esta categoría
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── FAQ ── */}
          <TabsContent value="faq" className="space-y-4">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {faqCategories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={faqCategory === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFaqCategory(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Preguntas Frecuentes</CardTitle>
                <CardDescription>
                  {filteredFaqs.length} respuesta{filteredFaqs.length !== 1 ? 's' : ''} encontrada{filteredFaqs.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[560px] pr-4">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p>No se encontraron resultados para "{searchQuery}"</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-start gap-3">
                              <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <span>{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground pl-8">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="pt-6 flex items-center gap-4">
                <HelpCircle className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">¿No encontraste tu respuesta?</p>
                  <p className="text-sm text-muted-foreground">Contáctanos por WhatsApp o email y te ayudamos en minutos.</p>
                </div>
                <Button onClick={() => setActiveTab('contacto')}>
                  Contactar soporte
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SOPORTE / CONTACTO ── */}
          <TabsContent value="contacto" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* WhatsApp */}
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-2">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Soporte por WhatsApp</CardTitle>
                  <CardDescription>Respuesta rápida para dudas urgentes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Respuesta en menos de 2 horas</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Lunes a viernes, 8am – 6pm</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Soporte en español</li>
                  </ul>
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20ayuda%20con%20AgroData`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Abrir WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-2">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Soporte por Email</CardTitle>
                  <CardDescription>Para consultas técnicas detalladas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Respuesta en 24 horas hábiles</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Incluye capturas o archivos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Soporte técnico especializado</li>
                  </ul>
                  <Button className="w-full" variant="outline" asChild>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20AgroData`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {SUPPORT_EMAIL}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Horarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    { day: 'Lunes', hours: '8:00 – 18:00' },
                    { day: 'Martes', hours: '8:00 – 18:00' },
                    { day: 'Miércoles', hours: '8:00 – 18:00' },
                    { day: 'Jueves', hours: '8:00 – 18:00' },
                    { day: 'Viernes', hours: '8:00 – 17:00' },
                    { day: 'Sábado', hours: '9:00 – 13:00' },
                    { day: 'Domingo', hours: 'Cerrado' },
                  ].map(item => (
                    <div key={item.day} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{item.day}</p>
                      <p className="text-muted-foreground">{item.hours}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips para soporte */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">💡 Tips para obtener ayuda más rápido</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Incluye una captura de pantalla del problema</li>
                  <li>• Describe los pasos que hiciste antes del error</li>
                  <li>• Indica el nombre de tu finca o número de cuenta</li>
                  <li>• Si es urgente, usa WhatsApp para respuesta inmediata</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admin Panel */}
      <HelpAdminPanel open={showAdminPanel} onOpenChange={setShowAdminPanel} />

      {/* Guide Detail Dialog */}
      <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedGuide && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Badge variant="outline">
                    {HELP_MODULES.find(m => m.value === selectedGuide.module)?.label}
                  </Badge>
                  <span>•</span>
                  <span>Actualizado: {format(new Date(selectedGuide.updated_at), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
                <DialogTitle>{selectedGuide.title}</DialogTitle>
                <DialogDescription>{selectedGuide.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedGuide.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{selectedGuide.content}</p>
                  </div>
                )}

                {selectedGuide.resources && selectedGuide.resources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Recursos</h4>
                    {selectedGuide.resources.map(resource => (
                      <Card key={resource.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {resource.resource_type === 'video' && <Video className="h-5 w-5 text-blue-500" />}
                              {resource.resource_type === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
                              {resource.resource_type === 'link' && <Link className="h-5 w-5 text-green-500" />}
                              {resource.resource_type === 'document' && <FileText className="h-5 w-5 text-orange-500" />}
                              <span>{resource.title}</span>
                            </div>
                            {resource.url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Abrir
                                </a>
                              </Button>
                            )}
                          </div>
                          {resource.resource_type === 'video' && resource.url && (
                            <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-muted">
                              {(resource.url.includes('youtube.com') || resource.url.includes('youtu.be')) ? (
                                <iframe
                                  src={resource.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              ) : resource.url.includes('vimeo.com') ? (
                                <iframe
                                  src={resource.url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              ) : null}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Ayuda;
