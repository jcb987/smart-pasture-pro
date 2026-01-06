import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, Video, MessageCircle, Phone } from 'lucide-react';

const Ayuda = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
          <p className="text-muted-foreground">Manuales, tutoriales y soporte</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Book className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Manual de Usuario</CardTitle>
              <CardDescription>Guía completa del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Ver Manual</Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Video Tutoriales</CardTitle>
              <CardDescription>Aprende paso a paso</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Ver Videos</Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Chat de Soporte</CardTitle>
              <CardDescription>Ayuda en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Iniciar Chat</Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <Phone className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Contacto Directo</CardTitle>
              <CardDescription>Habla con un asesor</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Llamar</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>
              Respuestas rápidas a las dudas más comunes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">¿Cómo registro un nuevo animal?</h4>
              <p className="text-sm text-muted-foreground">
                Ve al módulo Animales, haz clic en "Nuevo Animal" y completa el formulario con los datos básicos.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">¿Cómo sincronizo con la app móvil?</h4>
              <p className="text-sm text-muted-foreground">
                Descarga la app, inicia sesión con tus credenciales y la sincronización será automática.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">¿Cómo configuro las alertas?</h4>
              <p className="text-sm text-muted-foreground">
                Ve a Configuración → Alertas y personaliza qué notificaciones quieres recibir y cómo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ayuda;
