# 🔧 Solución de Problemas de Conexión

## ❌ Error: ERR_CONNECTION_REFUSED

Este error significa que el cliente no puede conectarse al servidor backend. Aquí están las causas más comunes y sus soluciones:

---

## 🔍 Paso 1: Verificar que el Servidor Esté Corriendo

### Windows (PowerShell):
```powershell
netstat -ano | findstr ":3000"
```

### Linux/Mac:
```bash
lsof -i :3000
# o
netstat -tuln | grep :3000
```

**¿Ves resultados?**
- ✅ **SÍ**: El servidor está corriendo → Ve al [Paso 2](#-paso-2-verificar-que-el-servidor-responda)
- ❌ **NO**: El servidor NO está corriendo → Ve al [Paso 3](#-paso-3-iniciar-el-servidor)

---

## 📡 Paso 2: Verificar que el Servidor Responda

Abre una terminal y ejecuta:

```bash
curl http://localhost:3000/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T...",
  "service": "TeamWorks API"
}
```

**¿Funcionó?**
- ✅ **SÍ**: El servidor funciona → Ve al [Paso 4](#-paso-4-problema-con-la-url-del-cliente)
- ❌ **NO**: Hay un problema con el servidor → Ve al [Paso 5](#-paso-5-resolver-problemas-del-servidor)

---

## 🚀 Paso 3: Iniciar el Servidor

### Opción A: Verificar la Configuración Primero (RECOMENDADO)

```bash
# Ejecutar script de verificación
./check-setup.sh      # Linux/Mac
check-setup.bat       # Windows
```

Esto te dirá exactamente qué falta configurar.

### Opción B: Iniciar Manualmente

1. **Abrir una terminal nueva**

2. **Navegar al directorio del servidor**:
   ```bash
   cd server
   ```

3. **Verificar que las dependencias estén instaladas**:
   ```bash
   npm install
   ```

4. **Verificar que el archivo .env existe**:
   ```bash
   # Linux/Mac
   cat .env
   
   # Windows
   type .env
   ```
   
   Si no existe, créalo con:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
   JWT_SECRET="tu-secreto-seguro-aqui"
   PORT=3000
   NODE_ENV=development
   ```

5. **Generar Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

6. **Compilar el servidor**:
   ```bash
   npm run build
   ```

7. **Iniciar el servidor**:
   ```bash
   npm start
   ```

**¿Ves estos mensajes?**
```
🚀 Server running on http://0.0.0.0:3000
📡 Accessible on local network
🔌 SSE enabled for real-time updates
🔔 Notification system enabled
```

- ✅ **SÍ**: ¡Perfecto! → Ve al [Paso 4](#-paso-4-problema-con-la-url-del-cliente)
- ❌ **NO**: Hay un error → Ve al [Paso 5](#-paso-5-resolver-problemas-del-servidor)

---

## 🌐 Paso 4: Problema con la URL del Cliente

Si el servidor funciona pero el cliente no se conecta, el problema está en la configuración del cliente.

### Solución 1: Limpiar Caché del Navegador

1. Abre la consola del navegador (**F12**)
2. Ve a la pestaña **Console**
3. Ejecuta:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Solución 2: Verificar la URL en Configuración

1. Abre la aplicación en el navegador
2. Ve a **Configuración** (⚙️)
3. Verifica que la URL del API sea correcta:
   - Si estás en el mismo PC: `http://localhost:3000/api`
   - Si estás en otro dispositivo: `http://IP_DEL_PC:3000/api`

### Solución 3: Forzar Reconexión

En la consola del navegador (F12):
```javascript
// Ver la configuración actual
const settings = JSON.parse(localStorage.getItem('settings-storage'));
console.log('URL actual:', settings?.state?.apiUrl);

// Forzar localhost
settings.state.apiUrl = 'http://localhost:3000/api';
localStorage.setItem('settings-storage', JSON.stringify(settings));
location.reload();
```

---

## 🔥 Paso 5: Resolver Problemas del Servidor

### Error: "Port 3000 is already in use"

**Causa**: Ya hay un servidor corriendo en el puerto 3000.

**Solución**:

#### Windows:
```powershell
# Encontrar el proceso
netstat -ano | findstr ":3000"
# Esto te dará un PID (número al final)

# Matar el proceso (reemplaza <PID> con el número)
taskkill /PID <PID> /F
```

#### Linux/Mac:
```bash
# Encontrar y matar el proceso
lsof -ti :3000 | xargs kill -9
```

### Error: "Cannot connect to database"

**Causa**: PostgreSQL no está corriendo.

**Solución con Docker** (más fácil):
```bash
docker run --name teamworks-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=teamworks \
  -p 5432:5432 \
  -d postgres:14
```

**Solución con PostgreSQL instalado**:
```bash
# Windows
net start postgresql

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Error: "Cannot find module" o errores de TypeScript

**Causa**: Dependencias no instaladas o build no actualizado.

**Solución**:
```bash
cd server

# Reinstalar dependencias
rm -rf node_modules
npm install

# Regenerar Prisma Client
npm run prisma:generate

# Recompilar
npm run build

# Iniciar
npm start
```

### Error: "JWT_SECRET is not defined"

**Causa**: Falta el archivo `.env` o está mal configurado.

**Solución**: Crea o edita `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
JWT_SECRET="tu-secreto-seguro-aqui-usa-algo-aleatorio"
PORT=3000
NODE_ENV=development
```

---

## 🚨 Problemas Después de un Rebuild

Si funcionaba antes pero dejó de funcionar después de hacer un rebuild:

### Checklist de Rebuild:

1. **¿Reinstalaste las dependencias?**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **¿El archivo .env sigue existiendo?**
   - A veces se borra por accidente
   - Verifica que `server/.env` existe

3. **¿Regeneraste Prisma Client?**
   ```bash
   cd server
   npm run prisma:generate
   ```

4. **¿PostgreSQL está corriendo?**
   - Si usas Docker, verifica: `docker ps | grep teamworks-db`
   - Si está parado, inícialo: `docker start teamworks-db`

5. **¿Recompilaste el servidor?**
   ```bash
   cd server
   npm run build
   ```

6. **¿Hay procesos antiguos corriendo?**
   - Mata todos los procesos de Node.js del proyecto
   - Windows: Abre Task Manager y mata los procesos `node.exe`
   - Linux/Mac: `killall node` (cuidado, mata todos los procesos de Node)

---

## 📋 Script de Reinicio Completo

Si nada funciona, prueba este proceso completo:

### Windows (PowerShell como Administrador):
```powershell
# Parar todos los procesos
Get-Process node | Stop-Process -Force

# Limpiar puerto 3000
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($proc) {
    Stop-Process -Id $proc.OwningProcess -Force
}

# Verificar PostgreSQL/Docker
docker start teamworks-db

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Reinstalar y reconstruir servidor
cd server
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
npm run prisma:generate
npm run build

# Iniciar servidor en nueva ventana
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

# Esperar 3 segundos
Start-Sleep -Seconds 3

# Reinstalar cliente
cd ../client
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Iniciar cliente
npm run dev
```

### Linux/Mac:
```bash
#!/bin/bash

# Parar todos los procesos
killall node 2>/dev/null

# Verificar PostgreSQL/Docker
docker start teamworks-db 2>/dev/null || true

# Esperar
sleep 5

# Reinstalar y reconstruir servidor
cd server
rm -rf node_modules
npm install
npm run prisma:generate
npm run build

# Iniciar servidor en background
npm start &

# Esperar
sleep 3

# Reinstalar cliente
cd ../client
rm -rf node_modules
npm install

# Iniciar cliente
npm run dev
```

---

## 🆘 Todavía No Funciona

Si después de todo esto aún no funciona:

1. **Captura la información de diagnóstico**:
   ```bash
   # Ejecutar el script de verificación
   ./check-setup.sh > diagnostico.txt    # Linux/Mac
   check-setup.bat > diagnostico.txt     # Windows
   
   # Agregar logs del servidor
   cd server
   npm start > server.log 2>&1
   ```

2. **Revisa los logs**:
   - `diagnostico.txt`: Estado de la configuración
   - `server.log`: Errores del servidor
   - Consola del navegador (F12): Errores del cliente

3. **Información a compartir**:
   - Sistema operativo y versión
   - Versión de Node.js (`node -v`)
   - Contenido de los logs
   - Mensaje de error exacto
   - Pasos que seguiste

---

## 📚 Recursos Adicionales

- [INSTRUCCIONES_INICIO.md](./INSTRUCCIONES_INICIO.md) - Guía de inicio básica
- [SETUP.md](./SETUP.md) - Configuración inicial completa
- [QUICK_START.md](./QUICK_START.md) - Inicio rápido
- [README.md](./README.md) - Documentación general

---

## ✅ Prevención

Para evitar estos problemas en el futuro:

1. **Nunca borres** el archivo `server/.env`
2. **Siempre ejecuta** `npm install` después de cambiar de rama o actualizar
3. **Verifica PostgreSQL** antes de iniciar el servidor
4. **Usa el script de verificación** antes de iniciar: `./check-setup.sh`
5. **Mantén logs** de los errores para diagnóstico rápido
