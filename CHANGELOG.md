# Changelog

Registro de cambios importantes del proyecto TeamWorks.

## [1.3.0] - 6 de Noviembre de 2025

### ✨ Nuevas Funcionalidades Mayores

#### 🌳 Subtareas Anidadas Ilimitadas
- **Creación recursiva de subtareas**: Crea tareas con subtareas que a su vez tienen subtareas, sin límite de profundidad
  - Ejemplo: `"crear tarea proyecto web con subtareas: diseñar mockups (con subtarea: investigar tendencias), desarrollar backend"`
  - Soporta propiedades completas en cada nivel (prioridad, fechas, etiquetas)
  - Nueva acción `create_with_subtasks` para gestionar jerarquías complejas

#### 📦 Operaciones en Bulk Avanzadas
- **Mover en Bulk (`move_bulk`)**: Mueve múltiples tareas entre proyectos y secciones
  - Ejemplo: `"mover todas las tareas de alta prioridad al proyecto Urgente"`
  - Soporta filtros por: prioridad, etiquetas, estado, proyecto, sección
  - Valida permisos antes de mover tareas a proyectos compartidos

- **Eliminar en Bulk Mejorado (`delete_bulk`)**: Eliminación con filtros sofisticados
  - Ejemplo: `"eliminar todas las tareas completadas del proyecto Personal de la semana pasada"`
  - Nuevos filtros de rango de fechas:
    - `lastWeek`: Semana pasada
    - `lastMonth`: Mes pasado  
    - `older: X days`: Más antiguas que X días
  - Filtros combinables: proyecto + estado + fecha + etiquetas

#### ↕️ Reorganización Completa de Tareas
- **Reordenar tareas (`reorder`)**: Control total sobre el orden de tareas
  - Mover antes/después de otra tarea: `"mover la tarea comprar leche arriba de sacar basura"`
  - Mover al inicio/final: `"poner la tarea reunión cliente al final de la lista"`
  - Reorganización múltiple: `"reorganizar tareas: primero comprar pan, luego sacar basura, después lavar ropa"`
  - Usa el campo `orden` para mantener posiciones precisas

### 📝 Mejoras del Sistema de IA

- **Prompt actualizado**: Ejemplos de todas las nuevas capacidades incluidos
- **Mejor comprensión**: La IA ahora entiende comandos más complejos y naturales
- **Validaciones mejoradas**: Más verificaciones de permisos y consistencia de datos
- **Manejo de errores**: Mejores mensajes cuando las operaciones no pueden completarse

### 📚 Documentación

- Nuevo archivo `docs/AI_CAPABILITIES.md`: Guía completa de todas las capacidades de IA
  - Casos de uso reales
  - Ejemplos exhaustivos
  - Mejores prácticas
  - Límites y consideraciones
- README.md actualizado con nuevas capacidades destacadas
- Ejemplos de uso ampliados en la sección de IA

### 🐛 Correcciones

- **Bug fix**: Corregido campo `fecha` → `fechaHora` en modelo reminders
  - Los recordatorios ahora se crean correctamente

### ⚙️ Cambios Técnicos

- Actualizada interface `AIAction` con nuevos tipos:
  - `create_with_subtasks`: Creación recursiva
  - `delete_bulk`: Eliminación con filtros avanzados
  - `move_bulk`: Movimiento masivo
  - `reorder`: Reorganización de tareas
- Implementadas funciones helper recursivas para subtareas anidadas
- Sistema de filtros unificado para operaciones bulk
- Mejor manejo de permisos en operaciones que afectan proyectos compartidos

### 🎯 Capacidades Completas de la IA

La IA ahora tiene capacidad total para realizar todas las operaciones que un usuario puede hacer:
- ✅ Crear tareas con subtareas anidadas ilimitadas
- ✅ Operaciones en bulk (crear, actualizar, mover, eliminar)
- ✅ Reorganizar tareas (cambiar orden, posición)
- ✅ Gestión completa de proyectos, secciones y etiquetas
- ✅ Comentarios y recordatorios
- ✅ Consultas y búsquedas avanzadas
- ✅ Actualización de propiedades (prioridad, fecha, proyecto, etc.)

