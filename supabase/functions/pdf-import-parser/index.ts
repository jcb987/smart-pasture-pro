import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate content length to prevent resource exhaustion (max 15MB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Request too large (max 15MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { pdfBase64, expectedColumns, tableName } = body;

    // Validate pdfBase64
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No PDF data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check PDF size (base64 is ~33% larger than binary, so 10MB PDF = ~13MB base64)
    if (pdfBase64.length > 13 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'PDF too large (max 10MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expectedColumns
    if (!Array.isArray(expectedColumns) || expectedColumns.length === 0 || expectedColumns.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid expectedColumns (must be array with 1-50 items)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tableName
    if (!tableName || typeof tableName !== 'string' || tableName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid table name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize tableName to prevent injection in prompts
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build expected columns description for the prompt
    const columnsDescription = expectedColumns.map((col: { db: string; labels: string[]; required: boolean }) => 
      `- ${col.db}: ${col.labels.join(', ')} ${col.required ? '(requerido)' : '(opcional)'}`
    ).join('\n');

    const systemPrompt = `Eres un experto en extracción de datos de inventarios ganaderos de documentos PDF.
Tu tarea es analizar el contenido del PDF y extraer los datos de animales en formato tabular.

El documento debe contener datos para la tabla "${safeTableName}".

Columnas esperadas:
${columnsDescription}

INSTRUCCIONES CRÍTICAS:
1. Busca cualquier tabla, lista o datos de animales en el documento
2. El campo principal es el ARETE/ID del animal (puede ser: número, código alfanumérico como "020-113", "706/8", "E9132")
3. Detecta FASES/ETAPAS productivas como: "Vaca seca", "Vaca parida", "Nov. vientre", "Hemb. levante", "Mac. levante", "Reproductor", "Cría macho", "Cría hembra", etc.
4. Extrae MÁXIMO 100 filas de datos (las primeras/más importantes)
5. Para fechas, usa formato YYYY-MM-DD
6. Para números (peso), usa punto como separador decimal
7. Si una celda está vacía o no existe, usa null
8. IMPORTANTE: Asegúrate de que el JSON esté COMPLETO y bien formado

RESPONDE ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "headers": ["tag_id", "name", "stage", "sex", "breed", "weight", "lot_name", "status"],
  "rows": [
    ["020-113", null, "Vaca parida", null, null, 450, "Potrero 1", null],
    ["706/8", "Lucero", "Nov. vientre", null, "Holstein", null, null, null]
  ],
  "extractionNotes": "Notas sobre la extracción",
  "totalRowsInDocument": 150
}

Si no encuentras datos tabulares, responde:
{
  "headers": [],
  "rows": [],
  "extractionNotes": "No se encontraron datos tabulares en el documento",
  "totalRowsInDocument": 0
}`;

    console.log('Sending PDF to AI for extraction...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Extrae los datos tabulares de este documento PDF y devuélvelos en formato JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse JSON response, handling potential markdown code blocks
    let parsed;
    try {
      let jsonStr = content.trim();
      
      // Remove markdown code blocks more robustly
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else if (jsonStr.startsWith('```')) {
        // Fallback: remove starting ``` and ending ```
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      
      // Find the JSON object boundaries
      const firstBrace = jsonStr.indexOf('{');
      if (firstBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace);
      }
      
      // Try to parse as-is first
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // If parsing fails, try to repair truncated JSON
        console.log('JSON parse failed, attempting repair...');
        
        // Try to fix truncated JSON by closing open brackets
        let repairedJson = jsonStr;
        
        // Count open brackets and arrays
        const openBraces = (repairedJson.match(/{/g) || []).length;
        const closeBraces = (repairedJson.match(/}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/]/g) || []).length;
        
        // Remove trailing incomplete data (after last complete array item)
        const lastCompleteItem = repairedJson.lastIndexOf('],');
        const lastCompleteItem2 = repairedJson.lastIndexOf('null]');
        const lastCompleteItem3 = repairedJson.lastIndexOf('"]');
        const cutPoint = Math.max(lastCompleteItem, lastCompleteItem2, lastCompleteItem3);
        
        if (cutPoint > 0) {
          repairedJson = repairedJson.substring(0, cutPoint + (lastCompleteItem === cutPoint ? 1 : (lastCompleteItem2 === cutPoint ? 5 : 2)));
        }
        
        // Close remaining brackets and braces
        const newOpenBrackets = (repairedJson.match(/\[/g) || []).length;
        const newCloseBrackets = (repairedJson.match(/]/g) || []).length;
        const newOpenBraces = (repairedJson.match(/{/g) || []).length;
        const newCloseBraces = (repairedJson.match(/}/g) || []).length;
        
        for (let i = 0; i < newOpenBrackets - newCloseBrackets; i++) {
          repairedJson += ']';
        }
        
        // Add extractionNotes if missing
        if (!repairedJson.includes('extractionNotes')) {
          repairedJson += ', "extractionNotes": "Datos parcialmente extraídos"';
        }
        
        for (let i = 0; i < newOpenBraces - newCloseBraces; i++) {
          repairedJson += '}';
        }
        
        console.log('Attempting to parse repaired JSON...');
        parsed = JSON.parse(repairedJson);
        console.log('Successfully repaired and parsed JSON');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.substring(0, 1000));
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log(`Extracted ${parsed.rows?.length || 0} rows from PDF`);

    return new Response(
      JSON.stringify({
        headers: parsed.headers || [],
        rows: parsed.rows || [],
        notes: parsed.extractionNotes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('PDF parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
