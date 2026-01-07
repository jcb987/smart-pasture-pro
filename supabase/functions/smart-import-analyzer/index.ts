import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, expectedColumns, tableName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente experto en análisis de datos ganaderos. Tu tarea es mapear columnas de un archivo Excel a campos de base de datos.

Reglas:
1. Analiza los nombres de columnas del Excel y encuentra la mejor correspondencia con los campos esperados
2. Considera variaciones en español: acentos, abreviaciones, sinónimos
3. Detecta formatos de fecha (DD/MM/YYYY, YYYY-MM-DD, etc.)
4. Identifica unidades de medida (kg, litros, etc.)
5. Advierte sobre columnas que podrían causar problemas

Tabla destino: ${tableName}

Columnas del Excel: ${JSON.stringify(headers)}

Campos esperados (db = nombre en base de datos, labels = nombres posibles, required = obligatorio):
${JSON.stringify(expectedColumns, null, 2)}

Responde SOLO con JSON válido en este formato exacto:
{
  "mappings": [
    {"excelColumn": "nombre exacto del excel", "dbColumn": "nombre_db", "confidence": 95, "suggestedBy": "ai"}
  ],
  "analysis": "Resumen breve del análisis en español",
  "warnings": ["advertencia 1", "advertencia 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analiza las columnas y genera el mapeo." }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Smart import analyzer error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        mappings: [],
        analysis: null,
        warnings: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
