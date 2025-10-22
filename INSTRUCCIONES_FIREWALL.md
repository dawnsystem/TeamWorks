# 🔥 SOLUCIÓN: Configurar Firewall de Windows

## ✅ Problema Identificado

El backend está corriendo correctamente pero el **Firewall de Windows está bloqueando las conexiones** desde otros dispositivos (móvil).

---

## 🚀 SOLUCIÓN RÁPIDA (3 pasos)

### Paso 1: Ejecutar el Script

He creado un script que configura automáticamente el firewall.

**Instrucciones:**

1. Abre **PowerShell como Administrador**:
   - Presiona `Win + X`
   - Selecciona "**Windows PowerShell (Administrador)**" o "**Terminal (Administrador)**"
   
2. Navega al directorio del proyecto:
   ```powershell
   cd "C:\Users\david\Downloads\PROYECTOS CURSOR\TeamWorks"
   ```

3. Ejecuta el script:
   ```powershell
   .\setup-firewall.ps1
   ```

4. El script agregará automáticamente las reglas para:
   - Puerto 3000 (Backend)
   - Puerto 5173 (Frontend)

---

### Paso 2: Verificar

Después de ejecutar el script, verás algo como:

```
=== CONFIGURACIÓN COMPLETADA ===

✅ Backend Rule: ACTIVA
   Puerto: 3000
   Estado: True

✅ Frontend Rule: ACTIVA
   Puerto: 5173
   Estado: True
```

---

### Paso 3: Probar desde el Móvil

1. Conecta tu móvil a la **MISMA WiFi** que tu PC
2. Abre el navegador del móvil
3. Ve a: `http://192.168.0.165:3000/health`
4. Deberías ver: `{"status":"ok","timestamp":"..."}`

Si funciona ✅, abre la app:
```
http://192.168.0.165:5173
```

---

## 📋 Alternativa Manual (Si no funciona el script)

### Opción A: Desde la Interfaz Gráfica

1. Presiona `Win + R` → escribe `wf.msc` → Enter
2. Click en "**Reglas de entrada**" (lado izquierdo)
3. Click en "**Nueva regla...**" (lado derecho)
4. Selecciona "**Puerto**" → Siguiente
5. **TCP** → Puertos locales específicos: `3000` → Siguiente
6. "**Permitir la conexión**" → Siguiente
7. Marca "**Privado**" y "**Público**" → Siguiente
8. Nombre: "TeamWorks Backend" → Finalizar
9. **Repite los pasos 3-8 para el puerto `5173`** (Frontend)

### Opción B: Comandos Manuales

Abre PowerShell **como Administrador** y ejecuta:

```powershell
# Backend (Puerto 3000)
New-NetFirewallRule -DisplayName "TeamWorks Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private,Public

# Frontend (Puerto 5173)
New-NetFirewallRule -DisplayName "TeamWorks Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private,Public
```

---

## 🔍 Verificación

### Verificar las reglas están activas:

```powershell
Get-NetFirewallRule -DisplayName "*TeamWorks*" | Select-Object DisplayName, Enabled, Direction
```

Deberías ver:
```
DisplayName                      Enabled Direction
-----------                      ------- ---------
TeamWorks Backend (Port 3000)    True    Inbound
TeamWorks Frontend (Port 5173)   True    Inbound
```

### Probar conectividad desde otra terminal:

```powershell
# En PC:
Invoke-WebRequest -Uri "http://192.168.0.165:3000/health" -UseBasicParsing
```

Debería responder: `StatusCode : 200`

---

## 📱 Después de Configurar el Firewall

### En el Móvil:

1. **Verifica Backend**:
   - Abre: `http://192.168.0.165:3000/health`
   - Debe mostrar: `{"status":"ok",...}`

2. **Abre la App**:
   - Ve a: `http://192.168.0.165:5173`
   - La app debería cargar ✅

3. **Configura la URL**:
   - Click en Configuración ⚙️
   - Busca "URLs Detectadas"
   - Haz click en "Probar" junto a `📱 Red Local (192.168.0.165)`
   - Si sale WiFi verde ✅, haz click en "Usar"
   - Guardar
   - Recarga la app

---

## ⚠️ Si Aún No Funciona

### 1. Verifica que ambos dispositivos estén en la misma WiFi:
```
PC: Configuración → Red e Internet → WiFi → Ver nombre de red
Móvil: Configuración → WiFi → Ver nombre de red
```

### 2. Verifica la IP de tu PC:
```powershell
ipconfig | findstr "IPv4"
```

Si es diferente a `192.168.0.165`, actualiza `client/.env`:
```
VITE_LOCAL_API_URL=http://[TU-IP]:3000/api
```

### 3. Desactiva temporalmente el firewall para probar:
```
Panel de Control → Firewall → Desactivar (solo red privada)
```

⚠️ **Solo para probar, luego reactiva y agrega las reglas**

---

## 🎯 Resumen de Comandos

```powershell
# 1. Abrir PowerShell como Administrador (Win + X)

# 2. Ir al directorio
cd "C:\Users\david\Downloads\PROYECTOS CURSOR\TeamWorks"

# 3. Ejecutar script
.\setup-firewall.ps1

# 4. Verificar reglas
Get-NetFirewallRule -DisplayName "*TeamWorks*"

# 5. Probar conectividad
Invoke-WebRequest -Uri "http://192.168.0.165:3000/health" -UseBasicParsing
```

---

## ✅ Checklist Final

- [ ] Script ejecutado como Administrador
- [ ] Reglas de firewall agregadas (puertos 3000 y 5173)
- [ ] Backend responde en `http://192.168.0.165:3000/health`
- [ ] Frontend accesible en `http://192.168.0.165:5173`
- [ ] Móvil y PC en la misma WiFi
- [ ] App configurada con URL de Red Local

---

**¡Ejecuta el script ahora y prueba desde el móvil!** 🚀

```powershell
# Recuerda: PowerShell como ADMINISTRADOR
cd "C:\Users\david\Downloads\PROYECTOS CURSOR\TeamWorks"
.\setup-firewall.ps1
```
