# Sistema de Suscripción a Tareas - Documentación

## 📋 Resumen

Este documento describe la implementación del sistema de suscripción a tareas que resuelve el problema de notificaciones inconsistentes donde los usuarios recibían notificaciones de sus propias acciones.

## 🎯 Problema Identificado

**Antes del cambio:**
- Los usuarios recibían notificaciones de sus propias acciones (crear tarea, completar tarea, crear proyecto, etc.)
- No tenía sentido notificar al usuario sobre algo que él mismo acababa de hacer
- Las notificaciones no diferenciaban entre el actor y los observadores interesados

**Ejemplo del problema:**
- Usuario crea una tarea → Recibe notificación "Has creado la tarea X" ❌
- Usuario completa una tarea → Recibe notificación "Has completado la tarea X" ❌
- Usuario crea un proyecto → Recibe notificación "Has creado el proyecto X" ❌

## ✅ Solución Implementada

### Concepto Principal: Sistema de Suscripción

1. **Suscripción a Tareas**: Los usuarios pueden suscribirse a tareas para recibir actualizaciones
2. **Auto-suscripción del Creador**: El creador de una tarea se suscribe automáticamente
3. **Notificaciones Solo a Suscriptores**: Solo los usuarios suscritos reciben notificaciones
4. **Exclusión del Actor**: El usuario que realiza la acción NO recibe notificación

### Flujo de Notificaciones

**Nuevo flujo:**
1. Usuario A crea una tarea → Se suscribe automáticamente
2. Usuario B se suscribe manualmente a la tarea
3. Usuario A completa la tarea → Solo Usuario B recibe notificación ✅
4. Usuario B comenta en la tarea → Solo Usuario A recibe notificación ✅

## 🏗️ Arquitectura

### Base de Datos

#### Nuevo Modelo: TaskSubscription

```prisma
model TaskSubscription {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@map("task_subscriptions")
  @@index([taskId])
  @@index([userId])
}
```

#### Cambio en Modelo Task

```prisma
model Task {
  // ... campos existentes
  createdBy       String    // Nuevo: ID del creador
  subscribers     TaskSubscription[]  // Nuevo: relación con suscriptores
}
```

### Backend (Node.js + Express)

#### Servicios Nuevos/Modificados

**`taskSubscriptionService.ts`** - Nuevo servicio
```typescript
- subscribe(taskId, userId): Suscribir usuario a tarea
- unsubscribe(taskId, userId): Desuscribir usuario
- isSubscribed(taskId, userId): Verificar suscripción
- getSubscribers(taskId): Obtener todos los suscriptores
- getUserSubscriptions(userId): Obtener suscripciones del usuario
- autoSubscribeCreator(taskId, creatorId): Auto-suscribir creador
```

**`notificationService.ts`** - Método nuevo
```typescript
- createForTaskSubscribers(taskId, actorUserId, notificationData):
    Crea notificaciones para todos los suscriptores excepto el actor
```

#### Controladores Actualizados

**`taskController.ts`**
- ✅ Añade `createdBy` al crear tareas
- ✅ Auto-suscribe al creador
- ✅ Notifica a suscriptores (no al actor) cuando se completa una tarea

**`commentController.ts`**
- ✅ Notifica a suscriptores (no al autor del comentario) en nuevos comentarios

**`projectController.ts`**
- ✅ Eliminadas notificaciones de creación de proyecto/sección (eran auto-notificaciones)

**`aiController.ts`**
- ✅ Eliminadas notificaciones de acciones de IA (eran auto-notificaciones)

#### Nuevas Rutas API

```
POST   /api/tasks/:taskId/subscribe        - Suscribirse a tarea
DELETE /api/tasks/:taskId/subscribe        - Desuscribirse
GET    /api/tasks/:taskId/subscription     - Verificar estado de suscripción
GET    /api/subscriptions                  - Obtener suscripciones del usuario
```

### Frontend (React + TypeScript)

#### Componentes Nuevos

**`TaskSubscriptionButton.tsx`**
- Botón toggle para suscribirse/desuscribirse
- Muestra estado visual (Bell/BellOff)
- Indicador de carga durante operaciones
- Toast notifications para feedback

**Uso del componente:**
```tsx
<TaskSubscriptionButton taskId={task.id} />
```

#### API Client

**`taskSubscriptionApi.ts`**
- Cliente HTTP para endpoints de suscripción
- Autenticación incluida via token JWT

#### Integración UI

**`TaskDetailView.tsx`**
- Botón de suscripción añadido en header junto a botones de editar/cerrar
- Se muestra en vista detalle de tarea

## 📝 Migración de Base de Datos

### Archivo de Migración

Ubicación: `server/migrations/add_task_subscriptions.sql`

### Pasos de la Migración

