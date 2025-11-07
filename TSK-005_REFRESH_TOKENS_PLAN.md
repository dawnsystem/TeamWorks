# TSK-005: Implementación de Refresh Tokens

**Prioridad**: MEDIA  
**Esfuerzo Estimado**: 8 horas  
**Estado**: Planificado  
**Relacionado con**: TSK-003 (Vulnerabilidad MEDIUM-2)

---

## 📋 Contexto

Actualmente, TeamWorks utiliza JWT con expiración de 7 días. Si un token es robado, permanece válido hasta su expiración, representando un riesgo de seguridad medio.

### Problema Actual
- JWT válido por 7 días sin mecanismo de invalidación
- No hay forma de revocar tokens comprometidos
- Ventana de exposición demasiado amplia en caso de robo de credenciales

---

## 🎯 Objetivo

Implementar un sistema de **Refresh Tokens** que mejore la seguridad mediante:
1. **Access Tokens** de corta duración (15-30 minutos)
2. **Refresh Tokens** de larga duración (7-30 días) almacenados de forma segura
3. Capacidad de revocar tokens comprometidos
4. Rotación automática de refresh tokens

---

## 🏗️ Arquitectura Propuesta

### 1. Estructura de Tokens

**Access Token** (JWT corto):
```typescript
{
  userId: string,
  email: string,
  iat: number,
  exp: number // 15-30 minutos
}
```

**Refresh Token** (almacenado en BD):
```typescript
{
  id: string (UUID),
  userId: string,
  token: string (hash),
  expiresAt: Date,
  createdAt: Date,
  lastUsedAt: Date,
  deviceInfo?: string,
  ipAddress?: string,
  isRevoked: boolean
}
```

### 2. Schema de Base de Datos (Prisma)

```prisma
model RefreshToken {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token       String    @unique // Hash del token
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime  @default(now())
  deviceInfo  String?
  ipAddress   String?
  isRevoked   Boolean   @default(false)
  revokedAt   DateTime?

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// Actualizar modelo User
model User {
  // ... campos existentes
  refreshTokens RefreshToken[]
}
```

---

## 📝 Cambios Técnicos Requeridos

### Fase 1: Preparación de Base de Datos

**Archivos a Crear**:
- `server/prisma/migrations/XXX_add_refresh_tokens/migration.sql`

**Acciones**:
1. Crear migración de Prisma para tabla `refresh_tokens`
2. Ejecutar `prisma migrate dev`
3. Actualizar `prisma generate`

### Fase 2: Servicios de Autenticación

**Archivos a Crear**:
- `server/src/services/refreshTokenService.ts` - Gestión de refresh tokens
- `server/src/types/auth.ts` - Tipos de autenticación

**Archivos a Modificar**:
- `server/src/controllers/authController.ts`:
  - Modificar `register()`: generar access + refresh token
  - Modificar `login()`: generar access + refresh token
  - Añadir `refresh()`: renovar access token usando refresh token
  - Añadir `logout()`: revocar refresh token
  - Añadir `logoutAll()`: revocar todos los refresh tokens del usuario

**Funcionalidades del refreshTokenService**:
```typescript
// Crear nuevo refresh token
async createRefreshToken(userId: string, deviceInfo?: string, ipAddress?: string): Promise<string>

// Validar y rotar refresh token
async validateAndRotate(token: string): Promise<{ userId: string, newRefreshToken: string } | null>

// Revocar token específico
async revokeToken(token: string): Promise<boolean>

// Revocar todos los tokens de un usuario
async revokeAllUserTokens(userId: string): Promise<number>

// Limpiar tokens expirados (cron job)
async cleanExpiredTokens(): Promise<number>

// Listar tokens activos de un usuario (para dashboard)
async getUserActiveTokens(userId: string): Promise<RefreshTokenInfo[]>
```

### Fase 3: Middleware y Rutas

**Archivos a Modificar**:
- `server/src/middleware/auth.ts`:
  - Actualizar para manejar tokens de corta duración
  - Mejorar mensajes de error (diferenciar token expirado vs inválido)

**Nuevas Rutas**:
```typescript
// En server/src/routes/authRoutes.ts
POST   /api/auth/refresh     // Renovar access token
POST   /api/auth/logout      // Logout (revocar refresh token)
POST   /api/auth/logout-all  // Revocar todos los tokens del usuario
GET    /api/auth/sessions    // Listar sesiones activas (opcional)
DELETE /api/auth/sessions/:id // Revocar sesión específica (opcional)
```

### Fase 4: Cliente (Frontend)

**Archivos a Modificar**:
- `client/src/lib/api.ts`:
  - Interceptor de respuesta para manejar token expirado (401)
  - Lógica de renovación automática con refresh token
  - Queue de requests durante renovación

**Archivos a Crear**:
- `client/src/lib/tokenManager.ts` - Gestión de tokens en cliente

**Funcionalidades**:
```typescript
// Almacenar refresh token en httpOnly cookie o localStorage seguro
// Renovar automáticamente access token al expirar
// Redirigir a login si refresh token expira
```

### Fase 5: Variables de Entorno

**Archivos a Modificar**:
- `.env.example`:
```bash
# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRES_IN=15m    # Access token: 15 minutos
JWT_REFRESH_TOKEN_EXPIRES_IN=7d    # Refresh token: 7 días
```

