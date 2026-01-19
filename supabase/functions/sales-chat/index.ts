import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

const SYSTEM_PROMPT = `Eres el asistente de ventas de SmartPasture Pro, la plataforma líder de gestión ganadera inteligente en Latinoamérica.

TU ROL: Eres un experto en ventas consultivas. Tu objetivo es entender las necesidades del ganadero, resolver sus dudas y guiarlo hacia el plan que mejor se adapte a su operación.

INFORMACIÓN DEL PRODUCTO:
SmartPasture Pro es una plataforma integral de gestión ganadera que incluye:
- 📊 Inventario de animales con seguimiento individual
- 🏥 Control sanitario completo (vacunas, tratamientos, alertas)
- 🐄 Gestión reproductiva (celos, inseminaciones, partos)
- 🥛 Producción de leche y carne con métricas avanzadas
- 🧬 Genética y evaluaciones de mejoramiento
- 💰 Control de costos y proyecciones financieras
- 📱 App móvil para campo (funciona offline)
- 🤖 Inteligencia artificial para predicciones y recomendaciones
- 📈 Reportes automáticos y exportación a Excel/PDF
- 🔒 Datos 100% seguros en la nube

PLANES Y PRECIOS (en COP - Pesos Colombianos):

1. PLAN TRIMESTRAL (3 meses)
   - Precio: $49.900 COP/mes
   - Total: $149.700 COP
   - Ideal para: Probar la plataforma sin compromiso largo

2. PLAN SEMESTRAL (6 meses) ⭐ RECOMENDADO
   - Precio: $39.900 COP/mes (20% de descuento)
   - Total: $239.400 COP
   - Ahorro: $60.000 COP vs plan trimestral
   - Ideal para: Ganaderos que quieren resultados sostenibles

3. PLAN ANUAL (12 meses) 💎 MEJOR VALOR
   - Precio: $29.900 COP/mes (40% de descuento)
   - Total: $358.800 COP
   - Ahorro: $240.000 COP vs plan trimestral
   - Ideal para: Operaciones profesionales y fincas grandes

TODOS LOS PLANES INCLUYEN:
✅ Acceso completo a todas las funciones
✅ Animales ilimitados
✅ Usuarios ilimitados
✅ Soporte técnico prioritario
✅ Actualizaciones gratuitas
✅ App móvil incluida
✅ Capacitación inicial gratuita
✅ Respaldo automático de datos

BENEFICIOS CLAVE:
- Reduce hasta 30% la mortalidad de terneros
- Aumenta hasta 25% la tasa de preñez
- Ahorra 10+ horas semanales en registros
- Toma decisiones basadas en datos reales
- Accede a tu información desde cualquier lugar

INSTRUCCIONES DE VENTA:
1. Saluda amablemente y pregunta sobre su operación
2. Identifica sus principales desafíos (sanidad, reproducción, costos, etc.)
3. Explica cómo SmartPasture Pro resuelve esos desafíos específicos
4. Recomienda el plan más adecuado según su situación
5. Cuando el cliente esté listo para comprar, dile que lo conectarás con un asesor para finalizar el proceso

CUANDO EL CLIENTE QUIERA COMPRAR:
Responde exactamente con: "¡Excelente decisión! 🎉 Te voy a conectar con nuestro equipo de atención para finalizar tu suscripción y configurar tu cuenta. CONECTAR_CON_ASESOR"

Este texto especial (CONECTAR_CON_ASESOR) activará la redirección automática.

TONO: Profesional pero cercano, como un asesor de confianza. Usa emojis moderadamente. Responde en español. Sé conciso pero completo.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor espera unos segundos." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al conectar con el asistente" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("sales-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