1. **Añadir columna `createdBy`** a tabla `tasks`
2. **Poblar datos existentes**: Asignar creador basado en dueño del proyecto
3. **Crear tabla `task_subscriptions`** con constraints e índices
4. **Auto-suscribir creadores**: Suscribir automáticamente a todos los creadores de tareas existentes

### Aplicar Migración

```bash
# Opción 1: Usar Prisma (recomendado)
cd server
npm run prisma:generate
npm run prisma:migrate

# Opción 2: Aplicar SQL directamente
psql -U postgres -d teamworks -f migrations/add_task_subscriptions.sql
```

## 🧪 Testing

### Casos de Prueba

1. **Suscripción básica**
   - Usuario se suscribe a tarea → OK
   - Usuario se desuscribe → OK
   - Intento de doble suscripción → Manejado correctamente

2. **Notificaciones**
   - Usuario A crea tarea → No recibe notificación ✅
   - Usuario B comenta → Usuario A recibe notificación ✅
   - Usuario A completa tarea → Usuario B recibe notificación ✅

3. **Auto-suscripción**
   - Al crear tarea → Creador queda automáticamente suscrito ✅

### Testing Manual

```bash
# 1. Iniciar backend
cd server
npm run dev

# 2. Iniciar frontend
cd client
npm run dev

# 3. Pruebas en navegador
# - Crear una tarea
# - Verificar que aparece botón de suscripción
# - Toggle suscripción
# - Crear comentario desde otro usuario
# - Verificar que solo los suscriptores (excepto actor) reciben notificación
```

## 🔧 Configuración

No se requiere configuración adicional. El sistema usa la configuración existente:

- **Base de datos**: PostgreSQL (configurada en `.env`)
- **Autenticación**: JWT (existente)
- **SSE**: Server-Sent Events (existente)

## 🚀 Despliegue

### Pasos para Producción

1. **Backup de base de datos**
   ```bash
   pg_dump teamworks > backup_before_subscription.sql
   ```

2. **Aplicar migración**
   ```bash
   cd server
   npm run prisma:migrate
   ```

3. **Build y deploy**
   ```bash
   # Backend
   cd server
   npm run build
   npm start

   # Frontend
   cd client
   npm run build
   ```

4. **Verificar funcionalidad**
   - Probar suscripción/desuscripción
   - Verificar notificaciones
   - Revisar logs del servidor

## 📊 Análisis de Impacto

### Cambios en Comportamiento de Usuario

| Acción | Antes | Después |
|--------|-------|---------|
| Crear tarea | ❌ Notificación propia | ✅ Sin notificación |
| Completar tarea | ❌ Notificación propia | ✅ Notifica a suscriptores |
| Comentar | ❌ Notifica al dueño proyecto | ✅ Notifica a suscriptores |
| Crear proyecto | ❌ Notificación propia | ✅ Sin notificación |

### Beneficios

- ✅ **Menos ruido**: Usuarios solo ven notificaciones relevantes
- ✅ **Control**: Usuarios eligen qué tareas seguir
- ✅ **Lógico**: No hay auto-notificaciones
- ✅ **Colaboración**: Facilita seguimiento de tareas compartidas

## 🐛 Solución de Problemas

### Problema: Botón de suscripción no aparece

**Causa**: Componente no importado correctamente
**Solución**: Verificar import en TaskDetailView.tsx

### Problema: Error al suscribirse

**Causa**: Migración no aplicada
**Solución**: 
```bash
cd server
npm run prisma:migrate
```

### Problema: Notificaciones duplicadas

**Causa**: Usuario suscrito múltiples veces
**Solución**: La constraint UNIQUE previene esto. Si ocurre, limpiar:
```sql
DELETE FROM task_subscriptions 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM task_subscriptions 
  GROUP BY "taskId", "userId"
);
```

## 📈 Mejoras Futuras

### Fase 2 (Sugerencias)

1. **Suscripción masiva**: Suscribirse a todas las tareas de un proyecto
2. **Notificaciones configurables**: Elegir qué tipos de eventos notificar
3. **Niveles de suscripción**: Básico, completo, solo menciones
4. **Panel de suscripciones**: Vista centralizada de todas las suscripciones
5. **Suscripción por etiqueta**: Seguir tareas con etiquetas específicas

## 🔗 Referencias

- **Prisma Schema**: `server/prisma/schema.prisma`
- **Migración SQL**: `server/migrations/add_task_subscriptions.sql`
- **Servicio Suscripciones**: `server/src/services/taskSubscriptionService.ts`
- **Componente UI**: `client/src/components/TaskSubscriptionButton.tsx`

---

**Versión**: 1.0.0  
**Fecha**: 2025-01-23  
**Autor**: GitHub Copilot Agent
