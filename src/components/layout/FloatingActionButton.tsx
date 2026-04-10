import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Beef, Milk, Heart, Activity, Scale,
  Bot, Send, Minimize2, Maximize2, Loader2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  {
    label: 'Nuevo Animal',
    icon: Beef,
    color: 'bg-green-600 hover:bg-green-700 text-white',
    url: '/animales?action=new',
  },
  {
    label: 'Registrar Leche',
    icon: Milk,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    url: '/produccion-leche?action=new',
  },
  {
    label: 'Evento Salud',
    icon: Heart,
    color: 'bg-red-500 hover:bg-red-600 text-white',
    url: '/salud?action=new',
  },
  {
    label: 'Evento Reproductivo',
    icon: Activity,
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
    url: '/reproduccion?action=new',
  },
  {
    label: 'Registrar Peso',
    icon: Scale,
    color: 'bg-amber-500 hover:bg-amber-600 text-white',
    url: '/animales?action=weight',
  },
];

const QUICK_QUESTIONS = [
  '¿Cuántas vacas están preñadas?',
  '¿Qué alertas tengo pendientes?',
  '¿Cómo mejorar la producción?',
];

export const FloatingActionButton = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAction = (url: string) => {
    setMenuOpen(false);
    navigate(url);
  };

  const handleOpenChat = () => {
    setMenuOpen(false);
    setChatOpen(true);
    setIsMinimized(false);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    clearMessages();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input, 'chat');
    setInput('');
  };

  return (
    <>
      {/* Backdrop para cerrar el menú */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Chat panel (encima del FAB) */}
      {chatOpen && (
        <Card className={cn(
          'fixed bottom-24 right-6 z-50 shadow-2xl transition-all duration-300',
          isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'
        )}>
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Asistente Ganadero IA
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(prev => !prev)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCloseChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[calc(500px-56px)]">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        ¡Hola! Soy tu asistente ganadero. Pregúntame sobre tu hato.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Preguntas rápidas:</p>
                      {QUICK_QUESTIONS.map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={() => sendMessage(q, 'chat')}
                        >
                          <span className="text-xs">{q}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                    {error}
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre tu hato..."
                  disabled={isLoading}
                  className="flex-1 h-9 text-sm"
                />
                <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Speed dial + FAB principal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
        {/* Acciones rápidas */}
        {QUICK_ACTIONS.map((action, i) => (
          <div
            key={action.url}
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              menuOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-4 pointer-events-none'
            )}
            style={{ transitionDelay: menuOpen ? `${i * 40}ms` : '0ms' }}
          >
            <span className="text-xs font-medium bg-background border border-border rounded-md px-2 py-1 shadow-sm whitespace-nowrap">
              {action.label}
            </span>
            <Button
              size="icon"
              className={cn('h-10 w-10 rounded-full shadow-md', action.color)}
              onClick={() => handleAction(action.url)}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Botón Asistente IA dentro del speed dial */}
        <div
          className={cn(
            'flex items-center gap-2 transition-all duration-200',
            menuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
          style={{ transitionDelay: menuOpen ? `${QUICK_ACTIONS.length * 40}ms` : '0ms' }}
        >
          <span className="text-xs font-medium bg-background border border-border rounded-md px-2 py-1 shadow-sm whitespace-nowrap">
            Asistente IA
          </span>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleOpenChat}
            title="Asistente IA"
          >
            <Bot className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón principal */}
        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-xl transition-all duration-200',
            menuOpen
              ? 'bg-muted hover:bg-muted/80 text-foreground rotate-45'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
          onClick={() => setMenuOpen(prev => !prev)}
          title={menuOpen ? 'Cerrar' : 'Acciones rápidas'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </>
  );
};
