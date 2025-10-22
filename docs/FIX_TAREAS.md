# Fix para el problema de creación y visualización de tareas

## Problema
Después del último merge, los usuarios reportaban:
1. No poder crear tareas
2. Las tareas que ya estaban creadas no aparecían

## Causa raíz
Las funciones `getTasks` y `getTasksByLabel` en `server/src/controllers/taskController.ts` podían devolver valores `null` en el array de tareas. Esto ocurría cuando la función auxiliar `getTaskWithAllSubtasks` no podía recuperar una tarea debido a:
- Verificaciones de permisos que fallaban
- Condiciones de carrera en la base de datos
- Tareas eliminadas entre consultas

### Flujo del problema:
1. `getTasks` recupera las tareas raíz con `prisma.task.findMany`
2. Para cada tarea, llama a `getTaskWithAllSubtasks` para obtener subtareas recursivamente
3. `getTaskWithAllSubtasks` hace otra consulta con filtros de usuario
4. Si la tarea no se encuentra en la segunda consulta, retorna `null`
5. Este `null` se incluía en el array de respuesta
6. El frontend intentaba renderizar el array y fallaba al encontrar valores `null`

## Solución implementada
Se agregó un filtro para eliminar valores `null` del array de tareas antes de enviar la respuesta:

```typescript
// Filter out any null values that might occur if a task couldn't be retrieved
const validTasks = tasksWithAllSubtasks.filter(task => task !== null);

res.json(validTasks);
```

Este cambio se aplicó en dos lugares:
- Línea 158: función `getTasks`
- Línea 448: función `getTasksByLabel`

## Archivos modificados
- `server/src/controllers/taskController.ts`

## Verificación
- ✅ El servidor compila sin errores TypeScript
- ✅ El cliente compila sin errores
- ✅ CodeQL no encontró vulnerabilidades de seguridad
- ✅ Los cambios son mínimos y quirúrgicos

## Próximos pasos recomendados
1. Configurar una base de datos PostgreSQL para pruebas locales
2. Ejecutar migraciones de Prisma: `cd server && npm run prisma:migrate`
3. Iniciar el servidor: `cd server && npm run dev`
4. Iniciar el cliente: `cd client && npm run dev`
5. Registrar un usuario y probar la creación de tareas

## Notas técnicas
La solución es defensiva y no afecta el rendimiento. Aunque el código podría optimizarse eliminando la doble consulta (fetch inicial + `getTaskWithAllSubtasks`), ese cambio sería más invasivo y está fuera del alcance de este fix quirúrgico.
