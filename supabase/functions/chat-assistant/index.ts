import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  type?: "chat" | "predict-health" | "optimize-feeding" | "breeding-suggestion";
  context?: Record<string, unknown>;
}

const SYSTEM_PROMPTS = {
  chat: `Eres un asistente experto en ganadería bovina. Ayudas a los ganaderos con:
- Gestión del hato (inventario, reproducción, producción)
- Salud animal (diagnósticos, tratamientos, prevención)
- Nutrición y alimentación
- Genética y mejoramiento
- Costos y rentabilidad

Responde de forma clara, práctica y concisa. Usa términos técnicos cuando sea apropiado pero explícalos si son complejos.
Si no tienes información suficiente para responder, pide más detalles.
Siempre basa tus respuestas en buenas prácticas ganaderas.`,

  "predict-health": `Eres un veterinario experto en salud bovina. Analiza los síntomas y datos proporcionados para:
1. Identificar posibles diagnósticos (ordenados por probabilidad)
2. Sugerir acciones inmediatas
3. Recomendar tratamientos preventivos
4. Indicar cuándo se requiere atención veterinaria urgente

Responde en formato estructurado con secciones claras. Siempre advierte que un veterinario debe confirmar el diagnóstico.`,

  "optimize-feeding": `Eres un nutricionista animal especializado en bovinos. Basándote en los datos del hato:
1. Evalúa la dieta actual
2. Identifica deficiencias nutricionales
3. Sugiere ajustes para optimizar producción/ganancia de peso
4. Calcula costos estimados de las recomendaciones

Considera: etapa productiva, peso, producción de leche, estado reproductivo y recursos disponibles.`,

  "breeding-suggestion": `Eres un genetista bovino experto. Analiza los datos genealógicos y genéticos para:
1. Evaluar compatibilidad entre animales
2. Calcular riesgo de consanguinidad
3. Sugerir apareamientos óptimos
4. Proyectar mejoras genéticas esperadas

Basa tus recomendaciones en índices genéticos y objetivos de mejoramiento del hato.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, type = "chat", context }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat;
    
    // Add context if provided
    let enhancedSystemPrompt = systemPrompt;
    if (context) {
      enhancedSystemPrompt += `\n\nContexto actual del hato:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes alcanzado. Por favor espera unos segundos." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos para continuar usando el asistente IA." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al conectar con el servicio de IA" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
