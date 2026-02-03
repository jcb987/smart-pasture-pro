import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Version logging for deployment verification
const VERSION = "v1.0.1";
const DEPLOYED_AT = "2026-02-03T01:50:00Z";
console.log(`[${VERSION}] public-api function loaded at ${DEPLOYED_AT}`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Simple hash function to verify API keys
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Validate API key and get organization
async function validateAPIKey(
  supabase: any,
  apiKey: string
): Promise<{ valid: boolean; organizationId?: string; permissions?: string[] }> {
  if (!apiKey || !apiKey.startsWith("agd_")) {
    return { valid: false };
  }

  const keyPrefix = apiKey.substring(0, 8);
  const keyHash = await hashKey(apiKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("organization_id, permissions, is_active, expires_at")
    .eq("key_prefix", keyPrefix)
    .eq("key_hash", keyHash)
    .single();

  if (error || !data || !data.is_active) {
    return { valid: false };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_prefix", keyPrefix)
    .eq("key_hash", keyHash);

  return {
    valid: true,
    organizationId: data.organization_id,
    permissions: data.permissions || [],
  };
}

// Check if permission is granted
function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes("*");
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/public-api", "");
    const method = req.method;

    // API Documentation endpoint
    if (path === "/" || path === "/docs") {
      const docs = {
        name: "Agro Data Public API",
        version: "1.0.0",
        description: "API REST pública para integración con sistemas ERP externos",
        baseUrl: url.origin + "/public-api",
        authentication: {
          type: "API Key",
          header: "X-API-Key",
          format: "agd_xxxxxxxxxx",
          note: "Genera tu API Key desde Herramientas > API en la aplicación",
        },
        endpoints: [
          {
            path: "/animals",
            method: "GET",
            description: "Lista todos los animales activos",
            permission: "animals:read",
            queryParams: {
              status: "Filtrar por estado (activo, vendido, muerto)",
              category: "Filtrar por categoría",
              limit: "Número máximo de resultados (default: 100)",
              offset: "Offset para paginación",
            },
          },
          {
            path: "/animals/:id",
            method: "GET",
            description: "Obtiene detalles de un animal específico",
            permission: "animals:read",
          },
          {
            path: "/production/milk",
            method: "GET",
            description: "Registros de producción de leche",
            permission: "production:read",
            queryParams: {
              animal_id: "Filtrar por ID de animal",
              from_date: "Fecha inicial (YYYY-MM-DD)",
              to_date: "Fecha final (YYYY-MM-DD)",
              limit: "Número máximo de resultados",
            },
          },
          {
            path: "/production/weight",
            method: "GET",
            description: "Registros de peso de animales",
            permission: "production:read",
          },
          {
            path: "/health",
            method: "GET",
            description: "Eventos de salud",
            permission: "health:read",
          },
          {
            path: "/reproduction",
            method: "GET",
            description: "Eventos reproductivos",
            permission: "reproduction:read",
          },
          {
            path: "/financial/transactions",
            method: "GET",
            description: "Transacciones financieras",
            permission: "financial:read",
          },
          {
            path: "/inventory",
            method: "GET",
            description: "Inventario de insumos",
            permission: "inventory:read",
          },
        ],
        errors: {
          401: "API Key inválida o no proporcionada",
          403: "Permiso insuficiente para esta operación",
          404: "Recurso no encontrado",
          429: "Rate limit excedido",
          500: "Error interno del servidor",
        },
      };

      return new Response(JSON.stringify(docs, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API Key
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "API Key requerida",
          message: "Incluye tu API Key en el header X-API-Key",
          docs: url.origin + "/public-api/docs"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { valid, organizationId, permissions } = await validateAPIKey(supabaseAdmin, apiKey);

    if (!valid || !organizationId) {
      return new Response(
        JSON.stringify({ error: "API Key inválida o expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters
    const params = Object.fromEntries(url.searchParams);
    const limit = Math.min(parseInt(params.limit) || 100, 1000);
    const offset = parseInt(params.offset) || 0;

    // Route handlers
    // GET /animals
    if (path === "/animals" && method === "GET") {
      if (!hasPermission(permissions!, "animals:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'animals:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabaseAdmin
        .from("animals")
        .select("id, tag_id, name, sex, category, breed, birth_date, current_weight, status, rfid_tag, lot_name, created_at")
        .eq("organization_id", organizationId)
        .range(offset, offset + limit - 1);

      if (params.status) query = query.eq("status", params.status);
      if (params.category) query = query.eq("category", params.category);

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /animals/:id
    const animalMatch = path.match(/^\/animals\/([^\/]+)$/);
    if (animalMatch && method === "GET") {
      if (!hasPermission(permissions!, "animals:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'animals:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const animalId = animalMatch[1];
      const { data, error } = await supabaseAdmin
        .from("animals")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("id", animalId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Animal no encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /production/milk
    if (path === "/production/milk" && method === "GET") {
      if (!hasPermission(permissions!, "production:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'production:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabaseAdmin
        .from("milk_production")
        .select("id, animal_id, production_date, morning_liters, afternoon_liters, evening_liters, total_liters, fat_percentage, protein_percentage, somatic_cell_count")
        .eq("organization_id", organizationId)
        .order("production_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (params.animal_id) query = query.eq("animal_id", params.animal_id);
      if (params.from_date) query = query.gte("production_date", params.from_date);
      if (params.to_date) query = query.lte("production_date", params.to_date);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /health
    if (path === "/health" && method === "GET") {
      if (!hasPermission(permissions!, "health:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'health:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabaseAdmin
        .from("health_events")
        .select("id, animal_id, event_type, event_date, diagnosis, treatment, medication, veterinarian, status")
        .eq("organization_id", organizationId)
        .order("event_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (params.animal_id) query = query.eq("animal_id", params.animal_id);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /reproduction
    if (path === "/reproduction" && method === "GET") {
      if (!hasPermission(permissions!, "reproduction:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'reproduction:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabaseAdmin
        .from("reproductive_events")
        .select("id, animal_id, event_type, event_date, pregnancy_result, expected_birth_date, technician, notes")
        .eq("organization_id", organizationId)
        .order("event_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (params.animal_id) query = query.eq("animal_id", params.animal_id);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /financial/transactions
    if (path === "/financial/transactions" && method === "GET") {
      if (!hasPermission(permissions!, "financial:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'financial:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabaseAdmin
        .from("financial_transactions")
        .select("id, transaction_type, category, subcategory, description, amount, transaction_date, payment_method")
        .eq("organization_id", organizationId)
        .order("transaction_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (params.type) query = query.eq("transaction_type", params.type);
      if (params.from_date) query = query.gte("transaction_date", params.from_date);
      if (params.to_date) query = query.lte("transaction_date", params.to_date);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /inventory
    if (path === "/inventory" && method === "GET") {
      if (!hasPermission(permissions!, "inventory:read")) {
        return new Response(
          JSON.stringify({ error: "Permiso 'inventory:read' requerido" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("supplies")
        .select("id, name, category, unit, current_stock, min_stock, unit_cost, supplier, is_active")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, count: data?.length || 0, limit, offset }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ 
        error: "Endpoint no encontrado",
        docs: url.origin + "/public-api/docs"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
