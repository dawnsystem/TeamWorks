# Estructura del Proyecto TeamWorks

## 📁 Estructura Completa

```
TeamWorks/
│
├── 📄 README.md                    # Documentación principal
├── 📄 SETUP.md                     # Guía de configuración detallada
├── 📄 PROJECT_STRUCTURE.md         # Este archivo
├── 📄 .gitignore                   # Archivos ignorados por git
├── 📄 setup.sh                     # Script de instalación (Linux/Mac)
├── 📄 setup.bat                    # Script de instalación (Windows)
├── 📄 dev.sh                       # Script de desarrollo (Linux/Mac)
├── 📄 dev.bat                      # Script de desarrollo (Windows)
│
├── 📂 server/                      # Backend Node.js + Express
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # Lógica de controladores
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── labelController.ts
│   │   │   └── aiController.ts
│   │   │
│   │   ├── 📂 middleware/          # Middleware personalizado
│   │   │   └── auth.ts             # Autenticación JWT
│   │   │
│   │   ├── 📂 routes/              # Definición de rutas
│   │   │   ├── authRoutes.ts
│   │   │   ├── projectRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   ├── labelRoutes.ts
│   │   │   └── aiRoutes.ts
│   │   │
│   │   ├── 📂 services/            # Servicios de negocio
│   │   │   └── aiService.ts        # Servicio de IA (Gemini)
│   │   │
│   │   └── 📄 index.ts             # Punto de entrada del servidor
│   │
│   ├── 📂 prisma/
│   │   └── 📄 schema.prisma        # Schema de base de datos
│   │
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 README.md
│   └── 📄 .env                     # Variables de entorno (crear)
│
└── 📂 client/                      # Frontend React + Vite
    ├── 📂 src/
    │   ├── 📂 components/          # Componentes React
    │   │   ├── AIAssistant.tsx     # Asistente de IA
    │   │   ├── ProjectView.tsx     # Vista de proyecto
    │   │   ├── Sidebar.tsx         # Barra lateral
    │   │   ├── TaskEditor.tsx      # Editor de tareas (modal)
    │   │   ├── TaskItem.tsx        # Item de tarea individual
    │   │   ├── TaskList.tsx        # Lista de tareas
    │   │   ├── TodayView.tsx       # Vista de hoy
    │   │   ├── TopBar.tsx          # Barra superior
    │   │   └── WeekView.tsx        # Vista de semana
    │   │
    │   ├── 📂 pages/               # Páginas/vistas principales
    │   │   ├── Dashboard.tsx       # Dashboard principal
    │   │   ├── Login.tsx           # Página de login
    │   │   └── Register.tsx        # Página de registro
    │   │
    │   ├── 📂 store/               # Estado global (Zustand)
    │   │   └── useStore.ts         # Stores de auth, UI, editor, IA
    │   │
    │   ├── 📂 lib/                 # Utilidades y configuración
    │   │   └── api.ts              # Cliente de API (axios)
    │   │
    │   ├── 📂 types/               # Tipos TypeScript
    │   │   └── index.ts            # Tipos compartidos
    │   │
    │   ├── 📄 App.tsx              # Componente raíz
    │   ├── 📄 main.tsx             # Punto de entrada
    │   └── 📄 index.css            # Estilos globales
    │
    ├── 📂 public/
    │   ├── 📄 vite.svg             # Logo de Vite
    │   ├── 📄 favicon.svg          # Favicon
    │   └── 📄 PWA_IMAGES.md        # Instrucciones para PWA
    │
    ├── 📄 index.html
    ├── 📄 package.json
    ├── 📄 tsconfig.json
    ├── 📄 tsconfig.node.json
    ├── 📄 vite.config.ts           # Configuración de Vite + PWA
    ├── 📄 tailwind.config.js       # Configuración de Tailwind
    ├── 📄 postcss.config.js        # Configuración de PostCSS
    ├── 📄 .eslintrc.cjs            # Configuración de ESLint
    └── 📄 .env                     # Variables de entorno (crear)
```

## 🔑 Archivos Clave

### Backend

#### `server/src/index.ts`
- Punto de entrada del servidor Express
- Configuración de middleware (CORS, JSON)
- Registro de rutas
- Escucha en `0.0.0.0:3000` para acceso en red

#### `server/prisma/schema.prisma`
- Modelo de datos de la aplicación
- Tablas: User, Project, Section, Task, Label, TaskLabel
- Relaciones entre entidades

#### `server/src/services/aiService.ts`
- Integración con Google Gemini AI
- Procesamiento de lenguaje natural
- Ejecución de acciones (crear, modificar, eliminar tareas)

### Frontend

#### `client/src/App.tsx`
- Router principal
- Rutas públicas (login, register) y protegidas
- Redirecciones basadas en autenticación

#### `client/src/store/useStore.ts`
- Estado global con Zustand
- Stores: Auth, UI, TaskEditor, AI
- Persistencia con localStorage

