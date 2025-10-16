# Imágenes para PWA

Para que la PWA funcione correctamente, necesitas generar las siguientes imágenes:

## Imágenes Requeridas

1. **pwa-192x192.png** - 192x192 píxeles
2. **pwa-512x512.png** - 512x512 píxeles  
3. **apple-touch-icon.png** - 180x180 píxeles
4. **mask-icon.svg** - Icono SVG monocromático

## Cómo Generar las Imágenes

### Opción 1: Usar una herramienta online (Recomendado)

1. Ve a [PWA Image Generator](https://www.pwabuilder.com/imageGenerator)
2. Sube un logo/icono de tu app (mínimo 512x512px)
3. Descarga las imágenes generadas
4. Coloca los archivos en `client/public/`

### Opción 2: Crear manualmente

Puedes crear las imágenes usando cualquier editor gráfico (Figma, Photoshop, GIMP, etc.):

**Diseño sugerido:**
- Fondo: #DC2626 (rojo de TeamWorks)
- Icono: Un checkmark blanco o el logo de tu app
- Formato: PNG con transparencia o fondo sólido

**Dimensiones:**
- 192x192px para `pwa-192x192.png`
- 512x512px para `pwa-512x512.png`
- 180x180px para `apple-touch-icon.png`

### Opción 3: Usar el favicon.svg como base

El archivo `favicon.svg` ya existe y puede usarse como base. Puedes exportarlo a PNG en las dimensiones necesarias.

## Verificación

Una vez tengas las imágenes:

1. Colócalas en `client/public/`
2. Verifica que los nombres coincidan exactamente
3. Ejecuta `npm run build` en el cliente
4. Inspecciona el manifest.json generado

## Imágenes Temporales

Mientras generas las imágenes finales, puedes usar placeholders:

```bash
# En client/public/
# Crea archivos PNG vacíos o usa el favicon.svg convertido
```

La app funcionará sin estas imágenes, pero no se podrá instalar como PWA correctamente.

