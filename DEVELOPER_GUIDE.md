# Guía Rápida para Desarrolladores

Referencia rápida para trabajar con el código de TeamWorks.

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone <repo-url>
cd TeamWorks

# Instalar dependencias
cd server && npm install
cd ../client && npm install

# Configurar variables de entorno
# Crear server/.env y client/.env según SETUP.md

# Iniciar base de datos (si usas Docker)
docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Configurar Prisma
cd server
npm run prisma:generate
npm run prisma:migrate

# Iniciar desarrollo
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

## 📂 Estructura del Código

### Backend (`/server`)

```
server/src/
├── controllers/      # Lógica de negocio por recurso
├── routes/          # Definición de endpoints
├── middleware/      # Middleware de autenticación
├── services/        # Servicios (ej: aiService.ts)
└── index.ts         # Punto de entrada
```

**Archivos Clave**:
- `services/aiService.ts`: Sistema de IA con Groq
- `controllers/taskController.ts`: CRUD de tareas
- `middleware/auth.ts`: Autenticación JWT

### Frontend (`/client`)

```
client/src/
├── components/      # Componentes React
├── pages/          # Páginas principales
├── store/          # Estado global (Zustand)
├── lib/            # Utilidades (api.ts)
├── types/          # Tipos TypeScript
└── hooks/          # Custom hooks
```

**Archivos Clave**:
- `lib/api.ts`: Cliente de API con axios
- `store/useStore.ts`: Stores de Zustand
- `components/AIAssistant.tsx`: UI del asistente de IA

## 🛠️ Comandos Útiles

### Backend

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar producción
npm start

# Prisma
npm run prisma:generate   # Generar cliente
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio (DB GUI)

# Audit de seguridad
npm audit --production
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🔧 Añadir Nueva Funcionalidad

### 1. Añadir Endpoint al Backend

**Ejemplo**: Añadir endpoint para marcar todas las tareas como leídas

```typescript
// server/src/controllers/taskController.ts
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const result = await prisma.task.updateMany({
      where: {
        project: { userId },
        completada: false
      },
      data: {
        // tu lógica aquí
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
};

// server/src/routes/taskRoutes.ts
router.post('/mark-all-read', auth, markAllAsRead);
```

### 2. Añadir Función al API Client

```typescript
// client/src/lib/api.ts
export const markAllTasksAsRead = async (): Promise<any> => {
  const response = await api.post('/tasks/mark-all-read');
  return response.data;
};
```

### 3. Usar en Componente React

```typescript
// client/src/components/SomeComponent.tsx
import { markAllTasksAsRead } from '../lib/api';

function SomeComponent() {
  const handleMarkAll = async () => {
    try {
      await markAllTasksAsRead();
      // Actualizar UI, mostrar toast, etc.
    } catch (error) {
      console.error(error);
    }
  };
  
  return <button onClick={handleMarkAll}>Mark All Read</button>;
}
```

## 🤖 Extender el Sistema de IA

### Añadir Nuevo Tipo de Acción

**1. Actualizar interfaz en `aiService.ts`**:

```typescript
export interface AIAction {
  type: 'create' | 'update' | 'delete' | ... | 'tu_nuevo_tipo';
  // ...
}
```

**2. Añadir ejemplo en el prompt**:

```typescript
const prompt = `
...
15. "tu comando de ejemplo"
{
  "actions": [{
    "type": "tu_nuevo_tipo",
    "entity": "task",
    "data": { ... },
    "confidence": 0.9,
    "explanation": "..."
  }]
}
`;
```

**3. Implementar handler en `executeAIActions`**:

```typescript
case 'tu_nuevo_tipo':
  if (action.entity === 'task') {
    // Tu lógica aquí
    result = await prisma.task...
  }
  break;
```

## 🗄️ Trabajar con la Base de Datos

### Crear Nueva Migración

```bash
# Editar server/prisma/schema.prisma
# Luego ejecutar:
cd server
npm run prisma:migrate
# Prisma te pedirá un nombre para la migración
```

### Queries Comunes con Prisma

