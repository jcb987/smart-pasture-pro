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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const safeTableName = (tableName || '').replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `Eres un experto en análisis de datos ganaderos. Se te muestra una imagen que puede contener una tabla, lista o documento con información de animales o producción. La fecha de hoy es ${today}.

Tu tarea:
1. PRIMERO: Busca en TODO el documento (título, encabezado, pie de página, texto libre, cualquier lugar FUERA de la tabla) cualquier fecha global. Puede aparecer como "Fecha: 15/01/2025", "01-2025", "Enero 2025", "15 de enero 2025", "2025-01-15", "15/01/25", o simplemente una fecha escrita a mano o impresa en la parte superior. Esto es CRÍTICO.
2. Identificar si la imagen contiene datos tabulares (tablas, listas, planillas)
3. Extraer TODOS los datos visibles de la imagen con la MAYOR PRECISIÓN posible
4. Mapear inteligentemente las columnas a los campos esperados de la base de datos
5. Interpretar abreviaciones del sector ganadero

Campos esperados para la tabla "${safeTableName}":
${JSON.stringify(expectedColumns || [], null, 2)}

Reglas CRÍTICAS para lectura correcta:
- LEE CADA CELDA CON CUIDADO. No confundas guiones (-) con valores numéricos. Un guión "-" significa SIN DATO (null), NO cero.
- Si una celda está vacía o tiene un guión, el valor es null, NO "0" ni "-".
- NÚMEROS DECIMALES: Lee con precisión. 2.3 es 2.3, no 23 ni 0.23.
- CHAPETAS/ARETES: Lee el número exacto incluyendo guiones y barras. Ej: "020-113", "024/7", "053-4" deben leerse exactamente así.

Reglas para PRODUCCIÓN DE LECHE (milk_production):
- Si ves columnas como "AM", "Mañana", "1er ordeño" → mapear a "morning_liters"
- Si ves columnas como "PM", "Tarde", "2do ordeño" → mapear a "afternoon_liters"  
- Si ves columnas como "Noche", "3er ordeño" → mapear a "evening_liters"
- Si ves columnas como "Total", "Producción", "Litros" (una sola columna con total) → mapear a "total_liters"
- IMPORTANTE: Si hay UNA SOLA columna numérica de litros (no dividida en AM/PM), mapéala como "total_liters", NO la dupliques.
- Si hay MÚLTIPLES columnas numéricas para un mismo animal, distingue si son AM/PM/Total o si son diferentes días.
- NUNCA mapees la misma columna de origen a múltiples campos destino.
- NUNCA mapees múltiples columnas de origen al mismo campo destino.
- Cada columna de la imagen debe mapearse a UN SOLO campo de la base de datos.

FECHA GLOBAL (CRÍTICO):
- Si encuentras una fecha FUERA de la tabla de datos (en el título, encabezado, pie de página, texto libre), ponla en "globalDate" en formato YYYY-MM-DD.
- Esta fecha se aplicará a TODAS las filas.
- Si la fecha solo tiene mes/año (ej: "Enero 2025"), usa el primer día del mes: "2025-01-01".

Reglas de mapeo general:
- Si ves números que parecen chapetas/arete de animales, mapéalos a "animal_tag" (no a "tag_id")
- Si ves estados como PRE, ABT, GES, mapéalos a reproductive_status
- Si ves edades en años (ANOS), calcula birth_date restando esos años desde ${today}
- Si ves condición corporal (1-5), mapéala a condition_score
- Extrae TODAS las filas de datos que puedas ver, incluso si son muchas
- NO omitas ninguna fila aunque le falten datos

Responde SOLO con JSON válido en este formato:
{
  "globalDate": "2025-01-15",
  "headers": ["columna_origen_1", "columna_origen_2", ...],
  "rows": [
    ["valor1", "valor2", ...],
    ...
  ],
  "mappings": [
    {"excelColumn": "columna_origen_1", "dbColumn": "campo_db", "confidence": 90, "suggestedBy": "ai"}
  ],
  "analysis": "Descripción breve de lo que encontraste",
  "warnings": ["advertencia si aplica"]
}

IMPORTANTE sobre mappings:
- "excelColumn" debe coincidir EXACTAMENTE con un valor de "headers"
- Cada "excelColumn" debe aparecer SOLO UNA VEZ en mappings
- Cada "dbColumn" debe aparecer SOLO UNA VEZ en mappings
- Solo incluye mappings para columnas que realmente tienen correspondencia con los campos esperados

Si NO encuentras datos tabulares:
{
  "globalDate": null,
  "headers": [],
  "rows": [],
  "mappings": [],
  "analysis": "No se encontraron datos tabulares en la imagen",
  "warnings": ["La imagen no contiene tablas o datos estructurados"]
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
        temperature: 0.05,
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

    // Post-processing: validate no duplicate mappings
    if (result.mappings && Array.isArray(result.mappings)) {
      const seenExcel = new Set<string>();
      const seenDb = new Set<string>();
      result.mappings = result.mappings.filter((m: any) => {
        if (seenExcel.has(m.excelColumn) || seenDb.has(m.dbColumn)) {
          return false;
        }
        seenExcel.add(m.excelColumn);
        seenDb.add(m.dbColumn);
        return true;
      });
    }

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
