# Guía de Uso Móvil - TeamWorks

## 📱 Bienvenido a TeamWorks en tu dispositivo móvil

TeamWorks v2.2.0 está completamente optimizado para dispositivos móviles y tablets. Esta guía te ayudará a aprovechar al máximo la aplicación en tu smartphone o tablet.

---

## 🎯 Acceso Rápido

### Desde tu Móvil o Tablet

1. **Abre tu navegador** (Chrome, Safari, Firefox, Edge)
2. **Navega a la dirección de TeamWorks**:
   - En red local: `http://[IP-DEL-SERVIDOR]:5173`
   - En línea: La URL proporcionada por tu organización
3. **¡Listo!** La aplicación detecta automáticamente que estás en móvil

### Instalar como App (PWA)

#### En Android (Chrome/Edge)
1. Abre TeamWorks en el navegador
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona **"Añadir a pantalla de inicio"**
4. Confirma el nombre y toca **"Añadir"**
5. ¡Ya tienes TeamWorks como app! Búscala en tu escritorio

#### En iOS (Safari)
1. Abre TeamWorks en Safari
2. Toca el botón **Compartir** (icono de cuadrado con flecha)
3. Desplázate y selecciona **"Añadir a la pantalla de inicio"**
4. Edita el nombre si quieres y toca **"Añadir"**
5. ¡La app aparecerá en tu pantalla de inicio!

---

## 🧭 Navegación en Móvil

### Barra de Navegación Inferior

En la parte inferior de la pantalla verás 5 iconos:

```
┌─────────────────────────────────────────┐
│                                         │
│         (Contenido de la app)           │
│                                         │
└─────────────────────────────────────────┘
┌────┬────┬────┬────┬────┐
│ 📥 │ 📅 │ 📆 │ 📁 │ ✨ │
│Inbox│ Hoy│Sem │Proy│ IA │
└────┴────┴────┴────┴────┘
```

- **📥 Inbox**: Todas tus tareas
- **📅 Hoy**: Tareas para hoy
- **📆 Semana**: Tareas de los próximos 7 días
- **📁 Proyectos**: Ver tus proyectos (abre el menú lateral)
- **✨ IA**: Asistente de IA

### Menú Lateral (Sidebar)

#### Abrir el menú:
1. Toca el icono **☰** (hamburguesa) en la esquina superior izquierda
2. El menú se desliza desde la izquierda

#### Cerrar el menú:
- Toca el botón **✕** en el menú
- O toca fuera del menú (en el área oscura)
- El menú se cierra automáticamente al seleccionar un item

### Barra Superior

Elementos en la barra superior:

```
┌─────────────────────────────────────────┐
│ ☰  🔍 Buscar...    ⊕   ☀️  ⚙️         │
└─────────────────────────────────────────┘
```

- **☰**: Abrir menú lateral
- **🔍**: Buscar tareas (Command Palette)
- **⊕**: Crear nueva tarea
- **☀️/🌙**: Cambiar tema claro/oscuro
- **⚙️**: Configuración

---

## ✨ Características Específicas para Móvil

### 1. Pantalla Completa para el Asistente de IA

Al tocar el icono **✨ IA** en la barra inferior:
- Se abre un panel que ocupa casi toda la pantalla
- Mayor espacio para escribir comandos
- Más fácil de leer las respuestas
- Toca la **✕** o el fondo oscuro para cerrar

### 2. Botones Grandes y Táctiles

Todos los botones están optimizados para tocarlos con el dedo:
- Tamaño mínimo de 44x44 píxeles
- Espaciado adecuado entre elementos
- Sin riesgo de tocar el botón equivocado

### 3. Textos Legibles

- Fuentes optimizadas para pantallas pequeñas
- Alto contraste para leer en exteriores
- Sin texto demasiado pequeño

### 4. Modales Adaptados

Los diálogos y ventanas emergentes se adaptan:
- Ocupan más espacio en móvil
- Botones más grandes
- Fácil de cerrar tocando fuera o con la **✕**

---

## 📝 Crear y Gestionar Tareas en Móvil

### Crear una Tarea Rápida

1. Toca el botón **⊕** rojo en la esquina superior derecha
2. Escribe el título de la tarea
3. (Opcional) Añade detalles:
   - Fecha de vencimiento
   - Prioridad
   - Proyecto
   - Etiquetas
4. Toca **"Crear"**

### Usar el Asistente de IA

El asistente es especialmente útil en móvil:

1. Toca **✨ IA** en la barra inferior
2. Escribe tu comando en lenguaje natural:
   ```
   "añadir comprar leche para mañana prioridad alta"
   "crear 3 tareas: pan, huevos, jamón todas para hoy"
   "qué tengo pendiente esta semana"
   ```
3. Revisa las acciones sugeridas
4. Toca **"Ejecutar"** o activa auto-ejecución

### Completar una Tarea

- Toca el círculo **○** a la izquierda de la tarea
- Se marcará con ✓ y se tachará

### Ver Detalles de una Tarea

- Toca sobre el título de la tarea
- Se abre el panel de detalles
- Puedes ver/editar descripción, comentarios, subtareas

### Editar una Tarea

1. Toca la tarea para abrir detalles
2. Toca el icono de **editar** (lápiz)
3. Modifica lo que necesites
4. Toca **"Guardar"**

---

## 🔍 Búsqueda Rápida (Command Palette)

### Abrir el Command Palette

- Toca el campo **🔍 Buscar...** en la barra superior

### Buscar Tareas

Escribe parte del nombre de la tarea:
```
"comprar"  → Encuentra "Comprar leche", "Comprar pan"
```

