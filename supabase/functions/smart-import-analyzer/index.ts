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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate content length
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 100000) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { headers, expectedColumns, tableName } = body;

    // Validate headers
    if (!Array.isArray(headers) || headers.length === 0 || headers.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid headers (must be array with 1-100 items)' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each header is a string with reasonable length
    for (const header of headers) {
      if (typeof header !== 'string' || header.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Invalid header format' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate expectedColumns
    if (!Array.isArray(expectedColumns) || expectedColumns.length === 0 || expectedColumns.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid expectedColumns (must be array with 1-50 items)' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tableName
    if (!tableName || typeof tableName !== 'string' || tableName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid table name' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize tableName to prevent injection in prompts
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);
    
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

Tabla destino: ${safeTableName}

Columnas del Excel: ${JSON.stringify(headers.slice(0, 100))}

Campos esperados (db = nombre en base de datos, labels = nombres posibles, required = obligatorio):
${JSON.stringify(expectedColumns.slice(0, 50), null, 2)}

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
