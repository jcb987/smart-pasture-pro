import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType, expectedColumns, tableName } = body;

    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'imageBase64 and mimeType are required' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const safeTableName = (tableName || '').replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `Eres un experto en análisis de datos ganaderos. Se te muestra una imagen que puede contener una tabla, lista o documento con información de animales. La fecha de hoy es ${today}.

Tu tarea:
1. PRIMERO: Busca en TODO el documento (título, encabezado, pie de página, texto libre) cualquier fecha global que aplique a todos los registros. Puede aparecer como "Fecha: 15/01/2025", "01-2025", "Enero 2025", "15 de enero 2025", "2025-01-15", o cualquier formato de fecha visible FUERA de la tabla de datos.
2. Identificar si la imagen contiene datos tabulares (tablas, listas, planillas)
3. Extraer TODOS los datos visibles de la imagen
4. Mapear inteligentemente las columnas a los campos esperados de la base de datos
5. Interpretar abreviaciones del sector ganadero (ej: PRE=preñada, ABT=vacía/abierta, GES=gestación, ANOS=edad, etc.)

Campos esperados para la tabla "${safeTableName}":
${JSON.stringify(expectedColumns || [], null, 2)}

Reglas CRÍTICAS:
- FECHA GLOBAL: Si encuentras una fecha en el título o encabezado del documento (no en las columnas de la tabla), pon esa fecha en el campo "globalDate" del JSON. Esta fecha se aplicará a TODAS las filas que no tengan su propia fecha. Convierte la fecha al formato YYYY-MM-DD.
- Si una fila de la tabla tiene su propia fecha, usa esa fecha en lugar de la global.
- Si ves números que parecen chapetas/arete de animales, mapéalos a "tag_id"  
- Si ves estados como PRE, ABT, GES, mapéalos a reproductive_status
- Si ves edades en años (ANOS), calcula birth_date restando esos años desde la fecha de hoy (${today})
- Si ves condición corporal (1-5), mapéala a condition_score
- Si ves valores de producción de leche (litros, lts, L), mapéalos a los campos de producción
- Extrae TODAS las filas de datos que puedas ver, incluso si son muchas
- NO omitas ninguna fila aunque le falten datos
- Si una columna de la tabla tiene un valor que parece fecha (ULTIMO, PALPACION, FECHA_PALP), inclúyela aunque no sea la fecha principal

Responde SOLO con JSON válido en este formato:
{
  "globalDate": "2025-01-15",
  "headers": ["columna1", "columna2", ...],
  "rows": [
    ["valor1", "valor2", ...],
    ...
  ],
  "mappings": [
    {"excelColumn": "columna1", "dbColumn": "campo_db", "confidence": 90, "suggestedBy": "ai"}
  ],
  "analysis": "Descripción breve de lo que encontraste en la imagen, incluyendo si encontraste una fecha global",
  "warnings": ["advertencia si aplica"]
}

Si NO encuentras datos tabulares en la imagen, responde:
{
  "globalDate": null,
  "headers": [],
  "rows": [],
  "mappings": [],
  "analysis": "No se encontraron datos tabulares en la imagen",
  "warnings": ["La imagen no contiene tablas o datos estructurados"]
}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

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
    console.error("Image import parser error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        headers: [],
        rows: [],
        mappings: [],
        analysis: null,
        warnings: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
