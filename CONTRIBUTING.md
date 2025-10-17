# Guía de Contribución a TeamWorks

¡Gracias por tu interés en contribuir a TeamWorks! Esta guía te ayudará a comenzar.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Proceso de Desarrollo](#proceso-de-desarrollo)
5. [Estándares de Código](#estándares-de-código)
6. [Proceso de Pull Request](#proceso-de-pull-request)
7. [Reportar Bugs](#reportar-bugs)
8. [Sugerir Mejoras](#sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un ambiente respetuoso y acogedor para todos. Ver [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 🤝 ¿Cómo Puedo Contribuir?

Hay muchas formas de contribuir a TeamWorks:

### 1. Reportar Bugs 🐛
- Usa la plantilla de issue para reportar bugs
- Incluye pasos detallados para reproducir
- Añade capturas de pantalla si es relevante
- Especifica tu entorno (OS, versión de Node, navegador)

### 2. Sugerir Mejoras 💡
- Abre un issue con la etiqueta "enhancement"
- Describe claramente la mejora propuesta
- Explica por qué sería útil
- Considera alternativas

### 3. Escribir Código 💻
- Corregir bugs reportados
- Implementar nuevas características
- Mejorar documentación
- Añadir tests

### 4. Mejorar Documentación 📚
- Corregir errores en documentos
- Añadir ejemplos
- Mejorar claridad
- Traducir contenido

### 5. Ayudar a Otros 🙋
- Responder preguntas en issues
- Revisar pull requests
- Compartir conocimiento

---

## 🔧 Configuración del Entorno

### Prerrequisitos

- Node.js 18+ y npm
- PostgreSQL 14+
- Git
- Editor de código (recomendado: VS Code)

### Paso 1: Fork y Clonar

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU_USUARIO/TeamWorks.git
cd TeamWorks

# Añade el upstream
git remote add upstream https://github.com/dawnsystem/TeamWorks.git
```

### Paso 2: Instalar Dependencias

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Paso 3: Configurar Base de Datos

```bash
# Opción A: Docker
docker run --name teamworks-dev -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres

# Opción B: PostgreSQL local
createdb teamworks_dev
```

### Paso 4: Variables de Entorno

```bash
# server/.env
DATABASE_URL="postgresql://postgres:dev@localhost:5432/teamworks_dev"
JWT_SECRET="dev-secret-key-change-in-production"
GROQ_API_KEY="tu-groq-api-key"
FRONTEND_URL="http://localhost:5173"

# client/.env
VITE_API_URL=http://localhost:3000/api
```

### Paso 5: Ejecutar Migraciones

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

### Paso 6: Iniciar en Modo Desarrollo

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

---

## 🔄 Proceso de Desarrollo

### 1. Crear una Rama

```bash
# Actualiza main
git checkout main
git pull upstream main

# Crea una rama descriptiva
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 2. Hacer Cambios

- Escribe código limpio y mantenible
- Sigue los estándares de código del proyecto
- Añade tests para nuevas funcionalidades
- Actualiza documentación si es necesario

### 3. Commit Frecuentemente

```bash
git add .
git commit -m "tipo: descripción breve

Descripción más detallada si es necesario.
Explica el por qué, no el qué."
```

**Tipos de Commit**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma faltantes, etc.
- `refactor`: Refactorización de código
- `test`: Añadir tests
- `chore`: Tareas de mantenimiento

**Ejemplos**:
```bash
git commit -m "feat: añadir filtro de tareas por etiqueta

Implementa un nuevo endpoint GET /api/tasks/by-label/:labelId
que permite filtrar tareas por etiqueta específica."

git commit -m "fix: corregir error al eliminar subtareas

El bug ocurría cuando se intentaba eliminar una subtarea
que tenía subtareas anidadas."

git commit -m "docs: actualizar guía de instalación

Añade instrucciones para usuarios de Windows."
```

### 4. Ejecutar Tests

```bash
# Backend
cd server
npm test
npm run build

# Frontend
cd client
npm test
npm run lint
npm run build
```

### 5. Push a tu Fork

```bash
git push origin feature/nombre-descriptivo
```

---

## 📏 Estándares de Código

### TypeScript

```typescript
// ✅ Bien: Tipos explícitos
interface TaskCreateInput {
  titulo: string;
  descripcion?: string;
  prioridad: 'P1' | 'P2' | 'P3' | 'P4';
  projectId: string;
}

function createTask(data: TaskCreateInput): Promise<Task> {
  // implementación
}

// ❌ Evitar: Tipos any
function createTask(data: any): any {
  // implementación
}
```

### Nombres Descriptivos

```typescript
// ✅ Bien
const userAuthToken = generateAuthToken(user);
const isTaskCompleted = task.completada === true;

// ❌ Evitar
const uat = genToken(u);
const x = t.c === true;
```

### Funciones Pequeñas y Enfocadas

```typescript
// ✅ Bien: Función con responsabilidad única
function calculateTaskPriority(task: Task): number {
  const priorityMap = { P1: 4, P2: 3, P3: 2, P4: 1 };
  return priorityMap[task.prioridad] || 0;
}

// ❌ Evitar: Función que hace demasiado
function processTask(task: Task) {
  // 100 líneas de código con múltiples responsabilidades
}
```

### Comentarios Útiles

```typescript
// ✅ Bien: Explica el "por qué"
// Usamos un timeout de 30s para operaciones de IA debido a
// que el modelo puede tardar en procesar comandos complejos
const AI_TIMEOUT = 30000;

// ❌ Evitar: Explica el "qué" (obvio del código)
// Incrementa i en 1
i++;
```

### Manejo de Errores

```typescript
// ✅ Bien: Manejo específico de errores
try {
  await prisma.task.create(data);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe una tarea con ese nombre');
    }
  }
  throw new Error('Error al crear tarea');
}

// ❌ Evitar: Catch silencioso
try {
  await prisma.task.create(data);
} catch (error) {
  // No hace nada
}
```

### ESLint y Prettier

El proyecto usa ESLint y Prettier. Asegúrate de que tu código pasa:

```bash
# Frontend
cd client
npm run lint
```

---

## 🔀 Proceso de Pull Request

### 1. Antes de Abrir el PR

- ✅ Todos los tests pasan
- ✅ El código compila sin errores
- ✅ Has actualizado la documentación
- ✅ Has añadido tests si corresponde
- ✅ Tu rama está actualizada con main

```bash
# Actualizar tu rama con main
git checkout main
git pull upstream main
git checkout feature/tu-rama
git rebase main
```

### 2. Abrir el Pull Request

1. Ve a tu fork en GitHub
2. Haz clic en "Pull Request"
3. Completa la plantilla de PR:

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe cómo has probado los cambios.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] No hay warnings en consola
- [ ] He añadido tests que prueban mi cambio
- [ ] Todos los tests existentes pasan
```

### 3. Revisión de Código

- Responde a los comentarios de forma constructiva
- Realiza los cambios solicitados
- Actualiza tu PR con los cambios

```bash
# Hacer cambios solicitados
git add .
git commit -m "fix: aplicar sugerencias de revisión"
git push origin feature/tu-rama
```

### 4. Merge

Una vez aprobado:
- El maintainer hará merge de tu PR
- Puedes eliminar tu rama después del merge

```bash
git checkout main
git pull upstream main
git branch -d feature/tu-rama
```

---

## 🐛 Reportar Bugs

### Plantilla de Bug Report

```markdown
**Descripción del Bug**
Descripción clara y concisa del bug.

**Para Reproducir**
Pasos para reproducir:
1. Ve a '...'
2. Haz clic en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado**
Qué esperabas que sucediera.

**Capturas de Pantalla**
Si aplica, añade capturas que ayuden a explicar el problema.

**Entorno**
- OS: [ej. Windows 10, macOS 13, Ubuntu 22.04]
- Navegador: [ej. Chrome 120, Firefox 121]
- Node.js: [ej. v18.17.0]
- Version: [ej. 1.0.0]

**Información Adicional**
Cualquier otro contexto sobre el problema.
```

### Antes de Reportar

1. **Busca issues existentes** para evitar duplicados
2. **Intenta reproducir** en un entorno limpio
3. **Verifica la versión** - puede estar corregido en la última versión
4. **Revisa la documentación** por si es un problema de configuración

---

## 💡 Sugerir Mejoras

### Plantilla de Feature Request

```markdown
**¿Tu solicitud está relacionada con un problema?**
Descripción clara del problema. Ej: "Siempre me frustro cuando [...]"

**Describe la solución que te gustaría**
Descripción clara de qué quieres que suceda.

**Describe alternativas que hayas considerado**
Otras soluciones o características que hayas considerado.

**Contexto Adicional**
Cualquier otro contexto, capturas de pantalla, etc.
```

---

## 📚 Recursos para Contribuidores

### Documentación del Proyecto
- [README.md](README.md) - Visión general
- [SETUP.md](SETUP.md) - Guía de instalación
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Guía para desarrolladores
- [TESTING.md](TESTING.md) - Guía de testing
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Arquitectura

### Tecnologías
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [Express](https://expressjs.com/)
- [TailwindCSS](https://tailwindcss.com/)

### Herramientas Recomendadas
- [VS Code](https://code.visualstudio.com/) con extensiones:
  - ESLint
  - Prettier
  - Prisma
  - TypeScript and JavaScript Language Features
- [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/) para testing de API
- [Prisma Studio](https://www.prisma.io/studio) para inspección de BD

---

## 🎯 Áreas que Necesitan Ayuda

Siempre buscamos ayuda en:

- 🧪 **Testing**: Añadir más tests unitarios y de integración
- 📚 **Documentación**: Mejorar guías, añadir ejemplos
- 🌐 **Internacionalización**: Soporte multiidioma
- 🎨 **UI/UX**: Mejoras de interfaz y experiencia
- 🤖 **Sistema de IA**: Mejorar interpretación de comandos
- ⚡ **Performance**: Optimizaciones de rendimiento
- 🔒 **Seguridad**: Auditorías y mejoras de seguridad

---

## ❓ Preguntas

Si tienes preguntas sobre cómo contribuir:

1. Revisa esta guía y la documentación
2. Busca en issues cerrados por si ya fue respondida
3. Abre un nuevo issue con la etiqueta "question"
4. Sé específico y proporciona contexto

---

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el README.md del proyecto.

---

**¡Gracias por contribuir a TeamWorks!** 🚀

Tu ayuda hace que este proyecto sea mejor para todos.

---

**Mantenido por**: Equipo de Desarrollo TeamWorks  
**Última Actualización**: 17 de Octubre de 2025
