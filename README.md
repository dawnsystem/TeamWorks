# TeamWorks - Gestión de Tareas con IA

Aplicación web de gestión de tareas inspirada en Todoist, con un potente asistente de IA integrado que permite crear, modificar y gestionar tareas usando lenguaje natural.

## 🚀 Características

### Gestión de Tareas
- ✅ **Gestión completa de tareas** - Crear, editar, eliminar y organizar tareas
- 📁 **Proyectos y secciones** - Organiza tus tareas en proyectos con secciones
- 🏷️ **Etiquetas personalizables** - Categoriza tus tareas con etiquetas de colores
- ⭐ **Prioridades** - 4 niveles de prioridad (P1-P4) con colores distintivos
- 📅 **Fechas de vencimiento** - Programa tus tareas con fechas límite
- 🔄 **Subtareas infinitas** - Divide tareas grandes en subtareas más manejables (sin límite de profundidad)
- 💬 **Comentarios** - Añade notas y actualizaciones a tus tareas
- ⏰ **Recordatorios** - Programa recordatorios para no olvidar tus tareas
- 🎯 **Drag & Drop** - Reordena tareas arrastrándolas desde cualquier parte

### Asistente de IA Avanzado ✨
- 🤖 **Lenguaje natural** - Crea y gestiona tareas hablando normalmente
- 📝 **Creación completa** - Especifica proyecto, sección, etiquetas, fechas y subtareas en un comando
  - Ejemplo: *"añadir reunión con cliente en proyecto Trabajo sección Reuniones con etiqueta urgente para el próximo lunes"*
- 🔗 **Subtareas vía IA** - Crea subtareas directamente con comandos
  - Ejemplo: *"añadir diseñar mockups como subtarea de proyecto web"*
- 🎯 **Bulk actions** - Crea múltiples tareas a la vez
  - Ejemplo: *"crear 3 tareas: comprar pan, sacar basura y lavar ropa todas para hoy"*
- 🔄 **Actualización inteligente** - Cambia prioridad, fecha, proyecto de tareas existentes
  - Ejemplo: *"cambiar prioridad de comprar leche a alta"*
- 📅 **Fechas inteligentes** - Entiende "hoy", "mañana", "próximo lunes", "en 3 días", "en 2 semanas"
- 🔍 **Consultas** - Pregunta por tareas pendientes, de hoy, de la semana, etc.
- 🎉 **Auto-creación** - Proyectos, secciones y etiquetas se crean automáticamente si no existen
- 💬 **Comentarios** - Añade comentarios a tareas con comandos de voz
  - Ejemplo: *"añadir comentario en tarea comprar leche: verificar si queda algo"*
- ⏰ **Recordatorios** - Crea recordatorios directamente con la IA
  - Ejemplo: *"recordarme mañana a las 9am sobre reunión cliente"*

### Gestión Inteligente de Relaciones 🧠 (Próximamente)
- 🎊 **Popup inteligente** - Al completar la última subtarea, te preguntará:
  - ✅ ¿Completar también la tarea padre?
  - 💬 ¿Añadir un comentario de progreso?
  - ➕ ¿Crear una nueva subtarea? (por si olvidaste algo)
- 🔔 **Notificaciones contextuales** - El sistema te ayudará a mantener tus tareas organizadas

### Experiencia de Usuario
- 🌓 **Tema oscuro/claro** - Cambia entre temas según tu preferencia
- ⌨️ **Atajos de teclado** - Cmd/Ctrl+K (nueva tarea), Cmd/Ctrl+/ (IA), Esc (cerrar)
- ✨ **Animaciones suaves** - Interfaz fluida y agradable
- 📱 **PWA** - Instálala como app en tu dispositivo
- 🎨 **Personalizable** - Cambia colores, logo y tema a tu gusto

