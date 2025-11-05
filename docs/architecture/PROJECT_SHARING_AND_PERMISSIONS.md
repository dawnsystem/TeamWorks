# Project Sharing & Permissions (Blueprint)

## Objetivo
Permitir que un usuario propietario comparta sus proyectos con otros usuarios manteniendo el aislamiento actual (cada usuario conserva su propio workspace por defecto) y habilitando diferentes niveles de acceso.

## Casos de uso
- Compartir un proyecto con un compañero con permisos de edición para colaborar en tiempo real.
- Invitar a un stakeholder con permisos de solo lectura.
- Revocar o degradar permisos sin afectar otros proyectos.
- Identificar quién realizó cambios (auditoría básica).

## Modelo de datos propuesto
### Nueva tabla `project_shares`
| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | `cuid` | PK |
| `projectId` | `string` | FK → `projects.id` |
| `ownerId` | `string` | FK → `users.id` (redundancia para auditoría) |
| `sharedWithId` | `string` | FK → `users.id` |
| `role` | `enum('viewer','editor','manager')` | Permisos |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### Roles sugeridos
- `viewer`: puede ver proyecto, secciones, tareas y comentarios (solo lectura).
- `editor`: incluye `viewer` + crear/editar/eliminar tareas, subtareas, comentarios, recordatorios.
- `manager`: incluye `editor` + crear/editar/eliminar secciones, compartir/revocar accesos, gestionar etiquetas vinculadas.

### Auditoría
- Añadir campos `createdBy` / `updatedBy` en entidades críticas (tareas, comentarios, etc.) ya está parcial.
- Registrar eventos en `notifications` y emitir SSE cuando alguien nuevo se une.

## Backend
1. **Prisma schema**: nueva tabla `project_shares`, índices por `sharedWithId`, `projectId`.
2. **Servicios**:
   - `projectShareService`: create/revoke/update roles, listar colaboradores.
   - Middlewares reutilizables para validar permisos (p.ej. `requireProjectAccess(projectId, userId, 'editor')`).
3. **Rutas**:
   - `POST /projects/:id/share` (manager).
   - `PATCH /projects/:id/share/:shareId` (manager).
   - `DELETE /projects/:id/share/:shareId` (manager).
   - `GET /projects/:id/share` (manager).
4. **Controladores**: actualizar controllers existentes (`task`, `section`, `label`, `comment`, `reminder`) para evaluar permisos via servicio: si el usuario no es owner ni tiene share con rol suficiente, devolver 403.
5. **AI & Automatizaciones**: cuando IA genere tareas/secciones debe respetar permisos (solo `editor`/`manager`). Plan: reutilizar helper de permisos en `executeAIActions`.

## Frontend
1. **UI de compartición**:
   - Modal en la vista de proyecto: listar colaboradores, invitar por email, asignar rol.
   - Tooltip/badge para identificar roles en la UI.
2. **Estado**:
   - Guardar `shares` en React Query (clave `['project', projectId, 'shares']`).
   - Actualizar `useTasksTree` para permitir lectura si el usuario no es owner pero tiene share.
3. **Restricciones de UI**:
   - Deshabilitar acciones (botones de crear/eliminar) según rol.
   - Mostrar advertencia si el usuario intenta acciones fuera de su permiso.
4. **Notificaciones**:
   - Cuando se comparte un proyecto, notificar al invitado vía SSE para refrescar la lista.

## Seguridad
- Validar toda acción del backend usando `projectShareService` para evitar escalado.
- Limitar `role` a pocos valores y asegurar que solo el owner puede promover a `manager` o revocar.
- Logs de auditoría (opcional) para registrar cambios relevantes.

## Migración
1. Crear tabla `project_shares` con Prisma Migration.
2. Actualizar factories y servicios para incluir información de permisos en responses si es necesario (p.ej. `projectFactory` → `currentUserRole`).
3. Backfill: ninguno (inicialmente sin compartidos).

## Roadmap furturo
- Integración con IA Planner para asignar automáticamente tareas a colaboradores (opcional).
- Historial de cambios por usuario (auditoría avanzada).
- Compartir plantillas y etiquetas.


