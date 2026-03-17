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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'imageBase64 and mimeType are required' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en lectura de registros manuscritos de producción lechera ganadera (búfalas, vacas).

Se te muestra una imagen de un cuaderno o planilla de "Pesa Leche" escrita a mano.

Tu tarea:
1. Identifica las columnas de fechas en el encabezado de la tabla (pueden ser fechas completas o solo día/mes).
2. Lee CADA fila de la tabla. Cada fila tiene un número/identificación de animal y valores de producción de leche en litros para cada fecha.
3. SOLO extrae filas que tengan AL MENOS UN valor numérico de producción. Si una fila está completamente vacía (sin valores en ninguna fecha), IGNÓRALA — significa que ese animal NO fue ordeñado.
4. Interpreta correctamente valores manuscritos:
   - ".5" o ",5" = 0.5
   - "1.5" o "1,5" = 1.5
   - Un guión "-" o espacio vacío = sin producción ese día (NO incluir en valores)
   - "0" explícito = 0 (incluir solo si está claramente escrito)
5. Si un valor es ilegible o dudoso, OMÍTELO del objeto de valores y añádelo a warnings.

IMPORTANTE:
- NO inventes datos. Si no puedes leer un valor, omítelo.
- NO incluyas animales que no tienen ningún valor de producción.
- Las fechas deben normalizarse al formato más claro posible (ej: "Enero 9", "9/01", "2025-01-09").

Responde SOLO con JSON válido en este formato:
{
  "fechas": ["Enero 9", "Enero 17", "Enero 21", "Enero 31", "Febrero 7"],
  "registros": [
    {"numero": "024/7", "valores": {"Enero 9": 3, "Enero 17": 2, "Enero 21": 1.7, "Enero 31": 2.1, "Febrero 7": 2.3}},
    {"numero": "111-82", "valores": {"Enero 9": 1.8, "Enero 17": 1.6, "Febrero 7": 1.8}}
  ],
  "year": 2025,
  "analysis": "Descripción breve de lo encontrado",
  "warnings": ["Fila X: valor ilegible en columna Y"]
}

Si NO encuentras datos tabulares, responde:
{
  "fechas": [],
  "registros": [],
  "year": null,
  "analysis": "No se encontraron datos tabulares en la imagen",
  "warnings": ["La imagen no contiene tablas o datos de producción de leche"]
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
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

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
    console.error("Milk image parser error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        fechas: [],
        registros: [],
        year: null,
        analysis: null,
        warnings: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
