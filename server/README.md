# TeamWorks Server

Backend de la aplicación TeamWorks - Sistema de gestión de tareas con IA.

## Tecnologías

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Google Gemini AI

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:

Crear archivo `.env` en la raíz del servidor:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/teamworks?schema=public"
JWT_SECRET="tu-secreto-super-secreto-cambialo"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
GROQ_API_KEY="tu-api-key-de-groq"
FRONTEND_URL="http://localhost:5173"
```

3. Configurar base de datos:

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

## Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://0.0.0.0:3000` y será accesible desde la red local.

## Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Proyectos
- `GET /api/projects` - Listar proyectos
- `GET /api/projects/:id` - Obtener proyecto
- `POST /api/projects` - Crear proyecto
- `PATCH /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto

### Secciones
- `POST /api/projects/:projectId/sections` - Crear sección
- `PATCH /api/projects/sections/:id` - Actualizar sección
- `DELETE /api/projects/sections/:id` - Eliminar sección

### Tareas
- `GET /api/tasks` - Listar tareas (con filtros)
- `GET /api/tasks/:id` - Obtener tarea
- `POST /api/tasks` - Crear tarea
- `PATCH /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `POST /api/tasks/:id/toggle` - Cambiar estado completada

### Etiquetas
- `GET /api/labels` - Listar etiquetas
- `GET /api/labels/:id` - Obtener etiqueta
- `POST /api/labels` - Crear etiqueta
- `PATCH /api/labels/:id` - Actualizar etiqueta
- `DELETE /api/labels/:id` - Eliminar etiqueta

### IA
- `POST /api/ai/process` - Procesar comando en lenguaje natural
- `POST /api/ai/execute` - Ejecutar acciones de IA

## Obtener API Key de Groq (GRATIS)

1. Ve a [Groq Console](https://console.groq.com)
2. Crea una cuenta (gratis)
3. Ve a "API Keys"
4. Crea una nueva API key
5. Copia la key y pégala en el archivo `.env` como `GROQ_API_KEY`

Groq es completamente gratuito y usa Llama 3 - muy rápido y potente.

## Base de datos

El proyecto usa PostgreSQL. Para instalarlo localmente:

### Windows
- Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- O usar Docker: `docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

Crear base de datos:
```bash
createdb teamworks
```

## Acceso en Red Local

El servidor está configurado para escuchar en `0.0.0.0`, lo que permite acceso desde otros dispositivos en la red local.

Para acceder desde otro dispositivo:
1. Obtén tu IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Accede desde otro dispositivo a `http://TU_IP:3000`

Asegúrate de que el firewall permita conexiones en el puerto 3000.

