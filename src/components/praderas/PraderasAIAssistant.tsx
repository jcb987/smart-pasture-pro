import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, Loader2, Sparkles, RotateCcw, 
  TreePine, Beef, Calendar, X
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PraderasAIAssistantProps {
  paddocksCount: number;
  totalHectares: number;
  totalAnimalsInPasture: number;
  occupiedPaddocks: number;
  availablePaddocks: number;
  onClose?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  {
    icon: RotateCcw,
    label: 'Rotación óptima',
    question: '¿Cuál es el plan de rotación más eficiente para mis potreros según la cantidad de animales que tengo?'
  },
  {
    icon: Beef,
    label: 'Distribución ganado',
    question: '¿Cómo debería distribuir mi ganado entre los potreros disponibles para maximizar el aprovechamiento del pasto?'
  },
  {
    icon: TreePine,
    label: 'Capacidad de carga',
    question: '¿Cuál es la capacidad de carga recomendada por hectárea según mi tipo de producción?'
  },
  {
    icon: Calendar,
    label: 'Planificar siembra',
    question: '¿Qué tipo de pasto debería sembrar y cuándo es el mejor momento para hacerlo?'
  },
];

export const PraderasAIAssistant = ({
  paddocksCount,
  totalHectares,
  totalAnimalsInPasture,
  occupiedPaddocks,
  availablePaddocks,
  onClose,
}: PraderasAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAIResponse = async (question: string): Promise<string> => {
    // Simulated AI response based on context
    await new Promise(resolve => setTimeout(resolve, 1500));

    const context = {
      potreros: paddocksCount,
      hectareas: totalHectares,
      animales: totalAnimalsInPasture,
      ocupados: occupiedPaddocks,
      disponibles: availablePaddocks,
    };

    // Simple response generation based on keywords
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('rotación') || lowerQuestion.includes('rotar')) {
      const diasDescanso = Math.max(25, Math.round(35 - (context.animales / context.potreros)));
      return `📋 **Plan de Rotación Sugerido**

Con ${context.potreros} potreros y ${context.animales} animales, te recomiendo:

1. **Tiempo de ocupación**: 3-5 días máximo por potrero
2. **Descanso mínimo**: ${diasDescanso} días entre pastoreos
3. **Secuencia**: Rota de forma continua, evitando volver al mismo potrero antes del tiempo de descanso

💡 **Tip**: Con ${context.disponibles} potrero(s) disponible(s), puedes iniciar la rotación de inmediato. Observa la altura del pasto (ideal 25-30 cm) antes de ingresar los animales.`;
    }

    if (lowerQuestion.includes('distribu') || lowerQuestion.includes('organiz')) {
      const animalesPorPotrero = Math.round(context.animales / Math.max(context.ocupados, 1));
      const cargaPorHa = context.animales / Math.max(context.hectareas, 1);
      return `🐄 **Distribución Recomendada**

Con ${context.animales} animales en ${context.hectareas.toFixed(1)} hectáreas:

1. **Carga actual**: ${cargaPorHa.toFixed(1)} animales/ha
2. **Por potrero**: Aproximadamente ${animalesPorPotrero} animales

📌 **Sugerencias**:
- Agrupa animales similares (misma categoría o edad)
- Separa vacas en lactancia para mejor manejo
- Mantén toros reproductores en potreros separados

${cargaPorHa > 2.5 ? '⚠️ **Alerta**: La carga parece alta. Considera usar más potreros o reducir el tiempo de ocupación.' : '✅ La carga está dentro de rangos normales.'}`;
    }

    if (lowerQuestion.includes('capacidad') || lowerQuestion.includes('carga')) {
      return `📊 **Capacidad de Carga Recomendada**

Para tus ${context.hectareas.toFixed(1)} hectáreas:

| Tipo de Producción | Animales/Ha |
|-------------------|-------------|
| Carne extensivo   | 0.5 - 1.0   |
| Carne semi-intensivo | 1.0 - 2.0 |
| Lechería          | 2.0 - 3.5   |
| Doble propósito   | 1.5 - 2.5   |

📌 **Tu situación actual**: ${(context.animales / context.hectareas).toFixed(1)} animales/ha

💡 **Factores a considerar**:
- Época del año (lluvia vs seca)
- Tipo de pasto
- Fertilización
- Suplementación alimenticia`;
    }

    if (lowerQuestion.includes('siembr') || lowerQuestion.includes('pasto')) {
      return `🌱 **Planificación de Siembra**

**Mejores pastos según clima tropical**:
- **Brachiaria**: Resistente, ideal para carne
- **Estrella africana**: Buena para lechería
- **Mombasa/Tanzania**: Alto rendimiento
- **Kikuyo**: Zonas altas y frías

📅 **Mejor época**: Inicio de temporada de lluvias

📋 **Pasos recomendados**:
1. Realiza análisis de suelo
2. Prepara el terreno con 2-3 semanas de anticipación
3. Siembra cuando el suelo esté húmedo
4. Primer pastoreo: 60-90 días después de siembra

💡 Para tus ${context.hectareas.toFixed(1)} ha, considera sembrar por lotes para no perder área de pastoreo.`;
    }

    // Default response
    return `Basándome en tus datos (${context.potreros} potreros, ${context.hectareas.toFixed(1)} ha, ${context.animales} animales):

Te sugiero enfocarte en:
1. Mantener un balance entre potreros ocupados y en descanso
2. Monitorear la altura del pasto regularmente
3. Registrar los días de ocupación para optimizar rotaciones

¿Tienes alguna pregunta específica sobre rotación, distribución de ganado, capacidad de carga o siembra de pastos?`;
  };

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await generateAIResponse(messageText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Asistente IA de Praderas
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Obtén recomendaciones para optimizar tus potreros
        </p>
      </CardHeader>

      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <div className="p-4 space-y-4">
            <div className="text-center py-4">
              <Bot className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                ¡Hola! Estoy aquí para ayudarte a optimizar el uso de tus praderas.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preguntas frecuentes
              </p>
              <div className="grid gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto py-2 px-3 justify-start text-left"
                    onClick={() => handleSend(q.question)}
                    disabled={loading}
                  >
                    <q.icon className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm">{q.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <Badge variant="secondary" className="text-xs">
                {paddocksCount} potreros
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalHectares.toFixed(1)} ha
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalAnimalsInPasture} animales
              </Badge>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu pregunta..."
              className="min-h-[40px] max-h-[100px] resize-none"
              rows={1}
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || loading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
