# Guía de Testing - TeamWorks

**Última Actualización**: 17 de Octubre de 2025

Esta guía cubre cómo ejecutar tests y crear nuevos tests para el proyecto TeamWorks.

---

## 📋 Tabla de Contenidos

1. [Configuración de Testing](#configuración-de-testing)
2. [Backend Testing (Jest)](#backend-testing-jest)
3. [Frontend Testing (Vitest)](#frontend-testing-vitest)
4. [Tests E2E](#tests-e2e)
5. [Cobertura de Código](#cobertura-de-código)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🔧 Configuración de Testing

### Instalar Dependencias de Testing

#### Backend (Jest)
```bash
cd server
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

#### Frontend (Vitest)
```bash
cd client
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## 🧪 Backend Testing (Jest)

### Configuración

El archivo `server/jest.config.js` está configurado para usar `ts-jest` y ejecutar tests en archivos `.test.ts` y `.spec.ts`.

### Ejecutar Tests

```bash
cd server

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

### Estructura de Tests

```
server/
├── src/
│   ├── controllers/
│   │   └── taskController.test.ts
│   ├── services/
│   │   └── aiService.test.ts
│   └── middleware/
│       └── auth.test.ts
└── __tests__/
    ├── integration/
    │   └── tasks.integration.test.ts
    └── unit/
        └── dateParser.test.ts
```

### Ejemplo de Test de Controlador

```typescript
// server/src/controllers/taskController.test.ts
import { getTasks, createTask } from './taskController';
import { Request, Response } from 'express';

describe('TaskController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      userId: 'test-user-id',
      body: {}
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });
  
  describe('getTasks', () => {
    it('debería retornar todas las tareas del usuario', async () => {
      await getTasks(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
  
  describe('createTask', () => {
    it('debería crear una nueva tarea', async () => {
      mockRequest.body = {
        titulo: 'Test Task',
        projectId: 'project-id'
      };
      
      await createTask(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Test Task' })
      );
    });
  });
});
```

### Ejemplo de Test de Integración

```typescript
// server/__tests__/integration/tasks.integration.test.ts
import request from 'supertest';
import app from '../../src/index';

describe('Tasks API Integration', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Login para obtener token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.token;
  });
  
  describe('POST /api/tasks', () => {
    it('debería crear una nueva tarea', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titulo: 'Integration Test Task',
          projectId: 'inbox-project-id'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.titulo).toBe('Integration Test Task');
    });
  });
  
  describe('GET /api/tasks', () => {
    it('debería retornar todas las tareas', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

### Mock de Prisma

```typescript
// server/__mocks__/prisma.ts
const mockPrisma = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn()
  }
};

export default mockPrisma;
```

---

## ⚛️ Frontend Testing (Vitest)

### Configuración

El archivo `client/vite.config.ts` incluye configuración para Vitest.

### Ejecutar Tests

```bash
cd client

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage
```

### Estructura de Tests

```
client/
└── src/
    ├── components/
    │   └── TaskItem.test.tsx
    ├── hooks/
    │   └── useKeyboardShortcuts.test.ts
    ├── lib/
    │   └── api.test.ts
    └── __tests__/
        └── utils.test.ts
```

### Ejemplo de Test de Componente

```typescript
// client/src/components/TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from './TaskItem';
import { describe, it, expect, vi } from 'vitest';

describe('TaskItem', () => {
  const mockTask = {
    id: '1',
    titulo: 'Test Task',
    completada: false,
    prioridad: 'P1',
    project: { id: 'proj-1', nombre: 'Test Project' }
  };
  
  it('debería renderizar el título de la tarea', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('debería llamar onToggle al hacer click en checkbox', () => {
    const onToggle = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onToggle).toHaveBeenCalledWith(mockTask.id);
  });
  
  it('debería aplicar clase correcta según prioridad', () => {
    const { container } = render(<TaskItem task={mockTask} />);
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });
});
```

### Ejemplo de Test de Hook

```typescript
// client/src/hooks/useKeyboardShortcuts.test.ts
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { describe, it, expect, vi } from 'vitest';

describe('useKeyboardShortcuts', () => {
  it('debería ejecutar callback al presionar Cmd+K', () => {
    const onNewTask = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewTask }));
    
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true
    });
    
    window.dispatchEvent(event);
    expect(onNewTask).toHaveBeenCalled();
  });
});
```

### Mock de React Query

```typescript
// client/src/__tests__/utils/queryClientWrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const QueryWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

---

## 🔄 Tests E2E

### Con Playwright (Recomendado)

```bash
cd client
npm install --save-dev @playwright/test
npx playwright install
```

### Ejemplo de Test E2E

```typescript
// client/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });
  
  test('debería crear una nueva tarea', async ({ page }) => {
    await page.click('[aria-label="Nueva tarea"]');
    await page.fill('input[name="titulo"]', 'Test Task E2E');
    await page.click('button:has-text("Crear")');
    
    await expect(page.locator('text=Test Task E2E')).toBeVisible();
  });
  
  test('debería completar una tarea', async ({ page }) => {
    const taskCheckbox = page.locator('input[type="checkbox"]').first();
    await taskCheckbox.click();
    
    await expect(taskCheckbox).toBeChecked();
  });
});
```

---

## 📊 Cobertura de Código

### Backend

```bash
cd server
npm run test:coverage

# Ver reporte HTML
open coverage/lcov-report/index.html
```

### Frontend

```bash
cd client
npm run test:coverage

# Ver reporte HTML
open coverage/index.html
```

### Objetivos de Cobertura

- **Mínimo**: 70% en todos los archivos
- **Ideal**: 80-90% en lógica crítica
- **Controllers**: 80%+
- **Services (IA)**: 90%+
- **Componentes UI**: 70%+

---

## ✅ Mejores Prácticas

### 1. Estructura AAA (Arrange-Act-Assert)

```typescript
it('debería hacer X', () => {
  // Arrange: Preparar datos y mocks
  const input = 'test';
  const expected = 'TEST';
  
  // Act: Ejecutar la función
  const result = myFunction(input);
  
  // Assert: Verificar resultado
  expect(result).toBe(expected);
});
```

### 2. Un Concepto por Test

```typescript
// ❌ Mal: Múltiples assertions no relacionadas
it('debería funcionar', () => {
  expect(createTask()).toBeDefined();
  expect(deleteTask()).toBe(true);
  expect(updateTask()).toHaveProperty('id');
});

// ✅ Bien: Un concepto por test
it('debería crear una tarea', () => {
  expect(createTask()).toBeDefined();
});

it('debería eliminar una tarea', () => {
  expect(deleteTask()).toBe(true);
});
```

### 3. Nombres Descriptivos

```typescript
// ❌ Mal
it('test 1', () => { /* ... */ });

// ✅ Bien
it('debería retornar error 401 si el token es inválido', () => { /* ... */ });
```

### 4. Evitar Implementación en Tests

```typescript
// ❌ Mal: Replicando lógica de negocio
it('debería calcular precio', () => {
  const price = item.price * 1.21; // IVA
  expect(calculateTotal(item)).toBe(price);
});

// ✅ Bien: Verificar comportamiento esperado
it('debería aplicar IVA de 21% al precio', () => {
  const item = { price: 100 };
  expect(calculateTotal(item)).toBe(121);
});
```

### 5. Limpiar Después de Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 6. Tests Independientes

Cada test debe poder ejecutarse solo o en cualquier orden:

```typescript
// ❌ Mal: Test depende de estado previo
let taskId: string;

it('debería crear tarea', async () => {
  const task = await createTask({ titulo: 'Test' });
  taskId = task.id; // Guardando estado
});

it('debería eliminar tarea', async () => {
  await deleteTask(taskId); // Usando estado del test anterior
});

// ✅ Bien: Tests independientes
it('debería crear tarea', async () => {
  const task = await createTask({ titulo: 'Test' });
  expect(task).toBeDefined();
});

it('debería eliminar tarea', async () => {
  const task = await createTask({ titulo: 'Test' });
  const result = await deleteTask(task.id);
  expect(result).toBe(true);
});
```

---

## 🐛 Debugging Tests

### Jest Debugging (Backend)

```bash
# Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Vitest Debugging (Frontend)

```bash
# En package.json, añadir:
"test:debug": "vitest --inspect-brk --single-thread"

# Ejecutar
npm run test:debug
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest](https://github.com/visionmedia/supertest)

---

## 🔄 CI/CD Integration

Ver `.github/workflows/test.yml` para configuración de tests en GitHub Actions.

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd server && npm ci
      
      - name: Run Backend Tests
        run: cd server && npm test
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test
      
      - name: Install Frontend Dependencies
        run: cd client && npm ci
      
      - name: Run Frontend Tests
        run: cd client && npm test
```

---

**Mantenido por**: Equipo de Desarrollo TeamWorks  
**Última Actualización**: 17 de Octubre de 2025
