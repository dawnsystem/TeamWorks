# Guía de Configuración para Acceso en Red Local

Esta guía te ayudará a configurar TeamWorks para que puedas acceder desde cualquier dispositivo en tu red local (móvil, tablet, otro ordenador).

## 🎉 ¡Actualizado! Configuración Automática Mejorada

TeamWorks ahora está completamente configurado para funcionar en red local **sin necesidad de configuración manual**. El servidor acepta automáticamente conexiones desde:
- ✅ Localhost (127.0.0.1, localhost, 0.0.0.0)
- ✅ Red local clase C (192.168.x.x)
- ✅ Red local clase A (10.x.x.x)
- ✅ Red local clase B (172.16.x.x - 172.31.x.x)

### Flujo de Configuración Simplificado:

1. **Inicia el servidor** en tu PC principal (ver Paso 1 abajo)
2. **Abre TeamWorks** desde otro dispositivo: `http://[IP-DEL-SERVIDOR]:5173`
3. **Verás un banner naranja** que detecta automáticamente la configuración necesaria
4. **Haz clic en "Configurar Automáticamente"** y ¡listo! 🎊

El sistema verificará que el servidor esté accesible y configurará todo por ti automáticamente.

---

## Paso 1: Configuración del Servidor

El servidor ya está configurado para:
- ✅ Escuchar en todas las interfaces de red (`0.0.0.0`)
- ✅ Aceptar conexiones CORS desde cualquier IP de red local
- ✅ Manejar credenciales de autenticación de forma segura

**No necesitas hacer cambios en el código ni en archivos .env para la configuración de red local.**

### 1.1 Iniciar el Servidor

```bash
cd server
npm run dev
```

Deberías ver:
```
🚀 Server running on http://0.0.0.0:3000
📡 Accessible on local network
```

### 1.2 Obtener la IP Local del Servidor

#### Windows
```bash
ipconfig
```
Busca "IPv4 Address" en tu adaptador de red activo. Ejemplo: `192.168.0.165`

#### macOS / Linux
```bash
ifconfig
# o
ip addr show
```
Busca la IP que empieza con `192.168.` o `10.0.`. Ejemplo: `192.168.0.165`

### 1.3 Verificar el Firewall (si hay problemas)

Si no puedes conectar desde otros dispositivos, asegúrate de que el firewall permite el puerto 3000:

#### Windows
```bash
# Como administrador
netsh advfirewall firewall add rule name="TeamWorks" dir=in action=allow protocol=TCP localport=3000
```

#### macOS
```bash
# El firewall de macOS generalmente no bloquea por defecto
# Si lo tienes activado, añade una excepción para Node.js
```

#### Linux (UFW)
```bash
sudo ufw allow 3000/tcp
```

## Paso 2: Configuración del Cliente

### 2.1 Iniciar el Cliente de Desarrollo (Opcional)

Si quieres usar el cliente de desarrollo en la misma máquina:

```bash
cd client
npm run dev
```

El cliente estará disponible en `http://localhost:5173`

### 2.2 Build de Producción del Cliente (Recomendado)

Para mejor rendimiento, construye el cliente y sírvelo desde el servidor:

```bash
cd client
npm run build
```

Luego configura el servidor para servir los archivos estáticos (puedes usar `express.static` o cualquier servidor web).

## Paso 3: Acceder desde Otro Dispositivo

### 3.1 Conectar al Mismo WiFi/Red

Asegúrate de que ambos dispositivos (servidor y cliente) están en la misma red WiFi o LAN.

### 3.2 Abrir la Aplicación

En el dispositivo desde el que quieres acceder (móvil, tablet, etc.):

1. Abre un navegador web
2. Navega a: `http://[IP-DEL-SERVIDOR]:5173` (si usas dev server del cliente)
   - O a la URL donde estés sirviendo el cliente de producción

### 3.3 Configurar la URL del API

#### 🌟 Opción 1: Configuración Automática (Recomendado)

Cuando abras TeamWorks desde un dispositivo remoto, verás automáticamente un **banner naranja en la parte superior** con el mensaje:

> ⚠️ **Configuración de Red Requerida**

