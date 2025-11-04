# Architecture Changelog

## 2025-11-04 — Fase 1 (Servicios de Dominio)
- ✅ Incorporado `projectDomainService` con operaciones CRUD de proyectos y secciones.
- ✅ Creada `projectFactory` para normalizar respuestas.
- ✅ `projectController` delega en servicios/factories y emite eventos SSE con payloads consistentes.
- ✅ Añadidos `labelDomainService` y `labelFactory`; `labelController` usa la nueva capa y respuestas homogéneas.
- ✅ Integrado con auditoría (`ARCHITECTURE_AUDIT_2025-11-04.md`) y ADR-0001.


