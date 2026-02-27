import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "v2.0.0";
console.log(`[${VERSION}] public-api function loaded`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// ── Helpers ──────────────────────────────────────────────────────────
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status: number, details?: string) {
  return json({ error: message, ...(details ? { details } : {}) }, status);
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes("*");
}

function requirePerm(permissions: string[], required: string) {
  if (!hasPermission(permissions, required)) {
    return err(`Permiso '${required}' requerido`, 403);
  }
  return null;
}

// ── Auth ─────────────────────────────────────────────────────────────
async function validateAPIKey(supabase: any, apiKey: string) {
  if (!apiKey?.startsWith("agd_")) return { valid: false };
  const keyPrefix = apiKey.substring(0, 8);
  const keyHash = await hashKey(apiKey);
  const { data, error } = await supabase
    .from("api_keys")
    .select("organization_id, permissions, is_active, expires_at")
    .eq("key_prefix", keyPrefix)
    .eq("key_hash", keyHash)
    .single();
  if (error || !data?.is_active) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false };
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_prefix", keyPrefix).eq("key_hash", keyHash);
  return { valid: true, organizationId: data.organization_id, permissions: data.permissions || [] };
}

// ── Generic CRUD helpers ─────────────────────────────────────────────
async function listRecords(supabase: any, table: string, orgId: string, select: string, params: any, extraFilters?: (q: any) => any, orderBy = "created_at") {
  const limit = Math.min(parseInt(params.limit) || 100, 1000);
  const offset = parseInt(params.offset) || 0;
  let query = supabase.from(table).select(select).eq("organization_id", orgId).order(orderBy, { ascending: false }).range(offset, offset + limit - 1);
  if (extraFilters) query = extraFilters(query);
  const { data, error } = await query;
  if (error) throw error;
  return json({ data, count: data?.length || 0, limit, offset });
}

async function getRecord(supabase: any, table: string, orgId: string, id: string) {
  const { data, error } = await supabase.from(table).select("*").eq("organization_id", orgId).eq("id", id).single();
  if (error || !data) return err("Recurso no encontrado", 404);
  return json({ data });
}

async function createRecord(supabase: any, table: string, orgId: string, body: any) {
  const { data, error } = await supabase.from(table).insert({ ...body, organization_id: orgId }).select().single();
  if (error) return err("Error al crear registro", 400, error.message);
  return json({ data, message: "Registro creado exitosamente" }, 201);
}

async function updateRecord(supabase: any, table: string, orgId: string, id: string, body: any) {
  delete body.id; delete body.organization_id; delete body.created_at;
  const { data, error } = await supabase.from(table).update(body).eq("organization_id", orgId).eq("id", id).select().single();
  if (error) return err("Error al actualizar registro", 400, error.message);
  if (!data) return err("Recurso no encontrado", 404);
  return json({ data, message: "Registro actualizado exitosamente" });
}

async function deleteRecord(supabase: any, table: string, orgId: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("organization_id", orgId).eq("id", id);
  if (error) return err("Error al eliminar registro", 400, error.message);
  return json({ message: "Registro eliminado exitosamente" });
}