Este banner:
- ✅ Detecta automáticamente tu dirección IP
- ✅ Sugiere la URL correcta del API
- ✅ Verifica la conexión antes de aplicar cambios
- ✅ Te avisa si algo no funciona

**Pasos:**
1. Haz clic en **"Configurar Automáticamente"**
2. Espera unos segundos mientras verifica la conexión
3. Si todo va bien, verás "✅ Configuración actualizada correctamente"
4. La página se recargará automáticamente
5. ¡Ya puedes iniciar sesión!

#### 🔧 Opción 2: Configuración Manual (Si la automática no funciona)

Si prefieres configurar manualmente o la configuración automática no funciona:

1. En la pantalla de Login/Register, verás un botón flotante ⚙️ en la esquina superior derecha
2. Haz click en el botón ⚙️ (también puedes hacer clic en "Configurar Manualmente" en el banner)
3. Se abrirá el panel de Configuración
4. En la sección "Configuración del Servidor", campo "URL de la API":
   - Ingresa: `http://[IP-DEL-SERVIDOR]:3000/api`
   - Ejemplo: `http://192.168.0.165:3000/api`
5. Haz click en el botón de verificación (icono de servidor) para comprobar la conexión
6. Si aparece "✓ Conectado" en verde, la configuración es correcta
7. Haz click en "Guardar"
8. La página se recargará automáticamente

### 3.4 Crear Cuenta o Iniciar Sesión

Ahora ya puedes:
- Crear una cuenta nueva desde cualquier dispositivo
- Iniciar sesión con una cuenta existente
- Todas las peticiones irán al servidor correcto

## Solución de Problemas Comunes

### Error: "No se puede conectar al servidor"

**Causas posibles:**
1. El servidor no está ejecutándose
2. La IP ingresada es incorrecta
3. El firewall está bloqueando el puerto 3000
4. Los dispositivos no están en la misma red
5. **NUEVO**: Error de CORS (muy poco probable con la nueva configuración)

**Soluciones:**
1. **Automática**: Si ves el banner naranja, prueba hacer clic en "Configurar Automáticamente"
2. Verifica que el servidor esté corriendo (`npm run dev` en carpeta server)
3. Confirma la IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
4. Revisa la configuración del firewall (ver Paso 1.3)
5. Asegúrate de que ambos dispositivos están en la misma WiFi
6. **NUEVO**: Verifica los logs del servidor. La configuración CORS ahora acepta automáticamente conexiones desde red local.

### CORS Bloqueado / Error de Cross-Origin

