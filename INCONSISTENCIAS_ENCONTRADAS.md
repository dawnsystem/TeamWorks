# Reporte de Inconsistencias del Proyecto TeamWorks

**Fecha de Análisis:** 2025-01-27  
**Analizador:** Project Manager Agent  
**Alcance:** Comparación entre Schema de BD (Prisma), Tipos TypeScript del Cliente, Schemas de Validación y Controladores

---

## 🔴 INCONSISTENCIAS CRÍTICAS

### 1. Campo `createdBy` en Task - FALTA EN TIPOS Y VALIDACIÓN

**Problema:**
- ✅ **Existe en BD** (`server/prisma/schema.prisma` línea 73): `createdBy String`
- ✅ **Se usa en controlador** (`server/src/controllers/taskController.ts` línea 267): `createdBy: userId`
- ❌ **NO existe en tipos del cliente** (`client/src/types/index.ts`)
- ❌ **NO está en schema de validación** (`server/src/validation/schemas.ts`)

**Impacto:**
- El frontend no puede acceder al campo `createdBy` aunque esté en la BD
- No hay validación del campo al crear tareas
- Los tipos TypeScript no reflejan la realidad de la base de datos

**Archivos afectados:**
- `server/prisma/schema.prisma` (línea 73)
- `server/src/controllers/taskController.ts` (línea 267)
- `client/src/types/index.ts` (interface Task)
- `server/src/validation/schemas.ts` (createTaskSchema)

**Solución recomendada:**
1. Añadir `createdBy?: string` a la interface `Task` en `client/src/types/index.ts`
2. Aunque `createdBy` se asigna automáticamente en el backend, considerar añadirlo a la validación como campo opcional (read-only)

---

### 2. Campo `labelIds` - FALTA EN SCHEMA DE VALIDACIÓN

**Problema:**
- ✅ **Se usa en controlador** (`server/src/controllers/taskController.ts` línea 232, 268, 316, 332)
- ✅ **Se usa en cliente** (`client/src/lib/api.ts` líneas 176, 179)
- ✅ **Se usa en componentes** (`client/src/components/TaskEditor.tsx`, `TaskItem.tsx`)
- ❌ **NO está en `createTaskSchema`** (`server/src/validation/schemas.ts`)
- ❌ **NO está en `updateTaskSchema`** (`server/src/validation/schemas.ts`)

**Impacto:**
- No hay validación de `labelIds` al crear/actualizar tareas
- El campo puede recibir valores inválidos sin ser validado
- Riesgo de inyección o datos corruptos si no se valida el formato

**Archivos afectados:**
- `server/src/validation/schemas.ts` (createTaskSchema, updateTaskSchema)
- `server/src/controllers/taskController.ts` (usa labelIds sin validación previa)

**Solución recomendada:**
```typescript
// En server/src/validation/schemas.ts
export const createTaskSchema = z.object({
  // ... campos existentes ...
  labelIds: z.array(z.string().uuid('ID de etiqueta inválido')).optional().default([]),
});

export const updateTaskSchema = z.object({
  // ... campos existentes ...
  labelIds: z.array(z.string().uuid('ID de etiqueta inválido')).optional(),
});
```

---

### 3. Schema `reorderTasksSchema` - NOMBRE INCONSISTENTE CON CONTROLADOR

**Problema:**
- ✅ **Schema de validación** (`server/src/validation/schemas.ts` línea 26): usa `updates` como nombre del array
- ❌ **Controlador** (`server/src/controllers/taskController.ts` línea 539): espera `taskUpdates` como nombre del campo

**Código actual:**
```typescript
// Schema de validación
export const reorderTasksSchema = z.object({
  updates: z.array(...)  // ← nombre: "updates"
});

// Controlador
const { taskUpdates } = req.body;  // ← espera: "taskUpdates"
```

**Impacto:**
- Si se usa el schema de validación, la validación fallará porque el nombre del campo no coincide
- La validación probablemente no se está aplicando en la ruta

**Archivos afectados:**
- `server/src/validation/schemas.ts` (línea 26-31)
- `server/src/controllers/taskController.ts` (línea 539)

**Solución recomendada:**
1. Cambiar el schema para usar `taskUpdates` en lugar de `updates`
2. O cambiar el controlador para usar `updates`
3. **Mejor opción:** Usar `taskUpdates` en ambos porque es más descriptivo

---

### 4. Schema `reorderTasksSchema` - CAMPOS INCOMPLETOS

**Problema:**
- ✅ **Schema de validación** (`server/src/validation/schemas.ts` línea 26-30): Solo valida `id` y `orden`
- ❌ **Controlador** (`server/src/controllers/taskController.ts` líneas 565-568): También usa `projectId`, `sectionId`, `parentTaskId`

