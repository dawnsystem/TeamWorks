# ADR-0001: Consolidar Domain Services y Design System unificado

- **Fecha**: 2025-11-04
- **Estado**: Aprobado (Fase 0)
- **Revisores**: @project-manager, @quality-guardian, @product-strategist

## Contexto

- Los controladores del backend mezclan lógica de negocio, acceso a datos y serialización.
- El frontend carece de un Design System formal (tokens, componentes UI) y la tematización se replica manualmente.
- Necesitamos garantizar que futuras funcionalidades escalen sin romper consistencia.

## Decisión

1. **Backend**
   - Introducir servicios de dominio (`*/services/*DomainService.ts`) encargados de:
     - Orquestar reglas de negocio y acceso a Prisma.
     - Exponer métodos puros (ej: `fetchTasksForest`, `createTaskWithLabels`).
   - Utilizar *Factories/DTOs* (`*/factories`) para normalizar respuestas (ej: `taskFactory`, `projectFactory`).
   - Controladores quedarán como adaptadores HTTP (validación → servicio → factory → respuesta).

2. **Frontend**
   - Crear un **Design System** con tokens (`src/design/tokens.ts`), helpers (`applyTheme.ts`) y componentes UI base (`src/components/ui/*`).
   - Exponer hooks reutilizables (`useTasksTree`, `useTheme`, `useLayoutState`).
   - Documentar componentes/tokens en Storybook o documentación interna.

3. **Documentación**
   - Registrar cambios en `docs/architecture/changelog.md` (por crear durante la fase 1).
   - Mantener ADRs para decisiones relevantes futuras (ej: manejo de errores, theming avanzado).

## Beneficios

- Claridad de responsabilidades (single responsibility por capa).
- Reutilización y consistencia en API y UI.
- Facilidad para pruebas unitarias y de integración.
- Base sólida para incorporar nuevos módulos (colaboración, analytics, etc.).

## Riesgos / mitigaciones

- **Incremento inicial de trabajo**: mitigado dividiendo en fases y priorizando módulos críticos (tareas, proyectos, IA).
- **Desalineación de equipos**: mitigado documentando tokens, componentes y publicando guías.
- **Regresión de funcionalidad**: mitigado mediante suite de tests y CI automatizado.

## Plan de implementación

1. Extender `taskDomainService` y replicar patrón en projects/labels/notifications.
2. Crear factories complementarias (`projectFactory`, `sectionFactory`, etc.).
3. Construir tokens/base UI, migrar componentes críticos a la librería UI.
4. Documentar en `docs/design/*` y establecer guidelines en `CONTRIBUTING.md`.
5. Activar pipeline CI para asegurar calidad continua.