**⚠️ SOLUCIONADO**: Este error ya no debería ocurrir con la nueva configuración. El servidor ahora acepta automáticamente:
- Todas las IPs de localhost (127.0.0.1, localhost, 0.0.0.0)
- Todas las IPs de red local privada (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

Si aún ves este error:
1. Reinicia el servidor completamente
2. Verifica que estés usando la última versión del código
3. Comprueba los logs del servidor para ver qué origin está siendo rechazado
4. Asegúrate de que estás accediendo desde una IP de red local válida

### El banner de configuración automática no aparece

**Posibles razones:**
- Ya has configurado correctamente la URL del API anteriormente
- Estás accediendo desde localhost (no es necesaria la configuración)

**Solución:**
- Si aun así no puedes conectarte, usa la configuración manual (botón ⚙️)

### Error: "Credenciales inválidas" al registrar usuario

**Causa:** La URL del API no está configurada correctamente.

**Solución:** Sigue el Paso 3.3 para configurar la URL del API antes de intentar registrarte.

### La página carga pero no muestra datos

**Causa:** El token de autenticación puede estar guardado con una URL anterior.

**Solución:**
1. Abre Settings (⚙️)
2. Verifica que la URL del API sea correcta
3. Cierra sesión y vuelve a iniciar sesión

### No puedo acceder desde el móvil pero sí desde el PC

**Causas posibles:**
1. El móvil está usando datos móviles en lugar de WiFi
2. Estás en una red WiFi de invitados que aísla dispositivos

**Soluciones:**
1. Asegúrate de que el móvil está conectado al mismo WiFi
2. Si usas WiFi de invitados, conéctate al WiFi principal
3. Algunos routers tienen "aislamiento de clientes" activado - desactívalo en la configuración del router

## Configuración Avanzada

### Entendiendo la Configuración CORS

La aplicación ahora incluye una configuración CORS inteligente que:
- ✅ Permite automáticamente conexiones desde localhost y todas sus variantes
- ✅ Permite automáticamente conexiones desde rangos de IP de red local privada
- ✅ Permite conexiones configuradas explícitamente via `FRONTEND_URL` en .env
- ✅ Soporta credenciales (cookies, headers de autenticación) de forma segura
- ✅ Registra en consola cualquier origen rechazado para debugging

**No necesitas configurar FRONTEND_URL** para uso en red local. La configuración CORS es automática.

Si quieres restringir el acceso a IPs específicas, puedes configurar `FRONTEND_URL` en el archivo `.env` del servidor:
```env
FRONTEND_URL=http://192.168.1.100:5173
```

### Usar un Dominio Local

Si quieres usar un nombre de dominio en lugar de la IP:

1. Edita el archivo `hosts` en todos los dispositivos:
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - macOS/Linux: `/etc/hosts`

2. Añade una línea:
   ```
   192.168.0.165  teamworks.local
   ```

3. Ahora puedes usar `http://teamworks.local:3000/api`

### HTTPS (Opcional)

Para usar HTTPS en red local, necesitarías:

1. Generar certificado autofirmado
2. Configurar el servidor Express para usar HTTPS
3. Aceptar el certificado en cada dispositivo

**Nota**: HTTPS no es necesario para red local, solo para producción en internet.

### Servir Cliente y Servidor en el Mismo Puerto

Puedes configurar Express para servir los archivos estáticos del cliente:

```javascript
// server/src/index.ts
import path from 'path';

// Después de las rutas de API
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all para SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

Entonces solo necesitas acceder a `http://[IP]:3000` (sin especificar puerto del cliente).

## Mejores Prácticas

### Seguridad en Red Local

1. **No expongas a internet**: Esta configuración es solo para red local
2. **Usa contraseñas fuertes**: Especialmente si otros tienen acceso a tu red
3. **Mantén actualizado**: Actualiza dependencias regularmente

### Rendimiento

1. **Usa build de producción**: `npm run build` en el cliente
2. **Considera usar PM2**: Para mantener el servidor ejecutándose
   ```bash
   npm install -g pm2
   pm2 start npm --name "teamworks-server" -- run dev
   ```

### Backup

1. **Base de datos**: Haz backup regular de PostgreSQL
   ```bash
   pg_dump teamworks > backup.sql
   ```

2. **Configuración**: Guarda tu configuración de Settings (se guarda automáticamente en localStorage del navegador)

## Resumen Rápido

### Para el usuario final (Nueva Experiencia Simplificada):

1. ✅ Asegúrate de que el servidor esté corriendo en tu PC principal
2. ✅ Obtén la IP del servidor (usa `ipconfig` en Windows o `ifconfig` en Mac/Linux)
3. ✅ Abre TeamWorks en el dispositivo: `http://[IP]:5173`
4. ✅ **¡El banner naranja aparecerá automáticamente!**
5. ✅ Haz clic en "Configurar Automáticamente"
6. ✅ Espera la confirmación
7. ✅ ¡Listo para usar! Inicia sesión o regístrate

### Método tradicional (si prefieres configurar manualmente):

1. ✅ Asegúrate de que el servidor esté corriendo
2. ✅ Obtén la IP del servidor
3. ✅ Abre TeamWorks en el dispositivo
4. ✅ Click en ⚙️ para abrir Settings
5. ✅ Configura URL: `http://[IP]:3000/api`
6. ✅ Verifica conexión (debe aparecer "Conectado")
7. ✅ Guarda y recarga
8. ✅ ¡Listo para usar!

## Soporte

Si tienes problemas:
1. Revisa la consola del servidor para errores
2. Revisa la consola del navegador (F12 → Console)
3. Usa el botón de ayuda (?) en la app para ver el manual completo
4. Verifica que ambos dispositivos están en la misma red
