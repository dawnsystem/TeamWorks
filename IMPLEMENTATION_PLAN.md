# Plan de Implementación - Mejoras de Etiquetas y Búsqueda

**Fecha**: 19 de Octubre de 2025  
**Estado**: En Ejecución

---

## 📋 Resumen de Requisitos

Del análisis del problema planteado, se identifican estas necesidades:

### 1. Mejoras de Etiquetas
- ✅ **Estado Actual**: Etiquetas visibles en TaskItem pero solo gestionables vía menú contextual
- ❌ **Problema**: No hay tooltips al pasar el ratón, no hay forma directa de añadir etiquetas
- ✅ **Solución**: Mejorar la visibilidad y accesibilidad de las etiquetas

### 2. Barra de Búsqueda Mejorada
- ❌ **Estado Actual**: Barra de búsqueda existe pero no busca nada
- ❌ **Problema**: No busca tareas, ni menús, ni configuraciones, ni acciones
- ✅ **Solución**: Implementar command palette estilo VSCode con búsqueda inteligente

---

## 🎯 Objetivos Específicos

### Fase 1: Mejoras de Etiquetas

#### 1.1 Tooltip Mejorado en TaskItem
**Objetivo**: Al pasar el ratón sobre las etiquetas, mostrar tooltip con todas las etiquetas

**Implementación**:
- Componente: `client/src/components/TaskItem.tsx`
- Agregar tooltip con biblioteca (o HTML title nativo)
- Mostrar lista completa de etiquetas si hay más de las visibles

**Estimación**: 1 hora

#### 1.2 Gestión Visual de Etiquetas en TaskEditor  
**Objetivo**: Mejorar la interfaz para añadir/quitar etiquetas

**Mejoras**:
- ✅ Ya existe selector de etiquetas (líneas 225-258)
- ➕ Añadir botón "Crear nueva etiqueta" en TaskEditor
- ➕ Añadir búsqueda/filtro de etiquetas si hay muchas
- ➕ Mostrar etiquetas seleccionadas más prominentemente

**Estimación**: 2 horas

#### 1.3 Gestión Rápida de Etiquetas
**Objetivo**: Crear modal/sidebar para gestionar etiquetas del sistema

**Componente Nuevo**: `client/src/components/LabelManager.tsx`

**Funcionalidades**:
- Listar todas las etiquetas
- Crear nueva etiqueta con selector de color
- Editar etiqueta existente (nombre y color)
- Eliminar etiqueta
- Ver contador de tareas por etiqueta

**Estimación**: 3 horas

#### 1.4 Filtro de Etiquetas en Dashboard
**Objetivo**: Permitir filtrar tareas por etiquetas desde la vista principal

**Implementación**:
- Añadir botones de filtro rápido en TopBar o Sidebar
- Permitir selección múltiple de etiquetas
- Filtrado en tiempo real

**Estimación**: 2 horas

---

### Fase 2: Command Palette (Búsqueda Avanzada)

#### 2.1 Componente Command Palette
**Objetivo**: Crear command palette estilo VSCode

**Componente Nuevo**: `client/src/components/CommandPalette.tsx`

**Características**:
- Modal centrado con input de búsqueda
- Lista de resultados categorizados
- Navegación con teclado (↑↓ Enter Esc)
- Fuzzy search
- Iconos por categoría

**Categorías de Búsqueda**:
1. **Tareas** - Buscar por título/descripción
2. **Proyectos** - Ir a proyecto
3. **Etiquetas** - Filtrar por etiqueta
4. **Acciones** - Ejecutar acciones (Nueva tarea, Configuración, etc.)
5. **Vistas** - Ir a vista (Hoy, Semana, etc.)

**Estimación**: 4 horas

#### 2.2 Sistema de Búsqueda
**Objetivo**: Implementar búsqueda fuzzy y filtros inteligentes

**Utilidad Nueva**: `client/src/utils/search.ts`

**Funcionalidades**:
- Fuzzy matching para búsqueda tolerante a errores
- Filtros inteligentes:
  - `p:Trabajo` - Buscar en proyecto Trabajo
  - `#urgente` - Buscar con etiqueta urgente
  - `@hoy` - Tareas de hoy
  - `!alta` - Prioridad alta
- Combinación de filtros
- Historial de búsquedas

**Estimación**: 3 horas

#### 2.3 Acciones Rápidas
**Objetivo**: Permitir ejecutar acciones desde el command palette

**Acciones Disponibles**:
- `Nueva tarea` - Abrir TaskEditor
- `Nueva tarea en [proyecto]` - Crear en proyecto específico
- `Ir a Configuración` - Abrir Settings
- `Ir a Hoy` - Navegar a vista Hoy
- `Ir a Semana` - Navegar a vista Semana
- `Abrir asistente IA` - Abrir AIAssistant
- `Tema oscuro/claro` - Toggle tema
- `Ayuda` - Abrir HelpModal

