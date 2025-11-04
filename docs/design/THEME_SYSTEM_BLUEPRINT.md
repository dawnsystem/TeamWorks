# Blueprint — Design System & Theming

## Objetivos
- Garantizar que cada nueva funcionalidad respete el look&feel existente.
- Eliminar duplicación de estilos adhoc (scrolls, modales, tarjetas, etc.).
- Preparar la base para temas futuros (corporativos, accesibles, alto contraste).

## 1. Tokens

- Archivo propuesto: `client/src/design/tokens.ts`.
- Contendrá valores neutrales (spacing, radii, sombras, tipografía) y paleta base.

### Tabla inicial de tokens

| Token                | Valor inicial | Uso                                                    |
|----------------------|---------------|--------------------------------------------------------|
| `spacing.xs`         | `0.375rem`    | Margen/padding en chips, icon buttons                  |
| `spacing.sm`         | `0.5rem`      | Inputs, inner spacing                                  |
| `spacing.md`         | `0.75rem`     | Cards, modales                                         |
| `spacing.lg`         | `1rem`        | Layout principal, secciones                            |
| `radius.sm`          | `0.5rem`      | Badges, inputs                                         |
| `radius.md`          | `0.75rem`     | Cards, dropdowns                                      |
| `radius.lg`          | `1rem`        | Modales, paneles flotantes                             |
| `shadow.soft`        | `0 15px 30px -18px rgba(15,23,42,0.3)` | Hover cards, menús                                     |
| `shadow.strong`      | `0 45px 90px -35px rgba(15,23,42,0.45)`| Modales, Popovers                                       |
| `font.family`        | `var(--font-system)` | Declarado en CSS base (system fonts)             |
| `color.primary.500`  | hereda de acento actual | Botones principales, enlaces           |
| `color.primary.600`  | "                                             |
| `color.neutral.900`  | `#111827`    | Texto principal                                        |
| `color.neutral.600`  | `#4b5563`    | Texto muted                                            |
| `color.success.500`  | `#16a34a`    | Etiquetas/estados                                      |
| `color.warning.500`  | `#f59e0b`    | Avisos                                                 |
| `color.danger.500`   | `#dc2626`    | Errores / destrucción                                  |

## 2. Helpers y CSS Variables

- `client/src/design/applyTheme.ts`: función que toma tokens + preferencia (light/dark) y actualiza `document.documentElement`.
- `client/src/design/themeTypes.ts`: tipado de Theme (tokens + overrides).
- `client/src/design/defaultTheme.ts`: exporta tema base y versión dark.
- `index.css` usará variables provenientes de `applyTheme` (mantener compatibilidad con glass UI actual).

## 3. Librería de Componentes UI

- Directorio: `client/src/components/ui/*`.
- Componentes iniciales:
  - `Button`: variantes `primary`, `secondary`, `ghost`, `danger`.
  - `Card`: estilo glass + variantes.
  - `Modal`: layout estándar (header/body/footer), scroll interior consistente.
  - `ScrollArea`: envoltorio con estilos de scrollbar controlados.
  - `Tabs`, `Tooltip`, `Badge`, `Input`, `Select`.
  - `Surface`: contenedor con blur/gradient.
- Cada componente expone API clara y se documenta con ejemplos.

## 4. Hooks

- `useTheme`: get/set theme (light/dark/custom) + persistencia (localStorage).
- `useTokens`: acceso a tokens actuales, útil en styled components / inline styles.
- `useResponsiveLayout`: breakpoints reutilizables para layout.

## 5. Documentación

- Storybook (o alternativa ligera) para visualizar componentes y estados.
- Playbook `docs/design/COMPONENT_GUIDELINES.md` con:
  - Naming (PascalCase, `Ui` prefix opcional si se desea).
  - Props estándar (`size`, `variant`, `tone`).
  - Ejemplos de composición.

## 6. Migraciones escalonadas

1. **Tokens**: extraer valores actuales de `index.css` al nuevo módulo y consumirlos desde `applyTheme`.
2. **Componentes**: migrar componentes críticos (Button, Card, Modal) a la librería UI y reemplazar usos.
3. **Scrolls**: utilizar `ScrollArea` en vistas (`TaskDetailView`, `BoardColumn`, etc.).
4. **Modales**: unificar `LabelModal`, `TaskEditor`, `Settings` sobre el mismo layout base.
5. **Documentación**: generar historias y actualizar `UX_IMPROVEMENTS.md` con referencia a tokens.

## 7. Checklist de consistencia UI

- [ ] Todo nuevo componente debe declararse en `components/ui` o estar basado en uno existente.
- [ ] Scrollbars: usar `ScrollArea` o clases utilitarias centralizadas.
- [ ] Modales: deben invocar el layout base y respetar `spacing/radius/shadow` definidos.
- [ ] Inputs/Botones: utilizar tokens y variantes documentadas.
- [ ] Nuevas pantallas: validar contraste y tipografía con tokens.

## 8. Próximas acciones

- Crear los archivos `tokens.ts`, `defaultTheme.ts`, `applyTheme.ts`.
- Montar Storybook y documentar los primeros componentes.
- Definir un “lint” visual/estático opcional (ej. revisar importaciones desde `components/ui`).
- Convertir `Settings` a `Modal` base como piloto.