### Usar Filtros

El Command Palette entiende filtros especiales:

- **Por proyecto**: `p:trabajo`
- **Por etiqueta**: `#urgente` o `etiqueta:personal`
- **Por fecha**: `@hoy`, `@semana`
- **Por prioridad**: `!alta`, `prioridad:media`

Ejemplos:
```
p:trabajo !alta        → Tareas de alta prioridad en proyecto "Trabajo"
#urgente @hoy          → Tareas urgentes para hoy
p:personal @semana     → Tareas personales de esta semana
```

---

## 📁 Organizar con Proyectos

### Ver Proyectos

1. Toca **☰** para abrir el menú lateral
2. Desplázate hasta la sección **"Proyectos"**
3. Toca un proyecto para ver sus tareas

### Crear un Proyecto

1. Abre el menú lateral
2. Toca **"Nuevo proyecto"**
3. Escribe el nombre y elige un color
4. Toca **"Crear"**

---

## 🏷️ Usar Etiquetas

### Ver Tareas por Etiqueta

1. Abre el menú lateral
2. Desplázate hasta **"Etiquetas"**
3. Toca una etiqueta para filtrar tareas

### Crear una Etiqueta

**Opción 1 - Desde configuración (Desktop):**
- Toca **⚙️** → **"Gestionar etiquetas"**

**Opción 2 - Con IA:**
```
"crear etiqueta urgente color rojo"
```

---

## ⚙️ Configuración en Móvil

### Acceder a Configuración

1. Toca **⚙️** en la esquina superior derecha
2. Se abre el panel de configuración

### Opciones Disponibles

- **URL de la API**: Configurar conexión al servidor
- **Tema**: Cambiar colores y logo
- **Groq API Key**: Configurar asistente de IA
- **Restaurar valores por defecto**

### Cambiar Tema Oscuro/Claro

- Toca el icono **☀️/🌙** en la barra superior
- Cambia instantáneamente

---

## 💡 Consejos para Usar en Móvil

### 1. Aprovecha el Asistente de IA
En móvil es más rápido dictar comandos que navegar por menús:
```
"añadir reunión mañana 10am proyecto trabajo"
```

### 2. Usa la Barra Inferior
Los elementos más usados están siempre accesibles con el pulgar:
- Inbox, Hoy, Semana, IA

### 3. Instala como PWA
La app instalada:
- Se abre más rápido
- Funciona sin barra del navegador
- Se siente como app nativa

### 4. Usa Command Palette
Es más rápido buscar que navegar:
- Toca 🔍 y escribe
- Los filtros son muy potentes

### 5. Gestiona en Lotes con IA
Crea múltiples tareas de una vez:
```
"crear 5 tareas: tarea1, tarea2, tarea3, tarea4, tarea5 todas para hoy"
```

---

## 🎨 Diferencias entre Dispositivos

### Smartphone (Móvil)

- **Navegación inferior** siempre visible
- **Menú lateral** como overlay
- **Asistente IA** en pantalla completa
- **Botones** optimizados para dedos
- **Textos** adaptados para pantalla pequeña

### Tablet

- **Navegación inferior** visible
- **Menú lateral** puede quedarse abierto
- **Asistente IA** en panel expandido
- **Dos columnas** en algunas vistas
- **Más información** visible a la vez

### Desktop/Laptop

- **Sin navegación inferior**
- **Menú lateral** fijo permanentemente
- **Asistente IA** en panel flotante
- **Atajos de teclado** disponibles
- **Vista completa** de la interfaz

---

## 🔧 Solución de Problemas

### La interfaz no se ve bien

1. **Fuerza recarga**: Mantén presionado el botón de recarga
2. **Limpia caché**: En ajustes del navegador
3. **Prueba modo incógnito**
4. **Reinstala la PWA** si está instalada

### Los botones son difíciles de tocar

- Asegúrate de tener la última versión
- Prueba en orientación vertical (no horizontal)
- Verifica el zoom del navegador (debe estar al 100%)

### El menú lateral no se abre

1. Toca el icono **☰** en la esquina superior izquierda
2. Si no funciona, recarga la página
3. Verifica que JavaScript esté habilitado

### La app es lenta en móvil

1. Cierra otras apps en segundo plano
2. Verifica tu conexión a internet
3. Limpia datos antiguos (tareas completadas antiguas)

---

## ✅ Checklist: Primera vez en Móvil

- [ ] Abre TeamWorks en tu navegador móvil
- [ ] Verifica que la barra inferior sea visible
- [ ] Abre el menú lateral tocando **☰**
- [ ] Crea una tarea con el botón **⊕**
- [ ] Prueba el asistente **✨ IA**
- [ ] Usa el Command Palette **🔍**
- [ ] Instala como PWA (opcional pero recomendado)
- [ ] Cambia entre tema claro/oscuro
- [ ] Explora tus proyectos en el menú lateral

---

## 🎉 ¡Disfruta TeamWorks en tu móvil!

Ahora puedes gestionar tus tareas desde cualquier lugar:
- En el bus 🚌
- En la cafetería ☕
- En el parque 🌳
- En la cama 🛏️
- ¡Donde sea! 🌍

**TeamWorks v2.2.0** está diseñado para que sea igual de cómodo y productivo en móvil que en escritorio.

---

**¿Necesitas ayuda?**
- Consulta la [Documentación Completa](./DOCUMENTATION.md)
- Abre un [Issue en GitHub](https://github.com/dawnsystem/TeamWorks/issues)

¡Feliz organización! 🚀
