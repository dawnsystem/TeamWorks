# Changelog

Registro de cambios importantes del proyecto TeamWorks.

## [Unreleased] - 7 de Noviembre de 2025

### 🔄 Integración y Sincronización

#### Merge con rama main
- **Sincronización completa con main**: Integración de todos los cambios desarrollados en las PRs #53, #54 y #55
- **Resolución de historias no relacionadas**: Se resolvió el conflicto de historias divergentes entre la rama de desarrollo y main

#### Cambios integrados desde main:

##### ✅ Cobertura de Tests (PR #53, #54, #55)
- **100% de cobertura en tests**: Se alcanzó cobertura completa con 114 tests de cliente y 172 tests de servidor pasando
- **Tests de componentes**: 
  - LabelBadge y ProjectCard con tests completos
  - TaskItem, TaskList y TaskDetailView mejorados
  - Mock de useAuthStore añadido para tests
- **Infraestructura de testing frontend**: Setup completo de testing con utilidades y mocks
- **Tests del backend**: 
  - Tests de autenticación y autorización (49 tests)
  - Tests de controladores (task, project, label)
  - Tests de middleware de validación
  - Tests del servicio de IA (60 tests)
  - Tests de parseo de acciones

##### 🔧 Mejoras de TypeScript y Linting
- **Corrección de errores de linting**: Todos los errores de ESLint resueltos
- **Build de TypeScript**: Problemas de compilación corregidos para CI/CD
- **Consistencia del sistema de tipos**: Verificación completa y correcciones aplicadas

##### 📦 Actualizaciones de Dependencias
- **yarn.lock actualizado**: Nuevos paquetes de esbuild y rollup para varias arquitecturas y plataformas
- **Compatibilidad mejorada**: Soporte de build mejorado para diferentes entornos

##### 🏗️ Infraestructura y DevOps
- **Docker**: Configuración completa de contenedorización con docker-compose
- **Logging estructurado**: Integración de Pino para logging profesional
- **CI/CD**: Mejoras en los workflows de GitHub Actions

##### 📚 Documentación Añadida
- **Nuevos archivos de documentación**:
  - `RESUMEN_TESTS.md`: Resumen en español de los resultados de tests
  - `TEST_RESULTS_REPORT.md`: Reporte detallado de resultados de tests
  - Reportes de fases de auditoría y refactorización
  - Guías de configuración de Docker
  - Documentación de capacidades de IA

##### 🎨 Componentes Nuevos
- **LabelBadge**: Componente para mostrar etiquetas con estilo
- **ProjectCard**: Componente de tarjeta de proyecto

#### Cambios Técnicos del Merge
- **Estrategia de merge**: Se utilizó `--allow-unrelated-histories` con `--strategy-option=theirs` para resolver conflictos
- **313 commits integrados**: Todo el historial de main ha sido incorporado
- **Archivos modificados**: 48 archivos cambiados, +1789 inserciones, -3951 eliminaciones
- **Simplificación del código**: Reducción de complejidad en varios módulos, especialmente en el servicio de IA

### 📊 Estadísticas del Merge
- **Tests**: De 87/115 a 114/114 (cliente) + 172/172 (servidor)
- **Cobertura**: 100% en ambos client y server
- **Líneas de código**: Optimización significativa (-2162 líneas netas)
- **Componentes**: +2 nuevos componentes con tests completos

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
