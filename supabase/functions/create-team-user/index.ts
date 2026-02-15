import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Default permissions per role
const ROLE_PERMISSIONS: Record<string, { module: string; permissions: string[] }[]> = {
  admin: [
    // Admin gets ALL modules with ALL permissions
    ...[
      'dashboard', 'usuarios', 'animales', 'reproduccion', 'produccion-leche',
      'produccion-carne', 'salud', 'alimentacion', 'praderas', 'simulaciones',
      'reportes', 'costos', 'insumos', 'genetica', 'intercambio', 'app-movil',
      'configuracion', 'ayuda', 'inteligencia', 'tareas', 'facturas',
    ].map(m => ({ module: m, permissions: ['read', 'write', 'delete'] })),
  ],
  ganadero: [
    { module: 'dashboard', permissions: ['read'] },
    { module: 'animales', permissions: ['read', 'write'] },
    { module: 'reproduccion', permissions: ['read', 'write'] },
    { module: 'produccion-leche', permissions: ['read', 'write'] },
    { module: 'produccion-carne', permissions: ['read', 'write'] },
    { module: 'salud', permissions: ['read'] },
    { module: 'alimentacion', permissions: ['read', 'write'] },
    { module: 'praderas', permissions: ['read', 'write'] },
    { module: 'reportes', permissions: ['read'] },
    { module: 'costos', permissions: ['read'] },
    { module: 'insumos', permissions: ['read', 'write'] },
    { module: 'tareas', permissions: ['read', 'write'] },
    { module: 'ayuda', permissions: ['read'] },
  ],
  veterinario: [
    { module: 'dashboard', permissions: ['read'] },
    { module: 'animales', permissions: ['read', 'write'] },
    { module: 'reproduccion', permissions: ['read', 'write', 'delete'] },
    { module: 'produccion-leche', permissions: ['read'] },
    { module: 'produccion-carne', permissions: ['read'] },
    { module: 'salud', permissions: ['read', 'write', 'delete'] },
    { module: 'genetica', permissions: ['read', 'write'] },
    { module: 'reportes', permissions: ['read'] },
    { module: 'ayuda', permissions: ['read'] },
  ],
  tecnico: [
    { module: 'dashboard', permissions: ['read'] },
    { module: 'animales', permissions: ['read', 'write'] },
    { module: 'produccion-leche', permissions: ['read', 'write'] },
    { module: 'produccion-carne', permissions: ['read', 'write'] },
    { module: 'alimentacion', permissions: ['read', 'write'] },
    { module: 'praderas', permissions: ['read', 'write'] },
    { module: 'insumos', permissions: ['read', 'write'] },
    { module: 'tareas', permissions: ['read', 'write'] },
    { module: 'ayuda', permissions: ['read'] },
  ],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller with anon client
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerId = claims.claims.sub as string

    // Verify caller is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: adminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse body
    const body = await req.json()
    const { email, password, full_name, phone, role, organization_id } = body

    if (!email || !password || !full_name || !role || !organization_id) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create user with admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        phone: phone || null,
      },
    })

    if (createError) {
      const msg = createError.message.includes('already been registered')
        ? 'Este correo ya está registrado'
        : createError.message
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = newUser.user.id

    // Update profile with organization
    await adminClient
      .from('profiles')
      .update({
        organization_id,
        full_name: full_name.trim(),
        phone: phone || null,
      })
      .eq('user_id', userId)

    // Remove default admin role (created by trigger) and assign correct role
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role, organization_id })

    // Assign default permissions based on role
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['ganadero']
    const permInserts: { user_id: string; module_name: string; permission: string; organization_id: string }[] = []

    for (const mp of rolePerms) {
      for (const perm of mp.permissions) {
        permInserts.push({
          user_id: userId,
          module_name: mp.module,
          permission: perm,
          organization_id,
        })
      }
    }

    if (permInserts.length > 0) {
      await adminClient.from('user_permissions').insert(permInserts)
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, full_name, role },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