// ── API Documentation ────────────────────────────────────────────────
function getDocs(baseUrl: string) {
  const ep = (path: string, methods: string[], perm: string, desc: string, queryParams?: any) => ({
    path, methods, permission: perm, description: desc, ...(queryParams ? { queryParams } : {}),
  });
  return {
    name: "Agro Data Public API",
    version: "2.0.0",
    description: "API REST pública completa para integración con sistemas ERP, agentes IA y aplicaciones externas",
    baseUrl,
    authentication: { type: "API Key", header: "X-API-Key", format: "agd_xxxxxxxxxx", note: "Genera tu API Key desde Herramientas > API en la aplicación" },
    endpoints: [
      // Animals
      ep("/animals", ["GET"], "animals:read", "Lista todos los animales", { status: "activo|vendido|muerto", category: "Categoría", lot_name: "Lote", breed: "Raza", sex: "macho|hembra", limit: "max 1000", offset: "paginación" }),
      ep("/animals/:id", ["GET"], "animals:read", "Detalle de un animal"),
      ep("/animals", ["POST"], "animals:write", "Crear un animal"),
      ep("/animals/:id", ["PUT"], "animals:write", "Actualizar un animal"),
      ep("/animals/:id", ["DELETE"], "animals:write", "Eliminar un animal"),
      // Health
      ep("/health", ["GET"], "health:read", "Eventos de salud", { animal_id: "UUID", event_type: "Tipo", from_date: "YYYY-MM-DD", to_date: "YYYY-MM-DD" }),
      ep("/health/:id", ["GET"], "health:read", "Detalle de evento de salud"),
      ep("/health", ["POST"], "health:write", "Crear evento de salud"),
      ep("/health/:id", ["PUT"], "health:write", "Actualizar evento de salud"),
      ep("/health/:id", ["DELETE"], "health:write", "Eliminar evento de salud"),
      // Reproduction
      ep("/reproduction", ["GET"], "reproduction:read", "Eventos reproductivos", { animal_id: "UUID", event_type: "Tipo" }),
      ep("/reproduction/:id", ["GET"], "reproduction:read", "Detalle de evento reproductivo"),
      ep("/reproduction", ["POST"], "reproduction:write", "Crear evento reproductivo"),
      ep("/reproduction/:id", ["PUT"], "reproduction:write", "Actualizar evento reproductivo"),
      ep("/reproduction/:id", ["DELETE"], "reproduction:write", "Eliminar evento reproductivo"),
      // Milk Production
      ep("/production/milk", ["GET"], "production:read", "Registros de producción de leche", { animal_id: "UUID", from_date: "YYYY-MM-DD", to_date: "YYYY-MM-DD" }),
      ep("/production/milk/:id", ["GET"], "production:read", "Detalle de registro de leche"),
      ep("/production/milk", ["POST"], "production:write", "Crear registro de producción de leche"),
      ep("/production/milk/:id", ["PUT"], "production:write", "Actualizar registro de leche"),
      ep("/production/milk/:id", ["DELETE"], "production:write", "Eliminar registro de leche"),
      // Weight / Events
      ep("/production/weight", ["GET"], "production:read", "Registros de peso (eventos de animales)", { animal_id: "UUID", event_type: "Tipo" }),
      ep("/production/weight", ["POST"], "production:write", "Crear registro de peso/evento"),
      // Financial
      ep("/financial/transactions", ["GET"], "financial:read", "Transacciones financieras", { type: "ingreso|egreso", category: "Categoría", from_date: "YYYY-MM-DD", to_date: "YYYY-MM-DD" }),
      ep("/financial/transactions/:id", ["GET"], "financial:read", "Detalle de transacción"),
      ep("/financial/transactions", ["POST"], "financial:write", "Crear transacción financiera"),
      ep("/financial/transactions/:id", ["PUT"], "financial:write", "Actualizar transacción"),
      ep("/financial/transactions/:id", ["DELETE"], "financial:write", "Eliminar transacción"),
      // Inventory
      ep("/inventory", ["GET"], "inventory:read", "Inventario de insumos"),
      ep("/inventory/:id", ["GET"], "inventory:read", "Detalle de insumo"),
      ep("/inventory", ["POST"], "inventory:write", "Crear insumo"),
      ep("/inventory/:id", ["PUT"], "inventory:write", "Actualizar insumo"),
      ep("/inventory/:id", ["DELETE"], "inventory:write", "Eliminar insumo"),
      ep("/inventory/movements", ["GET"], "inventory:read", "Movimientos de inventario", { supply_id: "UUID", movement_type: "entrada|salida" }),
      ep("/inventory/movements", ["POST"], "inventory:write", "Crear movimiento de inventario"),
      // Feed
      ep("/feed", ["GET"], "feed:read", "Inventario de alimentos"),
      ep("/feed/:id", ["GET"], "feed:read", "Detalle de alimento"),
      ep("/feed", ["POST"], "feed:write", "Crear alimento"),
      ep("/feed/:id", ["PUT"], "feed:write", "Actualizar alimento"),
      ep("/feed/consumption", ["GET"], "feed:read", "Registros de consumo", { animal_id: "UUID", from_date: "YYYY-MM-DD", to_date: "YYYY-MM-DD" }),
      ep("/feed/consumption", ["POST"], "feed:write", "Registrar consumo de alimento"),
      ep("/feed/diets", ["GET"], "feed:read", "Dietas configuradas"),
      ep("/feed/diets", ["POST"], "feed:write", "Crear dieta"),
      // Paddocks
      ep("/paddocks", ["GET"], "paddocks:read", "Praderas/potreros"),
      ep("/paddocks/:id", ["GET"], "paddocks:read", "Detalle de pradera"),
      ep("/paddocks", ["POST"], "paddocks:write", "Crear pradera"),
      ep("/paddocks/:id", ["PUT"], "paddocks:write", "Actualizar pradera"),
      ep("/paddocks/rotations", ["GET"], "paddocks:read", "Rotaciones de potreros"),
      ep("/paddocks/rotations", ["POST"], "paddocks:write", "Crear rotación"),
      ep("/paddocks/measurements", ["GET"], "paddocks:read", "Mediciones de forraje"),
      ep("/paddocks/measurements", ["POST"], "paddocks:write", "Crear medición de forraje"),
      // Tasks
      ep("/tasks", ["GET"], "tasks:read", "Tareas de campo", { status: "pending|in_progress|completed", priority: "low|medium|high|urgent", category: "Categoría" }),
      ep("/tasks/:id", ["GET"], "tasks:read", "Detalle de tarea"),
      ep("/tasks", ["POST"], "tasks:write", "Crear tarea"),
      ep("/tasks/:id", ["PUT"], "tasks:write", "Actualizar tarea"),
      ep("/tasks/:id", ["DELETE"], "tasks:write", "Eliminar tarea"),
      // Invoices
      ep("/invoices", ["GET"], "invoices:read", "Facturas", { status: "pending|paid|overdue", invoice_type: "purchase|sale" }),
      ep("/invoices/:id", ["GET"], "invoices:read", "Detalle de factura"),
      ep("/invoices", ["POST"], "invoices:write", "Crear factura"),
      ep("/invoices/:id", ["PUT"], "invoices:write", "Actualizar factura"),
      ep("/invoices/:id", ["DELETE"], "invoices:write", "Eliminar factura"),
      // Genetics
      ep("/genetics", ["GET"], "genetics:read", "Evaluaciones genéticas", { animal_id: "UUID" }),
      ep("/genetics/:id", ["GET"], "genetics:read", "Detalle de evaluación genética"),
      ep("/genetics", ["POST"], "genetics:write", "Crear evaluación genética"),
      ep("/genetics/breeding-suggestions", ["GET"], "genetics:read", "Sugerencias de cruce"),
      ep("/genetics/breeding-suggestions", ["POST"], "genetics:write", "Crear sugerencia de cruce"),
    ],
    permissions: [
      "animals:read", "animals:write", "health:read", "health:write",
      "production:read", "production:write", "reproduction:read", "reproduction:write",
      "financial:read", "financial:write", "inventory:read", "inventory:write",
      "feed:read", "feed:write", "paddocks:read", "paddocks:write",
      "tasks:read", "tasks:write", "invoices:read", "invoices:write",
      "genetics:read", "genetics:write", "* (acceso total)",
    ],
    errors: {
      400: "Datos inválidos en la solicitud",
      401: "API Key inválida o no proporcionada",
      403: "Permiso insuficiente para esta operación",
      404: "Recurso no encontrado",
      500: "Error interno del servidor",
    },
  };
}

