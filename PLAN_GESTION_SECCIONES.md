# Plan de Gestión de Secciones

## 📋 Estado Actual

### ✅ **LO QUE YA EXISTE:**

#### Backend (Server)
- ✅ Modelo de base de datos: `Section` en Prisma schema
- ✅ Rutas API creadas:
  - `POST /api/projects/:projectId/sections` - Crear sección
  - `PATCH /api/projects/sections/:id` - Actualizar sección
  - `DELETE /api/projects/sections/:id` - Eliminar sección
- ✅ Controladores implementados:
  - `createSection()`
  - `updateSection()`
  - `deleteSection()`
- ✅ Validación de schemas

#### Frontend (Client)
- ✅ Tipo `Section` definido en TypeScript
- ✅ API functions en `api.ts`:
  - `projectsAPI.createSection()`
  - `projectsAPI.updateSection()`
  - `projectsAPI.deleteSection()`
- ✅ Las secciones se muestran en `BoardView` como columnas
- ✅ Las secciones se incluyen al obtener proyectos
- ✅ Las tareas tienen `sectionId`

---

## ❌ **LO QUE FALTA IMPLEMENTAR:**

### 1. **UI para Gestión de Secciones** 🎨
- ❌ Botón para agregar nueva sección
- ❌ Modal/Dialog para crear sección
- ❌ Editar nombre de sección (inline editing)
- ❌ Menú contextual para opciones de sección
- ❌ Confirmación antes de eliminar
- ❌ Mostrar secciones en ProjectView (vista lista)

### 2. **Drag & Drop para Reordenar Secciones** 🔄
- ❌ Hacer las columnas arrastrables
- ❌ Endpoint API para reordenar: `POST /api/projects/sections/reorder`
- ❌ Actualizar orden de secciones en el backend
- ❌ Actualizar orden de tareas cuando se mueve una sección

### 3. **Integración con Tareas** 🔗
- ⚠️ Mostrar selector de sección en TaskEditor (parcialmente)
- ❌ Mover tareas entre secciones con drag & drop
- ❌ Permitir crear tarea en sección específica desde el board

### 4. **Mejoras UX** ✨
- ❌ Indicador visual cuando una sección está vacía
- ❌ Contador de tareas por sección
- ❌ Colores/iconos para secciones
- ❌ Vista colapsable de secciones

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: UI Básica de Gestión (Prioridad Alta)**

#### 1.1. Crear componente `SectionManager.tsx`
- Modal/Dialog para crear/editar secciones
- Formulario con nombre y orden
- Validación de campos
- Integración con React Query

#### 1.2. Agregar botones de acción en `BoardView`
- Botón "+" para agregar sección nueva
- Icono de edición en header de cada columna
- Menú contextual con opciones (Editar, Eliminar)

#### 1.3. Edición inline del nombre de sección
- Click en el título para editar
- Guardar al presionar Enter o perder foco
- Cancelar con Escape

#### 1.4. Mostrar secciones en `ProjectView` (vista lista)
- Agrupar tareas por sección
- Headers colapsables
- Opción de crear sección desde vista lista

---

### **Fase 2: Drag & Drop de Secciones (Prioridad Media)**

#### 2.1. Backend - Endpoint de reordenamiento
```typescript
// POST /api/projects/sections/reorder
{
  sectionUpdates: [
    { id: "section1", orden: 0 },
    { id: "section2", orden: 1 },
    { id: "section3", orden: 2 }
  ]
}
```

#### 2.2. Frontend - Implementar drag & drop
- Usar `@dnd-kit/core` para arrastrar columnas
- Actualizar orden localmente
- Sincronizar con el servidor
- Optimistic updates

#### 2.3. Mover tareas con la sección
- Cuando se reordena una sección, las tareas mantienen su `sectionId`
- Las tareas se mueven visualmente con la columna

---

### **Fase 3: Integración Completa (Prioridad Media)**

#### 3.1. TaskEditor
- Dropdown para seleccionar sección
- Crear en sección específica
- Cambiar sección de tarea existente

#### 3.2. Drag & Drop de tareas entre secciones
- Ya funciona parcialmente
- Mejorar UX con animaciones
- Actualizar contador de tareas

#### 3.3. Vista lista con secciones
- Agrupar tareas por sección
- Permitir colapsar/expandir secciones
- Drag & drop entre secciones en vista lista

---

### **Fase 4: Mejoras y Pulido (Prioridad Baja)**

#### 4.1. Características adicionales
- Colores personalizados para secciones
- Iconos para identificar secciones
- Descripción/notas en secciones
- Templates con secciones predefinidas

#### 4.2. Mejoras UX
- Animaciones suaves
- Feedback visual mejorado
- Atajos de teclado
- Bulk actions (mover múltiples tareas)

---

## 📝 ARCHIVOS A MODIFICAR/CREAR

### Backend
1. `server/src/controllers/projectController.ts` - Agregar `reorderSections`
2. `server/src/routes/projectRoutes.ts` - Nueva ruta de reordenamiento
3. `server/src/validation/schemas.ts` - Schema de reordenamiento

### Frontend
1. **CREAR:** `client/src/components/SectionManager.tsx` - Gestión de secciones
2. **CREAR:** `client/src/components/SectionHeader.tsx` - Header editable
3. **MODIFICAR:** `client/src/components/BoardView.tsx` - Botón agregar + drag & drop
4. **MODIFICAR:** `client/src/components/BoardColumn.tsx` - Edición inline
5. **MODIFICAR:** `client/src/components/ProjectView.tsx` - Mostrar secciones
6. **MODIFICAR:** `client/src/components/TaskEditor.tsx` - Selector de sección
7. **MODIFICAR:** `client/src/lib/api.ts` - Función reordenar secciones

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ Crear `SectionManager.tsx` - Modal para crear/editar secciones
2. ✅ Agregar botón "Agregar Sección" en `BoardView`
3. ✅ Implementar edición inline del nombre en `BoardColumn`
4. ✅ Agregar menú contextual en header de columna
5. ✅ Integrar con React Query (mutations)
6. ✅ Añadir confirmación antes de eliminar sección

---

## 💡 NOTAS ADICIONALES

- Las secciones son como "columnas" en la vista Kanban
- En la vista de lista, serían "grupos" de tareas
- Una tarea puede estar sin sección (`sectionId: null`)
- El orden de las secciones determina su posición visual
- Al eliminar una sección, las tareas pueden:
  - Opción 1: Quedarse sin sección (`sectionId = null`)
  - Opción 2: Eliminarse junto con la sección (preguntable)
  - Opción 3: Moverse a otra sección (preguntable)