**Estimación**: 2 horas

#### 2.4 Integración con TopBar
**Objetivo**: Reemplazar búsqueda actual con command palette

**Cambios en**: `client/src/components/TopBar.tsx`

**Implementación**:
- Al hacer click en búsqueda, abrir CommandPalette
- Atajo de teclado: `Cmd/Ctrl + P` o `Cmd/Ctrl + K`
- Mantener diseño visual consistente

**Estimación**: 1 hora

---

## 📁 Estructura de Archivos

### Nuevos Archivos a Crear

```
client/src/
├── components/
│   ├── CommandPalette.tsx          ← Nuevo (200-300 líneas)
│   ├── LabelManager.tsx            ← Nuevo (150-200 líneas)
│   ├── LabelPicker.tsx             ← Nuevo (100 líneas)
│   └── QuickFilters.tsx            ← Nuevo (100 líneas)
├── utils/
│   ├── search.ts                   ← Nuevo (150 líneas)
│   └── fuzzyMatch.ts               ← Nuevo (50 líneas)
├── hooks/
│   ├── useCommandPalette.ts        ← Nuevo (80 líneas)
│   └── useSearch.ts                ← Nuevo (100 líneas)
└── store/
    └── useStore.ts                 ← Modificar (añadir stores)
```

### Archivos a Modificar

```
client/src/
├── components/
│   ├── TopBar.tsx                  ← Modificar búsqueda
│   ├── TaskItem.tsx                ← Añadir tooltips
│   ├── TaskEditor.tsx              ← Mejorar label UI
│   ├── Sidebar.tsx                 ← Añadir filtros rápidos
│   └── Dashboard.tsx               ← Integrar CommandPalette
└── hooks/
    └── useKeyboardShortcuts.ts     ← Añadir Cmd+P
```

---

## 🎨 Diseño UI/UX

### Command Palette

```
┌─────────────────────────────────────────┐
│ 🔍 Buscar tareas, acciones...           │
├─────────────────────────────────────────┤
│                                         │
│ 📝 TAREAS                               │
│   ✓ Comprar leche (Hoy, Personal)     │
│   ○ Escribir informe (Mañana, Trabaj..)│
│                                         │
│ 📂 PROYECTOS                            │
│   📁 Trabajo (15 tareas)               │
│   📁 Personal (8 tareas)               │
│                                         │
│ 🏷️ ETIQUETAS                            │
│   🏷️ urgente (5 tareas)                │
│   🏷️ importante (12 tareas)            │
│                                         │
│ ⚡ ACCIONES                             │
│   ➕ Nueva tarea                        │
│   ⚙️ Configuración                     │
│   🌙 Cambiar tema                      │
│                                         │
└─────────────────────────────────────────┘
```

### Label Manager Modal

```
┌────────────────────────────────────────┐
│  🏷️ Gestionar Etiquetas          [X]   │
├────────────────────────────────────────┤
│                                        │
│  [🔍 Buscar etiqueta...]               │
│                                        │
│  📋 MIS ETIQUETAS                      │
│                                        │
│  🔴 urgente              [5 tareas]    │
│      ✏️ Editar  🗑️ Eliminar            │
│                                        │
│  🟡 importante           [12 tareas]   │
│      ✏️ Editar  🗑️ Eliminar            │
│                                        │
│  🔵 opcional             [3 tareas]    │
│      ✏️ Editar  🗑️ Eliminar            │
│                                        │
│  [+ Nueva Etiqueta]                    │
│                                        │
└────────────────────────────────────────┘
```

---

## 🔧 Detalles Técnicos

### Fuzzy Search Algorithm

**Biblioteca**: Usar `fuse.js` o implementación custom

```typescript
interface SearchResult<T> {
  item: T;
  score: number;
  matches: Array<{
    key: string;
    indices: number[][];
  }>;
}

function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: string[]
): SearchResult<T>[];
```

### Store para Command Palette

```typescript
interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  recentSearches: string[];
  openPalette: () => void;
  closePalette: () => void;
  setQuery: (query: string) => void;
  selectNext: () => void;
  selectPrev: () => void;
  addToHistory: (query: string) => void;
}
```

### Filtros Inteligentes

```typescript
interface SmartFilter {
  prefix: string;
  description: string;
  parse: (value: string) => FilterCondition;
}

const filters: SmartFilter[] = [
  {
    prefix: 'p:',
    description: 'Proyecto',
    parse: (value) => ({ project: value })
  },
  {
    prefix: '#',
    description: 'Etiqueta',
    parse: (value) => ({ label: value })
  },
  {
    prefix: '@',
    description: 'Fecha',
    parse: (value) => ({ date: parseDate(value) })
  },
  {
    prefix: '!',
    description: 'Prioridad',
    parse: (value) => ({ priority: parsePriority(value) })
  }
];
```

