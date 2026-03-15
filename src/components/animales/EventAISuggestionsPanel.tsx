import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Copy, 
  X, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { useEventAISuggestions, AIEventContext, AISuggestion } from '@/hooks/useEventAISuggestions';
import { cn } from '@/lib/utils';

interface EventAISuggestionsPanelProps {
  animalId: string;
  open: boolean;
  eventContext: AIEventContext;
  onAddToNotes: (text: string) => void;
}

export function EventAISuggestionsPanel({
  animalId,
  open,
  eventContext,
  onAddToNotes,
}: EventAISuggestionsPanelProps) {
  const {
    suggestions,
    loading,
    error,
    aiSummary,
    aiRecommendation,
    updateSuggestions,
    generateAISuggestions,
    dismissSuggestion,
    addToNotes,
    historyLoaded,
  } = useEventAISuggestions({ animalId, open });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local suggestions when context changes
  useEffect(() => {
    if (!historyLoaded) return;

    // Debounce updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateSuggestions(eventContext);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [eventContext, historyLoaded, updateSuggestions]);

  const handleCopyToNotes = useCallback((suggestion: AISuggestion) => {
    const noteText = addToNotes(suggestion);
    onAddToNotes(noteText);
  }, [addToNotes, onAddToNotes]);

  const handleRefreshAI = useCallback(() => {
    generateAISuggestions(eventContext);
  }, [generateAISuggestions, eventContext]);

  const getPriorityIcon = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'critico':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'atencion':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityStyles = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'critico':
        return 'border-destructive/30 bg-destructive/5';
      case 'atencion':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const getPriorityBadge = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'critico':
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Crítico</Badge>;
      case 'atencion':
        return <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">Atención</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Info</Badge>;
    }
  };

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">IA: Notas y sugerencias</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshAI}
          disabled={loading}
          className="h-7 px-2"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Error message */}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-primary">Resumen del evento</p>
                  <p className="text-xs text-foreground">{aiSummary}</p>
                  {aiRecommendation && (
                    <>
                      <p className="text-xs font-medium text-primary mt-2">Siguiente acción</p>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-primary" />
                        <p className="text-xs text-foreground">{aiRecommendation}</p>
                      </div>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs mt-1 -ml-2"
                    onClick={() => onAddToNotes(`[IA] ${aiSummary}${aiRecommendation ? `. Recomendación: ${aiRecommendation}` : ''}`)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Agregar a Notas
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* No suggestions */}
          {suggestions.length === 0 && !loading && !aiSummary && (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Ingresa datos para ver sugerencias</p>
            </div>
          )}

          {/* Suggestions list */}
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                getPriorityStyles(suggestion.priority)
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {getPriorityIcon(suggestion.priority)}
                  <span className="text-sm font-medium">{suggestion.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getPriorityBadge(suggestion.priority)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                    onClick={() => dismissSuggestion(suggestion.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Data */}
              <p className="text-xs text-muted-foreground mb-1">
                {suggestion.data}
              </p>

              {/* Interpretation */}
              <p className="text-xs font-medium mb-1.5">
                {suggestion.interpretation}
              </p>

              {/* Action */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground italic">
                  {suggestion.action}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs shrink-0"
                  onClick={() => handleCopyToNotes(suggestion)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Analizando...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t bg-muted/30">
        <p className="text-[10px] text-center text-muted-foreground">
          Sugerencias basadas en historial del animal. No sustituyen criterio profesional.
        </p>
      </div>
    </div>
  );
}
