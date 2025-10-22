# Plan de Implementación: Sistema de Notificaciones y Recordatorios

## 📋 Análisis del Estado Actual

### ✅ Lo que YA existe:
- **Recordatorios**: Sistema básico de recordatorios por tarea
  - CRUD de recordatorios vinculados a tareas
  - Campo `enviado` para marcar si se envió
  - Componente `ReminderManager` y `ReminderPicker` en frontend
  
### ❌ Lo que NO existe:
- **Sistema de Notificaciones**: No hay ningún sistema implementado
- **Centro de Notificaciones**: No hay UI para ver notificaciones
- **Servicio de Envío**: No hay backend que envíe recordatorios
- **Notificaciones del Sistema**: No se generan notificaciones automáticas
- **Navegación a Entidades**: No hay enlaces desde notificaciones

---

## 🎯 Objetivos del Nuevo Sistema

### 1. Sistema de Notificaciones Completo
Crear un sistema robusto que notifique al usuario sobre:
- 🔔 **Recordatorios** - Cuando llega la hora de un recordatorio
- 💬 **Comentarios** - Cuando alguien comenta en una tarea
- ✅ **Tareas Completadas** - Cuando se completa una tarea importante
- 📅 **Fechas de Vencimiento** - Tareas que vencen hoy/mañana
- 🏷️ **Menciones** - Si se implementan menciones en comentarios
- 🤖 **Acciones de IA** - Cuando la IA completa una acción

### 2. Centro de Notificaciones Flotante
- **Modal Flotante** con las siguientes características:
  - ✨ Posición recordada (si está pinneado)
  - 📌 Opción de pinnear/despinnear
  - 🖱️ Arrastrable por la pantalla
  - 📜 Scroll infinito dentro del modal
  - 🎨 Diseño limpio y moderno
  - 🌙 Soporte dark mode
  - ❌ Cierre al hacer clic fuera (si no está pinneado)

### 3. Interactividad Avanzada
- **Navegación Directa**: Clic en notificación → ir a la entidad
- **Respuesta Rápida**: Responder comentarios sin salir del modal
- **Acciones Rápidas**: Marcar como leída, eliminar, etc.
- **Filtros**: Ver todas, solo no leídas, por tipo

### 4. Notificaciones del Navegador (Opcional)
- Soporte para notificaciones web nativas
- Configuración por usuario (activar/desactivar)

---

## 🗄️ Estructura de Base de Datos

### Nueva Tabla: `Notification`

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'reminder', 'comment', 'task_completed', 'due_date', 'mention', 'ai_action'
  title     String
  message   String
  read      Boolean  @default(false)
  
  // Referencias opcionales según tipo
  taskId    String?
  commentId String?
  projectId String?
  sectionId String?
  labelId   String?
  
  // Metadatos
  metadata  Json?    // Información adicional flexible
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task? @relation(fields: [taskId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("notifications")
  @@index([userId, read])
  @@index([userId, createdAt])
}
```

---

## 🔧 Implementación Backend

### 1. Servicio de Notificaciones (`notificationService.ts`)

```typescript
class NotificationService {
  // Crear notificación
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string;
    commentId?: string;
    projectId?: string;
    metadata?: any;
  }): Promise<Notification>
  
  // Obtener notificaciones del usuario
  async getByUser(userId: string, filters?: {
    read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>
  
  // Marcar como leída
  async markAsRead(id: string): Promise<void>
  
  // Marcar todas como leídas
  async markAllAsRead(userId: string): Promise<void>
  
  // Eliminar notificación
  async delete(id: string): Promise<void>
  
  // Contar no leídas
  async countUnread(userId: string): Promise<number>
}
```

### 2. Servicio de Recordatorios Mejorado (`reminderService.ts`)

```typescript
class ReminderService {
  // Verificar recordatorios pendientes
  async checkPendingReminders(): Promise<void>
  
  // Enviar recordatorio (crear notificación)
  async sendReminder(reminder: Reminder): Promise<void>
  
  // Job periódico (cada minuto)
  startReminderChecker(): void
}
```

### 3. Controlador de Notificaciones (`notificationController.ts`)

```typescript
// GET /api/notifications
export const getNotifications = async (req, res) => { ... }

// GET /api/notifications/unread/count
export const getUnreadCount = async (req, res) => { ... }

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => { ... }

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => { ... }

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => { ... }
```

### 4. Integración con SSE

Añadir nuevos eventos SSE:
- `notification_created` - Nueva notificación
- `notification_read` - Notificación marcada como leída
- `notification_deleted` - Notificación eliminada

### 5. Generación Automática de Notificaciones

Modificar los controladores existentes para generar notificaciones:

**En `commentController.ts`:**
```typescript
// Después de crear comentario
await notificationService.create({
  userId: task.project.userId, // Dueño de la tarea
  type: 'comment',
  title: 'Nuevo comentario',
  message: `${user.nombre} comentó en "${task.titulo}"`,
  taskId: task.id,
  commentId: comment.id,
  metadata: { commentText: comment.contenido }
});
```

**En `taskController.ts` (toggle completada):**
```typescript
// Después de completar tarea
await notificationService.create({
  userId: userId,
  type: 'task_completed',
  title: 'Tarea completada',
  message: `"${task.titulo}" ha sido completada`,
  taskId: task.id
});
```

**Job diario para fechas de vencimiento:**
```typescript
// Chequear tareas que vencen hoy/mañana
async function checkDueDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const tasks = await prisma.task.findMany({
    where: {
      completada: false,
      fechaVencimiento: {
        gte: new Date(),
        lte: tomorrow
      }
    },
    include: { project: true }
  });
  
  for (const task of tasks) {
    await notificationService.create({
      userId: task.project.userId,
      type: 'due_date',
      title: 'Tarea próxima a vencer',
      message: `"${task.titulo}" vence pronto`,
      taskId: task.id
    });
  }
}
```

---

## 🎨 Implementación Frontend

### 1. Tipos TypeScript

```typescript
export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'comment' | 'task_completed' | 'due_date' | 'mention' | 'ai_action';
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  commentId?: string;
  projectId?: string;
  sectionId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Store de Notificaciones (Zustand)

