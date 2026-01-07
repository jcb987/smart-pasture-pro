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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    question: '¿Cómo registro un nuevo animal?',
    answer: 'Ve al módulo Animales, haz clic en "Nuevo Animal" y completa el formulario con los datos básicos como número de identificación, sexo, categoría y fecha de nacimiento.',
    category: 'animales',
  },
  {
    question: '¿Cómo sincronizo con la app móvil?',
    answer: 'Descarga la app desde el módulo "App Móvil", inicia sesión con tus credenciales y la sincronización será automática. También puedes forzar una sincronización manual desde el botón "Sincronizar Ahora".',
    category: 'app',
  },
  {
    question: '¿Cómo configuro las alertas?',
    answer: 'Ve a Configuración → Alertas y personaliza qué notificaciones quieres recibir. Puedes activar alertas de stock bajo, vencimientos, vacunas pendientes, y más.',
    category: 'configuracion',
  },
  {
    question: '¿Cómo registro un pesaje?',
    answer: 'Desde el módulo Producción de Carne o desde la ficha del animal, haz clic en "Nuevo Pesaje" e ingresa el peso y la fecha. El sistema calculará automáticamente la ganancia diaria.',
    category: 'produccion',
  },
  {
    question: '¿Cómo registro una inseminación?',
    answer: 'En el módulo Reproducción, selecciona la hembra y haz clic en "Registrar Evento". Elige "Inseminación" y completa los datos del toro o semen utilizado.',
    category: 'reproduccion',
  },
  {
    question: '¿Cómo creo una dieta para un lote?',
    answer: 'En el módulo Alimentación, ve a la pestaña "Dietas" y haz clic en "Nueva Dieta". Selecciona los ingredientes, cantidades y asigna la dieta a un lote específico.',
    category: 'alimentacion',
  },
  {
    question: '¿Cómo exporto un reporte?',
    answer: 'En el módulo Reportes, selecciona el tipo de informe, configura los filtros deseados y haz clic en "Exportar". Puedes descargar en PDF o Excel.',
    category: 'reportes',
  },
  {
    question: '¿Cómo hago un backup de mis datos?',
    answer: 'Ve a Configuración → Backup y haz clic en "Exportar Backup". Se descargará un archivo JSON con todos tus datos que podrás restaurar en cualquier momento.',
    category: 'configuracion',
  },
  {
    question: '¿Puedo trabajar sin internet?',
    answer: 'Sí, la app móvil funciona sin conexión. Los datos se guardan localmente y se sincronizan automáticamente cuando recuperes la conexión a internet.',
    category: 'app',
  },
  {
    question: '¿Cómo asigno permisos a otros usuarios?',
    answer: 'En el módulo Usuarios, selecciona el usuario y haz clic en "Permisos". Puedes asignar roles como Administrador, Ganadero, Técnico o Veterinario, cada uno con diferentes niveles de acceso.',
    category: 'usuarios',
  },
];

// Fallback static guides when no dynamic guides exist
const staticGuides = [
  { id: 'inicio', title: 'Primeros Pasos', icon: Book, description: 'Configuración inicial del sistema', category: 'inicio' },
  { id: 'app-movil', title: 'App Móvil', icon: Smartphone, description: 'Uso sin conexión', category: 'inicio' },
  { id: 'animales', title: 'Animales', icon: Beef, description: 'Registro e identificación del ganado', category: 'animales' },
  { id: 'produccion-leche', title: 'Producción de Leche', icon: Scale, description: 'Registro de ordeños diarios', category: 'produccion' },
  { id: 'reproduccion', title: 'Reproducción', icon: Baby, description: 'Ciclo reproductivo y partos', category: 'reproduccion' },
  { id: 'salud', title: 'Salud', icon: Heart, description: 'Control sanitario y vacunas', category: 'salud' },
  { id: 'alimentacion', title: 'Alimentación', icon: Leaf, description: 'Dietas y nutrición', category: 'alimentacion' },
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
};

const Ayuda = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<HelpGuide | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const { isFounder } = useFounder();
  const { guides, loading, fetchGuides } = useHelpCenter();

  useEffect(() => {
    fetchGuides(true); // Fetch published guides only for normal users
  }, [fetchGuides]);

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter dynamic guides
  const filteredGuides = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.module === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Fallback to static guides if no dynamic guides
  const displayGuides = guides.length > 0 ? filteredGuides : staticGuides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Todos' },
    ...HELP_MODULES.map(m => ({ id: m.value, label: m.label })),
  ];

  // If viewing a static tutorial
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
            <p className="text-muted-foreground">Manuales, tutoriales y soporte técnico</p>
          </div>
          
          {/* Admin button - only visible for Founder */}
          {isFounder && (
            <Button onClick={() => setShowAdminPanel(true)} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Edit className="h-4 w-4" />
              Administrar Ayuda
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick access cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <Book className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Manual de Usuario</CardTitle>
              <CardDescription>Guía completa del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedTutorial('inicio')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Manual
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Video Tutoriales</CardTitle>
              <CardDescription>Aprende paso a paso</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                Ver Videos
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <MessageCircle className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Soporte WhatsApp</CardTitle>
              <CardDescription>Ayuda en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Iniciar Chat
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Contacto Email</CardTitle>
              <CardDescription>Soporte técnico especializado</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:soporte@ganadero.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="guides" className="space-y-4">
          <TabsList>
            <TabsTrigger value="guides">
              <Book className="mr-2 h-4 w-4" />
              Guías por Módulo
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="mr-2 h-4 w-4" />
              Preguntas Frecuentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
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
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Dynamic guides from database */}
                {guides.length > 0 ? (
                  filteredGuides.map((guide) => {
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
                            {guide.resources && guide.resources.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {guide.resources.some(r => r.resource_type === 'video') && (
                                  <Video className="h-3 w-3" />
                                )}
                                {guide.resources.some(r => r.resource_type === 'pdf') && (
                                  <FileText className="h-3 w-3" />
                                )}
                                {guide.resources.some(r => r.resource_type === 'link') && (
                                  <Link className="h-3 w-3" />
                                )}
                              </div>
                            )}
                            <Button variant="ghost" size="sm">
                              Ver guía
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  // Fallback to static guides
                  staticGuides.filter(g => {
                    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
                    return matchesSearch && matchesCategory;
                  }).map((guide) => {
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
                              Ver guía
                              <ChevronRight className="ml-1 h-4 w-4" />
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

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Preguntas Frecuentes</CardTitle>
                <CardDescription>
                  Respuestas rápidas a las dudas más comunes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
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
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">¿Necesitas ayuda personalizada?</h4>
                  <p className="text-sm text-muted-foreground">
                    Nuestro equipo está disponible de lunes a viernes, 8am - 6pm
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild>
                  <a href="mailto:soporte@ganadero.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Email
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Panel Dialog */}
      <HelpAdminPanel 
        open={showAdminPanel} 
        onOpenChange={setShowAdminPanel} 
      />

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
                    {selectedGuide.resources.map((resource) => (
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
                          
                          {/* Video embed for YouTube/Vimeo */}
                          {resource.resource_type === 'video' && resource.url && (
                            <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-muted">
                              {resource.url.includes('youtube.com') || resource.url.includes('youtu.be') ? (
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
