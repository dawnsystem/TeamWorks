# Plan de pruebas manuales (Fase 4)

## 1. Compartición de proyectos
- [ ] Propietario añade un colaborador como `viewer` y verifica acceso solo lectura.
- [ ] Propietario eleva permisos a `editor` y comprueba que puede crear/editar tareas.
- [ ] Gestor elimina a un colaborador y confirma que pierde acceso inmediatamente.
- [ ] Visualizar lista de colaboradores con roles correctos en el modal de compartir.

## 2. Planner IA y contextos
- [ ] Generar plan en modo automático y validar que usa el proveedor configurado.
- [ ] Modo interactivo: responder preguntas y convertir plan en tareas sin errores.
- [ ] Intentar crear tareas en proyectos compartidos como `viewer` (debe fallar) y como `editor` (debe funcionar).

## 3. Automatizaciones y permisos
- [ ] Crear tarea P1 sin fecha → se asigna fecha hoy y se muestra nota.
- [ ] Tarea sin sección en proyecto con sección única → se asigna automáticamente.
- [ ] Usuario `viewer` no puede crear secciones ni eliminar tareas (respuestas 403).

## 4. Métricas y rendimiento
- [ ] Consultar `/metrics` y verificar incremento de `totalRequests` tras navegar por la app.
- [ ] Revisar que `avgResponseTimeMs` esté por debajo de 200ms bajo carga normal.
- [ ] Confirmar que los errores se registran aumentando `totalErrors`.

## 5. Revisión general UI/DX
- [ ] Botón "Compartir" visible solo para propietario/gestor.
- [ ] Modal de compartir accesible: enfoque inicial en campo email.
- [ ] Storybook (`npm run storybook`) renderiza Tabs/Tooltip y nuevos ejemplos.
- [ ] Workflow CI pasa tras ejecutar `lint`, `lint:ui`, `tsc`, `storybook:build`, tests backend.


