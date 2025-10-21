# Configuración de Tailscale para TeamWorks

## 📋 Resumen

Esta guía te ayudará a configurar TeamWorks para que sea accesible desde otros dispositivos usando Tailscale VPN.

## 🔧 Configuración Inicial

### 1. Verificar Tailscale

```powershell
# Verificar que Tailscale está instalado y funcionando
tailscale status
tailscale ip -4
```

### 2. Configurar Variables de Entorno

**Archivo: `server/.env`**
```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"

# Puerto del servidor
PORT=3000
NODE_ENV=development

# API Key de Groq (para IA)
GROQ_API_KEY="tu-api-key-aqui"

# URL del frontend (para CORS) - USAR TAILSCALE
FRONTEND_URL="http://davidhp.tail1c095e.ts.net:5173"
```

**Archivo: `client/.env`**
```env
# URL del API usando Tailscale
VITE_API_URL=http://davidhp.tail1c095e.ts.net:3000/api
```

### 3. Configurar Vite para Tailscale

**Archivo: `client/vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permitir acceso desde red
    port: 5173,
  },
})
```

## 🌐 URLs de Acceso

### Desde tu PC (local):
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Desde otros dispositivos con Tailscale:
- Frontend: `http://davidhp.tail1c095e.ts.net:5173`
- Backend: `http://davidhp.tail1c095e.ts.net:3000`

## 🔄 Reiniciar Servidores

Después de cambiar la configuración, reinicia ambos servidores:

**Terminal 1 (Backend):**
```powershell
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd client
npm run dev
```

## ✅ Verificación

1. **Verifica que ambos servidores muestren las URLs de red:**
   - Backend: `🚀 Server running on http://0.0.0.0:3000`
   - Frontend: `➜ Network: http://100.125.88.47:5173/`

2. **Prueba el acceso desde otro dispositivo:**
   - Conecta el dispositivo a Tailscale
   - Visita `http://davidhp.tail1c095e.ts.net:5173`

## 🔧 Solución de Problemas

### Error de CORS
Si ves errores de CORS, verifica que:
- `FRONTEND_URL` en `server/.env` use la URL de Tailscale
- `VITE_API_URL` en `client/.env` use la URL de Tailscale

### No se puede conectar
- Verifica que Tailscale esté funcionando: `tailscale status`
- Verifica que el firewall permita los puertos 3000 y 5173
- Reinicia ambos servidores después de cambiar la configuración

### API Key de Groq
- Obtén una API key gratuita en: https://console.groq.com
- Reemplaza `"tu-api-key-aqui"` en `server/.env` con tu clave real

## 📝 Notas Importantes

- Los archivos `.env` están protegidos por `.gitignore` y no se suben al repositorio
- La API key de Groq debe mantenerse privada
- Tailscale permite acceso seguro sin exponer puertos públicamente
- Puedes usar tanto la IP como el dominio MagicDNS (.ts.net)
