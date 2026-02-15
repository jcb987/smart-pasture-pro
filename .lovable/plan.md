

## Plan: Corregir registro de produccion de leche y sincronizacion

### Problemas detectados

1. **Dialogo sin feedback de errores**: Cuando se abre el formulario "Registrar Produccion", se buscan animales hembra activas. Si la consulta falla, no se muestra ningun error y el selector queda vacio e inutilizable.

2. **Sincronizacion atascada**: Hay un registro pendiente en la cola de sincronizacion que no se puede sincronizar. La funcion `syncNow` falla silenciosamente sin informar al usuario del error especifico.

3. **Datos extras en el INSERT**: La funcion `addRecord` envia el objeto completo al sistema offline, que luego lo inserta en la base de datos. Si el objeto contiene campos que no son columnas de la tabla (como `animal`), el INSERT falla.

### Solucion propuesta

#### 1. Mejorar el dialogo AddMilkRecordDialog

- Agregar manejo de errores al cargar animales
- Mostrar mensaje cuando no hay animales disponibles
- Mostrar un indicador de carga mientras se buscan animales
- Agregar soporte offline: si no hay conexion, cargar animales desde IndexedDB

#### 2. Limpiar datos antes del INSERT

En `useMilkProduction.ts`, asegurar que solo se envien las columnas validas de la tabla `milk_production` al llamar `saveOffline`, excluyendo campos como `animal` u otros que no son columnas.

#### 3. Mejorar feedback de sincronizacion

En `OfflineContext.tsx`:
- Mostrar errores especificos cuando la sincronizacion falla
- Agregar opcion para limpiar items atascados de la cola
- Mejorar los mensajes toast con detalles del error

#### 4. Agregar boton para limpiar cola de sincronizacion

Permitir que el usuario pueda descartar cambios pendientes que estan atascados y no se pueden sincronizar.

### Detalles tecnicos

**Archivos a modificar:**

1. `src/components/produccion/AddMilkRecordDialog.tsx`
   - Agregar estados de loading y error para la carga de animales
   - Mostrar mensaje "No hay animales hembra activos" si la lista esta vacia
   - Agregar try/catch con toast de error

2. `src/hooks/useMilkProduction.ts`
   - En `addRecord`, filtrar el objeto para enviar SOLO columnas validas: id, animal_id, organization_id, production_date, morning_liters, afternoon_liters, evening_liters, total_liters, fat_percentage, protein_percentage, somatic_cell_count, notes, created_at, created_by
   - Agregar mejor manejo de errores con mensajes descriptivos

3. `src/contexts/OfflineContext.tsx`
   - En `syncNow`, mostrar el error especifico de cada item que falla
   - Agregar funcion `clearSyncQueue` para limpiar items atascados
   - Exponer `clearSyncQueue` en el contexto

4. `src/components/layout/SyncStatusBadge.tsx` (verificar)
   - Agregar boton para limpiar cola si hay items con muchos reintentos

### Resultado esperado

- El formulario de registro mostrara feedback claro si no puede cargar animales
- Los nuevos registros se insertaran correctamente en la base de datos
- El cambio pendiente atascado podra ser descartado por el usuario
- Mensajes de error claros cuando la sincronizacion falla

