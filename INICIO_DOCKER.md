# 🐳 Inicio Rápido con Docker Compose

## Requisitos Previos

- Docker Desktop instalado y en ejecución
- Al menos 2GB de RAM disponible
- 5GB de espacio en disco

## Pasos para Iniciar el Proyecto

### 1. Crear archivo de configuración (opcional)

Si quieres personalizar la configuración, crea un archivo `.env` en la raíz del proyecto:

```env
# Database Configuration
POSTGRES_DB=teamworks
POSTGRES_USER=teamworks
POSTGRES_PASSWORD=teamworks
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=production
BACKEND_PORT=3000
JWT_SECRET=tu-secreto-super-secreto-cambialo-en-produccion
LOG_LEVEL=info

# Frontend Configuration
FRONTEND_PORT=8080

# AI API Keys (opcional)
GROQ_API_KEY=
GEMINI_API_KEY=
```

**Nota:** Si no creas el archivo `.env`, se usarán los valores por defecto del `docker-compose.yml`.

### 2. Construir e iniciar los servicios

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
docker-compose up -d
```

Este comando:
- Construirá las imágenes de Docker para el frontend y backend
- Creará y iniciará los contenedores
- Configurará la base de datos PostgreSQL
- Ejecutará automáticamente las migraciones de Prisma
- Iniciará todos los servicios

### 3. Verificar que todo esté funcionando

Puedes ver los logs en tiempo real:

```bash
docker-compose logs -f
```

O verificar el estado de los servicios:

```bash
docker-compose ps
```

### 4. Acceder a la aplicación

Una vez que todos los servicios estén en ejecución:

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## Comandos Útiles

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Detener los servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ elimina los datos de la base de datos)
```bash
docker-compose down -v
```

### Reconstruir las imágenes
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
```

### Ejecutar comandos dentro de un contenedor
```bash
# Acceder al shell del backend
docker-compose exec backend sh

# Ejecutar migraciones manualmente (si es necesario)
docker-compose exec backend npx prisma migrate deploy

# Acceder a la base de datos
docker-compose exec database psql -U teamworks -d teamworks
```

## Solución de Problemas

### Los servicios no inician

1. Verifica que Docker Desktop esté en ejecución
2. Revisa los logs: `docker-compose logs`
3. Verifica que los puertos no estén en uso:
   - 3000 (backend)
   - 8080 (frontend)
   - 5432 (base de datos)

### Error de conexión a la base de datos

El script de inicio espera automáticamente a que la base de datos esté lista. Si hay problemas:

```bash
# Verifica el estado de la base de datos
docker-compose exec database pg_isready -U teamworks

# Revisa los logs del backend
docker-compose logs backend
```

### Reconstruir desde cero

Si tienes problemas persistentes:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Notas Importantes

- La primera vez que ejecutes `docker-compose up`, puede tardar varios minutos mientras descarga las imágenes y construye el proyecto
- Los datos de la base de datos se persisten en un volumen de Docker llamado `postgres_data`
- Las migraciones de Prisma se ejecutan automáticamente al iniciar el backend
- El frontend se construye con Vite y se sirve con Nginx
- El backend se ejecuta en modo producción por defecto

## Próximos Pasos

Una vez que el proyecto esté en ejecución:

1. Accede a http://localhost:8080
2. Crea una cuenta de usuario
3. ¡Comienza a usar TeamWorks!