```typescript
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  toggleOpen: () => void;
  setPinned: (pinned: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
}
```

### 3. Hook de Notificaciones

```typescript
export function useNotifications() {
  const queryClient = useQueryClient();
  
  // Obtener notificaciones
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll(),
    refetchInterval: 30000 // Cada 30 segundos
  });
  
  // Contador de no leídas
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsAPI.getUnreadCount()
  });
  
  // Marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // ... más mutations
  
  return { notifications, unreadCount, markAsRead, ... };
}
```

### 4. Componente `NotificationCenter`

**Características:**
- 📦 Modal flotante con `react-draggable`
- 📌 Botón de pin/unpin
- 🔍 Filtros (todas, no leídas)
- 📜 Lista virtualizada si hay muchas notificaciones
- ⚡ Acciones rápidas por notificación
- 🎯 Navegación al hacer clic
- 💬 Respuesta rápida para comentarios

**Estructura:**
```tsx
<NotificationCenter>
  <Header>
    <Title>Notificaciones</Title>
    <PinButton />
    <CloseButton />
  </Header>
  
  <Filters>
    <FilterButton active>Todas</FilterButton>
    <FilterButton>No leídas</FilterButton>
  </Filters>
  
  <NotificationList>
    {notifications.map(notification => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onClick={() => navigateToEntity(notification)}
        onMarkAsRead={() => markAsRead(notification.id)}
        onDelete={() => deleteNotification(notification.id)}
      />
    ))}
  </NotificationList>
  
  {canReply && (
    <QuickReplyBox
      commentId={notification.commentId}
      onReply={handleReply}
    />
  )}
</NotificationCenter>
```

### 5. Botón de Notificaciones (Header)

```tsx
<NotificationButton onClick={toggleNotificationCenter}>
  <Bell />
  {unreadCount > 0 && (
    <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>
  )}
</NotificationButton>
```

### 6. NotificationItem Component

```tsx
<div className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
  <Icon type={notification.type} />
  
  <div className="content">
    <h4>{notification.title}</h4>
    <p>{notification.message}</p>
    <time>{formatRelative(notification.createdAt)}</time>
  </div>
  
  <div className="actions">
    {!notification.read && (
      <button onClick={onMarkAsRead}>
        <Check />
      </button>
    )}
    <button onClick={onDelete}>
      <Trash />
    </button>
  </div>
</div>
```

### 7. Navegación a Entidades

```typescript
function navigateToEntity(notification: Notification) {
  switch (notification.type) {
    case 'reminder':
    case 'task_completed':
    case 'due_date':
      // Abrir modal de tarea
      navigate(`/project/${notification.projectId}?task=${notification.taskId}`);
      break;
      
    case 'comment':
      // Abrir tarea y scrollear al comentario
      navigate(`/project/${notification.projectId}?task=${notification.taskId}&comment=${notification.commentId}`);
      break;
      
    // ... más casos
  }
  
  // Marcar como leída
  markAsRead(notification.id);
}
```

### 8. Integración con SSE

```typescript
// En useSSE hook
eventSource.addEventListener('notification_created', (e) => {
  const notification = JSON.parse(e.data);
  
  // Añadir a la lista
  addNotification(notification);
  
  // Incrementar contador
  incrementUnreadCount();
  
  // Mostrar toast
  toast.info(notification.title);
  
  // Notificación del navegador (si está permitido)
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png'
    });
  }
});
```

---

## 📱 Mejoras Adicionales Propuestas

### 1. Notificaciones Web Nativas
- Solicitar permisos al usuario
- Mostrar notificaciones incluso si la app no está activa
- Click en notificación → abrir app y navegar

### 2. Sonido de Notificación
- Sonido sutil al recibir notificación importante
- Opción para desactivar en configuración

### 3. Agrupación de Notificaciones
- Si hay 5+ notificaciones del mismo tipo, agruparlas
- Ej: "3 nuevos comentarios en tus tareas"

