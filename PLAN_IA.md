# Plan Integral - Sistema de IA Avanzado

**Fecha**: 17 de Octubre de 2025  
**Versión**: 2.0  
**Estado**: En Implementación

---

## 🎯 Visión General

Transformar el sistema de IA de TeamWorks para que pueda realizar **todas las operaciones que un usuario puede hacer** y **más**, incluyendo bulk actions, acciones secuenciales, y gestión inteligente de relaciones entre tareas.

---

## 📋 Objetivos del Plan

### Objetivo Principal
Crear un asistente de IA que sea tan capaz como un usuario humano, pero más eficiente, permitiendo:
1. Gestión completa de proyectos, secciones, tareas, etiquetas, comentarios y recordatorios
2. Operaciones en bulk (múltiples elementos a la vez)
3. Operaciones secuenciales (cadenas de acciones)
4. Gestión inteligente de relaciones entre tareas
5. Sugerencias contextuales basadas en el estado actual

### Objetivos Secundarios
- Mejorar la experiencia del usuario al completar tareas relacionadas
- Automatizar flujos de trabajo comunes
- Proporcionar feedback inteligente y proactivo
- Facilitar la organización y planificación

---

## 🔧 Capacidades Actuales vs Planificadas

### ✅ Implementado (Estado Actual)

#### Creación Básica de Tareas
- Crear tarea con título
- Asignar prioridad (P1-P4, alta/media/baja)
- Fechas básicas (hoy, mañana, pasado mañana)
- Asignación automática a Inbox

#### Operaciones sobre Tareas
- Completar tarea por nombre
- Eliminar tareas completadas
- Consultar tareas pendientes (hoy, semana)

#### Sistema de Confianza
- Score de confianza (0-1)
- Modo manual y automático
- Explicaciones de acciones

### 🚀 A Implementar (Nuevas Capacidades)

## Fase 1: Creación Avanzada de Tareas ✅ COMPLETADA

### 1.1 Especificación Completa de Propiedades ✅
- ✅ Título y descripción
- ✅ Prioridad (4 niveles)
- ✅ Fecha de vencimiento (parseo mejorado)
- ✅ **Proyecto específico** (no solo Inbox)
- ✅ **Sección específica** dentro del proyecto
- ✅ **Etiquetas múltiples**
- ✅ **Subtarea de otra tarea**

**Ejemplos de comandos**:
```
"crear tarea comprar leche prioridad alta para mañana en proyecto Personal sección Compras con etiqueta urgente"

"añadir escribir informe como subtarea de preparar presentación en proyecto Trabajo"

"nueva tarea llamar al dentista para el próximo lunes con etiquetas salud y personal"
```

### 1.2 Parseo Avanzado de Fechas ✅
- ✅ hoy, mañana, pasado mañana
- ✅ Días de la semana ("próximo lunes", "este viernes")
- ✅ Fechas relativas ("en 3 días", "en 2 semanas")
- ✅ Fechas absolutas ("25 de diciembre", "15/10/2025")
- ⏸️ Rangos ("del 10 al 15 de noviembre") - Pendiente

## Fase 2: Operaciones Bulk (Múltiples Elementos) ✅ COMPLETADA

### 2.1 Creación en Bulk ✅
**Objetivo**: Crear múltiples elementos en un solo comando

**Casos de uso**:
```
"crear 5 tareas: comprar leche, sacar la basura, lavar ropa, llamar a mamá, pagar facturas todas para hoy prioridad media"

"añadir tareas para la semana: lunes reunión equipo, martes revisar presupuesto, miércoles presentación cliente, jueves formación, viernes revisión semanal"

"crear etiquetas: urgente rojo, opcional azul, en proceso amarillo, completado verde"
```

### 2.2 Modificación en Bulk ✅ COMPLETADA
**Objetivo**: Modificar múltiples tareas a la vez

**Casos de uso**:
```
"cambiar todas las tareas del proyecto Personal a prioridad alta"

"mover todas las tareas de la sección Backlog a la sección En Progreso"

"añadir etiqueta urgente a todas las tareas de hoy"

"completar todas las tareas con etiqueta quick-win"

"cambiar todas las tareas vencidas a próxima semana"
```

**Estado**: ✅ Implementado - El sistema puede modificar múltiples tareas que coincidan con filtros específicos

