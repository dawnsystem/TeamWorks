# Guía de Configuración de TeamWorks

Esta guía te ayudará a configurar correctamente la aplicación TeamWorks paso a paso.

## 1. Configuración de Variables de Entorno

### Backend (server/.env)

Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"

# JWT para autenticación
JWT_SECRET="cambia-este-secreto-por-algo-muy-seguro-y-aleatorio"
JWT_EXPIRES_IN="7d"

# Puerto del servidor
PORT=3000
NODE_ENV=development

# API Key de Google Gemini (obtener en https://makersuite.google.com/app/apikey)
GEMINI_API_KEY="tu-api-key-de-gemini-aqui"

# URL del frontend (para CORS)
FRONTEND_URL="http://localhost:5173"
```

**Importante:** 
- Cambia `JWT_SECRET` por una cadena aleatoria segura
- Obtén tu `GEMINI_API_KEY` de [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ajusta `DATABASE_URL` según tu configuración de PostgreSQL

### Frontend (client/.env)

Crea un archivo `.env` en la carpeta `client/` con el siguiente contenido:

```env
VITE_API_URL=http://localhost:3000/api
```

Para acceso en red local, cambia `localhost` por tu IP local (ejemplo: `http://192.168.1.100:3000/api`)

## 2. Instalación de PostgreSQL

### Opción A: Docker (Más fácil)

```bash
docker run --name teamworks-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=teamworks \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Opción B: Instalación Local

#### Windows
1. Descargar instalador desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Ejecutar instalador y seguir wizard
3. Recordar la contraseña de usuario `postgres`
4. Abrir pgAdmin o línea de comandos y crear base de datos:
   ```sql
   CREATE DATABASE teamworks;
   ```

#### macOS
```bash
# Instalar con Homebrew
brew install postgresql@16

# Iniciar servicio
brew services start postgresql@16

# Crear base de datos
createdb teamworks
```

#### Linux (Ubuntu/Debian)
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos
sudo -u postgres createdb teamworks
```

## 3. Obtener API Key de Google Gemini (GRATIS)

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Selecciona tu proyecto de Google Cloud (o crea uno nuevo - es gratis)
5. Copia la API key generada
6. Pégala en el archivo `server/.env` en la variable `GEMINI_API_KEY`

**Nota:** El tier gratuito de Gemini incluye:
- 60 requests por minuto
- 1,500 requests por día
- Perfecto para uso personal

### Alternativa: Groq (También gratuito)

Si prefieres usar Groq (Llama 3):

1. Ve a [Groq Console](https://console.groq.com)
2. Crea una cuenta
3. Obtén tu API key
4. Modifica `server/src/services/aiService.ts` para usar Groq en lugar de Gemini

## 4. Instalación de Dependencias

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd client
npm install
```

## 5. Configurar Base de Datos con Prisma

```bash
cd server

# Generar cliente de Prisma
npm run prisma:generate

# Crear las tablas en la base de datos
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver/editar datos
npm run prisma:studio
```

## 6. Iniciar la Aplicación

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

Deberías ver:
```
🚀 Server running on http://0.0.0.0:3000
📡 Accessible on local network
```

### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

## 7. Acceso en Red Local

Para acceder desde otros dispositivos en tu red:

1. **Encuentra tu IP local:**
   - Windows: `ipconfig` → busca IPv4
   - Mac: `ifconfig | grep inet` o ver en Preferencias del Sistema
   - Linux: `ip addr` o `hostname -I`

2. **Actualiza el archivo `client/.env`:**
   ```env
   VITE_API_URL=http://TU_IP_LOCAL:3000/api
   ```
   Por ejemplo: `VITE_API_URL=http://192.168.1.100:3000/api`

3. **Configura el firewall:**
   - Windows: Permite puertos 3000 y 5173 en Windows Defender
   - Mac: System Preferences → Security & Privacy → Firewall → Firewall Options
   - Linux: `sudo ufw allow 3000` y `sudo ufw allow 5173`

4. **Accede desde otro dispositivo:**
   - Asegúrate de estar en la misma red WiFi
   - Abre el navegador en: `http://TU_IP_LOCAL:5173`

## 8. Primer Uso

1. Abre `http://localhost:5173` en tu navegador
2. Haz clic en "Regístrate"
3. Crea una cuenta con:
   - Nombre
   - Email
   - Contraseña (mínimo 6 caracteres)
4. Automáticamente se creará un proyecto "Inbox"
5. ¡Comienza a crear tareas!

## 9. Probar el Asistente de IA

1. Haz clic en el icono ✨ (Sparkles) en la barra superior
2. Escribe un comando, por ejemplo:
   ```
   añadir comprar leche para mañana prioridad alta
   ```
3. La IA analizará el comando y sugerirá acciones
4. Confirma o activa "Ejecutar automáticamente" para que se ejecute sin confirmación

## 10. Instalar como PWA

### En Chrome/Edge (Escritorio):
1. Mira la barra de direcciones, verás un icono de instalación
2. Haz clic en él
3. Confirma "Instalar"
4. La app se abrirá en su propia ventana

### En Safari (Mac):
1. Archivo → Agregar a Dock
2. La app aparecerá en tu Dock

### En Móvil:
1. Abre el menú del navegador (⋮ o ⋯)
2. "Agregar a pantalla de inicio"
3. Confirma
4. El icono aparecerá en tu pantalla de inicio

## 🔧 Solución de Problemas Comunes

### "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Comprueba el `DATABASE_URL` en `server/.env`
- Intenta ejecutar `npm run prisma:migrate` de nuevo

### "Invalid API key" (IA)
- Verifica que tu `GEMINI_API_KEY` esté correcta
- Comprueba que tengas cuota disponible en Google AI Studio
- La app funciona sin IA, solo no podrás usar comandos de lenguaje natural

### "Network Error" en el frontend
- Verifica que el backend esté corriendo (`http://localhost:3000/health` debe responder)
- Comprueba el `VITE_API_URL` en `client/.env`
- Revisa la consola del navegador (F12) para más detalles

### Puerto 3000 o 5173 ya en uso
- Cambia el puerto en `server/.env` (PORT=3001)
- O mata el proceso que usa el puerto:
  - Windows: `netstat -ano | findstr :3000` → `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:3000 | xargs kill`

### CORS errors
- Verifica que `FRONTEND_URL` en `server/.env` coincida con tu URL del frontend
- Si usas IP local, actualiza `FRONTEND_URL` a `http://TU_IP:5173`

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs/)
- [Google Gemini AI](https://ai.google.dev/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TailwindCSS](https://tailwindcss.com/docs)

---

Si tienes problemas, revisa los logs en la terminal donde está corriendo el servidor y el cliente.

