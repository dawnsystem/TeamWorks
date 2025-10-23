# 🔧 Resumen de Correcciones para Problemas de Conexión

## 📋 Problema Original

Después de hacer un rebuild y reiniciar los servidores, el cliente no podía conectarse al backend, mostrando el error:

```
ERR_CONNECTION_REFUSED
❌ No se pudo conectar a ninguna URL de API
```

## 🎯 Causas Identificadas

1. **Servidor no inicia correctamente**: Después de un rebuild, el servidor puede no iniciar debido a:
   - Dependencias no instaladas (`node_modules` faltante)
   - Archivo `.env` eliminado o mal configurado
   - Base de datos PostgreSQL no corriendo
   - Puerto 3000 ya en uso por un proceso antiguo
   - Prisma Client no generado

2. **Errores silenciosos**: El servidor podía fallar al iniciar sin mensajes de error claros

3. **Debugging difícil**: No había forma fácil de verificar qué estaba mal configurado

## ✅ Soluciones Implementadas

### 1. Mejor Manejo de Errores del Servidor

**Archivo**: `server/src/index.ts`

Se agregó manejo de errores para el servidor:

```typescript
// Handle server startup errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error(`   Please stop the other server or use a different port`);
    console.error(`   You can set PORT in the .env file`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Error: Permission denied to bind to port ${PORT}`);
    console.error(`   Try using a port number above 1024`);
  } else {
    console.error(`❌ Server error:`, error.message);
  }
  process.exit(1);
});
```

**Beneficios**:
- Mensajes de error claros cuando el puerto está en uso
- Instrucciones específicas para solucionar cada problema
- El proceso termina correctamente con código de error

### 2. Mejora en Detección de Errores del Cliente

**Archivo**: `client/src/lib/api.ts`

Se mejoró la función `testApiConnection` para:

```typescript
export const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    const healthUrl = url.replace(/\/api\/?$/, '') + '/health';
    const response = await axios.get(healthUrl, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 
    });
    if (response.status === 200) {
      return true;
    }
  } catch (error: any) {
    try {
      await axios.get(url, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 
      });
      return true;
    } catch (e: any) {
      // Log more detailed error information
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED') {
        console.log(`❌ No se pudo conectar a: ${url} (servidor no responde)`);
      } else if (e.code === 'ECONNABORTED') {
        console.log(`❌ Timeout al conectar a: ${url}`);
      } else {
        console.log(`❌ No se pudo conectar a: ${url} (${e.message || 'error desconocido'})`);
      }
      return false;
    }
  }
  return false;
};
```

**Beneficios**:
- Mensajes de error más específicos en la consola
- Diferencia entre servidor no responde, timeout, y otros errores
- Mejor debugging para el usuario

### 3. Corrección del Orden de Rutas

**Archivo**: `server/src/index.ts`

Se movió el endpoint `/api/server-info` antes de las rutas protegidas:

```typescript
// Public endpoints (no auth required) - must be before protected routes
app.get('/health', ...);
app.get('/api/server-info', ...);

// Protected routes (require auth)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
// ...etc
```

**Beneficios**:
- El endpoint `/api/server-info` ahora es accesible sin autenticación
- Permite mejor auto-descubrimiento del servidor
- Útil para herramientas de diagnóstico

### 4. Scripts de Verificación

**Archivos**: `check-setup.sh` (Linux/Mac) y `check-setup.bat` (Windows)

Scripts que verifican:
- ✅ Node.js y npm instalados
- ✅ Dependencias instaladas (server y client)
- ✅ Archivo `.env` existe y tiene variables requeridas
- ✅ Servidor compilado (`dist/` existe)
- ✅ Prisma Client generado
- ✅ PostgreSQL corriendo en puerto 5432
- ✅ Puerto 3000 disponible

**Uso**:
```bash
# Linux/Mac
./check-setup.sh

# Windows
check-setup.bat
```

**Salida ejemplo**:
```
🔍 Verificando configuración de TeamWorks...

✅ Node.js: v20.19.5
✅ npm: 10.8.2

📦 Verificando dependencias...
✅ Dependencias del servidor instaladas
✅ Dependencias del cliente instaladas

⚙️  Verificando configuración...
✅ Archivo server/.env existe
✅ Servidor compilado
✅ Prisma Client generado