#### `client/src/lib/api.ts`
- Cliente de API con axios
- Interceptores para autenticación
- Funciones para todas las operaciones CRUD

#### `client/vite.config.ts`
- Configuración de Vite
- Plugin PWA
- Proxy para desarrollo
- Host `0.0.0.0` para acceso en red

## 🗄️ Base de Datos

### Tablas Principales

**users**
- id, email, password (hash), nombre
- Relaciones: projects[], labels[]

**projects**
- id, nombre, color, orden, userId
- Relaciones: user, sections[], tasks[]

**sections**
- id, nombre, orden, projectId
- Relaciones: project, tasks[]

**tasks**
- id, titulo, descripcion, prioridad, fechaVencimiento
- completada, orden, projectId, sectionId, parentTaskId
- Relaciones: project, section, labels[], subTasks[], parentTask

**labels**
- id, nombre, color, userId
- Relaciones: user, tasks[] (through TaskLabel)

**task_labels** (tabla pivote)
- taskId, labelId
- Relaciones: task, label

## 🔐 Autenticación

1. Usuario se registra → contraseña hasheada con bcrypt
2. Login → verifica contraseña → genera JWT token
3. Token guardado en localStorage
4. Cada request incluye token en header: `Authorization: Bearer <token>`
5. Middleware verifica token en rutas protegidas

## 🤖 Sistema de IA

1. Usuario escribe comando en lenguaje natural
2. Frontend envía a `/api/ai/process`
3. Backend usa Gemini AI para interpretar
4. Respuesta: array de acciones con confianza y explicación
5. Frontend muestra acciones sugeridas
6. Usuario confirma o auto-ejecuta
7. Acciones se ejecutan → BD actualizada → UI se refresca

## 🎨 Componentes Principales

### Sidebar
- Navegación: Inbox, Hoy, Próximos 7 días
- Lista de proyectos con contadores
- Lista de etiquetas

### TopBar
- Toggle sidebar
- Búsqueda rápida
- Botón nueva tarea
- Asistente IA
- Toggle tema oscuro/claro
- Info usuario y logout

### TaskList
- Lista de tareas con TaskItem
- Loading skeleton
- Mensaje vacío

### TaskItem
- Checkbox para completar
- Título y descripción
- Prioridad (P1-P4) con colores
- Fecha de vencimiento
- Etiquetas
- Contador de subtareas
- Click para editar

### TaskEditor (Modal)
- Formulario crear/editar tarea
- Campos: título, descripción, prioridad, fecha, proyecto, etiquetas
- Botón eliminar (si edita)
- Validación

### AIAssistant (Panel flotante)
- Input de comando
- Ejemplos de comandos
- Acciones sugeridas con confianza
- Resultados de ejecución
- Toggle auto-ejecutar

## 🔄 Flujo de Datos

1. **Autenticación**
   - Login → Token → localStorage → Zustand
   - Todas las requests incluyen token
   - Error 401 → logout automático

2. **Tareas**
   - React Query caché con refetch
   - Optimistic updates
   - Invalidación al mutar

3. **Estado Global**
   - Zustand para estado UI
   - React Query para datos del servidor
   - Persistencia selectiva con localStorage

## 🚀 Flujo de Desarrollo

1. **Iniciar DB**: PostgreSQL corriendo en localhost:5432
2. **Backend**: `cd server && npm run dev` → http://0.0.0.0:3000
3. **Frontend**: `cd client && npm run dev` → http://0.0.0.0:5173
4. **Desarrollo**: Hot reload en ambos
5. **Testing**: Abrir http://localhost:5173

## 📦 Build y Deploy

### Backend
```bash
cd server
npm run build      # Compila TypeScript a dist/
npm start          # Ejecuta desde dist/
```

### Frontend
```bash
cd client
npm run build      # Build de producción en dist/
npm run preview    # Preview del build
```

### Producción
- Backend: Node.js server con PM2 o similar
- Frontend: Servir dist/ con Nginx, Apache o servicio estático
- PostgreSQL: Instancia dedicada
- Variables de entorno: Configurar en servidor
- HTTPS: Certificado SSL (Let's Encrypt)

## 🔧 Configuración de Red Local

### Backend (server/.env)
```env
PORT=3000
# CORS permite frontend URL
FRONTEND_URL="http://192.168.1.100:5173"
```

### Frontend (client/.env)
```env
# Cambiar localhost por IP local
VITE_API_URL=http://192.168.1.100:3000/api
```

### Firewall
- Permitir puertos 3000 y 5173
- Windows: Windows Defender → Reglas entrantes
- Mac: Preferencias → Seguridad → Firewall
- Linux: ufw allow 3000, ufw allow 5173

## 📝 Próximos Pasos

Ver `README.md` sección "Próximas Características" para roadmap.

---

Este documento proporciona una visión completa de la arquitectura del proyecto TeamWorks.

