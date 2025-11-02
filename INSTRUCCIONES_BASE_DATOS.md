# 🔧 Instrucciones para Configurar la Base de Datos

## Problema Detectado

El puerto 5432 está bloqueado en tu sistema Windows. Se ha configurado PostgreSQL en el **puerto 15432** como alternativa.

## ✅ Configuración Realizada

1. Contenedor Docker creado: `teamworks-db`
2. Puerto mapeado: **15432** (host) → **5432** (contenedor)
3. Base de datos: `teamworks`
4. Usuario: `postgres`
5. Contraseña: `password`

## 📝 Pasos Siguientes (IMPORTANTE - HAZLO AHORA)

### 1. Detener el Servidor (si está corriendo)

Presiona `Ctrl+C` en la terminal donde está corriendo `npm run dev` del servidor.

### 2. Actualizar archivo `server/.env`

Abre el archivo `server/.env` y **cambia** la línea `DATABASE_URL` a:

```env
DATABASE_URL="postgresql://postgres:password@localhost:15432/teamworks?schema=public"
```

**IMPORTANTE**: 
- Usa el puerto **15432** (no 5432)
- Si no tienes el archivo `.env`, créalo con este contenido mínimo:
  ```env
  DATABASE_URL="postgresql://postgres:password@localhost:15432/teamworks?schema=public"
  JWT_SECRET="cambia-este-secreto-por-algo-seguro"
  JWT_EXPIRES_IN="7d"
  PORT=3000
  NODE_ENV=development
  ```

### 3. Ejecutar Migraciones

Abre una terminal nueva y ejecuta:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

**Nota**: Si ves un error de permisos, cierra todas las terminales que tengan `npm run dev` corriendo y vuelve a intentar.

### 3. Verificar que Todo Funciona

Inicia el servidor:
```bash
cd server
npm run dev
```

Deberías ver el mensaje: `🚀 Server running on http://0.0.0.0:3000`

## 🔄 Si el Contenedor se Detiene

Para iniciar el contenedor nuevamente:
```bash
docker start teamworks-db
```

Para verificar el estado:
```bash
docker ps --filter "name=teamworks-db"
```

## 🛑 Si Quieres Usar el Puerto 5432 Original

Si tienes PostgreSQL instalado localmente en el puerto 5432:

1. Desinstala o detén el servicio local de PostgreSQL
2. O configura PostgreSQL local para usar otro puerto
3. Luego puedes cambiar el contenedor Docker al puerto 5432:
   ```bash
   docker rm -f teamworks-db
   docker run --name teamworks-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=teamworks -p 5432:5432 -d postgres:16-alpine
   ```
4. Actualiza `DATABASE_URL` en `server/.env` a:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
   ```

