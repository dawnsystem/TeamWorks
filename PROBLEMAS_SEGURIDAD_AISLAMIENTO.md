# Problemas de Seguridad y Aislamiento de Datos - TeamWorks

**Fecha:** 2025-01-27  
**Tipo:** Vulnerabilidades de Seguridad CRÍTICAS  
**Analizador:** Project Manager Agent

---

## 🔴 VULNERABILIDADES CRÍTICAS DE SEGURIDAD

### 1. `getCommentsByTask` - ACCESO NO AUTORIZADO A COMENTARIOS

**Problema CRÍTICO:**
- ❌ **NO verifica que la tarea pertenezca al usuario**
- ❌ Cualquier usuario puede ver comentarios de tareas de otros usuarios
- Solo requiere conocer el `taskId` de otra persona

**Código vulnerable:**
```typescript
// commentController.ts - línea 15
const comments = await prisma.comment.findMany({
  where: { taskId }, // ← Solo filtra por taskId, NO por userId del proyecto
  // ...
});
```

**Impacto:**
- 🔴 **Fuga de información**: Ver comentarios privados de otros usuarios
- 🔴 **Violación de privacidad**: Acceso a datos sensibles
- 🔴 **Posible explotación**: Enumeración de tareas mediante comentarios

**Archivos afectados:**
- `server/src/controllers/commentController.ts` (línea 11-34)

**Solución:**
```typescript
export const getCommentsByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    // Verificar que la tarea pertenece al usuario
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
        task: {
          project: { userId } // ← Asegurar que la tarea pertenece al usuario
        }
      },
      // ...
    });
    // ...
  }
};
```

---

### 2. `getRemindersByTask` - ACCESO NO AUTORIZADO A RECORDATORIOS

**Problema CRÍTICO:**
- ❌ **NO verifica que la tarea pertenezca al usuario**
- ❌ Cualquier usuario puede ver recordatorios de tareas de otros usuarios

**Código vulnerable:**
```typescript
// reminderController.ts - línea 11
const reminders = await prisma.reminder.findMany({
  where: { taskId }, // ← Solo filtra por taskId
  // ...
});
```

**Impacto:**
- 🔴 **Fuga de información**: Ver recordatorios privados de otros usuarios
- 🔴 **Información sensible**: Fechas, horarios de actividades personales
- 🔴 **Enumeración**: Descubrir tareas de otros usuarios

**Archivos afectados:**
- `server/src/controllers/reminderController.ts` (línea 7-21)

**Solución:**
```typescript
export const getRemindersByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    // Verificar que la tarea pertenece al usuario
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        taskId,
        task: {
          project: { userId }
        }
      },
      // ...
    });
    // ...
  }
};
```

---

### 3. `createReminder` - CREAR RECORDATORIOS EN TAREAS AJENAS

**Problema CRÍTICO:**
- ❌ **Verifica que la tarea existe pero NO que pertenezca al usuario**
- ❌ Cualquier usuario puede crear recordatorios en tareas de otros usuarios

**Código vulnerable:**
```typescript
// reminderController.ts - línea 39
const task = await prisma.task.findUnique({
  where: { id: taskId }, // ← NO verifica userId
});
```

**Impacto:**
- 🔴 **Manipulación de datos**: Crear recordatorios en tareas ajenas
- 🔴 **Spam/Abuso**: Llenar tareas de otros con recordatorios falsos
- 🔴 **Notificaciones no autorizadas**: Generar notificaciones para otros usuarios

**Archivos afectados:**
- `server/src/controllers/reminderController.ts` (línea 24-59)

**Solución:**
```typescript
// Verificar que la tarea pertenece al usuario
const task = await prisma.task.findFirst({
  where: {
    id: taskId,
    project: { userId: (req as AuthRequest).userId }
  }
});

if (!task) {
  return res.status(404).json({ message: 'Tarea no encontrada' });
}
```

---

### 4. `deleteReminder` - ELIMINAR RECORDATORIOS AJENOS

**Problema CRÍTICO:**
- ❌ **NO verifica que el recordatorio pertenezca a una tarea del usuario**
- ❌ Cualquier usuario puede eliminar recordatorios de otros usuarios

**Código vulnerable:**
```typescript
// reminderController.ts - línea 66
const reminder = await prisma.reminder.findUnique({
  where: { id }, // ← Solo busca por ID, NO verifica ownership
});
```

**Impacto:**
- 🔴 **Destrucción de datos**: Eliminar recordatorios importantes de otros usuarios
- 🔴 **Sabotaje**: Eliminar recordatorios críticos ajenos

**Archivos afectados:**
- `server/src/controllers/reminderController.ts` (línea 62-83)

**Solución:**
```typescript
export const deleteReminder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    // Verificar que el recordatorio pertenece a una tarea del usuario
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        task: {
          project: { userId }
        }
      }
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    await prisma.reminder.delete({
      where: { id }
    });
    // ...
  }
};
```

---

### 5. `createComment` - COMENTAR EN TAREAS AJENAS

**Problema CRÍTICO:**
- ❌ **NO verifica que la tarea pertenezca al usuario antes de crear comentario**
- ❌ Cualquier usuario puede comentar en tareas de otros usuarios
- ⚠️ **Nota**: El código actual obtiene información del proyecto después, pero no valida ANTES de crear

**Código vulnerable:**
```typescript
// commentController.ts - línea 51
const comment = await prisma.comment.create({
  data: {
    contenido: contenido.trim(),
    taskId, // ← NO verifica que task pertenezca al usuario
    userId,
  },
  // ...
});
```

