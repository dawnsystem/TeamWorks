# Análisis de Capacidades de IA

## Acciones Actualmente Soportadas por la IA

### ✅ Tareas
- `create` - Crear una tarea
- `create_bulk` - Crear múltiples tareas en batch
- `update` - Actualizar una tarea
- `update_bulk` - Actualizar múltiples tareas
- `complete` - Marcar tarea como completada
- `delete` - Eliminar tarea
- `query` - Consultar/buscar tareas

### ✅ Proyectos
- `create_project` - Crear proyecto

### ✅ Secciones
- `create_section` - Crear sección

### ✅ Etiquetas
- `create_label` - Crear etiqueta

### ✅ Comentarios
- `add_comment` - Agregar comentario

### ✅ Recordatorios
- `create_reminder` - Crear recordatorio

---

## Acciones que FALTAN Implementar

### ❌ Proyectos
- `update_project` - Actualizar proyecto (nombre, color, orden)
- `delete_project` - Eliminar proyecto
- `update_project_bulk` - Actualizar múltiples proyectos

### ❌ Secciones
- `update_section` - Actualizar sección
- `delete_section` - Eliminar sección
- `reorder_sections` - Reordenar secciones
- `move_section` - Mover sección a otro proyecto

### ❌ Etiquetas
- `update_label` - Actualizar etiqueta
- `delete_label` - Eliminar etiqueta
- `assign_label` - Asignar etiqueta a tarea(s)
- `remove_label` - Quitar etiqueta de tarea(s)
- `assign_label_bulk` - Asignar etiqueta a múltiples tareas

### ❌ Comentarios
- `update_comment` - Actualizar comentario
- `delete_comment` - Eliminar comentario

### ❌ Recordatorios
- `update_reminder` - Actualizar recordatorio
- `delete_reminder` - Eliminar recordatorio

### ❌ Tareas (avanzado)
- `reorder_tasks` - Reordenar tareas
- `move_task` - Mover tarea a otro proyecto/sección
- `duplicate_task` - Duplicar tarea
- `uncomplete` - Desmarcar tarea como completada
- `delete_bulk` - Eliminar múltiples tareas
- `move_bulk` - Mover múltiples tareas
- `set_priority_bulk` - Establecer prioridad en múltiples tareas
- `set_due_date_bulk` - Establecer fecha de vencimiento en múltiples tareas

### ❌ Consultas Avanzadas
- `query_by_label` - Buscar tareas por etiqueta
- `query_by_project` - Buscar tareas por proyecto
- `query_by_priority` - Buscar tareas por prioridad
- `query_overdue` - Buscar tareas vencidas
- `query_today` - Buscar tareas de hoy
- `query_week` - Buscar tareas de esta semana
- `statistics` - Obtener estadísticas del usuario

### ❌ Acciones Secuenciales/Condicionales
- Soporte para acciones con dependencias (hacer X, luego Y)
- Condiciones (si X, entonces hacer Y)
- Acciones en paralelo vs secuenciales

---

## Nuevas Funcionalidades que la IA Debe Conocer

### Subtareas
- La IA NO sabe que las tareas pueden tener subtareas
- Debe poder:
  - Crear subtareas
  - Listar subtareas de una tarea
  - Mover tareas para convertirlas en subtareas
  - Promover subtareas a tareas principales

### Templates (Plantillas)
- La IA NO sabe que existen templates
- Debe poder:
  - Crear templates desde tareas existentes
  - Crear tareas desde templates
  - Listar templates disponibles

### Secciones dentro de Proyectos
- La IA sabe crear secciones pero NO sabe:
  - Listarlas
  - Moverlas
  - Reordenarlas
  - Mover tareas entre secciones

### Sistema de Prioridades Mejorado
- La IA debe entender mejor las prioridades:
  - 1 = Alta (urgente)
  - 2 = Media
  - 3 = Baja
  - 4 = Ninguna (por defecto)

---

## Prioridad de Implementación

### ALTA PRIORIDAD (esencial)
1. **Subtareas** - La IA debe poder trabajar con subtareas
2. **Asignar/quitar etiquetas** - Funcionalidad muy usada
3. **Acciones bulk mejoradas** - delete_bulk, move_bulk, etc.
4. **Desmarcar como completada** - Para corregir errores

### MEDIA PRIORIDAD (importante)
5. **Actualizar/eliminar proyectos y secciones**
6. **Consultas avanzadas** - query_by_label, query_overdue, etc.
7. **Reordenar tareas y secciones**
8. **Templates** - Crear y usar plantillas

### BAJA PRIORIDAD (nice to have)
9. **Actualizar/eliminar comentarios y recordatorios**
10. **Estadísticas y reportes**
11. **Acciones condicionales/secuenciales**

---

## Sincronización SSE para Acciones de IA

**CRÍTICO:** Todas las acciones ejecutadas por la IA deben emitir eventos SSE para sincronización en tiempo real.

Actualmente, cuando la IA ejecuta acciones, NO se están enviando eventos SSE, por lo que:
- Los cambios no se sincronizan entre dispositivos
- El usuario tiene que recargar para ver lo que hizo la IA

**SOLUCIÓN:** Modificar `executeAIActions` para que cada acción emita el evento SSE correspondiente.
