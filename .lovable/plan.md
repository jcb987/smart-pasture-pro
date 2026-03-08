

## Plan: Reemplazar encuesta por mensaje de bienvenida para usuarios agregados

### Problema raiz

La Edge Function `create-team-user` intenta insertar un registro en `user_onboarding` con valores como `'na'` para saltar la encuesta, pero la tabla tiene restricciones CHECK que solo permiten valores especificos (ej: `production_type` solo acepta `'carne'`, `'leche'`, `'doble_proposito'`). Por eso el insert falla silenciosamente y la encuesta sigue apareciendo.

### Estrategia

En lugar de forzar datos falsos en la encuesta, vamos a:

1. Marcar al usuario como "agregado por admin" para que el sistema sepa que NO debe mostrar la encuesta
2. Mostrar un mensaje de bienvenida amigable en vez de la encuesta cuando el usuario es agregado

### Cambios a realizar

#### 1. Agregar columna `is_team_member` a la tabla `profiles`

Una columna booleana que indica si el usuario fue creado por un administrador (vs. auto-registrado). Valor por defecto: `false`.

```sql
ALTER TABLE profiles ADD COLUMN is_team_member boolean DEFAULT false;
```

#### 2. Actualizar Edge Function `create-team-user`

- Remover el insert fallido a `user_onboarding`
- En su lugar, marcar `is_team_member = true` en el perfil del usuario (ya se hace un `update` al perfil, solo se agrega este campo)

#### 3. Modificar `ProtectedRoute.tsx`

Cambiar la logica de verificacion de onboarding:
- Si el usuario tiene `is_team_member = true` en su perfil Y no tiene registro en `user_onboarding`: mostrar **dialogo de bienvenida** (no la encuesta)
- Si el usuario NO tiene `is_team_member` (es dueno) Y no tiene registro en `user_onboarding`: mostrar la **encuesta normal**
- Si ya tiene registro en `user_onboarding`: no mostrar nada

#### 4. Crear componente `WelcomeDialog.tsx`

Un dialogo sencillo y amigable que:
- Muestra un mensaje de bienvenida al sistema
- Indica el nombre del hato/organizacion al que fue agregado
- Tiene un unico boton "Comenzar" que cierra el dialogo
- Al cerrarse, inserta un registro minimo en `user_onboarding` (con valores validos) para que no vuelva a aparecer

### Archivos a modificar

1. **Migracion SQL** - Agregar columna `is_team_member` a `profiles`
2. **`supabase/functions/create-team-user/index.ts`** - Marcar `is_team_member = true` y remover insert fallido a `user_onboarding`
3. **`src/components/ProtectedRoute.tsx`** - Agregar logica para diferenciar usuario agregado vs. auto-registrado
4. **`src/components/onboarding/WelcomeDialog.tsx`** (nuevo) - Componente de bienvenida para usuarios agregados

### Flujo resultante

- **Dueno se registra por primera vez**: Ve la encuesta de 5 pasos (sin cambios)
- **Usuario agregado por admin inicia sesion por primera vez**: Ve un mensaje de bienvenida sencillo con un boton "Comenzar"
- **Cualquier usuario que ya completo onboarding**: No ve nada (sin cambios)

