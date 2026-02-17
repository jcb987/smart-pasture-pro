import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2, User, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "¿Cuáles son los planes y precios?",
  "¿Qué funciones incluye?",
  "¿Funciona sin internet?",
  "Quiero una demo",
];

export const SalesChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRedirect, setShowRedirect] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chat`;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      throw new Error("Error de conexión");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });

            // Check for redirect trigger
            if (assistantContent.includes("CONECTAR_CON_ASESOR")) {
              setShowRedirect(true);
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Lo siento, hubo un problema de conexión. ¿Puedes intentar de nuevo?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const form = document.getElementById("sales-chat-form") as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const handleContactFounder = () => {
    // Open WhatsApp with founder
    window.open("https://wa.me/573001234567?text=Hola,%20quiero%20suscribirme%20a%20Agro%20Data", "_blank");
  };

  const formatMessage = (content: string) => {
    // Remove the redirect trigger from displayed content
    let text = content.replace("CONECTAR_CON_ASESOR", "").trim();
    
    // Convert markdown bold **text** to HTML
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown italic *text* to HTML (but not already processed bold)
    text = text.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Sanitize the HTML to prevent XSS attacks
    return DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: ['strong', 'em', 'br', 'p'],
      ALLOWED_ATTR: [] 
    });
  };

  const renderFormattedMessage = (content: string) => {
    const formatted = formatMessage(content);
    return (
      <span 
        className="whitespace-pre-wrap" 
        dangerouslySetInnerHTML={{ __html: formatted }} 
      />
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg cursor-pointer flex items-center gap-2 hover:bg-primary/90 transition-all"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Chat de Ventas</span>
        {messages.length > 0 && (
          <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] shadow-2xl border-2 flex flex-col overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Asesor Agro Data</CardTitle>
            <p className="text-xs opacity-80">En línea • Respuesta inmediata</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div className="p-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-2">👋 ¡Hola! Soy tu asesor virtual.</p>
                <p className="text-muted-foreground">
                  Estoy aquí para ayudarte a conocer Agro Data y encontrar el plan perfecto para tu finca.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Preguntas frecuentes:</p>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {renderFormattedMessage(msg.content)}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </ScrollArea>

        {showRedirect && (
          <div className="p-3 bg-accent/10 border-t">
            <Button 
              onClick={handleContactFounder}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Contactar Asesor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <form 
          id="sales-chat-form"
          onSubmit={handleSubmit} 
          className="p-3 border-t flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