### Fase 6: Cron Job para Limpieza

**Archivos a Crear**:
- `server/src/cron/cleanExpiredTokens.ts`

**Acción**:
- Ejecutar cada 24 horas
- Eliminar refresh tokens expirados y revocados antiguos
- Logging de tokens eliminados

---

## 🔒 Consideraciones de Seguridad

### 1. Almacenamiento de Refresh Tokens

**En Base de Datos**:
- ✅ Almacenar **hash** del refresh token (bcrypt o argon2)
- ✅ No almacenar el token en texto plano
- ✅ Indexar por token y userId para queries rápidas

**En Cliente**:
- ⚠️ **Opción 1 (Recomendada)**: HttpOnly Cookie
  - Más seguro contra XSS
  - Requiere configuración de CORS adecuada
  - No accesible desde JavaScript
  
- ⚠️ **Opción 2**: localStorage con precauciones
  - Más simple de implementar
  - Vulnerable a XSS si hay otras vulnerabilidades
  - Requiere sanitización estricta de inputs

### 2. Rotación de Tokens

- ✅ Generar nuevo refresh token en cada renovación
- ✅ Invalidar el refresh token anterior
- ✅ Detectar reutilización de tokens (posible robo)

### 3. Rate Limiting

- ✅ Limitar intentos de refresh (ej: 10 por minuto)
- ✅ Bloquear IPs con comportamiento sospechoso

### 4. Device Tracking

- ✅ Almacenar User-Agent y IP del dispositivo
- ✅ Permitir al usuario ver y revocar sesiones activas
- ⚠️ Notificar login desde nuevo dispositivo (futuro)

---

## 🧪 Tests Requeridos

### Tests Unitarios
```typescript
// server/src/__tests__/refreshTokenService.test.ts
describe('RefreshTokenService', () => {
  test('should create refresh token', async () => {});
  test('should validate and rotate token', async () => {});
  test('should reject expired token', async () => {});
  test('should reject revoked token', async () => {});
  test('should detect token reuse', async () => {});
  test('should revoke all user tokens', async () => {});
  test('should clean expired tokens', async () => {});
});
```

### Tests de Integración
```typescript
// server/src/__tests__/authFlow.test.ts
describe('Auth Flow with Refresh Tokens', () => {
  test('register should return access and refresh tokens', async () => {});
  test('login should return access and refresh tokens', async () => {});
  test('refresh endpoint should renew access token', async () => {});
  test('expired access token should be rejected', async () => {});
  test('logout should revoke refresh token', async () => {});
  test('revoked refresh token should not work', async () => {});
});
```

### Tests E2E (Cliente)
```typescript
// client/src/__tests__/authFlow.test.tsx
describe('Client Auth Flow', () => {
  test('should auto-refresh token on 401', async () => {});
  test('should redirect to login when refresh fails', async () => {});
  test('should queue requests during refresh', async () => {});
});
```

---

## 📊 Plan de Implementación

### Sprint 1 (2 horas)
- [ ] Crear schema de Prisma
- [ ] Generar migración
- [ ] Implementar `refreshTokenService.ts`
- [ ] Tests unitarios del servicio

### Sprint 2 (3 horas)
- [ ] Modificar `authController.ts` (register, login, refresh, logout)
- [ ] Actualizar middleware de autenticación
- [ ] Añadir nuevas rutas
- [ ] Tests de integración backend

### Sprint 3 (2 horas)
- [ ] Implementar `tokenManager.ts` en cliente
- [ ] Modificar interceptor de axios
- [ ] Actualizar flujo de login/logout en frontend
- [ ] Tests E2E

### Sprint 4 (1 hora)
- [ ] Implementar cron job de limpieza
- [ ] Documentar nuevas variables de entorno
- [ ] Actualizar README con nueva arquitectura
- [ ] Probar en entorno de staging

---

## 🔄 Migración para Usuarios Existentes

**Estrategia**:
1. Desplegar nueva versión con soporte para ambos sistemas
2. Usuarios existentes continúan usando tokens de 7 días
3. Al próximo login, migran automáticamente al sistema de refresh tokens
4. Después de 30 días, deprecar tokens antiguos

**Plan de Rollback**:
- Mantener compatibilidad con tokens antiguos durante período de gracia
- Si hay problemas, desactivar refresh tokens temporalmente
- Flag de feature para activar/desactivar: `ENABLE_REFRESH_TOKENS=true`

---

## 📚 Referencias

- [RFC 6749: OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [OWASP: JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0: Refresh Tokens](https://auth0.com/docs/secure/tokens/refresh-tokens)

---

## ✅ Criterios de Aceptación

- [ ] Access tokens expiran en 15-30 minutos
- [ ] Refresh tokens expiran en 7-30 días
- [ ] Refresh token endpoint funciona correctamente
- [ ] Cliente renueva tokens automáticamente
- [ ] Usuario puede ver sesiones activas
- [ ] Usuario puede revocar sesiones
- [ ] Logout revoca refresh token
- [ ] Tests cubren >= 80% del código nuevo
- [ ] Documentación actualizada
- [ ] Migración de usuarios sin interrupciones

---

**Notas**: Este documento es un plan completo. La implementación se realizará en un PR separado una vez aprobado por el equipo.
