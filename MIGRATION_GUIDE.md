# Guía de Migración - Sistema de Suscripción a Tareas

## 📋 Resumen

Esta guía explica cómo aplicar la migración que implementa el sistema de suscripción a tareas y elimina las auto-notificaciones.

## ⚠️ Importante: Backup

**Antes de aplicar cualquier migración, haz backup de tu base de datos:**

```bash
# PostgreSQL
pg_dump teamworks > backup_$(date +%Y%m%d_%H%M%S).sql

# Con Docker
docker exec teamworks-db pg_dump -U postgres teamworks > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔧 Métodos de Aplicación

### Opción 1: Usando Prisma (Recomendado)

Esta es la forma más segura y automática.

```bash
# 1. Navegar al directorio del servidor
cd server

# 2. Generar cliente Prisma con el nuevo schema
npm run prisma:generate

# 3. Crear y aplicar la migración
npm run prisma:migrate

# 4. Seguir los prompts de Prisma
# - Dar un nombre a la migración: "add_task_subscriptions"
# - Confirmar aplicación
```

**Qué hace Prisma:**
- Lee el schema actualizado (`prisma/schema.prisma`)
- Genera el SQL necesario automáticamente
- Aplica la migración de forma segura
- Actualiza el cliente de Prisma

### Opción 2: SQL Directo

Si prefieres control manual o Prisma no está disponible.

```bash
# 1. Conectar a la base de datos
psql -U postgres -d teamworks

# 2. Aplicar el SQL
\i server/migrations/add_task_subscriptions.sql

# 3. Verificar que se aplicó correctamente
\dt task_subscriptions
\d tasks
```

**O en una sola línea:**
```bash
psql -U postgres -d teamworks -f server/migrations/add_task_subscriptions.sql
```

### Opción 3: Con Docker

Si tu base de datos está en Docker.

```bash
# Copiar SQL al contenedor y ejecutar
docker cp server/migrations/add_task_subscriptions.sql teamworks-db:/tmp/
docker exec -it teamworks-db psql -U postgres -d teamworks -f /tmp/add_task_subscriptions.sql
```

## 🔍 Verificación

Después de aplicar la migración, verifica que todo está correcto:

### 1. Verificar Tablas

```sql
-- Verificar que la tabla existe
SELECT COUNT(*) FROM task_subscriptions;

-- Verificar que los índices están creados
\di task_subscriptions*

-- Verificar que la columna createdBy existe en tasks
\d tasks
```

### 2. Verificar Auto-suscripciones

```sql
-- Contar suscripciones creadas automáticamente
SELECT COUNT(*) FROM task_subscriptions;

-- Ver algunas suscripciones
SELECT 
  ts.id,
  t.titulo as tarea,
  u.nombre as usuario
FROM task_subscriptions ts
JOIN tasks t ON t.id = ts."taskId"
JOIN users u ON u.id = ts."userId"
LIMIT 10;
```

### 3. Verificar en la Aplicación

1. Iniciar el servidor:
   ```bash
   cd server
   npm run dev
   ```

2. Iniciar el cliente:
   ```bash
   cd client
   npm run dev
   ```

3. En el navegador:
   - Abrir una tarea
   - Verificar que aparece el botón de suscripción (Bell/BellOff)
   - Intentar suscribirse/desuscribirse
   - Crear un comentario desde otra sesión
   - Verificar que solo los suscriptores reciben notificación

## 🐛 Solución de Problemas

### Error: "relation task_subscriptions already exists"

**Causa**: La tabla ya existe (migración aplicada previamente)

**Solución**: No es necesario volver a aplicar. Si tienes dudas:
```sql
-- Verificar estructura
\d task_subscriptions

-- Si la estructura es correcta, no hacer nada
-- Si es incorrecha, eliminar y volver a crear:
DROP TABLE task_subscriptions CASCADE;
-- Luego aplicar la migración nuevamente
```

### Error: "column createdBy does not exist"

**Causa**: Parte de la migración no se aplicó correctamente

**Solución**:
```sql
-- Aplicar solo esa parte de la migración
ALTER TABLE tasks ADD COLUMN "createdBy" TEXT;

-- Poblar datos existentes
UPDATE tasks 
SET "createdBy" = (
  SELECT "userId" 
  FROM projects 
  WHERE projects.id = tasks."projectId"
);

-- Hacer NOT NULL
ALTER TABLE tasks ALTER COLUMN "createdBy" SET NOT NULL;
```

### Error al compilar TypeScript

**Causa**: Prisma client no actualizado

**Solución**:
```bash
cd server
npm run prisma:generate
```

### Botón de suscripción no aparece

**Causa**: Frontend no actualizado o no recargado

**Solución**:
```bash
# Limpiar caché y reinstalar
cd client
rm -rf node_modules .vite
npm install
npm run dev
```

## 📝 Rollback (Si algo sale mal)

Si necesitas revertir la migración:

### 1. Restaurar desde Backup

```bash
# Detener aplicaciones
# Restaurar backup
psql -U postgres -d teamworks < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Rollback Manual

```sql
-- Eliminar tabla de suscripciones
DROP TABLE IF EXISTS task_subscriptions CASCADE;

-- Eliminar columna createdBy
ALTER TABLE tasks DROP COLUMN IF EXISTS "createdBy";
```

### 3. Revertir código

```bash
git revert <commit-hash>
# O volver al commit anterior
git reset --hard <commit-anterior>
```

## 📊 Impacto de la Migración

### Datos Afectados

- **Tabla `tasks`**: Se añade columna `createdBy`
- **Nueva tabla**: `task_subscriptions` creada
- **Suscripciones automáticas**: Una por cada tarea existente

### Tiempo Estimado

- **Base de datos pequeña** (< 1000 tareas): < 1 segundo
- **Base de datos media** (< 10000 tareas): < 5 segundos
- **Base de datos grande** (> 10000 tareas): < 30 segundos

### Espacio en Disco

- **Por tarea**: ~200 bytes (entrada en task_subscriptions)
- **1000 tareas**: ~200 KB
- **10000 tareas**: ~2 MB

## ✅ Checklist Post-Migración

- [ ] Backup creado
- [ ] Migración aplicada sin errores
- [ ] Tabla `task_subscriptions` existe
- [ ] Columna `createdBy` en `tasks`
- [ ] Suscripciones automáticas creadas
- [ ] Servidor inicia correctamente
- [ ] Cliente inicia correctamente
- [ ] Botón de suscripción visible en UI
- [ ] Subscribe/unsubscribe funciona
- [ ] Notificaciones solo a suscriptores
- [ ] Sin auto-notificaciones

## 🔗 Referencias

- **Schema Prisma**: `server/prisma/schema.prisma`
- **SQL Migración**: `server/migrations/add_task_subscriptions.sql`
- **Documentación completa**: `DOCUMENTATION.md`
- **Guía de testing**: `TESTING.md`

## 🆘 Ayuda

Si encuentras problemas:

1. **Revisa los logs del servidor**: `server/logs` o consola
2. **Revisa los logs de PostgreSQL**: `docker logs teamworks-db`
3. **Consulta la documentación**: `DOCUMENTATION.md`
4. **Abre un issue** en GitHub con:
   - Descripción del problema
   - Logs relevantes
   - Pasos para reproducir

---

**Última actualización**: 23 de Enero, 2025  
**Versión**: 1.0.0
