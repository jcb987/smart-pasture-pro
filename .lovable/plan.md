

## Plan: Limpiar imports no usados en ProduccionLeche.tsx

El código ya tiene los botones eliminados correctamente. Solo queda "Registrar Producción". Sin embargo, aún hay imports sin usar (DropdownMenu, Upload, Download, Camera, SmartImportDialog, MilkImageImportDialog, useExportMilk, useImportMilk, etc.) y estados innecesarios (`showImportDialog`, `showImageImportDialog`, `exportToExcel`, `importData`).

### Cambios

**`src/pages/ProduccionLeche.tsx`**:
1. Eliminar imports no usados: `DropdownMenu*`, `Upload`, `Download`, `Camera`, `SmartImportDialog`, `MilkImageImportDialog`, `milkImportConfig`, `useExportMilk`, `useImportMilk`
2. Eliminar estados: `showImportDialog`, `showImageImportDialog`
3. Eliminar hooks: `exportToExcel`, `exporting`, `importData`
4. Eliminar los componentes `<SmartImportDialog>` y `<MilkImageImportDialog>` del JSX al final del archivo

Esta limpieza forzará una nueva compilación que debería resolver el problema de que el preview no refleja los cambios.

