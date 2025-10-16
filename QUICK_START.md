# 🚀 Inicio Rápido - TeamWorks

Guía para tener TeamWorks funcionando en menos de 10 minutos.

## Prerrequisitos

- ✅ Node.js 18+ instalado
- ✅ PostgreSQL 14+ instalado (o Docker)
- ✅ 10 minutos de tu tiempo

## Paso 1: Instalar Dependencias (2 min)

### Opción A: Script Automático (Recomendado)
```bash
# Linux/Mac
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

### Opción B: Manual
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

## Paso 2: Configurar PostgreSQL (3 min)

### Opción A: Docker (Más fácil)
```bash
docker run --name teamworks-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=teamworks \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Opción B: Local
Si ya tienes PostgreSQL:
```bash
createdb teamworks
```

## Paso 3: Variables de Entorno (2 min)

### Backend: `server/.env`
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
JWT_SECRET="mi-secreto-super-seguro-123"
GEMINI_API_KEY="obtener-en-google-ai-studio"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Obtener Gemini API Key (GRATIS):**
1. Ve a https://makersuite.google.com/app/apikey
2. Crea API key
3. Copia y pega en `.env`

### Frontend: `client/.env`
```env
VITE_API_URL=http://localhost:3000/api
```

## Paso 4: Configurar Base de Datos (1 min)

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

## Paso 5: ¡Iniciar! (30 seg)

### Opción A: Script Automático
```bash
# Linux/Mac
chmod +x dev.sh
./dev.sh

# Windows
dev.bat
```

### Opción B: Manual (2 terminales)
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Paso 6: Abrir en Navegador

Abre: **http://localhost:5173**

1. Haz clic en "Regístrate"
2. Crea tu cuenta
3. ¡Empieza a crear tareas!

## 🤖 Probar el Asistente de IA

1. Haz clic en el icono ✨ (Sparkles) arriba
2. Prueba estos comandos:

```
añadir comprar leche para mañana prioridad alta
completar la tarea de comprar leche
qué tengo pendiente esta semana
eliminar todas las tareas completadas
```

## 🌐 Acceso desde otro Dispositivo

1. Obtén tu IP local:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` o `hostname -I`

2. En otro dispositivo (misma red WiFi):
   - Abre: `http://TU_IP:5173`

3. Actualiza `client/.env`:
   ```env
   VITE_API_URL=http://TU_IP:3000/api
   ```

## 🐛 Problemas Comunes

### "Cannot connect to database"
```bash
# Verifica que PostgreSQL esté corriendo
# Docker:
docker ps | grep teamworks-db

# Si no está corriendo:
docker start teamworks-db

# Local:
# Windows: Servicios → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql
```

### "Invalid API key" (IA)
- Verifica `GEMINI_API_KEY` en `server/.env`
- La app funciona sin IA, solo no podrás usar comandos de lenguaje natural

### "Port already in use"
```bash
# Cambiar puerto en server/.env
PORT=3001

# O matar proceso:
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -ti:3000 | xargs kill
```

### Frontend no carga
- Verifica que backend esté corriendo (http://localhost:3000/health)
- Revisa la consola del navegador (F12)
- Verifica `VITE_API_URL` en `client/.env`

## 📱 Instalar como App (PWA)

### Chrome/Edge (Desktop)
1. Mira la barra de direcciones
2. Clic en icono de instalación
3. "Instalar"

### Safari (Mac)
- Archivo → Agregar a Dock

### Móvil
- Menú (⋮) → Agregar a pantalla de inicio

## 📚 Documentación Completa

- **SETUP.md** - Guía detallada de configuración
- **README.md** - Documentación principal
- **PROJECT_STRUCTURE.md** - Arquitectura del proyecto
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico

## ✨ Características Principales

- ✅ Gestión completa de tareas
- ✅ Proyectos y secciones
- ✅ Prioridades (P1-P4) con colores
- ✅ Etiquetas personalizables
- ✅ Subtareas anidadas
- ✅ Asistente de IA en español
- ✅ Tema oscuro/claro
- ✅ PWA instalable
- ✅ Multi-usuario
- ✅ Acceso en red local

## 🎯 Siguientes Pasos

1. ✅ Configurar variables de entorno
2. ✅ Iniciar aplicación
3. ✅ Crear cuenta
4. ✅ Crear primer proyecto
5. ✅ Crear primera tarea
6. ✅ Probar asistente de IA
7. ✅ Instalar como PWA
8. ✅ Explorar funcionalidades

## 💡 Tips

- **Atajos rápidos**: Clic en "+" para nueva tarea
- **IA automática**: Activa checkbox para auto-ejecutar
- **Tema oscuro**: Icono luna/sol en barra superior
- **Búsqueda**: Clic en lupa en barra superior
- **Editar tarea**: Clic en cualquier tarea

---

**¿Problemas?** Revisa SETUP.md o los logs de terminal.

**¡Disfruta organizando tus tareas con TeamWorks! 🚀**

