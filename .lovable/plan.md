

## Plan: Actualizar el logo en la aplicación

### Problema
El logo no aparece en la barra de navegación. El código importa correctamente el archivo `src/assets/logo.png`, pero la imagen no se está mostrando. Esto puede deberse a que el archivo no se copió correctamente o a un problema de caché.

### Solución

1. **Volver a copiar el logo** desde el archivo subido (`Logo_Agro_Data_sin_fondo-3.png`) al proyecto en `src/assets/logo.png`.

2. **Actualizar también el favicon** en `public/favicon.png` con el mismo logo para mantener consistencia visual.

3. **Verificar** que el logo aparece correctamente en el Navbar después de la actualización.

### Detalles técnicos

- El Navbar ya importa el logo correctamente vía ES6 import (`import logoImage from "@/assets/logo.png"`), lo cual es la forma correcta para que Vite procese el asset.
- No se requieren cambios de código, solo reemplazar el archivo de imagen.
- Si el problema persiste, se añadirá un query string o se ajustará el import para forzar la recarga del caché.

