# TeamWorks - Documentación Completa

> **Última actualización:** Octubre 2025  
> **Versión:** 2.2.0

Esta es la documentación unificada de TeamWorks. Aquí encontrarás toda la información necesaria para usar, configurar, desarrollar y contribuir al proyecto.

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Inicio Rápido](#inicio-rápido)
3. [Instalación Completa](#instalación-completa)
4. [Guía de Usuario](#guía-de-usuario)
5. [Asistente de IA](#asistente-de-ia)
6. [Acceso en Red Local](#acceso-en-red-local)
7. [Uso en Móviles y Tablets](#uso-en-móviles-y-tablets)
8. [Guía de Desarrollo](#guía-de-desarrollo)
9. [Testing](#testing)
10. [Contribuir](#contribuir)
11. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

TeamWorks es una aplicación web moderna de gestión de tareas con un potente asistente de IA integrado. Inspirada en Todoist, permite organizar proyectos, tareas, subtareas, etiquetas y mucho más usando una interfaz intuitiva o comandos de lenguaje natural.

### Características Principales

#### Gestión de Tareas
- ✅ **Gestión completa** - Crear, editar, eliminar y organizar tareas
- 📁 **Proyectos y secciones** - Organiza tus tareas en proyectos con secciones
- 🏷️ **Etiquetas personalizables** - Categoriza con etiquetas de colores
- ⭐ **Prioridades** - 4 niveles (P1-P4) con colores distintivos
- 📅 **Fechas de vencimiento** - Programa tus tareas
- 🔄 **Subtareas infinitas** - Sin límite de profundidad
- 💬 **Comentarios** - Añade notas a tus tareas
- ⏰ **Recordatorios** - Programa recordatorios
- 🎯 **Drag & Drop** - Reordena arrastrando

#### Asistente de IA ✨
- 🤖 **Lenguaje natural** - Crea y gestiona tareas hablando normalmente
- 📝 **Creación completa** - Especifica proyecto, sección, etiquetas, fechas
- 🔗 **Subtareas vía IA** - Crea subtareas con comandos
- 🎯 **Bulk actions** - Crea múltiples tareas a la vez
- 🔄 **Actualización inteligente** - Cambia prioridad, fecha, proyecto
- 📅 **Fechas inteligentes** - Entiende "hoy", "mañana", "próximo lunes"
- 🔍 **Consultas** - Pregunta por tareas pendientes

#### Experiencia de Usuario
- 🔍 **Command Palette** - Búsqueda universal (Cmd/Ctrl+P)
- 🎯 **Filtros inteligentes** - `p:proyecto` `#etiqueta` `@hoy` `!alta`
- 🌓 **Tema oscuro/claro** - Cambia según tu preferencia
- ⌨️ **Atajos de teclado** - Cmd/Ctrl+K, Cmd/Ctrl+P, Cmd/Ctrl+/
- 📱 **Diseño responsive** - Optimizado para móvil, tablet y escritorio
- 📱 **PWA** - Instálala como app en tu dispositivo
- 🎨 **Personalizable** - Cambia colores, logo y tema

#### Configuración y Acceso
- 🔐 **Multi-usuario** - Datos separados por usuario
- 🌐 **Acceso en red local** - Desde cualquier dispositivo en tu red
- ⚙️ **Totalmente configurable** - Todo desde la UI

### Tecnologías

**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, Groq AI  
**Frontend:** React, TypeScript, Vite, TailwindCSS, Zustand, React Query

---

## Inicio Rápido

### Requisitos
- Node.js 18+
- PostgreSQL 14+ (o Docker)
- API Key de Groq (gratuita)

### Instalación Automática

#### Windows
```bash
setup.bat
dev.bat
```

#### macOS/Linux
```bash
chmod +x setup.sh dev.sh
./setup.sh
./dev.sh
```

La aplicación estará disponible en `http://localhost:5173`

---

## Instalación Completa

### 1. PostgreSQL

#### Opción A: Docker (Recomendado)
```bash
docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

#### Opción B: Instalación Local
- **Windows**: [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql && brew services start postgresql`
- **Linux**: `sudo apt install postgresql && sudo systemctl start postgresql`

Crear base de datos:
```bash
createdb teamworks
```

### 2. Configurar Backend

```bash
cd server
npm install
```

Crear archivo `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
JWT_SECRET="cambia-este-secreto-por-algo-seguro"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
GROQ_API_KEY="tu-groq-api-key-aqui"
FRONTEND_URL="http://localhost:5173"
```

**Obtener API Key de Groq:**
1. Ve a [Groq Console](https://console.groq.com)
2. Crea una cuenta gratuita
3. Ve a API Keys y crea una nueva
4. Copia la key al `.env` como `GROQ_API_KEY`

Configurar base de datos:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Configurar Frontend

```bash
cd ../client
npm install
```

Crear archivo `.env` (opcional):
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Ejecutar

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

---

## Guía de Usuario

### Crear Tareas

#### Desde la UI
1. Click en "Nueva Tarea" o presiona `Cmd/Ctrl+K`
2. Escribe el título
3. (Opcional) Añade descripción, fecha, prioridad, proyecto, etiquetas
4. Click en "Crear"

#### Con Asistente IA
1. Click en el icono de IA o presiona `Cmd/Ctrl+/`
2. Escribe tu comando en lenguaje natural
3. Confirma las acciones sugeridas (o activa ejecución automática)

### Organizar con Proyectos

1. Click en "Nuevo proyecto" en la sidebar
2. Escribe el nombre y elige un color
3. Las tareas pueden asignarse a proyectos
4. Los proyectos pueden tener secciones para mayor organización

### Usar Etiquetas

1. Click en el icono de etiqueta en la TopBar
2. Crea una etiqueta con nombre y color
3. Asigna etiquetas a tus tareas
4. Filtra tareas por etiqueta desde la sidebar

### Subtareas

1. Abre una tarea
2. Click en "Añadir subtarea"
3. Las subtareas pueden tener sus propias subtareas (infinitas)
4. Al completar la última subtarea, se te preguntará si quieres completar la tarea padre

### Command Palette

Presiona `Cmd/Ctrl+P` para abrir:
- Busca tareas por nombre
- Usa filtros: `p:trabajo`, `#urgente`, `@hoy`, `!alta`
- Ejecuta acciones rápidas
- Búsqueda fuzzy (tolerante a errores)

### Atajos de Teclado

- `Cmd/Ctrl+K` - Nueva tarea
- `Cmd/Ctrl+P` - Command Palette
- `Cmd/Ctrl+/` - Asistente IA
- `Cmd/Ctrl+B` - Toggle sidebar

---

## Asistente de IA

### Comandos Básicos

**Crear tareas:**
```
"añadir comprar leche para mañana prioridad alta"
"crear tarea llamar a Juan para hoy"
```

**Con proyectos y secciones:**
```
"añadir reunión con cliente en proyecto Trabajo sección Reuniones"
"crear diseñar logo en proyecto Web para el viernes"
```

**Con etiquetas:**
```
"añadir revisar documentos con etiqueta urgente para hoy"
"crear tarea comprar material etiquetas compras,personal"
```

**Crear múltiples tareas:**
```
"crear 3 tareas: comprar pan, sacar basura y lavar ropa todas para hoy"
```

**Subtareas:**
```
"añadir diseñar mockups como subtarea de proyecto web"
"crear subtarea revisar código en tarea implementar feature"
```

### Comandos Avanzados

**Actualizar tareas:**
```
"cambiar prioridad de comprar leche a alta"
"mover tarea reunión a proyecto Trabajo"
"cambiar fecha de llamar Juan a mañana"
```

**Completar tareas:**
```
"completar la tarea de hacer ejercicio"
"marcar como hecha comprar leche"
```

**Eliminar tareas:**
```
"eliminar la tarea comprar pan"
"borrar todas las tareas completadas"
```

**Consultar tareas:**
```
"qué tengo pendiente esta semana"
"muéstrame las tareas de hoy"
"cuáles son las tareas de alta prioridad"
```

**Añadir comentarios:**
```
"añadir comentario en tarea comprar leche: verificar si queda algo"
```

**Crear recordatorios:**
```
"recordarme mañana a las 9am sobre reunión cliente"
```

### Fechas Inteligentes

El asistente entiende:
- `hoy`, `mañana`, `pasado mañana`
- `lunes`, `martes`, etc. (próximo día de la semana)
- `próximo lunes`, `próximo viernes`
- `en 3 días`, `en 2 semanas`
- `el 25 de diciembre`

### Modo de Ejecución

**Manual (por defecto):**
- La IA sugiere acciones
- Tú las confirmas antes de ejecutar
- Más seguro para comandos complejos

**Automático:**
- Activa el checkbox "Auto-ejecutar"
- Las acciones se ejecutan directamente
- Más rápido para uso frecuente

---

## Acceso en Red Local

TeamWorks está completamente preparado para funcionar en red local sin configuración adicional.

### Configuración Automática (Recomendado)

1. Inicia el servidor en tu PC principal
2. Desde cualquier dispositivo en la red:
   - Abre un navegador
   - Navega a `http://[IP-DEL-PC]:5173`
   - Verás un banner naranja que detecta tu configuración
   - Haz click en "Configurar Automáticamente"
   - ¡Listo! Ya puedes iniciar sesión

### Configuración Manual

1. Desde cualquier dispositivo:
   - Abre la aplicación
   - Click en ⚙️ (Settings)
   - Configura "URL de la API": `http://[IP-DEL-PC]:3000/api`
   - Verifica conexión
   - Guarda cambios

### ¿Cómo encontrar la IP del servidor?

**Windows:**
```bash
ipconfig
# Busca "IPv4 Address" en tu adaptador de red activo
```

**macOS/Linux:**
```bash
ifconfig
# o
ip addr show
# Busca la IP que empieza con 192.168.x.x o 10.x.x.x
```

### Notas Importantes

- El servidor acepta automáticamente conexiones de IPs de red local
- CORS está configurado para red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- No necesitas editar archivos `.env` para acceso en red local
- Asegúrate de que el firewall permita las conexiones

---

## Uso en Móviles y Tablets

TeamWorks v2.2.0 incluye un diseño completamente responsive optimizado para dispositivos móviles y tablets.

### Características Móviles

#### Detección Automática
- La aplicación detecta automáticamente si estás usando móvil, tablet o escritorio
- La interfaz se adapta automáticamente para ofrecer la mejor experiencia

#### Navegación en Móvil
- **Barra superior compacta**: Menú hamburguesa, búsqueda y botones principales
- **Navegación inferior**: Acceso rápido a Inbox, Hoy, Semana, Proyectos e IA
- **Sidebar deslizable**: Se abre como overlay y se cierra automáticamente al navegar

#### Optimizaciones Móviles
- **Botones más grandes**: Áreas táctiles optimizadas para dedos
- **Texto legible**: Tamaños de fuente adaptados para pantallas pequeñas
- **Modales en pantalla completa**: Los diálogos usan toda la pantalla en móvil
- **Asistente IA expandido**: Panel de IA optimizado para pantallas pequeñas

#### Gestos Táctiles
- Desliza para abrir/cerrar sidebar
- Toca para seleccionar
- Mantén presionado para menú contextual (donde esté disponible)

### Instalar como PWA

#### En Android
1. Abre TeamWorks en Chrome
2. Toca el menú (⋮)
3. Selecciona "Añadir a pantalla de inicio"
4. Confirma

#### En iOS (Safari)
1. Abre TeamWorks en Safari
2. Toca el botón Compartir
3. Selecciona "Añadir a pantalla de inicio"
4. Confirma

#### En Escritorio
1. Abre TeamWorks en Chrome/Edge
2. Click en el icono de instalación en la barra de direcciones
3. Confirma "Instalar"

### Uso en Tablet

- **Interfaz híbrida**: Combina lo mejor de móvil y escritorio
- **Sidebar permanente** (opcional): En tablets grandes, la sidebar puede quedarse visible
- **Múltiples columnas**: Aprovecha el espacio extra para mostrar más información
- **Teclado y táctil**: Funciona perfectamente con ambos métodos de entrada

---

## Guía de Desarrollo

### Estructura del Proyecto

```
TeamWorks/
├── server/                 # Backend
│   ├── src/
│   │   ├── controllers/   # Controladores de rutas
│   │   ├── middleware/    # Middleware (auth, etc.)
│   │   ├── routes/        # Definición de rutas
│   │   ├── services/      # Lógica de negocio (IA)
│   │   └── index.ts       # Punto de entrada
│   ├── prisma/
│   │   └── schema.prisma  # Schema de BD
│   └── package.json
│
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas/vistas
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── lib/           # Utilidades y API client
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # Tipos TypeScript
│   │   └── main.tsx       # Punto de entrada
│   └── package.json
│
└── docs/                  # Documentación adicional
```

### Comandos de Desarrollo

**Backend:**
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run prisma:studio # Abrir Prisma Studio (GUI de BD)
npm run test         # Ejecutar tests
```

**Frontend:**
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter
npm run test         # Ejecutar tests
npm run test:ui      # Tests con interfaz
```

### Agregar una Nueva Característica

1. **Planificación**
   - Define el problema que resuelve
   - Diseña la solución
   - Considera el impacto en la base de datos

2. **Base de Datos**
   - Edita `server/prisma/schema.prisma` si es necesario
   - Crea migración: `npm run prisma:migrate`

3. **Backend**
   - Crea/actualiza controladores en `server/src/controllers/`
   - Añade rutas en `server/src/routes/`
   - Implementa lógica de negocio en `server/src/services/`

4. **Frontend**
   - Crea componentes en `client/src/components/`
   - Actualiza tipos en `client/src/types/`
   - Añade llamadas API en `client/src/lib/api.ts`
   - Crea hooks personalizados si es necesario

5. **Testing**
   - Escribe tests para backend
   - Escribe tests para componentes
   - Ejecuta suite completa de tests

6. **Documentación**
   - Actualiza este archivo si es necesario
   - Añade comentarios JSDoc en el código
   - Actualiza CHANGELOG.md

### Mejores Prácticas

- **TypeScript**: Usa tipos fuertes, evita `any`
- **Componentes**: Pequeños, reutilizables, con responsabilidad única
- **Estado**: Zustand para global, useState para local
- **Estilos**: TailwindCSS, clases utilitarias
- **Commits**: Mensajes descriptivos, commits atómicos
- **Testing**: Escribe tests para nuevas características

### Hooks Personalizados Útiles

- `useMediaQuery()` - Detectar tamaño de pantalla
- `useIsMobile()` - Detectar si es móvil
- `useIsTablet()` - Detectar si es tablet
- `useDeviceType()` - Obtener tipo de dispositivo
- `useKeyboardShortcuts()` - Gestionar atajos de teclado

---

## Testing

### Ejecutar Tests

**Backend:**
```bash
cd server
npm run test
```

**Frontend:**
```bash
cd client
npm run test          # Tests en terminal
npm run test:ui       # Tests con interfaz
npm run test:coverage # Tests con cobertura
```

### Escribir Tests

#### Tests de Componentes
```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Tests de API
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('GET /api/tasks', () => {
  it('returns tasks', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
  });
});
```

---

## Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

### 1. Fork y Clona
```bash
git clone https://github.com/TU-USUARIO/TeamWorks.git
cd TeamWorks
```

### 2. Crea una Rama
```bash
git checkout -b feature/nombre-caracteristica
```

### 3. Realiza Cambios
- Escribe código limpio y documentado
- Sigue las convenciones del proyecto
- Añade tests para nuevas características

### 4. Ejecuta Tests y Linters
```bash
# Backend
cd server
npm run test
npm run lint

# Frontend
cd client
npm run test
npm run lint
```

### 5. Commit
```bash
git add .
git commit -m "feat: descripción clara del cambio"
```

Usa prefijos:
- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formato, no cambio de código
- `refactor:` - Refactorización
- `test:` - Añadir tests
- `chore:` - Mantenimiento

### 6. Push y Pull Request
```bash
git push origin feature/nombre-caracteristica
```

Luego crea un Pull Request en GitHub con:
- Descripción clara del cambio
- Referencias a issues relacionados
- Screenshots si hay cambios visuales

### Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Ayuda a otros contribuyentes

---

## Solución de Problemas

### Error de Conexión a Base de Datos

**Síntomas:** `Error: Connection refused` o similar

**Soluciones:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Windows (en servicios)
   services.msc
   ```

2. Verifica el `DATABASE_URL` en `.env`
3. Ejecuta `npm run prisma:migrate` en el servidor
4. Si usas Docker, verifica que el contenedor esté corriendo:
   ```bash
   docker ps
   ```

### Error de API de IA

**Síntomas:** Comandos de IA no funcionan

**Soluciones:**
1. Verifica tu `GROQ_API_KEY` en `.env`
2. Comprueba que tengas cuota disponible en Groq Console
3. Revisa los logs del servidor para más detalles
4. La IA tiene un fallback: si falla, crea tareas simples

### Frontend No se Conecta al Backend

**Síntomas:** Errores CORS, timeout en peticiones

**Soluciones:**
1. Verifica que el backend esté corriendo en el puerto 3000
2. Comprueba el `VITE_API_URL` en `.env` del cliente
3. Revisa la consola del navegador para errores específicos
4. Si usas red local, verifica la configuración de IP
5. Asegúrate de que no haya firewall bloqueando las conexiones

### Problemas en Móvil

**Síntomas:** La interfaz no se ve bien en móvil

**Soluciones:**
1. Fuerza recarga de la página (Ctrl+Shift+R / Cmd+Shift+R)
2. Limpia la caché del navegador
3. Verifica que estás usando la última versión
4. Prueba en modo incógnito
5. Reinstala la PWA si está instalada

### Build Falla

**Síntomas:** `npm run build` da error

**Soluciones:**
1. Elimina `node_modules` y reinstala:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Verifica la versión de Node.js (debe ser 18+)
3. Revisa errores de TypeScript en el código
4. Ejecuta `npm run lint` para ver problemas de estilo

### La Aplicación es Lenta

**Soluciones:**
1. Limpia datos antiguos de la base de datos
2. Verifica que no haya muchas tareas sin completar
3. Cierra otros programas que consuman recursos
4. Si usas Docker, asigna más recursos al contenedor
5. Considera usar PostgreSQL local en lugar de Docker

### No Puedo Instalar como PWA

**Soluciones:**
1. Asegúrate de usar HTTPS o localhost
2. Verifica que el navegador soporte PWA
3. Comprueba que el manifest.json sea accesible
4. Revisa la consola para errores del Service Worker

---

## Información Adicional

### Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para historial completo de cambios.

### Licencia

MIT License - Siéntete libre de usar este proyecto como quieras.

### Contacto y Soporte

- **Issues:** [GitHub Issues](https://github.com/dawnsystem/TeamWorks/issues)
- **Discusiones:** [GitHub Discussions](https://github.com/dawnsystem/TeamWorks/discussions)

### Roadmap

Características planificadas:
- [ ] Notificaciones push
- [ ] Colaboración en proyectos (compartir con otros usuarios)
- [ ] Exportar/importar datos
- [ ] Estadísticas de productividad
- [ ] Recordatorios automáticos más avanzados
- [ ] Integración con calendarios (Google Calendar, Outlook)
- [ ] Temas personalizados avanzados
- [ ] App móvil nativa

---

**¡Gracias por usar TeamWorks! 🚀**

Si tienes preguntas o sugerencias, no dudes en abrir un issue o contribuir al proyecto.