### 4. Notificaciones Persistentes
- Mantener notificaciones importantes hasta que se lean
- Ej: Recordatorios, menciones directas

### 5. Configuración de Notificaciones
- Usuario puede elegir qué tipos de notificaciones recibir
- Horario "No molestar"
- Frecuencia de recordatorios

### 6. Snooze de Recordatorios
- Posponer recordatorio por X minutos
- Re-generar notificación después del snooze

### 7. Preview de Tareas
- Hover sobre notificación → ver preview de la tarea
- Ver título, descripción, prioridad sin navegar

### 8. Respuesta Rápida Mejorada
- Editor markdown dentro del modal
- Soporte para menciones (@usuario)
- Adjuntar archivos (futura funcionalidad)

### 9. Historial de Notificaciones
- Ver todas las notificaciones (incluso antiguas)
- Búsqueda en historial
- Archivar en lugar de eliminar

### 10. Notificaciones de Actividad
- "Has completado 5 tareas hoy 🎉"
- "Tienes 10 tareas pendientes esta semana"
- Resumen semanal/mensual

---

## 📊 Prioridades de Implementación

### FASE 1 - CORE (Alta Prioridad) ⭐⭐⭐
1. ✅ Migración de base de datos (tabla Notification)
2. ✅ Servicio backend de notificaciones
3. ✅ API REST endpoints
4. ✅ Servicio de recordatorios automático
5. ✅ Componente NotificationCenter básico
6. ✅ Integración con SSE
7. ✅ Navegación a entidades

**Tiempo estimado: 1-2 días**

### FASE 2 - UX AVANZADA (Media Prioridad) ⭐⭐
8. ✅ Modal arrastrable y posición recordada
9. ✅ Respuesta rápida a comentarios
10. ✅ Acciones rápidas (marcar leída, eliminar)
11. ✅ Filtros y búsqueda
12. ✅ Notificaciones automáticas (comentarios, completar tareas)

**Tiempo estimado: 1 día**

### FASE 3 - EXTRAS (Baja Prioridad) ⭐
13. ✅ Notificaciones web nativas
14. ✅ Sonidos
15. ✅ Configuración de preferencias
16. ✅ Agrupación inteligente
17. ✅ Preview de tareas
18. ✅ Historial completo

**Tiempo estimado: 1-2 días**

---

## 🧪 Testing

### Tests Backend
- ✅ Creación de notificaciones
- ✅ Servicio de recordatorios (mock de fechas)
- ✅ SSE de notificaciones
- ✅ Generación automática

### Tests Frontend
- ✅ Renderizado de NotificationCenter
- ✅ Navegación a entidades
- ✅ Respuesta rápida
- ✅ Persistencia de posición

---

## 📝 Notas Técnicas

### Librerías a Instalar

**Backend:**
```bash
npm install node-cron  # Para jobs periódicos
```

**Frontend:**
```bash
npm install react-draggable  # Para modal arrastrable
npm install date-fns  # Ya instalado, para formateo de fechas
```

### Configuración Adicional

**Variables de entorno:**
```env
NOTIFICATION_CHECK_INTERVAL=60000  # Chequear recordatorios cada minuto
ENABLE_BROWSER_NOTIFICATIONS=true
ENABLE_NOTIFICATION_SOUNDS=true
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Crear migración de Prisma para tabla `Notification`
- [ ] Implementar `notificationService.ts`
- [ ] Implementar `notificationController.ts`
- [ ] Crear rutas `/api/notifications`
- [ ] Mejorar `reminderService.ts` con checker automático
- [ ] Añadir eventos SSE para notificaciones
- [ ] Integrar creación de notificaciones en comentarios
- [ ] Integrar creación de notificaciones en tareas completadas
- [ ] Crear job para fechas de vencimiento
- [ ] Tests unitarios

### Frontend
- [ ] Crear tipos de notificaciones
- [ ] Crear store de notificaciones (Zustand)
- [ ] Implementar hook `useNotifications`
- [ ] API client para notificaciones
- [ ] Componente `NotificationCenter`
- [ ] Componente `NotificationItem`
- [ ] Componente `NotificationButton` (header)
- [ ] Componente `QuickReplyBox`
- [ ] Integrar SSE para notificaciones
- [ ] Implementar navegación a entidades
- [ ] Modal arrastrable con posición persistente
- [ ] Sistema de permisos para notificaciones web
- [ ] Tests de componentes

---

## 🎯 Resultado Esperado

Un sistema de notificaciones completo que:
- ✅ Notifica automáticamente eventos importantes
- ✅ Permite gestión centralizada de todas las notificaciones
- ✅ Facilita navegación rápida a entidades
- ✅ Permite respuesta rápida a comentarios
- ✅ Funciona en tiempo real con SSE
- ✅ Es configurable por el usuario
- ✅ Tiene excelente UX (arrastrable, pinnable, responsive)
- ✅ Soporta notificaciones web nativas

---

**¿Listo para empezar? Podemos comenzar con la FASE 1 (Core) inmediatamente.**