**Código del controlador:**
```typescript
data: {
  orden: update.orden,
  ...(update.projectId && { projectId: update.projectId }),
  ...(update.sectionId !== undefined && { sectionId: update.sectionId }),
  ...(update.parentTaskId !== undefined && { parentTaskId: update.parentTaskId })
}
```

**Impacto:**
- No se validan estos campos adicionales que el controlador sí procesa
- Pueden llegar valores inválidos sin validación
- Los tipos TypeScript del cliente incluyen estos campos, pero la validación no

**Archivos afectados:**
- `server/src/validation/schemas.ts` (reorderTasksSchema)
- `server/src/controllers/taskController.ts` (reorderTasks)
- `client/src/lib/api.ts` (interface del reorder incluye estos campos)

**Solución recomendada:**
```typescript
export const reorderTasksSchema = z.object({
  taskUpdates: z.array(z.object({
    id: z.string().uuid(),
    orden: z.number().int().min(0),
    projectId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional().nullable(),
    parentTaskId: z.string().uuid().optional().nullable(),
  })).min(1, 'Debe proporcionar al menos una actualización'),
});
```

---

## 🟡 INCONSISTENCIAS MENORES

### 5. Campo `parentTaskId` en `updateTaskSchema` - FALTA

**Problema:**
- ✅ **Existe en BD** (Task schema)
- ✅ **Se usa en controlador** (`updateTask` puede actualizar parentTaskId indirectamente)
- ❌ **NO está en `updateTaskSchema`** de validación

**Impacto:**
- No se puede actualizar `parentTaskId` directamente mediante update
- Aunque esto podría ser intencional (cambiar parentTaskId podría requerir lógica especial)

**Nota:** Esto podría ser intencional ya que cambiar el parent de una tarea podría requerir lógica especial.

---

### 6. Interface `Task` en Cliente - Campos Opcionales vs Requeridos

**Problema:**
- La interface `Task` en el cliente tiene algunos campos como opcionales (`labels?`, `subTasks?`, etc.) que siempre vienen en las respuestas del backend
- No hay distinción entre campos que siempre vienen y campos que son opcionales

**Impacto:**
- Menor, pero puede causar confusión en el código del cliente

**Solución recomendada:**
- Crear tipos separados para Task completo vs Task básico, o documentar mejor qué campos siempre vienen

---

## 🟢 OBSERVACIONES Y MEJORAS SUGERIDAS

### 7. Validación de `fechaVencimiento` - Formato String vs DateTime

**Observación:**
- Schema de validación usa `z.string().datetime()`
- BD usa `DateTime`
- Cliente envía como string ISO

**Estado:** ✅ Consistente, pero podría mejorarse la validación del formato exacto

---

### 8. Campo `metadata` en Notification - Tipo Json

**Observación:**
- BD: `metadata Json?`
- No hay validación específica del contenido de metadata
- Depende del tipo de notificación

**Estado:** ✅ Consistente, pero considerar validaciones específicas por tipo

---

## 📋 RESUMEN DE ACCIONES REQUERIDAS

### Prioridad ALTA (Críticas):
1. ✅ Añadir `createdBy` a interface `Task` en cliente
2. ✅ Añadir `labelIds` a schemas de validación de Task
3. ✅ Corregir nombre en `reorderTasksSchema` (de `updates` a `taskUpdates`)
4. ✅ Añadir campos faltantes a `reorderTasksSchema`

### Prioridad MEDIA:
5. ⚠️ Revisar si `parentTaskId` debe estar en `updateTaskSchema`
6. ⚠️ Documentar campos opcionales vs requeridos en interfaces

### Prioridad BAJA:
7. 💡 Mejorar validación de formatos específicos
8. 💡 Considerar validaciones específicas por tipo en metadata

---

## 🔍 MÉTODO DE VERIFICACIÓN

Para verificar que estas correcciones se han aplicado:

1. **Campo `createdBy`:**
   ```bash
   grep -r "createdBy" client/src/types/index.ts
   ```

2. **Campo `labelIds` en validación:**
   ```bash
   grep -r "labelIds" server/src/validation/schemas.ts
   ```

3. **Schema reorderTasks:**
   ```bash
   grep -A 5 "reorderTasksSchema" server/src/validation/schemas.ts
   grep -r "taskUpdates" server/src/controllers/taskController.ts
   ```

---

## 📝 NOTAS ADICIONALES

- El campo `createdBy` fue añadido en una migración posterior (`migrations/add_task_subscriptions.sql`), lo que explica por qué no está sincronizado con los tipos
- El uso de `labelIds` como array en el body es común, pero debería validarse antes de procesarse
- La inconsistencia en `reorderTasksSchema` sugiere que la validación podría no estar aplicándose correctamente en la ruta

---

**Fin del Reporte**