### 2.3 Eliminación en Bulk ✅
**Objetivo**: Eliminar múltiples elementos con filtros

**Casos de uso**:
```
"eliminar todas las tareas completadas del proyecto Personal"

"borrar todas las tareas vencidas hace más de 30 días"

"eliminar subtareas completadas de preparar presentación"
```

## Fase 3: Acciones Secuenciales

### 3.1 Flujos de Creación
**Objetivo**: Crear estructuras completas en un comando

**Casos de uso**:
```
"crear proyecto Marketing con secciones Planificación, Ejecución y Análisis y añadir tarea crear estrategia en Planificación"

"preparar sprint: crear proyecto Sprint 10, secciones Todo, In Progress, Done y 10 tareas de backlog"

"configurar nuevo cliente: crear proyecto Cliente ABC con secciones Onboarding, Desarrollo, Testing, Deployment cada una con tarea inicial"
```

### 3.2 Flujos de Organización
**Objetivo**: Reorganizar múltiples elementos

**Casos de uso**:
```
"organizar tareas de hoy por prioridad en secciones"

"mover tareas completadas de todos los proyectos a archivo"

"agrupar tareas similares y crear proyecto para cada grupo"
```

### 3.3 Flujos Condicionales
**Objetivo**: Acciones con lógica condicional

**Casos de uso**:
```
"si hay tareas vencidas hace más de 7 días, moverlas a proyecto Backlog y quitar prioridad"

"si no hay tareas para hoy, sugerir 3 tareas del backlog"

"si proyecto tiene más de 50 tareas, crear sección Archive y mover completadas"
```

## Fase 4: Gestión de Comentarios y Recordatorios ✅ COMPLETADA

### 4.1 Comentarios vía IA ✅
**Casos de uso**:
```
"añadir comentario en tarea comprar leche: verificar si queda algo en la nevera"

"comentar en todas las tareas de hoy: recordar actualizar estado al finalizar"

"añadir nota en preparar presentación: incluir datos del último trimestre"
```

### 4.2 Recordatorios vía IA ✅
**Casos de uso**:
```
"crear recordatorio para tarea reunión cliente 30 minutos antes"

"añadir recordatorios de 1 día antes a todas las tareas de esta semana"

"recordarme mañana a las 9am revisar tareas pendientes"
```

## Fase 5: Actualización de Tareas Existentes ✅ COMPLETADA

### 5.1 Modificación de Propiedades ✅
**Casos de uso**:
```
"cambiar prioridad de comprar leche a alta"

"mover tarea escribir informe al proyecto Trabajo sección Documentación"

"cambiar fecha de reunión cliente a próximo martes"

"añadir etiquetas urgente y cliente a tarea preparar presupuesto"
```

### 5.2 Gestión de Subtareas ✅
**Casos de uso**:
```
"convertir tareas X, Y, Z en subtareas de proyecto principal"

"promover subtarea X a tarea independiente"

"crear 5 subtareas para tarea preparar presentación: investigar, redactar, diseñar, revisar, practicar"
```

## Fase 6: Búsquedas y Consultas Avanzadas

### 6.1 Búsquedas Complejas
**Casos de uso**:
```
"mostrar tareas prioritarias sin fecha de vencimiento"

"qué tareas tengo del proyecto Trabajo con etiqueta urgente para esta semana"

"listar todas las tareas vencidas agrupadas por proyecto"

"encontrar tareas con la palabra 'cliente' en título o descripción"
```

### 6.2 Análisis y Estadísticas
**Casos de uso**:
```
"cuántas tareas completé esta semana"

"qué proyecto tiene más tareas pendientes"

"mostrar distribución de tareas por prioridad"

"cuál es mi tasa de completitud este mes"
```

### 6.3 Sugerencias Inteligentes
**Casos de uso**:
```
"qué debería hacer ahora" → Sugiere tareas según contexto

"sugerir tareas para completar hoy" → Basado en prioridad, fecha, proyecto

"recomendar reorganización de proyectos" → Detecta patrones y sugiere mejoras
```

## Fase 7: Gestión Inteligente de Relaciones

### 7.1 Detección de Tareas Relacionadas
**Implementación**:
- Detectar cuando se completa la última subtarea de una tarea padre
- Detectar cuando se completan todas las tareas de una sección
- Detectar cuando se completan todas las tareas de un proyecto

