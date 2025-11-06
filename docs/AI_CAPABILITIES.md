# Capacidades Avanzadas de IA en TeamWorks

Este documento detalla las capacidades completas del asistente de IA de TeamWorks, incluyendo las últimas mejoras que permiten operaciones avanzadas de gestión de tareas.

## 📋 Índice

- [Entendiendo la Jerarquía de Entidades](#entendiendo-la-jerarquía-de-entidades)
- [Creación de Tareas](#creación-de-tareas)
- [Subtareas Anidadas](#subtareas-anidadas)
- [Operaciones en Bulk](#operaciones-en-bulk)
- [Reorganización de Tareas](#reorganización-de-tareas)
- [Consultas y Búsquedas](#consultas-y-búsquedas)
- [Gestión de Proyectos y Secciones](#gestión-de-proyectos-y-secciones)
- [Etiquetas y Comentarios](#etiquetas-y-comentarios)
- [Recordatorios](#recordatorios)

## Entendiendo la Jerarquía de Entidades

⭐ **IMPORTANTE**: La IA de TeamWorks ha sido mejorada para comprender claramente la diferencia entre los distintos tipos de entidades en tu organización de tareas.

### 🗂️ Modelo de Datos

TeamWorks organiza tu trabajo en una jerarquía clara:

#### 1. **PROYECTO** (Project)
- **Qué es**: Contenedor de alto nivel para organizar trabajo relacionado
- **Ejemplos**: "Trabajo", "Personal", "Desarrollo Web", "Marketing 2024"
- **Puede contener**: Secciones y Tareas
- **No puede**: Ser hijo de otro proyecto
- **Comando ejemplo**: `"crear proyecto Desarrollo Web"`

#### 2. **SECCIÓN** (Section)
- **Qué es**: Subdivisión dentro de un proyecto específico
- **Ejemplos**: "Frontend", "Backend", "Diseño", "Testing"
- **Pertenece a**: Siempre a un proyecto específico
- **No puede**: Existir sin un proyecto
- **Comando ejemplo**: `"crear sección Frontend en proyecto Desarrollo Web"`

#### 3. **TAREA** (Task)
- **Qué es**: Unidad de trabajo específica que debes completar
- **Ejemplos**: "Implementar autenticación", "Diseñar landing page"
- **Pertenece a**: Un proyecto (obligatorio), opcionalmente a una sección
- **Puede tener**: Subtareas (tareas hijas)
- **Comando ejemplo**: `"añadir implementar navbar en proyecto Desarrollo Web sección Frontend"`

#### 4. **SUBTAREA** (Subtask)
- **Qué es**: Una tarea que depende de otra tarea (tarea padre)
- **Ejemplos**: "Diseñar mockups" como subtarea de "Implementar navbar"
- **Pertenece a**: Una tarea padre
- **Hereda**: El proyecto de su tarea padre
- **Puede tener**: Sus propias subtareas (anidamiento ilimitado)
- **Comando ejemplo**: `"crear subtarea diseñar mockups de la tarea implementar navbar"`

### 📊 Visualización de la Jerarquía

```
🗂️ PROYECTO: Desarrollo Web
│
├── 📂 SECCIÓN: Frontend
│   ├── ✅ TAREA: Implementar navbar
│   │   ├── ✅ SUBTAREA: Diseñar mockups
│   │   │   └── ✅ SUBTAREA: Investigar tendencias
│   │   └── ✅ SUBTAREA: Desarrollar componente
│   └── ✅ TAREA: Crear página de inicio
│
└── 📂 SECCIÓN: Backend
    └── ✅ TAREA: Configurar base de datos
        └── ✅ SUBTAREA: Diseñar esquema
```

### 🎯 Reglas Importantes

1. **Las SECCIONES siempre necesitan un proyecto**
   - ✅ Correcto: `"crear sección Testing en proyecto App Móvil"`
   - ❌ Incorrecto: `"crear sección Testing"` (falta el proyecto)

2. **Las SUBTAREAS siempre necesitan una tarea padre**
   - ✅ Correcto: `"añadir subtarea revisar código de la tarea implementar feature"`
   - ❌ Incorrecto: `"añadir subtarea revisar código"` (falta la tarea padre)

3. **Las TAREAS sin proyecto especificado van a "Inbox"**
   - `"añadir comprar leche"` → Se crea en Inbox
   - `"añadir comprar leche en proyecto Personal"` → Se crea en proyecto Personal

4. **Una SECCIÓN no es una TAREA**
   - Las secciones solo agrupan tareas dentro de un proyecto
   - Las secciones no tienen estado (completada/pendiente)
   - Las secciones no tienen fechas de vencimiento

### 💡 Ejemplos de Comandos Claros

**Crear estructura completa:**
```
"crear proyecto Lanzamiento App con secciones: Diseño, Desarrollo, Marketing"
```

**Crear tarea con subtareas:**
```
"añadir implementar autenticación en proyecto Lanzamiento App con subtareas: diseñar UI de login, configurar JWT, añadir tests"
```

**Crear subtareas anidadas:**
```
"crear tarea migrar base de datos con subtareas: backup (con subtarea: verificar integridad), migración (con subtareas: ejecutar scripts y verificar datos), rollback plan"
```

## Creación de Tareas

### Tarea Simple
```
"añadir comprar leche"
```
Crea una tarea básica con título "Comprar leche".

### Tarea con Propiedades
```
"añadir reunión con cliente para mañana prioridad alta en proyecto Trabajo"
```
Crea tarea con:
- Título: "Reunión con cliente"
- Fecha: Mañana
- Prioridad: P1 (Alta)
- Proyecto: Trabajo

### Tarea Completa
```
"añadir reunión con cliente en proyecto Trabajo sección Reuniones con etiqueta urgente para el próximo lunes prioridad alta"
```
Crea tarea especificando:
- Título
- Proyecto y sección
- Etiquetas
- Fecha de vencimiento
- Prioridad

### Fechas Inteligentes
El asistente entiende múltiples formatos de fecha:
- **Relativas**: "hoy", "mañana", "pasado mañana"
- **Días de la semana**: "próximo lunes", "este viernes"
- **Relativas con números**: "en 3 días", "en 2 semanas"
- **Específicas**: "25 de diciembre", "15/10/2025"

## Subtareas Anidadas

### ⭐ NUEVO: Subtareas con Múltiples Niveles

Ahora puedes crear tareas con subtareas que a su vez tienen sus propias subtareas, sin límite de profundidad:

```
"crear tarea proyecto web con subtareas: diseñar mockups (con subtarea: investigar tendencias), desarrollar backend, desarrollar frontend"
```

Esto crea:
```
📋 Proyecto web
├── 📋 Diseñar mockups
│   └── 📋 Investigar tendencias
├── 📋 Desarrollar backend
└── 📋 Desarrollar frontend
```

### Ejemplo Complejo
```
"crear tarea lanzar producto con subtareas: planificación (con subtareas: definir objetivos y crear cronograma), desarrollo (con subtareas: fase 1, fase 2 y testing), y marketing"
```

Estructura resultante:
```
📋 Lanzar producto
├── 📋 Planificación
│   ├── 📋 Definir objetivos
│   └── 📋 Crear cronograma
├── 📋 Desarrollo
│   ├── 📋 Fase 1
│   ├── 📋 Fase 2
│   └── 📋 Testing
└── 📋 Marketing
```

### Propiedades en Subtareas Anidadas
```
"crear tarea proyecto grande prioridad alta con subtareas: tarea 1 prioridad media para mañana con etiqueta urgente, tarea 2 para la próxima semana"
```

Cada subtarea puede tener sus propias:
- Prioridad
- Fecha de vencimiento
- Etiquetas
- Descripción

## Operaciones en Bulk

### Crear Múltiples Tareas
```
"crear 3 tareas: comprar pan, sacar basura y lavar ropa todas para hoy"
```

Crea tres tareas independientes, todas con fecha de hoy.

### ⭐ NUEVO: Actualizar en Bulk
```
"cambiar todas las tareas del proyecto Personal a prioridad alta"
```

Actualiza la prioridad de todas las tareas del proyecto especificado.

```
"añadir etiqueta urgente a todas las tareas de hoy"
```

Añade una etiqueta a todas las tareas que vencen hoy.

```
"mover todas las tareas de sección Backlog a En Progreso"
```

Mueve todas las tareas entre secciones.

### ⭐ NUEVO: Mover en Bulk
```
"mover todas las tareas de alta prioridad al proyecto Urgente"
```

Mueve todas las tareas que cumplen ciertos criterios a un nuevo proyecto/sección.

Ejemplos adicionales:
```
"mover todas las tareas con etiqueta revision al proyecto QA"

"mover todas las tareas completadas de esta semana al proyecto Archivo"

"mover todas las tareas sin fecha al proyecto Someday"
```

### ⭐ NUEVO: Eliminar en Bulk con Filtros Avanzados
```
"eliminar todas las tareas completadas del proyecto Personal de la semana pasada"
```

Elimina múltiples tareas con filtros sofisticados:

**Por estado y tiempo:**
```
"eliminar todas las tareas completadas de hace más de 30 días"
```

**Por proyecto y estado:**
```
"eliminar todas las tareas completadas del proyecto Archivo"
```

**Por prioridad:**
```
"eliminar todas las tareas de baja prioridad completadas"
```

**Por etiquetas:**
```
"eliminar todas las tareas con etiqueta temporal que están completadas"
```

### Filtros Disponibles para Operaciones Bulk

Todas las operaciones en bulk (actualizar, mover, eliminar) soportan estos filtros:

- **Proyecto**: `projectName: "Nombre del proyecto"`
- **Sección**: `sectionName: "Nombre de la sección"`
- **Prioridad**: `prioridad: 1-4` (1=alta, 4=baja)
- **Estado**: `completada: true/false`
- **Etiqueta**: `labelName: "nombre"`
- **Rango de fechas**:
  - `lastWeek`: Semana pasada
  - `lastMonth`: Mes pasado
  - `older: X days`: Más antiguas que X días

## Reorganización de Tareas

### ⭐ NUEVO: Mover Tarea Antes/Después de Otra
```
"mover la tarea comprar leche arriba de sacar basura"
```

Reordena "comprar leche" para que aparezca antes de "sacar basura".

```
"mover la tarea reunión cliente después de preparar presentación"
```

### ⭐ NUEVO: Mover al Principio o Final
```
"poner la tarea reunión cliente al final de la lista"
```

Mueve la tarea al final de su lista.

```
"mover la tarea urgente al principio"
```

Mueve la tarea al inicio de su lista.

### ⭐ NUEVO: Reorganizar Múltiples Tareas
```
"reorganizar tareas: primero comprar pan, luego sacar basura, después lavar ropa"
```

Reordena varias tareas especificando el orden deseado explícitamente.

## Consultas y Búsquedas

### Consultas de Tareas
```
"qué tengo pendiente esta semana"
```

Muestra todas las tareas pendientes de los próximos 7 días.

```
"mostrar tareas de alta prioridad"
```

Lista todas las tareas con prioridad P1.

```
"cuáles son mis tareas de hoy"
```

Muestra tareas con vencimiento hoy.

## Gestión de Proyectos y Secciones

### Crear Proyectos
```
"crear proyecto Marketing con color azul"
```

Crea un nuevo proyecto con el color especificado.

Colores disponibles:
- rojo, naranja, amarillo
- verde, azul, indigo
- morado, rosa, gris

### Crear Secciones
```
"añadir sección Backlog en proyecto Desarrollo"
```

Crea una nueva sección dentro del proyecto especificado.

## Etiquetas y Comentarios

### Crear Etiquetas
```
"crear etiqueta urgente con color rojo"
```

Las etiquetas se crean automáticamente si no existen al asignarlas a tareas.

### Añadir Comentarios
```
"añadir comentario en tarea comprar leche: verificar si queda algo en la nevera"
```

Añade un comentario a la tarea especificada.

## Recordatorios

### Crear Recordatorios
```
"recordarme mañana a las 9am sobre reunión cliente"
```

Crea un recordatorio para la tarea especificada.

```
"recordatorio para pasado mañana a las 15:00 sobre entregar informe"
```

## Actualización de Tareas

### Cambiar Propiedades
```
"cambiar prioridad de comprar leche a alta"
```

Actualiza la prioridad de una tarea existente.

```
"cambiar fecha de reunión a mañana"
```

```
"mover tarea informe al proyecto Trabajo"
```

### Completar Tareas
```
"completar la tarea de comprar pan"
```

Marca la tarea como completada.

```
"marcar como hecha la tarea de llamar al cliente"
```

### Eliminar Tareas
```
"eliminar la tarea de lavar el coche"
```

Elimina una tarea específica.

```
"borrar todas las tareas completadas"
```

## Modos de Ejecución

### Modo Manual (Predeterminado)
La IA sugiere las acciones y espera tu confirmación antes de ejecutarlas.

### Modo Automático
Activa el checkbox "Ejecutar automáticamente" para que la IA ejecute las acciones directamente sin confirmación.

## Consejos de Uso

### 1. Sé Natural
No necesitas usar sintaxis especial. Habla naturalmente:
- ✅ "añadir reunión con el cliente para mañana"
- ✅ "crear una tarea de comprar leche"
- ✅ "hazme un recordatorio para la reunión de mañana"

### 2. Proporciona Contexto
Cuanto más específico seas, mejor:
- ✅ "añadir diseñar mockups en proyecto Web sección Diseño prioridad alta para esta semana"
- ⚠️ "añadir tarea de diseño"

### 3. Usa Operaciones en Bulk para Eficiencia
Cuando necesites hacer múltiples cambios:
- ✅ "mover todas las tareas urgentes al proyecto Hoy"
- ⚠️ Mover cada tarea individualmente

### 4. Aprovecha las Subtareas Anidadas
Para proyectos complejos, estructura con subtareas:
- ✅ "crear proyecto X con subtareas A (con subtarea A1), B, C"
- ⚠️ Crear todas las tareas por separado

### 5. Combina Filtros
Las operaciones bulk permiten filtros sofisticados:
- ✅ "eliminar tareas completadas de baja prioridad del proyecto Archivo de hace más de 30 días"

## Límites y Consideraciones

- **Búsqueda por título**: Las tareas se buscan por coincidencia parcial del título
- **Creación automática**: Proyectos, secciones y etiquetas se crean automáticamente si no existen
- **Permisos**: Respeta los permisos de proyectos compartidos
- **Fechas**: Si no se especifica fecha, la tarea no tiene fecha de vencimiento
- **Prioridades**: Si no se especifica, se asigna P4 (sin prioridad)

## Proveedores de IA

TeamWorks soporta dos proveedores de IA:

### Groq (LLaMA 3.1 Instant)
- **Velocidad**: Muy rápida
- **Uso**: General, tareas simples y complejas
- **API Key gratuita**: console.groq.com

### Google Gemini 1.5 Flash
- **Capacidad**: Comprensión avanzada
- **Uso**: Comandos complejos, planificación
- **API Key gratuita**: makersuite.google.com/app/apikey

El sistema tiene **fallback automático**: si un proveedor falla, intenta con el otro.

## AI Planner

El AI Planner es una función especial para crear planes completos:

```
"generar plan para lanzar campaña de marketing"
```

Modos disponibles:
- **Automático**: La IA genera el plan inmediatamente
- **Interactivo**: La IA hace preguntas antes de generar el plan

El plan generado incluye:
- Resumen ejecutivo
- Fases del proyecto
- Tareas por fase con prioridades y fechas
- Dependencias entre tareas
- Timeline estimado

Luego puedes convertir el plan en tareas reales con un clic.

---

## Ejemplos Completos de Casos de Uso

### Caso 1: Iniciar un Proyecto Nuevo
```
"crear proyecto Rediseño Web con secciones: Investigación, Diseño, Desarrollo, Testing y Despliegue"

"crear tarea análisis competencia en proyecto Rediseño Web sección Investigación prioridad alta para esta semana con subtareas: buscar referencias, analizar tendencias y documentar hallazgos"

"crear 3 tareas en proyecto Rediseño Web sección Diseño: wireframes para lunes, mockups para miércoles, y prototipo para viernes todas prioridad alta"
```

### Caso 2: Reorganizar Proyecto Existente
```
"mover todas las tareas completadas del proyecto Desarrollo al proyecto Archivo"

"cambiar todas las tareas de baja prioridad sin fecha del proyecto Desarrollo a sección Someday"

"reorganizar tareas del proyecto Hoy: primero revisar emails, luego reunión equipo, después trabajar en informe"
```

### Caso 3: Limpieza de Tareas
```
"eliminar todas las tareas completadas de hace más de 30 días"

"eliminar todas las tareas del proyecto Temporal"

"eliminar todas las tareas de baja prioridad completadas del proyecto Personal"
```

### Caso 4: Gestión Diaria
```
"qué tengo pendiente hoy"

"mover las tareas urgentes al principio de la lista"

"añadir comentario en reunión cliente: confirmar asistencia por la mañana"

"recordarme a las 14:00 sobre llamar al proveedor"
```

---

**¿Tienes preguntas o sugerencias?** Abre un issue en GitHub o consulta la [documentación completa](../DOCUMENTATION.md).
