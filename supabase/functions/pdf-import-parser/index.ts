import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { pdfBase64, expectedColumns, tableName } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'No PDF data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const systemPrompt = `Eres un experto en extracción de datos tabulares de documentos PDF.
Tu tarea es analizar el contenido del PDF y extraer los datos en formato tabular.

El documento debe contener datos para la tabla "${tableName}".

Columnas esperadas:
${columnsDescription}

INSTRUCCIONES:
1. Busca cualquier tabla o lista de datos en el documento
2. Identifica las columnas que corresponden a los campos esperados
3. Extrae TODOS los datos de cada fila encontrada
4. Para fechas, usa formato YYYY-MM-DD
5. Para números, usa punto como separador decimal
6. Si una celda está vacía, usa null

RESPONDE ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "headers": ["columna1", "columna2", ...],
  "rows": [
    [valor1, valor2, ...],
    [valor1, valor2, ...]
  ],
  "extractionNotes": "Notas sobre la extracción"
}

Si no encuentras datos tabulares, responde:
{
  "headers": [],
  "rows": [],
  "extractionNotes": "No se encontraron datos tabulares en el documento"
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
        max_tokens: 8000,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse JSON response, handling potential markdown code blocks
    let parsed;
    try {
      let jsonStr = content.trim();
      
      // Remove markdown code blocks more robustly
      // Handle ```json ... ``` or ``` ... ```
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else if (jsonStr.startsWith('```')) {
        // Fallback: remove starting ``` and ending ```
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      
      // Find the JSON object boundaries as additional fallback
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.substring(0, 500));
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