🗄️  Verificando PostgreSQL...
✅ PostgreSQL está corriendo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ¡Todo listo! Puedes iniciar los servidores
```

### 5. Guía Completa de Troubleshooting

**Archivo**: `TROUBLESHOOTING_CONNECTION.md`

Documentación exhaustiva que incluye:

- **Paso a paso** para diagnosticar problemas de conexión
- **Soluciones específicas** para cada error común
- **Scripts de recuperación completa** para Windows y Linux/Mac
- **Prevención** de problemas futuros
- **Referencias** a otros documentos útiles

**Errores cubiertos**:
- ❌ ERR_CONNECTION_REFUSED
- ❌ Port already in use
- ❌ Cannot connect to database
- ❌ Cannot find module
- ❌ JWT_SECRET is not defined
- ❌ Problemas después de rebuild

## 🚀 Cómo Usar las Mejoras

### Antes de Iniciar (Recomendado)

```bash
# Verifica que todo está configurado correctamente
./check-setup.sh      # Linux/Mac
check-setup.bat       # Windows
```

### Si Hay Problemas de Conexión

1. **Lee el documento de troubleshooting**:
   ```bash
   cat TROUBLESHOOTING_CONNECTION.md
   ```

2. **Verifica los logs del servidor**:
   - Busca mensajes de error claros
   - Revisa que diga "Server running on http://0.0.0.0:3000"

3. **Verifica los logs del cliente**:
   - Abre la consola del navegador (F12)
   - Busca mensajes con detalles del error de conexión

### Después de un Rebuild

```bash
# 1. Verificar configuración
./check-setup.sh

# 2. Si hay errores, seguir las instrucciones del script

# 3. Iniciar los servidores
# Terminal 1:
cd server && npm start

# Terminal 2:
cd client && npm run dev
```

## 📊 Mejoras en Diagnóstico

### Antes
```
ERR_CONNECTION_REFUSED
❌ No se pudo conectar a: http://localhost:3000/api
❌ No se pudo conectar a: http://192.168.0.165:3000/api
❌ No se pudo conectar a ninguna URL de API
```

### Ahora
```
❌ No se pudo conectar a: http://localhost:3000/api (servidor no responde)
   → Verifica que el servidor esté corriendo
   → Ejecuta: ./check-setup.sh

❌ Error: Port 3000 is already in use
   → Please stop the other server or use a different port
   → You can set PORT in the .env file
```

## 🎓 Lecciones y Mejores Prácticas

1. **Siempre verifica antes de iniciar**:
   ```bash
   ./check-setup.sh
   ```

2. **No borres el archivo `.env`**:
   - Guarda un backup en `.env.example`
   - Documenta todas las variables necesarias

3. **Después de cada rebuild**:
   - Verifica que `node_modules` exista
   - Regenera Prisma Client: `npm run prisma:generate`
   - Recompila: `npm run build`

4. **Mantén PostgreSQL corriendo**:
   - Docker: `docker start teamworks-db`
   - O usa servicio del sistema

5. **Limpia procesos antiguos**:
   - Windows: Task Manager → Matar procesos `node.exe`
   - Linux/Mac: `killall node` o `lsof -ti :3000 | xargs kill -9`

## 📚 Archivos Relacionados

- `check-setup.sh` / `check-setup.bat` - Scripts de verificación
- `TROUBLESHOOTING_CONNECTION.md` - Guía completa de troubleshooting
- `INSTRUCCIONES_INICIO.md` - Instrucciones básicas de inicio
- `SETUP.md` - Configuración inicial completa
- `QUICK_START.md` - Inicio rápido

## ✅ Resultado Final

Ahora cuando hay problemas de conexión:

1. ✅ **El servidor muestra errores claros** si no puede iniciar
2. ✅ **El cliente muestra errores específicos** en la consola
3. ✅ **Hay herramientas de diagnóstico** (`check-setup` scripts)
4. ✅ **Hay documentación completa** (TROUBLESHOOTING_CONNECTION.md)
5. ✅ **Los endpoints públicos funcionan** sin autenticación

Los usuarios pueden:
- Diagnosticar problemas rápidamente
- Entender exactamente qué está mal
- Seguir pasos claros para solucionar
- Prevenir problemas futuros

## 🔒 Seguridad

- ✅ No se introdujeron vulnerabilidades nuevas
- ✅ CodeQL analysis: 0 alerts
- ✅ Endpoints públicos limitados a `/health` y `/api/server-info`
- ✅ Todas las rutas de API siguen protegidas por autenticación