### 7.2 Popup Inteligente al Completar Subtareas
**Trigger**: Usuario completa una subtarea y no quedan más subtareas pendientes

**Opciones en el Popup**:
1. ✅ **Completar tarea padre también**
2. 💬 **Añadir comentario a la tarea padre** (ej: "Todas las subtareas completadas el [fecha]")
3. 📝 **Crear nueva subtarea** (si faltó algo)
4. 🔄 **Mover tarea padre a otra sección** (ej: de "En Progreso" a "Completado")
5. ⏭️ **Sugerir siguiente tarea** del mismo proyecto
6. ❌ **No hacer nada** (cerrar popup)

**Contexto Adicional**:
- Mostrar título de la tarea padre
- Mostrar proyecto y sección
- Mostrar estadísticas (X de Y subtareas completadas)

### 7.3 Sugerencias Contextuales
**Casos de uso**:
- Al completar última tarea de la sección → "¿Crear nueva sección o mover tarea?"
- Al crear muchas tareas sin fecha → "¿Asignar fechas automáticamente?"
- Al tener muchas tareas vencidas → "¿Reprogramar tareas vencidas?"

## Fase 8: Operaciones de Proyectos y Etiquetas ✅ COMPLETADA

### 8.1 Gestión de Proyectos vía IA ✅
**Casos de uso**:
```
"crear proyecto Marketing con color azul"

"cambiar color del proyecto Personal a verde" - Pendiente

"eliminar proyecto Archivo y mover tareas a Inbox" - Pendiente

"duplicar proyecto Template para nuevo cliente" - Pendiente
```

### 8.2 Gestión de Etiquetas vía IA ✅
**Casos de uso**:
```
"crear etiqueta urgente con color rojo"

"cambiar nombre de etiqueta work a trabajo" - Pendiente

"eliminar etiqueta deprecated de todas las tareas" - Pendiente

"fusionar etiquetas importante y priority en una sola" - Pendiente
```

### 8.3 Gestión de Secciones vía IA ✅
**Casos de uso**:
```
"crear sección Backlog en proyecto Desarrollo"

"renombrar sección Todo a Por Hacer" - Pendiente

"mover todas las tareas de sección Done a Archive" - Pendiente

"eliminar sección vacía Testing" - Pendiente
```

---

## 🏗️ Arquitectura Técnica

### Mejoras en `aiService.ts`

#### 1. Prompt Mejorado
```typescript
interface EnhancedAIContext {
  // Usuario y permisos
  userId: string;
  userName: string;
  
  // Contexto completo
  projects: Array<{ id, nombre, color, sections }>;
  labels: Array<{ id, nombre, color }>;
  recentTasks: Array<{ id, titulo, projectId, sectionId }>;
  
  // Estado actual
  currentView: 'inbox' | 'today' | 'week' | 'project';
  currentProjectId?: string;
  currentSectionId?: string;
  
  // Preferencias
  defaultProject?: string;
  timezone: string;
}
```

#### 2. Tipos de Acciones Extendidos
```typescript
type AIActionType = 
  // Tareas
  | 'create_task'
  | 'create_tasks_bulk'  // 🆕
  | 'update_task'         // 🆕
  | 'update_tasks_bulk'   // 🆕
  | 'delete_task'
  | 'delete_tasks_bulk'   // 🆕
  | 'complete_task'
  | 'complete_tasks_bulk' // 🆕
  
  // Proyectos
  | 'create_project'      // 🆕
  | 'update_project'      // 🆕
  | 'delete_project'      // 🆕
  
  // Secciones
  | 'create_section'      // 🆕
  | 'update_section'      // 🆕
  | 'delete_section'      // 🆕
  
  // Etiquetas
  | 'create_label'        // 🆕
  | 'update_label'        // 🆕
  | 'delete_label'        // 🆕
  | 'assign_labels'       // 🆕
  
  // Comentarios y Recordatorios
  | 'add_comment'         // 🆕
  | 'create_reminder'     // 🆕
  
  // Consultas
  | 'query_tasks'
  | 'query_analytics'     // 🆕
  
  // Flujos
  | 'sequential_actions'  // 🆕
  | 'conditional_action'; // 🆕
```

