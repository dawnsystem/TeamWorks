# Guía de Componentes UI

Esta guía resume las normas de uso del sistema de diseño y ofrece ejemplos rápidos por componente.

## Convenciones generales
- **Naming:** componentes en PascalCase; reutilizables residen en `client/src/components/ui`.
- **Imports:** preferir `import { Button } from '@/components/ui'`; evita duplicar variantes locales.
- **Props comunes:**
  - `size`: `sm | md | lg` (por defecto `md`).
  - `variant`: según componente (`primary | secondary | ghost | danger` en botones).
  - `tone`: reservado para futuros estados temáticos.
- **Tokens:** todo espaciado, radios y sombras provienen de `spacingTokens`, `radiiTokens`, `shadowTokens`.

## Componentes

### Button
- Variantes: `primary`, `secondary`, `ghost`, `danger`.
- Tamaños: `sm`, `md`, `lg`.
- Siempre respeta `disabled` para accesibilidad (cursor `not-allowed`, opacidad reducida).

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">Aceptar</Button>
<Button variant="secondary" size="sm" onClick={handleCancel}>Cancelar</Button>
```

### Modal
- Layout estándar con `title`, `description`, `footer` opcional y `size` (`sm | md | lg | xl`).
- Accesibilidad: foco inicial, trap de tabulación, cierre con `Esc`, overlay clickable, restauración de foco.
- Usa `ScrollArea` para contenido largo.

```tsx
import { Modal, Button } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={close}
  title="Editar tarea"
  size="lg"
  footer={
    <>
      <Button variant="secondary" onClick={close}>Cancelar</Button>
      <Button onClick={submit}>Guardar</Button>
    </>
  }
>
  <ScrollArea className="max-h-[60vh]">
    {/* contenido */}
  </ScrollArea>
</Modal>
```

### Card
- Contenedor base con `ui-card`; admite `className` para personalizaciones.
- Ideal para paneles, resúmenes, resultados.

```tsx
import { Card } from '@/components/ui';

<Card className="space-y-3">
  <h3 className="text-lg font-semibold">Resumen</h3>
  <p className="text-sm text-gray-500">Detalle de actividad semanal.</p>
</Card>
```

### ScrollArea
- Proporciona estilos consistentes de scrollbar (`scrollbar-thin`) y evita saltos de layout.
- Úsalo en listas dentro de modales, paneles laterales y secciones acotadas.

```tsx
import { ScrollArea } from '@/components/ui';

<ScrollArea className="max-h-72">
  <ul className="space-y-2">
    {items.map((item) => <li key={item.id}>{item.label}</li>)}
  </ul>
</ScrollArea>
```

### Input
- Utiliza la clase `input-elevated` y soporta los atributos nativos (`type`, `placeholder`, etc.).
- Usa siempre label asociado (`<label>` con `htmlFor`) para accesibilidad.

```tsx
import { Input } from '@/components/ui';

<label htmlFor="project-name" className="text-sm font-medium text-gray-700">
  Nombre del proyecto
</label>
<Input id="project-name" placeholder="Ej: Proyecto Alpha" />
```

### Select
- Mantiene la estética de los inputs y soporta todas las opciones nativas.
- Recuerda incluir una opción por defecto (`value=""`) cuando corresponda.

```tsx
import { Select } from '@/components/ui';

<label htmlFor="priority" className="text-sm font-medium text-gray-700">
  Prioridad
</label>
<Select id="priority" defaultValue="">
  <option value="" disabled>
    Selecciona prioridad
  </option>
  <option value="1">Alta</option>
  <option value="2">Media</option>
  <option value="3">Baja</option>
</Select>
```

## Checklist de QA visual
- [ ] ¿El componente proviene de `components/ui`?
- [ ] ¿Se usan spacing/radius/shadow tokens y clases consistentes?
- [ ] ¿El modal (si aplica) mantiene accesibilidad (focus, Esc, overlay)?
- [ ] ¿Inputs y selects tienen etiqueta, placeholder claro y contrastan con el fondo?
- [ ] ¿Los estados `disabled`, `hover`, `focus` son visibles y accesibles?
- [ ] ¿El diseño respeta contraste mínimo AA (texto vs fondo)?
- [ ] ¿Se documentó el componente (Storybook y/o ejemplos en esta guía)?

## Próximos componentes
- `Tabs`, `Tooltip`, `Badge` (siguientes iteraciones).
- Documentar patrones de `Sidebar`/`Paneles` una vez migrados.