**Impacto:**
- 🔴 **Manipulación de datos**: Comentar en tareas ajenas
- 🔴 **Spam/Abuso**: Llenar tareas de otros con comentarios
- 🔴 **Notificaciones no autorizadas**: Generar notificaciones para otros usuarios

**Archivos afectados:**
- `server/src/controllers/commentController.ts` (línea 37-119)

**Solución:**
```typescript
export const createComment = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { contenido } = req.body;
    const userId = (req as AuthRequest).userId;

    // Validación de formato ya realizada por middleware

    // Verificar que la tarea pertenece al usuario ANTES de crear comentario
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId }
      },
      include: {
        project: {
          select: {
            id: true,
            nombre: true,
            userId: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const comment = await prisma.comment.create({
      data: {
        contenido: contenido.trim(),
        taskId,
        userId,
      },
      // ...
    });
    // ...
  }
};
```

---

### 6. `updateComment` y `deleteComment` - Verificación Parcial

**Estado:** ⚠️ Parcialmente Seguro
- ✅ Verifican que el comentario pertenece al usuario (creador)
- ❌ NO verifican que la tarea pertenezca al usuario

**Análisis:**
- **updateComment**: Solo el creador puede editar → **Seguro** (aunque idealmente debería verificar también la tarea)
- **deleteComment**: Solo el creador puede eliminar → **Seguro** (aunque idealmente debería verificar también la tarea)

**Recomendación:**
Aunque funcionalmente seguros (solo el creador puede modificar), sería mejor también verificar que la tarea pertenezca al usuario para consistencia y defensa en profundidad.

---

## 🔍 ANÁLISIS DE MODELO DE DATOS

### Modelo Actual - Sin Compartir

**Estado:** ✅ **NO hay modelo de compartir implementado**
- ✅ No existe tabla `ProjectShare` o similar en schema.prisma
- ✅ Cada usuario tiene sus propios proyectos, tareas, labels
- ✅ No hay relaciones de colaboración en la BD

**Conclusión:** El modelo está diseñado para espacios de trabajo **completamente independientes**, pero la **implementación tiene vulnerabilidades** que permiten acceso cruzado.

---

## 📊 RESUMEN DE VULNERABILIDADES

### Vulnerabilidades CRÍTICAS: 5
1. 🔴 `getCommentsByTask` - Acceso no autorizado a comentarios
2. 🔴 `getRemindersByTask` - Acceso no autorizado a recordatorios
3. 🔴 `createReminder` - Crear recordatorios en tareas ajenas
4. 🔴 `deleteReminder` - Eliminar recordatorios ajenos
5. 🔴 `createComment` - Comentar en tareas ajenas

### Verificaciones Parciales: 2
6. ⚠️ `updateComment` - Seguro pero debería verificar tarea también
7. ⚠️ `deleteComment` - Seguro pero debería verificar tarea también

---

## 🎯 PRIORIDAD DE CORRECCIÓN

### CRÍTICA (Corregir INMEDIATAMENTE):
1. ⚠️ Corregir `getCommentsByTask` - Fuga de información
2. ⚠️ Corregir `getRemindersByTask` - Fuga de información
3. ⚠️ Corregir `createReminder` - Manipulación de datos
4. ⚠️ Corregir `deleteReminder` - Destrucción de datos
5. ⚠️ Corregir `createComment` - Manipulación de datos

### ALTA (Mejora de Seguridad):
6. 💡 Mejorar `updateComment` y `deleteComment` - Defensa en profundidad

---

## 🛡️ PATRÓN DE VERIFICACIÓN RECOMENDADO

Para todos los endpoints que acceden a recursos relacionados con tareas:

```typescript
// 1. Verificar ownership ANTES de cualquier operación
const task = await prisma.task.findFirst({
  where: {
    id: taskId,
    project: { userId: (req as AuthRequest).userId }
  }
});

if (!task) {
  return res.status(404).json({ message: 'Tarea no encontrada' });
}

// 2. Proceder con la operación solo si la verificación pasó
```

---

## 📝 NOTAS ADICIONALES

### Funcionalidad de Compartir - Estado Actual

**NO implementada:**
- No hay tabla para compartir proyectos
- No hay lógica de permisos de colaboración
- No hay endpoints para compartir/dejar de compartir
- **Por diseño**, cada usuario tiene su espacio independiente

**Cuando se implemente compartir:**
- Crear tabla `ProjectShare` o `ProjectCollaborator`
- Añadir campo `shared` o `isShared` en Project
- Modificar verificaciones para incluir usuarios colaboradores
- Implementar endpoints de gestión de compartir

---

## ✅ VERIFICACIONES CORRECTAS ENCONTRADAS

Estos controladores SÍ verifican correctamente la propiedad:

- ✅ `taskController.ts` - Todos los métodos verifican `project: { userId }`
- ✅ `projectController.ts` - Todos los métodos verifican `userId`
- ✅ `labelController.ts` - Todos los métodos verifican `userId`
- ✅ `templateController.ts` - Todos los métodos verifican `userId`
- ✅ `notificationController.ts` - Todos los métodos usan `userId` del servicio
- ✅ `taskSubscriptionController.ts` - Usa servicios que verifican ownership

**Problema:** Los recursos relacionados (comments, reminders) acceden directamente sin verificar la propiedad de la tarea padre.

---

**Fin del Reporte de Seguridad**

