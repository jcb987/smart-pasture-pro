import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify caller is admin
    const { data: adminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden realizar esta acción' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action, target_user_id } = body

    if (!action || !target_user_id) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent self-deletion
    if (action === 'delete' && target_user_id === callerId) {
      return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      // Delete user completely using admin API (cascades handle related records)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id)
      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reset_password') {
      const { new_password } = body
      if (!new_password || new_password.length < 6) {
        return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(target_user_id, {
        password: new_password,
      })

      if (updateError) {
        console.error('Error resetting password:', updateError)
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'Contraseña restablecida correctamente' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Acción no válida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-team-user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})