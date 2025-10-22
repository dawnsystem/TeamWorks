# 📱 Acceso Móvil - Guía Rápida Actualizada

## 🎯 URLs Disponibles

Tu app ahora detecta **3 formas de conexión**:

| Icono | Tipo | URL | Cuándo usar |
|-------|------|-----|-------------|
| 🏠 | Localhost | `http://localhost:3000/api` | Solo en la PC |
| 📱 | Red Local | `http://192.168.0.165:3000/api` | **Móvil en misma WiFi** ⭐ |
| 🌐 | Tailscale | `http://davidhp.tail1c095e.ts.net:3000/api` | Desde cualquier lugar |

---

## ⭐ Opción Recomendada: Red Local (WiFi)

### 1️⃣ En la PC:
```bash
# Verifica que todo esté corriendo
cd server && npm run dev    # Backend
cd client && npm run dev    # Frontend (en otra terminal)
```

### 2️⃣ En el Móvil:
```bash
1. Conecta a la MISMA WiFi que la PC
2. Abre navegador
3. Ve a: http://192.168.0.165:5173
4. Abre Configuración ⚙️
5. Prueba "📱 Red Local" → Click en "Usar"
6. Guardar
7. ¡Listo!
```

---

## 🔧 Si no funciona:

### Verifica conectividad:
```
En móvil, abre: http://192.168.0.165:3000/health
Debe responder: {"status":"ok",...}
```

### Verifica Firewall:
```
Windows → Buscar "Firewall"
→ Permitir puertos 3000 y 5173
```

### IP cambió:
```bash
# En PC:
ipconfig

# Busca "Dirección IPv4" (ej: 192.168.0.165)
# Si es diferente, actualiza client/.env:
VITE_LOCAL_API_URL=http://[NUEVA-IP]:3000/api
```

---

## 📊 Resumen Visual

```
PC (192.168.0.165)
├── Backend :3000     ← Backend API
├── Frontend :5173    ← App Web
│
└── WiFi Router
    │
    └── Móvil/Tablet
        └── Abre: http://192.168.0.165:5173
            └── Configura: Red Local en Settings
```

---

## ✅ Checklist

- [ ] Backend corriendo en PC
- [ ] Frontend corriendo en PC
- [ ] PC y móvil en misma WiFi
- [ ] Firewall permite conexiones
- [ ] IP correcta (192.168.0.165)
- [ ] Configuración guardada en móvil

---

**¿Todo listo?** Recarga el frontend (`Ctrl+Shift+R`) y prueba desde el móvil.
