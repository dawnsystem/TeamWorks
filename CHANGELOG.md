# Changelog

Registro de cambios importantes del proyecto TeamWorks.

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
