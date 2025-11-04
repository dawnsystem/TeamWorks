# Architecture Changelog

## 2025-11-04 — Fase 1 (Servicios de Dominio)
- ✅ Incorporado `projectDomainService` con operaciones CRUD de proyectos y secciones.
- ✅ Creada `projectFactory` para normalizar respuestas.
- ✅ `projectController` delega en servicios/factories y emite eventos SSE con payloads consistentes.
- ✅ Añadidos `labelDomainService` y `labelFactory`; `labelController` usa la nueva capa y respuestas homogéneas.
- ✅ Añadidos `notificationDomainService` + `notificationFactory`; `notificationController` delega en la nueva capa y mantiene eventos SSE.
- ✅ Integrado con auditoría (`ARCHITECTURE_AUDIT_2025-11-04.md`) y ADR-0001.
- ✅ Creada librería UI inicial (`Button`, `Card`, `Modal`, `ScrollArea`) alineada con el sistema de diseño y aplicada en `Settings`.
- ✅ Refactor de comentarios con `commentDomainService` + `commentFactory`; controlador reducido a orquestación y normalización unificada.
- ✅ Recordatorios alineados con la capa de dominio (`reminderDomainService` + `reminderFactory`) y respuestas serializadas.
- ✅ `LabelModal`, modales de proyectos y `TaskEditor` migrados al kit de UI reutilizable con acciones en el footer y scroll consistente.
- ✅ Definidos tokens compartidos (`spacingTokens`, `radiiTokens`, `shadowTokens`) y guía de componentes UI.
- ✅ Storybook configurado (`npm run storybook`) con historia base de `Button` y script `lint:ui` para validar uso del kit.