#### 3. Validación y Seguridad
```typescript
interface ActionValidator {
  // Validar permisos del usuario
  validatePermissions(action: AIAction, userId: string): boolean;
  
  // Validar que los IDs existen
  validateReferences(action: AIAction): Promise<boolean>;
  
  // Validar coherencia de datos
  validateData(action: AIAction): boolean;
  
  // Sanitizar inputs
  sanitize(action: AIAction): AIAction;
}
```

### Mejoras en `aiController.ts`

#### 1. Ejecución Transaccional
```typescript
async function executeActionsTransactional(
  actions: AIAction[],
  userId: string
): Promise<ActionResult[]> {
  return await prisma.$transaction(async (tx) => {
    const results = [];
    for (const action of actions) {
      const result = await executeAction(action, userId, tx);
      results.push(result);
      
      // Si una acción falla y es crítica, rollback
      if (!result.success && action.critical) {
        throw new Error(`Critical action failed: ${action.explanation}`);
      }
    }
    return results;
  });
}
```

#### 2. Sistema de Rollback
```typescript
interface ActionResult {
  action: AIAction;
  success: boolean;
  result?: any;
  error?: string;
  rollbackable: boolean;
  rollbackData?: any;
}

async function rollbackActions(
  results: ActionResult[]
): Promise<void> {
  // Revertir acciones en orden inverso
  for (const result of results.reverse()) {
    if (result.rollbackable && result.rollbackData) {
      await rollbackAction(result);
    }
  }
}
```

---

## 🎨 Componentes Frontend

### Nuevo: `TaskRelationshipManager.tsx`
**Responsabilidad**: Gestionar popup cuando se completa última subtarea

```typescript
interface TaskRelationshipManagerProps {
  parentTask: Task;
  completedSubTaskId: string;
  onAction: (action: RelationshipAction) => void;
}

type RelationshipAction =
  | { type: 'complete_parent' }
  | { type: 'add_comment'; comment: string }
  | { type: 'create_subtask'; title: string }
  | { type: 'move_to_section'; sectionId: string }
  | { type: 'suggest_next' }
  | { type: 'dismiss' };
```

**UI del Popup**:
- Modal centrado con overlay
- Título: "🎉 ¡Última subtarea completada!"
- Información de tarea padre
- 6 botones de acción
- Diseño limpio y claro
- Animación de celebración (opcional)

### Mejoras en `AIAssistant.tsx`

#### 1. Ejemplos Dinámicos
Mostrar ejemplos basados en el contexto actual:
- Si estás en un proyecto → ejemplos de ese proyecto
- Si es lunes → ejemplos de planificación semanal
- Si hay tareas vencidas → ejemplos de reprogramación

#### 2. Historial de Comandos
- Guardar últimos 10 comandos
- Autocompletar basado en historial
- Shortcuts para comandos frecuentes

#### 3. Modo Avanzado
Toggle para habilitar:
- Acciones bulk
- Acciones condicionales
- Flujos complejos
- Feedback técnico

---

## 📊 Plan de Implementación

### Sprint 1: Fundamentos ✅ COMPLETADO (Semana 1)
- [x] Documentación consolidada
- [x] Mejora de parseo de fechas
- [x] Soporte para proyectos específicos
- [x] Soporte para secciones
- [x] Soporte para etiquetas
- [x] Testing de creación avanzada

### Sprint 2: Bulk Actions ✅ COMPLETADO (Semana 2)
- [x] Crear múltiples tareas
- [x] Modificar múltiples tareas
- [x] Eliminar en bulk
- [ ] UI para confirmar bulk actions - PENDIENTE (opcional)
- [ ] Testing de bulk operations - PENDIENTE

### Sprint 3: Acciones Secuenciales ⏸️ PENDIENTE (Semana 3)
- [ ] Parser de flujos
- [ ] Ejecución transaccional
- [ ] Rollback automático
- [ ] UI para feedback de flujos
- [ ] Testing de sequences

### Sprint 4: Gestión de Relaciones ⏸️ PENDIENTE (Semana 4)
- [ ] Detección de subtareas completadas
- [ ] Componente TaskRelationshipManager
- [ ] Popup inteligente
- [ ] Sugerencias contextuales
- [ ] Testing de relaciones

