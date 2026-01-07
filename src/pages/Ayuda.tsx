import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TutorialContent, moduleTutorials } from '@/components/ayuda/TutorialContent';
import { 
  HelpCircle, Book, Video, MessageCircle, Phone, Search, 
  FileText, PlayCircle, Mail, ExternalLink, ChevronRight,
  Smartphone, BarChart3, Heart, Baby, Beef, Scale, Leaf, DollarSign,
  Settings, Users, Dna, Package, ArrowLeftRight, Clock
} from 'lucide-react';

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

// Cada guía tiene una categoría única - NO se repiten
const moduleGuides = [
  // Inicio - guías generales del sistema
  { id: 'inicio', title: 'Primeros Pasos', icon: Book, description: 'Configuración inicial del sistema', category: 'inicio' },
  { id: 'app-movil', title: 'App Móvil', icon: Smartphone, description: 'Uso sin conexión', category: 'inicio' },
  { id: 'configuracion', title: 'Configuración', icon: Settings, description: 'Personalización del sistema', category: 'inicio' },
  { id: 'usuarios', title: 'Usuarios', icon: Users, description: 'Gestión de usuarios y permisos', category: 'inicio' },
  
  // Animales - guías de registro e identificación
  { id: 'animales', title: 'Animales', icon: Beef, description: 'Registro e identificación del ganado', category: 'animales' },
  { id: 'trazabilidad', title: 'Trazabilidad', icon: ArrowLeftRight, description: 'Hoja de vida del animal', category: 'animales' },
  
  // Producción - guías de leche, carne y productividad
  { id: 'produccion-leche', title: 'Producción de Leche', icon: Scale, description: 'Registro de ordeños diarios', category: 'produccion' },
  { id: 'produccion-carne', title: 'Producción de Carne', icon: Scale, description: 'Control de peso y engorde', category: 'produccion' },
  { id: 'costos', title: 'Costos', icon: DollarSign, description: 'Finanzas y rentabilidad', category: 'produccion' },
  { id: 'reportes', title: 'Reportes', icon: BarChart3, description: 'Informes y exportación', category: 'produccion' },
  
  // Reproducción - guías de celos, inseminación y partos
  { id: 'reproduccion', title: 'Reproducción', icon: Baby, description: 'Ciclo reproductivo y partos', category: 'reproduccion' },
  { id: 'genetica', title: 'Genética', icon: Dna, description: 'Mejoramiento y selección', category: 'reproduccion' },
  
  // Salud - guías sanitarias y tratamientos
  { id: 'salud', title: 'Salud', icon: Heart, description: 'Control sanitario y vacunas', category: 'salud' },
  { id: 'insumos', title: 'Insumos', icon: Package, description: 'Medicamentos y materiales', category: 'salud' },
  
  // Alimentación - guías de praderas y nutrición
  { id: 'alimentacion', title: 'Alimentación', icon: Leaf, description: 'Dietas y nutrición', category: 'alimentacion' },
  { id: 'praderas', title: 'Praderas', icon: Leaf, description: 'Gestión de potreros', category: 'alimentacion' },
];

const Ayuda = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrar módulos por categoría seleccionada y búsqueda
  const filteredModules = moduleGuides.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'inicio', label: 'Inicio' },
    { id: 'animales', label: 'Animales' },
    { id: 'produccion', label: 'Producción' },
    { id: 'reproduccion', label: 'Reproducción' },
    { id: 'salud', label: 'Salud' },
    { id: 'alimentacion', label: 'Alimentación' },
  ];

  // If a tutorial is selected, show the tutorial content
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
          <p className="text-muted-foreground">Manuales, tutoriales y soporte técnico</p>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Accesos rápidos */}
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
            {/* Filtros de categoría */}
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredModules.map((guide) => {
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
                            variant={tutorial.difficulty === 'básico' ? 'secondary' : tutorial.difficulty === 'intermedio' ? 'default' : 'destructive'}
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
              })}
            </div>
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

        {/* Contacto */}
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
    </DashboardLayout>
  );
};

export default Ayuda;