```typescript
// Buscar con relaciones
const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: {
    labels: {
      include: {
        label: true
      }
    },
    comments: true,
    reminders: true
  }
});

// Crear con relaciones
const task = await prisma.task.create({
  data: {
    titulo: 'Nueva tarea',
    project: { connect: { id: projectId } },
    labels: {
      create: [
        { label: { connect: { id: labelId } } }
      ]
    }
  }
});

// Update many
await prisma.task.updateMany({
  where: { completada: true },
  data: { archived: true }
});
```

## 🎨 Añadir Nuevos Componentes React

### Estructura Recomendada

```typescript
// client/src/components/MiComponente.tsx
import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface MiComponenteProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}

export function MiComponente({ prop1, prop2 = 0, onAction }: MiComponenteProps) {
  const [state, setState] = useState('');

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-semibold">{prop1}</h2>
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <Save className="w-4 h-4 inline mr-2" />
        Guardar
      </button>
    </div>
  );
}
```

## 🔐 Autenticación

### Verificar Usuario en Backend

```typescript
// El middleware auth ya inyecta userId en req
import { auth } from '../middleware/auth';

router.get('/protected', auth, async (req, res) => {
  const userId = (req as any).userId;
  // userId está disponible
});
```

### Verificar en Frontend

```typescript
// El token se guarda automáticamente en localStorage
// Verificar si usuario está autenticado:
import { useStore } from '../store/useStore';

function MyComponent() {
  const { user, token } = useStore();
  
  if (!user) {
    return <div>No autenticado</div>;
  }
  
  return <div>Bienvenido {user.nombre}</div>;
}
```

## 📝 Logging y Debugging

### Backend

```typescript
// Usar console.log en desarrollo
console.log('Debug:', data);

// Para producción, considera usar un logger como winston
```

### Frontend

```typescript
// React Query DevTools (ya incluido)
// Se muestra automáticamente en desarrollo

// Ver estado de Zustand
import { useStore } from '../store/useStore';
console.log('Store state:', useStore.getState());
```

### Debugging en VS Code

**Backend**:
Crea `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server/src/index.ts",
      "preLaunchTask": "npm: dev",
      "outFiles": ["${workspaceFolder}/server/dist/**/*.js"],
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/server"
    }
  ]
}
```

**Frontend**:
1. Abre DevTools del navegador (F12)
2. Usa la pestaña Sources para poner breakpoints
3. O usa `debugger;` en tu código

**Tests**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/server/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "cwd": "${workspaceFolder}/server"
}
```

### Common Debugging Tips

**Backend no arranca**:
```bash
# Verificar puerto 3000
lsof -ti:3000 | xargs kill

# Verificar variables de entorno
cat server/.env

# Verificar logs
cd server && npm run dev
```

**Frontend no se conecta**:
```bash
# Verificar que backend esté corriendo
curl http://localhost:3000/health

# Verificar VITE_API_URL
cat client/.env

# Limpiar caché y reinstalar
cd client
rm -rf node_modules package-lock.json dist
npm install
npm run dev
```

**Base de datos no conecta**:
```bash
# Docker
docker ps | grep postgres
docker logs teamworks-db

# Local
psql -U postgres -d teamworks -c "SELECT 1"

# Regenerar Prisma Client
cd server
npm run prisma:generate
```

**Tests fallan**:
```bash
# Backend
cd server
npm test -- --verbose

# Frontend
cd client
npm test -- --run
```


## 🧪 Testing (Futuro)

### Configuración de Testing

TeamWorks utiliza:
- **Backend**: Jest + Supertest para tests unitarios e integración
- **Frontend**: Vitest + React Testing Library para tests de componentes

### Backend Testing

```bash
cd server

# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

**Escribir un test de controlador**:
```typescript
// server/src/controllers/__tests__/taskController.test.ts
import { getTasks } from '../taskController';
import { Request, Response } from 'express';

describe('TaskController', () => {
  it('debería retornar todas las tareas', async () => {
    const req = { userId: 'test-user' } as any;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    } as any;
    
    await getTasks(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
```

### Frontend Testing

```bash
cd client

# Ejecutar todos los tests
npm test

# Ejecutar en modo watch (con UI)
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

**Escribir un test de componente**:
```typescript
// client/src/components/__tests__/TaskItem.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { describe, it, expect } from 'vitest';

