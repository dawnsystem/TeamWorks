# Auditoría de Arquitectura — TeamWorks (2025-11-04)

## Resumen ejecutivo

- **Estado**: la aplicación funciona y ya cuenta con correcciones importantes (validaciones, árbol de tareas, IA multi proveedor, optimizaciones).
- **Riesgo principal**: mezcla de responsabilidades (controladores vs prisma), ausencia de contratos formales entre capas y carencia de un sistema de diseño/documentación que guíe nuevas features.
- **Oportunidad**: consolidar un enfoque de *Domain Services + Factories + Hooks* (ya iniciado) y un *Design System* que haga que cada nueva pantalla sea coherente sin esfuerzo manual.

## Backend

### Puntos fuertes
- Arquitectura Express modular con routers específicos (`routes/*`).
- Capa de validación compartida (Zod + `validateBody`).
- Refactor reciente hacia pluralización correcta y uso de `taskDomainService` / `taskFactory`.

### Debilidades
- Controladores aún contienen lógica de negocio (p. ej. `taskController.updateTask`).
- No existe catálogo de servicios (solo `taskDomainService` y `aiService`).
- No hay capa de DTO/serialización para proyectos, secciones, notificaciones.
- Falta una guía de errores/observabilidad (logs, AppError, tracing). 
- Tests unitarios/integración limitados.

### Recomendaciones
1. **Domain Services**: extender patrón (`projectDomainService`, `notificationDomainService`, etc.).
2. **Factories/DTOs**: replicar `taskFactory` para `projectFactory`, `sectionFactory`, `notificationFactory` y utilizarlos en controladores.
3. **Error Handling**: crear utilidades (`AppError`, `errorMapper`) y middleware de logging.
4. **Testing**: suites unitarias para services y factories con Prisma en modo test; documentación en `TESTING.md`.
5. **ADRs**: mantener decisiones clave (ver ADR-0001 abajo).

## Frontend

### Puntos fuertes
- Uso de React Query + Zustand, patrones ya establecidos (`useTasksTree`, `TaskEditor`, `TaskDetailView`).
- Index.css contiene tokens base (prioridades, glass UI) y utilidades de scroll.
- Vistas principales (`ProjectView`, `BoardView`, `Today/Week`) integran la nueva API de árbol.

### Debilidades
- Ausencia de un **Design System** formal (tokens dispersos, componentes UI duplicados).
- Falta consistencia en scrollbars, sombras y modales nuevos (depende del copy/paste).
- No hay Storybook ni documentación de componentes.
- Hooks personalizados limitados (la lógica se repite en `TodayView`, `WeekView`).

### Recomendaciones
1. **Design System**: definir tokens en `src/design/tokens.ts` + helpers `applyTheme`.
2. **Component Library interna**: `src/components/ui/*` (Button, Card, Modal, ScrollArea, Tabs, etc.).
3. **Hooks transversales**: `useTheme`, `useLayout`, `useBoolean`, `useFeatureFlags`.
4. **Storybook o Ladle** ligero para documentar componentes.
5. **Playbook UI**: guía clara en docs (ver blueprint a continuación).

## Infraestructura / DevOps

### Puntos fuertes
- Scripts de setup (Docker DB, envs). 
- Documentación extensa (`README`, guías varias).

### Debilidades
- No hay pipeline automatizado visible (CI/CD, coverage).
- Contenedor DB sin plantilla Compose oficial.
- Falta cross-check de dependencias desactualizadas.

### Recomendaciones
1. **CI**: configurar GitHub Actions con tareas: lint + test + build.
2. **Docker Compose**: plantilla en `/infra/docker-compose.yml` para backend + db + pgAdmin si se desea.
3. **Quality Gates**: cobertura mínima y auditoría de dependencias (npm audit / snyk).

## Siguientes pasos sugeridos

1. **ADR-0001**: formalizar la decisión de adoptar Domain Services + Factories (archivo añadido en esta iteración).
2. **Blueprint de Design System**: documento base con tokens, componentes y pautas (ver `docs/design/THEME_SYSTEM_BLUEPRINT.md`).
3. **Plan de ejecución por fases** (ver plan maestro compartido):
   - Fase 1: refactor backend hacia Domain Services.
   - Fase 2: Design System + UI library.
   - Fase 3: Automatizaciones y pruebas.
4. **Revisión periódica**: al finalizar cada fase, documentar resultados en `docs/architecture/changelog.md` (por crear).

- **Estado actual**: ✅ Auditoría lista.
- **Acción siguiente**: confirmar fase 1 (extensión Domain Services) o ajustar plan según feedback.