---

## ✅ Checklist de Implementación

### Fase 1: Etiquetas (8 horas)

- [ ] 1.1 Tooltip en TaskItem (1h)
  - [ ] Añadir biblioteca de tooltips o usar nativo
  - [ ] Implementar tooltip con lista completa
  - [ ] Probar en diferentes navegadores
  
- [ ] 1.2 Mejorar TaskEditor (2h)
  - [ ] Añadir botón "Nueva etiqueta"
  - [ ] Implementar búsqueda de etiquetas
  - [ ] Mejorar visualización de seleccionadas
  
- [ ] 1.3 LabelManager (3h)
  - [ ] Crear componente base
  - [ ] Implementar CRUD de etiquetas
  - [ ] Integrar con modal system
  
- [ ] 1.4 Filtros en Dashboard (2h)
  - [ ] Añadir UI de filtros
  - [ ] Implementar lógica de filtrado
  - [ ] Persistir filtros activos

### Fase 2: Command Palette (10 horas)

- [ ] 2.1 CommandPalette Component (4h)
  - [ ] Crear estructura base
  - [ ] Implementar navegación con teclado
  - [ ] Añadir categorías de resultados
  - [ ] Estilizar con animaciones
  
- [ ] 2.2 Sistema de Búsqueda (3h)
  - [ ] Implementar fuzzy matching
  - [ ] Crear sistema de filtros
  - [ ] Añadir historial
  - [ ] Optimizar performance
  
- [ ] 2.3 Acciones Rápidas (2h)
  - [ ] Definir acciones disponibles
  - [ ] Implementar handlers
  - [ ] Añadir iconos y descripciones
  
- [ ] 2.4 Integración TopBar (1h)
  - [ ] Conectar con TopBar
  - [ ] Añadir atajos de teclado
  - [ ] Testing de integración

### Fase 3: Testing y Documentación (4 horas)

- [ ] Testing Manual
  - [ ] Probar todas las funcionalidades de etiquetas
  - [ ] Probar command palette con diferentes búsquedas
  - [ ] Verificar atajos de teclado
  - [ ] Probar en modo oscuro
  - [ ] Probar en diferentes tamaños de pantalla
  
- [ ] Documentación
  - [ ] Actualizar README con nuevas funcionalidades
  - [ ] Actualizar GUIA_IA.md si aplica
  - [ ] Crear sección en HelpModal
  - [ ] Actualizar DEVELOPER_GUIDE.md
  - [ ] Documentar atajos de teclado

---

## 📊 Tiempo Estimado

| Fase | Tiempo |
|------|--------|
| Fase 1: Etiquetas | 8 horas |
| Fase 2: Command Palette | 10 horas |
| Fase 3: Testing y Docs | 4 horas |
| **Total** | **22 horas** |

---

## 🎯 Priorización

### Must Have (MVP)
1. ✅ CommandPalette básico con búsqueda de tareas
2. ✅ Búsqueda fuzzy funcional
3. ✅ Acciones rápidas básicas
4. ✅ Tooltips de etiquetas
5. ✅ Mejorar gestión de etiquetas en TaskEditor

### Should Have
1. Filtros inteligentes completos
2. LabelManager completo
3. Historial de búsquedas
4. Filtros rápidos en dashboard

### Nice to Have
1. Búsqueda de menús y configuraciones
2. Sugerencias contextuales
3. Analytics de búsquedas
4. Atajos personalizables

---

## 🚀 Plan de Ejecución

### Día 1 (8h)
- **Mañana (4h)**: Fase 1.1 y 1.2 - Tooltips y mejoras TaskEditor
- **Tarde (4h)**: Fase 1.3 - LabelManager completo

### Día 2 (8h)
- **Mañana (4h)**: Fase 2.1 - CommandPalette estructura base
- **Tarde (4h)**: Fase 2.2 - Sistema de búsqueda fuzzy

### Día 3 (6h)
- **Mañana (3h)**: Fase 2.3 y 2.4 - Acciones e integración
- **Tarde (3h)**: Fase 3 - Testing y documentación

---

## 📝 Notas de Implementación

### Consideraciones de Performance
- Debounce en búsqueda (300ms)
- Virtualización si hay muchos resultados (>100)
- Caché de resultados de búsqueda
- Lazy loading de componentes pesados

### Consideraciones de UX
- Feedback visual inmediato
- Estados de carga sutiles
- Animaciones suaves (< 200ms)
- Accesibilidad (ARIA labels, navegación por teclado)
- Mobile-friendly (responsive)

### Consideraciones de Seguridad
- Sanitizar inputs de búsqueda
- Validar filtros antes de aplicar
- Rate limiting en búsquedas (si aplica)

---

**Última Actualización**: 19 de Octubre de 2025  
**Estado**: 📋 Plan Aprobado - Listo para Implementar
