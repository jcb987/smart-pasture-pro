

## Plan: Corregir el registro de produccion de leche

### Problema real detectado

Al analizar las peticiones de red, el error NO es sobre fechas pasadas. El problema es que **ningún registro se esta guardando** (ni de hoy ni de fechas anteriores). El error es:

```
"cannot insert a non-DEFAULT value into column 'total_liters'"
```

La columna `total_liters` es una **columna generada automaticamente** en la base de datos que calcula:
```
morning_liters + afternoon_liters + evening_liters
```

Pero el codigo esta enviando un valor calculado manualmente para `total_liters`, lo cual la base de datos rechaza con error 400. Esto causa que todos los registros queden "pendientes" en la cola de sincronizacion sin poder guardarse.

### Solucion

#### 1. Excluir `total_liters` del INSERT (archivo: `useMilkProduction.ts`)

Remover `total_liters` del objeto `dbRecord` que se envia a la base de datos, ya que la base de datos lo calcula automaticamente. Mantenerlo en el estado local para mostrar en la UI.

#### 2. Excluir `total_liters` en la importacion masiva (archivo: `useImportMilk.ts`)

Mismo problema: al importar datos de Excel, tambien se envia `total_liters`. Hay que removerlo del objeto de insercion.

#### 3. Limpiar la cola de sincronizacion atascada

Los registros que intentaste guardar antes estan atascados en la cola porque contienen `total_liters`. Necesitas descartarlos usando el boton "Descartar cambios pendientes" que ya existe.

### Detalles tecnicos

**Archivos a modificar:**

1. **`src/hooks/useMilkProduction.ts`** (linea ~180-195)
   - Eliminar la linea `total_liters: newRecord.total_liters` del objeto `dbRecord`
   - El campo seguira existiendo en `newRecord` para mostrar en la UI local

2. **`src/hooks/useImportMilk.ts`** (linea ~40-50)
   - Eliminar `total_liters: row.total_liters` del objeto que se inserta en `recordsToInsert`

### Resultado esperado

- Los registros de produccion de leche se guardaran correctamente para CUALQUIER fecha (pasada, presente o futura)
- La importacion masiva desde Excel tambien funcionara
- La cola de sincronizacion dejara de atascarse