## [1.2.0] - 17 de Octubre de 2025

### ✨ Nuevas Funcionalidades

#### Sistema de IA Mejorado
- **Subtareas**: Ahora puedes crear subtareas directamente con comandos de IA
  - Ejemplo: `"añadir diseñar mockups como subtarea de proyecto web"`
- **Gestión de Proyectos**: Crea proyectos con colores personalizados
  - Ejemplo: `"crear proyecto Marketing con color azul"`
- **Gestión de Secciones**: Crea secciones dentro de proyectos
  - Ejemplo: `"crear sección Backlog en proyecto Desarrollo"`
- **Gestión de Etiquetas**: Crea etiquetas con colores personalizados
  - Ejemplo: `"crear etiqueta urgente con color rojo"`
- **Comentarios**: Añade comentarios a tareas vía IA
  - Ejemplo: `"añadir comentario en tarea comprar leche: verificar si queda algo"`
- **Recordatorios**: Crea recordatorios para tareas
  - Ejemplo: `"recordarme mañana a las 9am sobre reunión cliente"`
- **Actualización en Bulk**: Modifica múltiples tareas a la vez
  - Ejemplo: `"cambiar todas las tareas del proyecto Personal a prioridad alta"`
  - Ejemplo: `"añadir etiqueta urgente a todas las tareas de hoy"`
  - Ejemplo: `"mover todas las tareas de sección Backlog a En Progreso"`

### 📝 Mejoras
- Parseo de fechas mejorado: soporta días de la semana y fechas relativas
  - Ahora funciona: "próximo lunes", "este viernes", "en 3 días", "en 2 semanas"
- Sistema de IA ahora soporta especificar proyecto, sección y etiquetas en comandos
- Auto-creación de etiquetas si no existen al asignarlas a tareas
- Mejor manejo de contexto del usuario en comandos de IA

### 📚 Documentación
- Actualizado ESTADO_ACTUAL.md con todas las capacidades implementadas
- Actualizado PLAN_IA.md con progreso de fases completadas
- Actualizado EJEMPLOS_IA.md con ejemplos de todos los nuevos comandos
- Actualizado README.md con características mejoradas
- Añadido este CHANGELOG.md

### 🐛 Correcciones
- Ninguna (nueva versión)

### ⚙️ Cambios Técnicos
- Añadidos nuevos tipos de acción al AIAction interface
- Implementado `update_bulk` para modificaciones masivas
- Mejorado el prompt del sistema de IA con más ejemplos
- Mejor validación de permisos en operaciones bulk

## [1.1.0] - 17 de Octubre de 2025

### Características Principales
- Sistema completo de gestión de tareas
- Asistente de IA básico con procesamiento de lenguaje natural
- Proyectos, secciones y etiquetas
- Subtareas infinitas con drag & drop
- Comentarios y recordatorios
- PWA instalable
- Acceso en red local
- Configuración completa desde UI

## [1.0.0] - 17 de Octubre de 2025

### Lanzamiento Inicial
- Backend con Node.js + Express + TypeScript
- Frontend con React + Vite
- Base de datos PostgreSQL con Prisma
- Autenticación JWT
- CRUD completo de tareas, proyectos, etiquetas
- UI responsive con tema claro/oscuro
- Atajos de teclado

---

Para más detalles, consulta:
- [ESTADO_ACTUAL.md](./ESTADO_ACTUAL.md) - Estado actual del proyecto
- [PLAN_IA.md](./PLAN_IA.md) - Plan de mejoras del sistema de IA
- [EJEMPLOS_IA.md](./EJEMPLOS_IA.md) - Ejemplos de comandos de IA