### Configuración y Acceso
- 🔐 **Multi-usuario** - Sistema de autenticación y datos separados por usuario
- 🌐 **Acceso en red local** - Accede desde cualquier dispositivo en tu red
- ⚙️ **Totalmente configurable** - Configura todo desde la UI sin tocar código
- 📖 **Manual integrado** - Ayuda y documentación accesible desde la app

## 🛠️ Tecnologías

### Backend
- Node.js + Express + TypeScript
- PostgreSQL con Prisma ORM
- JWT para autenticación
- Google Gemini AI (tier gratuito)

### Frontend
- React + TypeScript
- Vite como bundler
- TailwindCSS para estilos
- Zustand para gestión de estado
- React Query para caché y sincronización
- React Router para navegación
- DnD Kit para drag & drop (preparado)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- PostgreSQL 14+ (o Docker)
- API Key de Google Gemini (gratuita)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
cd TeamWorks
```

### 2. Instalar PostgreSQL

#### Opción A: Docker (Recomendado)
```bash
docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

#### Opción B: Instalación Local
- **Windows**: Descargar de [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql && brew services start postgresql`
- **Linux**: `sudo apt install postgresql && sudo systemctl start postgresql`

Crear base de datos:
```bash
createdb teamworks
```

### 3. Configurar Backend

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

**Obtener API Key de Groq (para IA):**
1. Ve a [Groq Console](https://console.groq.com)
2. Crea una cuenta gratuita
3. Ve a API Keys y crea una nueva key
4. Copia la key al archivo `.env` como `GROQ_API_KEY`

**Nota**: Groq ofrece acceso gratuito a modelos potentes como Llama 3.1 8B Instant, ideal para procesamiento de lenguaje natural.

Configurar base de datos:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Configurar Frontend

```bash
cd ../client
npm install
```

Crear archivo `.env` (opcional, se puede configurar desde la UI):
```env
VITE_API_URL=http://localhost:3000/api
```

## 🚀 Inicio Rápido

### Configuración Automática (Recomendado)

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

### Acceso desde Otro Dispositivo en Red

Si quieres acceder a TeamWorks desde tu móvil, tablet u otro ordenador en tu red local:

1. **Lee la guía completa**: [NETWORK_SETUP.md](NETWORK_SETUP.md)
2. **En resumen**:
   - Inicia el servidor en un PC
   - Abre TeamWorks en el otro dispositivo
   - Click en ⚙️ (Settings)
   - Configura la URL del API: `http://[IP-DEL-SERVIDOR]:3000/api`
   - Guarda y recarga
   - ¡Listo!

Para instrucciones detalladas, ver [NETWORK_SETUP.md](NETWORK_SETUP.md).

## 📚 Documentación

- **[QUICK_START.md](QUICK_START.md)** - Guía de inicio rápido
- **[SETUP.md](SETUP.md)** - Instalación detallada paso a paso
- **[NETWORK_SETUP.md](NETWORK_SETUP.md)** - ⭐ Configuración para acceso en red local
- **[ESTADO_IMPLEMENTACION.md](ESTADO_IMPLEMENTACION.md)** - Estado del proyecto
- **[SESION5_RESUMEN.md](SESION5_RESUMEN.md)** - ⭐ Últimas mejoras implementadas
- **Manual integrado** - Click en el botón ? dentro de la app

## 🚀 Ejecución

### Iniciar Backend

```bash
cd server
npm run dev
```

El servidor estará en `http://0.0.0.0:3000`

### Iniciar Frontend

```bash
cd client
npm run dev
```

El cliente estará en `http://0.0.0.0:5173`

Abre tu navegador en `http://localhost:5173`

## 🌐 Acceso en Red Local

⭐ **Nuevo**: Ahora puedes configurar la URL del servidor desde la interfaz de usuario sin editar archivos.

El servidor y cliente están configurados para escuchar en `0.0.0.0`, permitiendo acceso desde otros dispositivos en la red local.

### Configuración Simplificada (Recomendado):

1. Inicia el servidor en tu PC principal
2. Desde cualquier dispositivo en la red:
   - Abre un navegador
   - Navega a la aplicación
   - Click en el botón ⚙️ (Settings)
   - Configura "URL de la API": `http://[IP-DEL-PC]:3000/api`
   - Verifica conexión con el botón de test
   - Guarda cambios

**Ver guía completa**: [NETWORK_SETUP.md](NETWORK_SETUP.md)

### Método Manual (Avanzado):

1. Obtén tu IP local:
   - **Windows**: `ipconfig` (busca IPv4)
   - **Mac/Linux**: `ifconfig` o `ip addr`

2. Accede desde otro dispositivo:
   - Frontend: `http://TU_IP:5173`
   - Backend API: `http://TU_IP:3000/api`

3. Asegúrate de:
   - Permitir conexiones en el firewall (puertos 3000 y 5173)
   - Estar en la misma red WiFi

## 🤖 Uso del Asistente de IA

El asistente de IA puede interpretar comandos en lenguaje natural:

### Ejemplos de comandos:

```
"añadir comprar leche para mañana prioridad alta"
→ Crea tarea "Comprar leche" con P1 para mañana

"completar la tarea de hacer ejercicio"
→ Marca como completada la tarea que contiene "hacer ejercicio"

"qué tengo pendiente esta semana"
→ Muestra todas las tareas de los próximos 7 días

"eliminar todas las tareas completadas"
→ Elimina tareas marcadas como completadas

"crear proyecto de trabajo"
→ Crea un nuevo proyecto llamado "trabajo"
```

### Modos de ejecución:

- **Manual**: La IA sugiere acciones y tú las confirmas
- **Automático**: La IA ejecuta las acciones directamente (activar checkbox)

## 📱 Instalar como PWA

### En Escritorio (Chrome/Edge):
1. Haz clic en el icono de instalación en la barra de direcciones
2. Confirma "Instalar"

### En Móvil:
1. Abre el menú del navegador
2. Selecciona "Agregar a pantalla de inicio"

## 📁 Estructura del Proyecto

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
│   │   ├── types/         # Tipos TypeScript
│   │   └── main.tsx       # Punto de entrada
│   └── package.json
│
└── README.md
```

## 🎨 Características de UI

- **Diseño limpio** inspirado en Todoist
- **Colores de prioridad**:
  - P1 (Alta): Rojo
  - P2 (Media): Naranja
  - P3 (Baja): Azul
  - P4 (Ninguna): Gris
- **Vistas inteligentes**:
  - Inbox: Todas las tareas
  - Hoy: Tareas de hoy
  - Próximos 7 días: Tareas de la semana
- **Temas**: Modo claro y oscuro
- **Responsivo**: Funciona en móviles y tablets

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT
- Tokens con expiración configurable
- Validación en backend y frontend
- CORS configurado correctamente

## 🛠️ Comandos Útiles

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run prisma:studio # Abrir Prisma Studio (GUI de BD)
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Comprueba el `DATABASE_URL` en `.env`
- Ejecuta `npm run prisma:migrate` en el servidor

### Error de API de IA
- Verifica tu `GEMINI_API_KEY` en `.env`
- Comprueba que tengas cuota disponible en Google AI Studio
- La IA tiene un fallback: si falla, crea tareas simples

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en el puerto 3000
- Comprueba el `VITE_API_URL` en `.env` del cliente
- Revisa la consola del navegador para errores CORS

## 📝 Próximas Características

- [ ] Drag & drop para reordenar tareas
- [ ] Notificaciones push
- [ ] Colaboración en proyectos (compartir con otros usuarios)
- [ ] Exportar/importar datos
- [ ] Estadísticas de productividad
- [ ] Recordatorios automáticos
- [ ] Integración con calendarios
- [ ] App móvil nativa

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto como quieras.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**¡Disfruta organizando tus tareas con TeamWorks! 🚀**

