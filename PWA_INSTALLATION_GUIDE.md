# 📱 Guía de Instalación PWA - TeamWorks

## ✅ Estado: PWA Completamente Configurado

Todos los archivos necesarios para la instalación PWA están ahora presentes y correctamente configurados.

## 🎨 Iconos Generados

Los siguientes iconos PWA han sido generados con el diseño de marca TeamWorks:

### Iconos Creados
```
client/public/
├── pwa-192x192.png       ✅ 192x192 píxeles (Android)
├── pwa-512x512.png       ✅ 512x512 píxeles (Android/Desktop)
├── apple-touch-icon.png  ✅ 180x180 píxeles (iOS/macOS)
├── mask-icon.svg         ✅ SVG monocromático (Safari)
└── pwa-icon.svg          ✅ SVG fuente
```

### Diseño de los Iconos
- **Fondo:** #DC2626 (rojo característico de TeamWorks)
- **Icono:** Checkmark blanco (símbolo de tareas completadas)
- **Estilo:** Esquinas redondeadas para aspecto moderno
- **Formato:** PNG con RGBA (transparencia)

## 📋 Manifest Configuration

El archivo `manifest.webmanifest` se genera automáticamente durante el build con:

```json
{
  "name": "TeamWorks",
  "short_name": "TeamWorks",
  "description": "Gestión de tareas inteligente con IA",
  "theme_color": "#dc2626",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 🚀 Instalación por Plataforma

### 🖥️ Windows/Linux (Chrome/Edge)

1. **Abrir la aplicación**
   ```
   http://localhost:5173
   ```

2. **Buscar el icono de instalación**
   - En la barra de direcciones, busca el icono ⊕ o 💻
   - Aparece a la derecha de la URL

3. **Instalar**
   - Clic en el icono
   - Seleccionar "Instalar TeamWorks"
   - Confirmar en el diálogo

4. **Resultado**
   - Se abre una ventana independiente sin barra de navegador
   - La app aparece en el menú de inicio/aplicaciones
   - Se puede anclar a la barra de tareas

**Atajo de teclado:** En Chrome, puedes usar `Ctrl+Shift+I` → Application → Manifest para verificar la instalación

### 🍎 macOS (Chrome/Edge)

Similar a Windows/Linux, pero:
- El icono aparece en la barra de direcciones
- La app instalada aparece en el Dock y Launchpad
- Se puede arrastrar al Dock para acceso rápido

### 🍎 macOS (Safari)

1. Abrir la aplicación en Safari
2. **Menú:** Archivo → Agregar a Dock
3. La app aparece en el Dock como aplicación nativa

**Nota:** Safari usa `apple-touch-icon.png` automáticamente

### 📱 Android (Chrome/Edge)

1. Abrir la aplicación en el navegador móvil
2. **Menú:** Tocar ⋮ (tres puntos verticales)
3. Seleccionar "Agregar a pantalla de inicio" o "Instalar app"
4. Confirmar nombre e icono
5. El icono aparece en la pantalla de inicio

**Características móviles:**
- Pantalla completa sin barra del navegador
- Splash screen con colores de marca
- Funcionamiento como app nativa

### 📱 iOS (Safari)

1. Abrir la aplicación en Safari
2. Tocar el botón de **Compartir** (cuadrado con flecha)
3. Desplazar hacia abajo y tocar **"Agregar a pantalla de inicio"**
4. Personalizar nombre si es necesario
5. Tocar "Agregar"

**Nota:** iOS usa específicamente `apple-touch-icon.png`

## 🔧 Verificación Técnica

### Comprobar que PWA está listo

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Application** (Chrome) o **Storage** (Firefox)
3. **Sección Manifest:**
   - Verificar que aparece "manifest.webmanifest"
   - Comprobar todos los iconos se muestran correctamente
   - Ver "Installable: Yes" o similar

4. **Service Worker:**
   - Verificar que `sw.js` está registrado
   - Estado debe ser "activated and running"

### Verificar iconos manualmente

```bash
# En la raíz del proyecto
cd client/public

# Verificar que existen
ls -lh pwa-*.png apple-touch-icon.png mask-icon.svg

# Ver detalles de las imágenes
file pwa-192x192.png
file pwa-512x512.png
file apple-touch-icon.png
```

### Test de manifest

```bash
# Servir el build de producción
cd client
npm run build
npm run preview

# O usar http-server
cd dist
npx http-server -p 8080

# Visitar: http://localhost:8080
# Y verificar en DevTools → Application → Manifest
```

## 🌟 Características PWA Incluidas

- ✅ **Instalación nativa:** Funciona como app de escritorio/móvil
- ✅ **Offline-first:** Service worker con caché inteligente
- ✅ **Auto-actualización:** Detecta y aplica updates automáticamente
- ✅ **Tema consistente:** Usa los colores de TeamWorks
- ✅ **Splash screen:** Pantalla de carga con branding
- ✅ **Notificaciones:** Soporte para notificaciones push (futuro)

## 🎯 Beneficios de Instalación

### Para el Usuario
- 🚀 **Inicio rápido:** Abrir desde dock/inicio sin navegador
- 💾 **Uso offline:** Funciona sin conexión a internet
- 🔔 **Notificaciones:** Recibir alertas de tareas
- 📱 **Experiencia nativa:** Sin barra de navegación
- 💻 **Multi-plataforma:** Mismo comportamiento en todos los dispositivos

### Técnicos
- ⚡ **Caché automático:** Menos carga de red
- 🔄 **Updates automáticos:** Sin reinstalación manual
- 📊 **Mejor rendimiento:** Assets precargados
- 🎨 **UI consistente:** Sin interferencia del navegador

## ❓ Troubleshooting

### El icono de instalación no aparece

**Posibles causas:**
1. La app ya está instalada (verificar en aplicaciones del sistema)
2. No estás usando HTTPS o localhost
3. Service worker no se registró correctamente

**Solución:**
```bash
# Limpiar caché del navegador
# DevTools → Application → Clear Storage → Clear site data

# Rebuilding
cd client
npm run build
```

### Los iconos no se ven correctamente

**Verificar:**
1. Los archivos PNG existen en `client/public/`
2. El build copió los archivos a `client/dist/`
3. El manifest.webmanifest lista los iconos correctamente

**Regenerar iconos:**
```bash
cd client/public
# Los iconos ya están generados, pero puedes verificar:
ls -lh pwa-*.png
```

### Error "Failed to fetch manifest"

**Solución:**
1. Verificar que el build se completó correctamente
2. Comprobar que `manifest.webmanifest` está en `/dist`
3. Revisar la consola del navegador para errores

## 📚 Referencias

- [MDN Web App Manifests](https://developer.mozilla.org/es/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)

## ✅ Checklist de Verificación

Antes de considerar la PWA lista:

- [x] Iconos generados en todos los tamaños requeridos
- [x] Manifest.webmanifest con configuración correcta
- [x] Service worker registrado y funcionando
- [x] Theme color configurado (#dc2626)
- [x] Display mode: standalone
- [x] Start URL configurada
- [x] Icons referenciados en manifest
- [x] Build de producción funcional
- [x] Pruebas en Chrome/Edge desktop
- [x] Compatible con Safari (mac/iOS)
- [x] Compatible con Android

---

**�� ¡TeamWorks está listo para instalarse como PWA en cualquier dispositivo!**
