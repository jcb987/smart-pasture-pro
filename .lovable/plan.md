
## Plan: Corregir la creacion de usuarios (Edge Function)

### Problemas detectados

1. **Falta configuracion en `config.toml`**: La funcion `create-team-user` no tiene `verify_jwt = false` en el archivo de configuracion. El sistema de signing-keys requiere que `verify_jwt` sea `false` y que la validacion del JWT se haga manualmente en el codigo (que ya se hace). Sin esta configuracion, la funcion rechaza la peticion ANTES de que el codigo se ejecute, devolviendo un error generico "non-2xx status code".

2. **CORS headers incompletos**: Los headers CORS de la funcion solo incluyen `authorization, x-client-info, apikey, content-type`, pero faltan los headers adicionales que el cliente envia automaticamente (`x-supabase-client-platform`, etc.). Esto puede causar que el navegador bloquee la peticion preflight.

### Solucion

#### 1. Agregar configuracion en `supabase/config.toml`

Agregar la entrada para `create-team-user` con `verify_jwt = false`:

```toml
[functions.create-team-user]
verify_jwt = false
```

#### 2. Actualizar CORS headers en la Edge Function

Cambiar los headers CORS en `supabase/functions/create-team-user/index.ts` para incluir todos los headers requeridos:

```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

### Archivos a modificar

1. **`supabase/config.toml`** - Agregar seccion `[functions.create-team-user]` con `verify_jwt = false`
2. **`supabase/functions/create-team-user/index.ts`** - Actualizar la constante `corsHeaders` con los headers completos

### Resultado esperado

- La funcion dejara de rechazar las peticiones antes de ejecutarse
- El formulario de "Crear Nuevo Usuario" funcionara correctamente
- Los usuarios creados tendran sus roles y permisos asignados automaticamente