describe('TaskItem', () => {
  it('debería renderizar el título', () => {
    const task = { id: '1', titulo: 'Test' };
    render(<TaskItem task={task} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

Ver [TESTING.md](../TESTING.md) para guía completa de testing.


## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Query Docs](https://tanstack.com/query/latest)
- [Groq API Docs](https://console.groq.com/docs)

## 💡 Best Practices

### Código Limpio

**Nombres descriptivos**:
```typescript
// ✅ Bien
const userAuthToken = generateAuthToken(user);

// ❌ Evitar
const uat = genTok(u);
```

**Funciones pequeñas y enfocadas**:
```typescript
// ✅ Bien: Una responsabilidad
function calculatePriority(task: Task): number {
  const map = { P1: 4, P2: 3, P3: 2, P4: 1 };
  return map[task.prioridad] || 0;
}

// ❌ Evitar: Hace demasiadas cosas
function processTask(task: Task) {
  // 100 líneas con múltiples responsabilidades
}
```

**Manejo de errores**:
```typescript
// ✅ Bien: Errores específicos
try {
  await createTask(data);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Tarea duplicada');
    }
  }
  throw new Error('Error al crear tarea');
}

// ❌ Evitar: Catch silencioso
try {
  await createTask(data);
} catch (error) {
  // No hace nada
}
```

### Seguridad

**Validar inputs**:
```typescript
// ✅ Bien
if (!titulo || titulo.length < 1) {
  throw new Error('Título requerido');
}

// Sanitizar datos de usuario
const sanitizedTitulo = titulo.trim();
```

**No exponer información sensible**:
```typescript
// ✅ Bien
res.status(401).json({ error: 'Credenciales inválidas' });

// ❌ Evitar
res.status(401).json({ error: 'Usuario no existe' }); // Info leak
```

### Performance

**Optimizar queries**:
```typescript
// ✅ Bien: Include solo lo necesario
const task = await prisma.task.findUnique({
  where: { id },
  include: { labels: true }
});

// ❌ Evitar: Include todo sin necesidad
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    labels: true,
    comments: true,
    reminders: true,
    subTasks: { include: { subTasks: true } }
  }
});
```

**Usar paginación**:
```typescript
// ✅ Bien
const tasks = await prisma.task.findMany({
  skip: (page - 1) * limit,
  take: limit
});

// ❌ Evitar: Cargar todo
const tasks = await prisma.task.findMany();
```

### TypeScript

**Tipos explícitos**:
```typescript
// ✅ Bien
interface CreateTaskInput {
  titulo: string;
  descripcion?: string;
  prioridad: 'P1' | 'P2' | 'P3' | 'P4';
}

function createTask(data: CreateTaskInput): Promise<Task> {
  // ...
}

// ❌ Evitar
function createTask(data: any): any {
  // ...
}
```

### Git

**Commits descriptivos**:
```bash
# ✅ Bien
git commit -m "feat: añadir filtro por etiqueta en tareas

Implementa endpoint GET /api/tasks/by-label/:id
que permite filtrar tareas por etiqueta."

# ❌ Evitar
git commit -m "cambios"
```

**Branches con nombres claros**:
```bash
# ✅ Bien
feature/task-filter-by-label
fix/auth-token-expiration

# ❌ Evitar
test
temp
```

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para más guías de estilo.


## 🆘 Solución de Problemas

### Puerto ya en uso
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill

# O cambiar puerto en server/.env
PORT=3001
```

### Error de Prisma Client
```bash
cd server
npm run prisma:generate
```

### Base de datos no conecta
```bash
# Verificar que PostgreSQL esté corriendo
# Docker:
docker ps | grep postgres

# Local:
psql -U postgres -c "SELECT 1"
```

### Frontend no carga datos
```bash
# Verificar VITE_API_URL en client/.env
# Verificar que backend esté corriendo
curl http://localhost:3000/health
```

---

**Mantenido por**: Equipo de Desarrollo TeamWorks  
**Última Actualización**: 17 de Octubre de 2025