### Sprint 5: Operaciones Avanzadas ✅ COMPLETADO (Semana 5)
- [x] Gestión de proyectos vía IA (creación)
- [x] Gestión de etiquetas vía IA (creación)
- [x] Comentarios y recordatorios vía IA
- [x] Actualización de tareas existentes
- [ ] Testing completo - PENDIENTE

### Sprint 6: Búsquedas y Analytics ⏸️ PENDIENTE (Semana 6)
- [ ] Búsquedas complejas
- [ ] Analytics básicos
- [ ] Sugerencias inteligentes
- [ ] UI para visualización de consultas
- [ ] Testing de queries

### Sprint 7: Pulido y Documentación ✅ EN PROGRESO (Semana 7)
- [x] Optimización de prompts
- [ ] Mejora de UI/UX
- [x] Documentación completa
- [x] Ejemplos y tutoriales
- [ ] Video demos

---

## 🧪 Estrategia de Testing

### Tests Unitarios
- Parser de comandos
- Validación de acciones
- Ejecución de acciones individuales
- Rollback de acciones

### Tests de Integración
- Flujos completos de creación
- Bulk operations
- Secuencias de acciones
- Gestión de relaciones

### Tests E2E
- Casos de uso reales
- Comandos complejos
- Verificación de UI
- Performance

### Tests de IA
- Accuracy de interpretación
- Confidence scores apropiados
- Manejo de ambigüedad
- Edge cases

---

## 📈 Métricas de Éxito

### Métricas de Funcionalidad
- Tipos de comandos soportados: objetivo 50+
- Tasa de éxito de interpretación: > 90%
- Tasa de éxito de ejecución: > 95%
- Cobertura de operaciones: 100% de lo que puede hacer un usuario

### Métricas de UX
- Tiempo medio para completar tarea con IA vs manual: < 50%
- Satisfacción del usuario: > 4.5/5
- Adopción de función de IA: > 70% de usuarios activos
- Comandos por usuario activo por día: > 5

### Métricas Técnicas
- Tiempo de respuesta de IA: < 2s (p95)
- Tasa de error del sistema: < 1%
- Uptime del servicio de IA: > 99.9%
- Coste por comando: < $0.001

---

## 🚧 Consideraciones de Implementación

### Rendimiento
- Caché de contexto de usuario (30 min TTL)
- Batch processing para bulk operations
- Ejecución asíncrona para operaciones largas
- Rate limiting por usuario

### Costos de IA
- Groq API es gratuito hasta cierto límite
- Monitorear uso por usuario
- Implementar fallback a modelo local si es necesario
- Optimizar prompts para reducir tokens

### Seguridad
- Validar todos los inputs
- Sanitizar comandos del usuario
- Verificar permisos en cada operación
- Logging de acciones de IA para auditoría
- Rate limiting para prevenir abuso

### Escalabilidad
- Queue system para operaciones pesadas
- Horizontal scaling del backend
- Database connection pooling
- CDN para assets del frontend

---

## 📚 Documentación a Crear/Actualizar

### Para Usuarios
- [ ] Guía completa de comandos de IA
- [ ] Tutorial interactivo
- [ ] Video demos de casos de uso
- [ ] FAQ de IA
- [ ] Tips y trucos

### Para Desarrolladores
- [ ] Arquitectura del sistema de IA
- [ ] API reference completa
- [ ] Guía de prompts
- [ ] Guía de testing
- [ ] Contributing guide

---

## 🎯 Próximos Pasos Inmediatos

1. ✅ Consolidar documentación existente
2. ✅ Crear PLAN_IA.md (este documento)
3. ✅ Implementar parseo mejorado de fechas
4. ✅ Añadir soporte para proyectos/secciones/etiquetas
5. ✅ Implementar creación de tareas mejorada
6. ✅ Implementar subtareas, comentarios y recordatorios vía IA
7. ⏭️ Implementar modificaciones bulk (cambiar múltiples tareas a la vez)
8. ⏭️ Implementar acciones secuenciales
9. ⏭️ Implementar detección inteligente de tareas relacionadas
10. ⏭️ Testing exhaustivo de mejoras
11. ⏭️ Desplegar a producción

---

**Mantenido por**: Equipo de Desarrollo TeamWorks  
**Última Actualización**: 17 de Octubre de 2025  
**Estado**: Documento vivo - se actualiza con cada sprint