// ── Main Router ──────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/public-api", "");
    const method = req.method;

    // Docs endpoint (public)
    if (path === "/" || path === "/docs") return json(getDocs(url.origin + "/public-api"));

    // Auth
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
    if (!apiKey) return err("API Key requerida. Incluye tu API Key en el header X-API-Key", 401);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { valid, organizationId: orgId, permissions: perms } = await validateAPIKey(sb, apiKey);
    if (!valid || !orgId) return err("API Key inválida o expirada", 401);

    const params = Object.fromEntries(url.searchParams);
    const limit = Math.min(parseInt(params.limit) || 100, 1000);
    const offset = parseInt(params.offset) || 0;
    let body: any = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try { body = await req.json(); } catch { return err("Body JSON inválido", 400); }
    }

    // ── ANIMALS ──────────────────────────────────────────────────
    if (path === "/animals" && method === "GET") {
      const p = requirePerm(perms!, "animals:read"); if (p) return p;
      return listRecords(sb, "animals", orgId, "id, tag_id, name, sex, category, breed, birth_date, current_weight, status, rfid_tag, lot_name, reproductive_status, origin, entry_date, created_at", params, q => {
        if (params.status) q = q.eq("status", params.status);
        if (params.category) q = q.eq("category", params.category);
        if (params.lot_name) q = q.eq("lot_name", params.lot_name);
        if (params.breed) q = q.ilike("breed", `%${params.breed}%`);
        if (params.sex) q = q.eq("sex", params.sex);
        return q;
      });
    }
    if (path === "/animals" && method === "POST") {
      const p = requirePerm(perms!, "animals:write"); if (p) return p;
      return createRecord(sb, "animals", orgId, body);
    }
    const animalMatch = path.match(/^\/animals\/([^\/]+)$/);
    if (animalMatch) {
      const id = animalMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "animals:read"); if (p) return p; return getRecord(sb, "animals", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "animals:write"); if (p) return p; return updateRecord(sb, "animals", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "animals:write"); if (p) return p; return deleteRecord(sb, "animals", orgId, id); }
    }

    // ── HEALTH ───────────────────────────────────────────────────
    if (path === "/health" && method === "GET") {
      const p = requirePerm(perms!, "health:read"); if (p) return p;
      return listRecords(sb, "health_events", orgId, "id, animal_id, event_type, event_date, diagnosis, treatment, medication, dosage, veterinarian, status, outcome, cost, withdrawal_days, withdrawal_end_date, next_dose_date, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        if (params.event_type) q = q.eq("event_type", params.event_type);
        if (params.from_date) q = q.gte("event_date", params.from_date);
        if (params.to_date) q = q.lte("event_date", params.to_date);
        return q;
      }, "event_date");
    }
    if (path === "/health" && method === "POST") {
      const p = requirePerm(perms!, "health:write"); if (p) return p;
      return createRecord(sb, "health_events", orgId, body);
    }
    const healthMatch = path.match(/^\/health\/([^\/]+)$/);
    if (healthMatch) {
      const id = healthMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "health:read"); if (p) return p; return getRecord(sb, "health_events", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "health:write"); if (p) return p; return updateRecord(sb, "health_events", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "health:write"); if (p) return p; return deleteRecord(sb, "health_events", orgId, id); }
    }

    // ── REPRODUCTION ─────────────────────────────────────────────
    if (path === "/reproduction" && method === "GET") {
      const p = requirePerm(perms!, "reproduction:read"); if (p) return p;
      return listRecords(sb, "reproductive_events", orgId, "id, animal_id, event_type, event_date, pregnancy_result, expected_birth_date, technician, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        if (params.event_type) q = q.eq("event_type", params.event_type);
        return q;
      }, "event_date");
    }
    if (path === "/reproduction" && method === "POST") {
      const p = requirePerm(perms!, "reproduction:write"); if (p) return p;
      return createRecord(sb, "reproductive_events", orgId, body);
    }
    const reproMatch = path.match(/^\/reproduction\/([^\/]+)$/);
    if (reproMatch) {
      const id = reproMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "reproduction:read"); if (p) return p; return getRecord(sb, "reproductive_events", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "reproduction:write"); if (p) return p; return updateRecord(sb, "reproductive_events", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "reproduction:write"); if (p) return p; return deleteRecord(sb, "reproductive_events", orgId, id); }
    }

    // ── PRODUCTION: MILK ─────────────────────────────────────────
    if (path === "/production/milk" && method === "GET") {
      const p = requirePerm(perms!, "production:read"); if (p) return p;
      return listRecords(sb, "milk_production", orgId, "id, animal_id, production_date, morning_liters, afternoon_liters, evening_liters, total_liters, fat_percentage, protein_percentage, somatic_cell_count, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        if (params.from_date) q = q.gte("production_date", params.from_date);
        if (params.to_date) q = q.lte("production_date", params.to_date);
        return q;
      }, "production_date");
    }
    if (path === "/production/milk" && method === "POST") {
      const p = requirePerm(perms!, "production:write"); if (p) return p;
      return createRecord(sb, "milk_production", orgId, body);
    }
    const milkMatch = path.match(/^\/production\/milk\/([^\/]+)$/);
    if (milkMatch) {
      const id = milkMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "production:read"); if (p) return p; return getRecord(sb, "milk_production", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "production:write"); if (p) return p; return updateRecord(sb, "milk_production", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "production:write"); if (p) return p; return deleteRecord(sb, "milk_production", orgId, id); }
    }

    // ── PRODUCTION: WEIGHT (animal_events) ───────────────────────
    if (path === "/production/weight" && method === "GET") {
      const p = requirePerm(perms!, "production:read"); if (p) return p;
      return listRecords(sb, "animal_events", orgId, "id, animal_id, event_type, event_date, weight, details, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        if (params.event_type) q = q.eq("event_type", params.event_type);
        return q;
      }, "event_date");
    }
    if (path === "/production/weight" && method === "POST") {
      const p = requirePerm(perms!, "production:write"); if (p) return p;
      return createRecord(sb, "animal_events", orgId, body);
    }

    // ── FINANCIAL ────────────────────────────────────────────────
    if (path === "/financial/transactions" && method === "GET") {
      const p = requirePerm(perms!, "financial:read"); if (p) return p;
      return listRecords(sb, "financial_transactions", orgId, "id, transaction_type, category, subcategory, description, amount, transaction_date, payment_method, reference_number, animal_id, lot_name, notes", params, q => {
        if (params.type) q = q.eq("transaction_type", params.type);
        if (params.category) q = q.eq("category", params.category);
        if (params.from_date) q = q.gte("transaction_date", params.from_date);
        if (params.to_date) q = q.lte("transaction_date", params.to_date);
        return q;
      }, "transaction_date");
    }
    if (path === "/financial/transactions" && method === "POST") {
      const p = requirePerm(perms!, "financial:write"); if (p) return p;
      return createRecord(sb, "financial_transactions", orgId, body);
    }
    const finMatch = path.match(/^\/financial\/transactions\/([^\/]+)$/);
    if (finMatch) {
      const id = finMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "financial:read"); if (p) return p; return getRecord(sb, "financial_transactions", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "financial:write"); if (p) return p; return updateRecord(sb, "financial_transactions", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "financial:write"); if (p) return p; return deleteRecord(sb, "financial_transactions", orgId, id); }
    }

    // ── INVENTORY (supplies) ─────────────────────────────────────
    if (path === "/inventory" && method === "GET") {
      const p = requirePerm(perms!, "inventory:read"); if (p) return p;
      return listRecords(sb, "supplies", orgId, "id, name, category, unit, current_stock, min_stock, unit_cost, supplier, is_active, location, withdrawal_days, notes", params, q => {
        if (params.category) q = q.eq("category", params.category);
        if (params.is_active !== undefined) q = q.eq("is_active", params.is_active === "true");
        return q;
      });
    }
    if (path === "/inventory" && method === "POST") {
      const p = requirePerm(perms!, "inventory:write"); if (p) return p;
      return createRecord(sb, "supplies", orgId, body);
    }
    if (path === "/inventory/movements" && method === "GET") {
      const p = requirePerm(perms!, "inventory:read"); if (p) return p;
      return listRecords(sb, "supply_movements", orgId, "id, supply_id, lot_id, movement_type, quantity, unit_cost, total_cost, movement_date, reason, animal_id, lot_name, reference_number, notes", params, q => {
        if (params.supply_id) q = q.eq("supply_id", params.supply_id);
        if (params.movement_type) q = q.eq("movement_type", params.movement_type);
        return q;
      }, "movement_date");
    }
    if (path === "/inventory/movements" && method === "POST") {
      const p = requirePerm(perms!, "inventory:write"); if (p) return p;
      return createRecord(sb, "supply_movements", orgId, body);
    }
    const invMatch = path.match(/^\/inventory\/([^\/]+)$/);
    if (invMatch && invMatch[1] !== "movements") {
      const id = invMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "inventory:read"); if (p) return p; return getRecord(sb, "supplies", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "inventory:write"); if (p) return p; return updateRecord(sb, "supplies", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "inventory:write"); if (p) return p; return deleteRecord(sb, "supplies", orgId, id); }
    }

    // ── FEED ─────────────────────────────────────────────────────
    if (path === "/feed" && method === "GET") {
      const p = requirePerm(perms!, "feed:read"); if (p) return p;
      return listRecords(sb, "feed_inventory", orgId, "id, name, category, unit, current_stock, min_stock, unit_cost, protein_percentage, energy_mcal, fdn_percentage, dry_matter_percentage, supplier, notes", params);
    }
    if (path === "/feed" && method === "POST") {
      const p = requirePerm(perms!, "feed:write"); if (p) return p;
      return createRecord(sb, "feed_inventory", orgId, body);
    }
    const feedMatch = path.match(/^\/feed\/([^\/]+)$/);
    if (feedMatch && !["consumption", "diets"].includes(feedMatch[1])) {
      const id = feedMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "feed:read"); if (p) return p; return getRecord(sb, "feed_inventory", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "feed:write"); if (p) return p; return updateRecord(sb, "feed_inventory", orgId, id, body); }
    }
    if (path === "/feed/consumption" && method === "GET") {
      const p = requirePerm(perms!, "feed:read"); if (p) return p;
      return listRecords(sb, "feed_consumption", orgId, "id, feed_id, animal_id, consumption_date, quantity_kg, cost, lot_name, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        if (params.feed_id) q = q.eq("feed_id", params.feed_id);
        if (params.from_date) q = q.gte("consumption_date", params.from_date);
        if (params.to_date) q = q.lte("consumption_date", params.to_date);
        return q;
      }, "consumption_date");
    }
    if (path === "/feed/consumption" && method === "POST") {
      const p = requirePerm(perms!, "feed:write"); if (p) return p;
      return createRecord(sb, "feed_consumption", orgId, body);
    }
    if (path === "/feed/diets" && method === "GET") {
      const p = requirePerm(perms!, "feed:read"); if (p) return p;
      return listRecords(sb, "feed_diets", orgId, "id, name, target_group, target_lot, target_protein, target_energy, target_fdn, target_dry_matter, daily_cost, is_active, notes", params);
    }
    if (path === "/feed/diets" && method === "POST") {
      const p = requirePerm(perms!, "feed:write"); if (p) return p;
      return createRecord(sb, "feed_diets", orgId, body);
    }

    // ── PADDOCKS ─────────────────────────────────────────────────
    if (path === "/paddocks" && method === "GET") {
      const p = requirePerm(perms!, "paddocks:read"); if (p) return p;
      return listRecords(sb, "paddocks", orgId, "id, name, area_hectares, grass_type, capacity, current_animals, status, coordinates, notes", params);
    }
    if (path === "/paddocks" && method === "POST") {
      const p = requirePerm(perms!, "paddocks:write"); if (p) return p;
      return createRecord(sb, "paddocks", orgId, body);
    }
    const paddockMatch = path.match(/^\/paddocks\/([^\/]+)$/);
    if (paddockMatch && !["rotations", "measurements"].includes(paddockMatch[1])) {
      const id = paddockMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "paddocks:read"); if (p) return p; return getRecord(sb, "paddocks", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "paddocks:write"); if (p) return p; return updateRecord(sb, "paddocks", orgId, id, body); }
    }
    if (path === "/paddocks/rotations" && method === "GET") {
      const p = requirePerm(perms!, "paddocks:read"); if (p) return p;
      return listRecords(sb, "paddock_rotations", orgId, "id, paddock_id, lot_name, animals_count, entry_date, exit_date, days_occupied, entry_forage_kg, exit_forage_kg, forage_consumed_kg, notes", params, q => {
        if (params.paddock_id) q = q.eq("paddock_id", params.paddock_id);
        return q;
      }, "entry_date");
    }
    if (path === "/paddocks/rotations" && method === "POST") {
      const p = requirePerm(perms!, "paddocks:write"); if (p) return p;
      return createRecord(sb, "paddock_rotations", orgId, body);
    }
    if (path === "/paddocks/measurements" && method === "GET") {
      const p = requirePerm(perms!, "paddocks:read"); if (p) return p;
      return listRecords(sb, "forage_measurements", orgId, "id, paddock_id, measurement_date, grass_height_cm, forage_kg_per_ha, total_forage_kg, dry_matter_percentage, quality_score, measurement_type, notes", params, q => {
        if (params.paddock_id) q = q.eq("paddock_id", params.paddock_id);
        return q;
      }, "measurement_date");
    }
    if (path === "/paddocks/measurements" && method === "POST") {
      const p = requirePerm(perms!, "paddocks:write"); if (p) return p;
      return createRecord(sb, "forage_measurements", orgId, body);
    }

    // ── TASKS ────────────────────────────────────────────────────
    if (path === "/tasks" && method === "GET") {
      const p = requirePerm(perms!, "tasks:read"); if (p) return p;
      return listRecords(sb, "field_tasks", orgId, "id, title, description, status, priority, category, due_date, completed_at, assigned_to, related_animal_id, related_paddock_id, notes, created_at", params, q => {
        if (params.status) q = q.eq("status", params.status);
        if (params.priority) q = q.eq("priority", params.priority);
        if (params.category) q = q.eq("category", params.category);
        return q;
      });
    }
    if (path === "/tasks" && method === "POST") {
      const p = requirePerm(perms!, "tasks:write"); if (p) return p;
      return createRecord(sb, "field_tasks", orgId, body);
    }
    const taskMatch = path.match(/^\/tasks\/([^\/]+)$/);
    if (taskMatch) {
      const id = taskMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "tasks:read"); if (p) return p; return getRecord(sb, "field_tasks", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "tasks:write"); if (p) return p; return updateRecord(sb, "field_tasks", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "tasks:write"); if (p) return p; return deleteRecord(sb, "field_tasks", orgId, id); }
    }

    // ── INVOICES ─────────────────────────────────────────────────
    if (path === "/invoices" && method === "GET") {
      const p = requirePerm(perms!, "invoices:read"); if (p) return p;
      return listRecords(sb, "invoices", orgId, "id, invoice_number, invoice_type, supplier_name, supplier_id, issue_date, due_date, subtotal, tax_amount, total_amount, currency, status, items, notes", params, q => {
        if (params.status) q = q.eq("status", params.status);
        if (params.invoice_type) q = q.eq("invoice_type", params.invoice_type);
        return q;
      });
    }
    if (path === "/invoices" && method === "POST") {
      const p = requirePerm(perms!, "invoices:write"); if (p) return p;
      return createRecord(sb, "invoices", orgId, body);
    }
    const invoiceMatch = path.match(/^\/invoices\/([^\/]+)$/);
    if (invoiceMatch) {
      const id = invoiceMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "invoices:read"); if (p) return p; return getRecord(sb, "invoices", orgId, id); }
      if (method === "PUT" || method === "PATCH") { const p = requirePerm(perms!, "invoices:write"); if (p) return p; return updateRecord(sb, "invoices", orgId, id, body); }
      if (method === "DELETE") { const p = requirePerm(perms!, "invoices:write"); if (p) return p; return deleteRecord(sb, "invoices", orgId, id); }
    }

    // ── GENETICS ─────────────────────────────────────────────────
    if (path === "/genetics" && method === "GET") {
      const p = requirePerm(perms!, "genetics:read"); if (p) return p;
      return listRecords(sb, "genetic_evaluations", orgId, "id, animal_id, evaluation_date, evaluator, overall_genetic_value, milk_production_index, meat_production_index, fertility_index, growth_rate_index, calving_ease_index, maternal_ability_index, longevity_index, disease_resistance_index, body_conformation_score, udder_score, legs_feet_score, reliability_percentage, notes", params, q => {
        if (params.animal_id) q = q.eq("animal_id", params.animal_id);
        return q;
      }, "evaluation_date");
    }
    if (path === "/genetics" && method === "POST") {
      const p = requirePerm(perms!, "genetics:write"); if (p) return p;
      return createRecord(sb, "genetic_evaluations", orgId, body);
    }
    const genMatch = path.match(/^\/genetics\/([^\/]+)$/);
    if (genMatch && genMatch[1] !== "breeding-suggestions") {
      const id = genMatch[1];
      if (method === "GET") { const p = requirePerm(perms!, "genetics:read"); if (p) return p; return getRecord(sb, "genetic_evaluations", orgId, id); }
    }
    if (path === "/genetics/breeding-suggestions" && method === "GET") {
      const p = requirePerm(perms!, "genetics:read"); if (p) return p;
      return listRecords(sb, "breeding_suggestions", orgId, "id, female_id, male_id, semen_code, bull_name, suggested_date, priority, compatibility_score, inbreeding_coefficient, expected_improvement, status, executed_date, notes", params);
    }
    if (path === "/genetics/breeding-suggestions" && method === "POST") {
      const p = requirePerm(perms!, "genetics:write"); if (p) return p;
      return createRecord(sb, "breeding_suggestions", orgId, body);
    }

    // ── 404 ──────────────────────────────────────────────────────
    return err("Endpoint no encontrado. Visita /public-api/docs para la documentación completa.", 404);

  } catch (error: any) {
    console.error("API Error:", error);
    return err("Error interno del servidor", 500, error.message);
  }
});
