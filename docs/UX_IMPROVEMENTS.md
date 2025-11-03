# Guía de Mejoras UX

## Resumen

- Tema visual renovado con fondo en degradado, superficies translúcidas y sombras suaves.
- Cartas y modales con efecto "glassmorphism" para aportar profundidad sin perder claridad.
- Inputs elevados con foco realzado y personalización de date/time pickers.
- Estados vacíos inspiradores con llamada a la acción para crear la primera tarea.
- Skeletons y badges optimizados para la nueva paleta.

## Componentes clave

- `TaskItem` y `TaskItemSkeleton`: usan `glass-card`, sombras suaves y badges con blur.
- `TaskList`: estado vacío con tarjeta motivadora y botón de creación.
- `TaskEditor` y `LabelModal`: modales translúcidos (`glass-modal`), inputs elevados y botones brand.

## Estilos globales

- Nuevas variables CSS (`--glass-surface`, `--accent-600`, `--priority-*`).
- Botones utilitarios (`.btn-primary`, `.btn-secondary`), badges suaves y utilidad `input-elevated`.
- Scrollbars estilizadas y fondos específicos para modo claro/oscuro.

## Próximos pasos sugeridos

- Extender la misma estética al resto de modales (por ejemplo, `SectionManager`).
- Incorporar animaciones suaves al panel lateral y a las notificaciones.
- Documentar paletas en `tailwind.config.js` para personalización futura.

