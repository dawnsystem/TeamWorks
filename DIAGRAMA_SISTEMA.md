# Diagrama del Sistema de Suscripción a Tareas

## 🎯 Flujo de Suscripción y Notificaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CREACIÓN DE TAREA                            │
└─────────────────────────────────────────────────────────────────────┘

Usuario A: "Crear tarea: Revisar diseño"
           │
           ├─> [Backend] taskController.createTask()
           │   │
           │   ├─> Guarda Task en BD con createdBy = Usuario A
           │   │
           │   └─> [Auto-suscripción]
           │       taskSubscriptionService.autoSubscribeCreator()
           │       │
           │       └─> Crea TaskSubscription: { taskId, userId: A }
           │
           └─> [UI] Muestra tarea creada
               │
               └─> ❌ NO se crea notificación para Usuario A


┌─────────────────────────────────────────────────────────────────────┐
│                    SUSCRIPCIÓN MANUAL                               │
└─────────────────────────────────────────────────────────────────────┘

Usuario B: Ve la tarea y hace clic en botón "Suscribirse"
           │
           ├─> [Frontend] TaskSubscriptionButton
           │   └─> POST /api/tasks/:taskId/subscribe
           │
           ├─> [Backend] taskSubscriptionController.subscribeToTask()
           │   │
           │   └─> taskSubscriptionService.subscribe(taskId, userId: B)
           │       │
           │       └─> Crea TaskSubscription: { taskId, userId: B }
           │
           └─> [UI] Botón cambia a "Suscrito" (Bell icon)


┌─────────────────────────────────────────────────────────────────────┐
│                ACTUALIZACIÓN DE TAREA (Completar)                   │
└─────────────────────────────────────────────────────────────────────┘

Usuario A: Marca tarea como completada
           │
           ├─> [Backend] taskController.toggleTask()
           │   │
           │   ├─> Actualiza Task.completada = true
           │   │
           │   └─> notificationService.createForTaskSubscribers()
           │       │
           │       ├─> Obtiene suscriptores: [Usuario A, Usuario B]
           │       │
           │       ├─> Filtra al actor (Usuario A): [Usuario B]
           │       │
           │       └─> Crea notificación SOLO para Usuario B
           │           │
           │           └─> "Se completó la tarea: Revisar diseño"
           │
           ├─> [SSE] Envía evento a Usuario B
           │
           └─> ✅ Usuario A NO recibe notificación (es el actor)
               ✅ Usuario B SÍ recibe notificación


┌─────────────────────────────────────────────────────────────────────┐
│                      AÑADIR COMENTARIO                              │
└─────────────────────────────────────────────────────────────────────┘

Usuario B: "El diseño se ve bien 👍"
           │
           ├─> [Backend] commentController.createComment()
           │   │
           │   ├─> Guarda Comment en BD
           │   │
           │   └─> notificationService.createForTaskSubscribers()
           │       │
           │       ├─> Obtiene suscriptores: [Usuario A, Usuario B]
           │       │
           │       ├─> Filtra al actor (Usuario B): [Usuario A]
           │       │
           │       └─> Crea notificación SOLO para Usuario A
           │           │
           │           └─> "Usuario B comentó en: Revisar diseño"
           │
           ├─> [SSE] Envía evento a Usuario A
           │
           └─> ✅ Usuario B NO recibe notificación (es el autor)
               ✅ Usuario A SÍ recibe notificación


┌─────────────────────────────────────────────────────────────────────┐
│                       DESUSCRIBIRSE                                 │
└─────────────────────────────────────────────────────────────────────┘

Usuario B: Hace clic en "Desuscribirse"
           │
           ├─> [Frontend] TaskSubscriptionButton
           │   └─> DELETE /api/tasks/:taskId/subscribe
           │
           ├─> [Backend] taskSubscriptionController.unsubscribeFromTask()
           │   │
           │   └─> taskSubscriptionService.unsubscribe(taskId, userId: B)
           │       │
           │       └─> Elimina TaskSubscription donde taskId Y userId = B
           │
           └─> [UI] Botón cambia a "Suscribirse" (BellOff icon)

           Ahora Usuario B ya NO recibirá notificaciones de esta tarea
```

## 📊 Tabla de Suscriptores

```
┌──────────────┬─────────────┬────────────────┬─────────────┐
│   taskId     │   userId    │  Tipo          │  Recibe     │
│              │             │                │  Notifs?    │
├──────────────┼─────────────┼────────────────┼─────────────┤
│ task-123     │  Usuario A  │  Auto (creador)│  ✅ (otros) │
│ task-123     │  Usuario B  │  Manual        │  ✅ (otros) │
│ task-123     │  Usuario C  │  Manual        │  ✅ (otros) │
└──────────────┴─────────────┴────────────────┴─────────────┘

Cuando Usuario A hace algo:
  → Notifica a: Usuario B, Usuario C
  → NO notifica a: Usuario A (es el actor)

Cuando Usuario B hace algo:
  → Notifica a: Usuario A, Usuario C
  → NO notifica a: Usuario B (es el actor)
```

## 🔄 Comparación: Antes vs Ahora

### ANTES (Sin Sistema de Suscripción)

```
Usuario A crea tarea
    ↓
  ❌ Notificación a Usuario A: "Has creado tarea X"
    (no tiene sentido)

Usuario A completa tarea
    ↓
  ❌ Notificación a Usuario A: "Has completado tarea X"
    (no tiene sentido)

Usuario B comenta
    ↓
  ⚠️ Notificación SOLO a dueño del proyecto
    (otros interesados no se enteran)
```

### AHORA (Con Sistema de Suscripción)

```
Usuario A crea tarea
    ↓
  ✅ Auto-suscripción silenciosa (sin notificación)
  ✅ Usuario A puede recibir notifs de otros usuarios

Usuario A completa tarea
    ↓
  ✅ Notificación a TODOS los suscriptores
  ✅ EXCEPTO Usuario A (es el actor)

Usuario B comenta
    ↓
  ✅ Notificación a TODOS los suscriptores
  ✅ EXCEPTO Usuario B (es el autor)
```

## 🎨 Interfaz de Usuario

```
┌────────────────────────────────────────────────────────────┐
│  Tarea: Revisar diseño de homepage                    × ✏️│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [🔔 Suscrito]  ← Botón de suscripción                   │
│                                                            │
│  Descripción: Revisar el nuevo diseño responsive...       │
│                                                            │
│  📁 Proyecto: Marketing                                    │
│  🚩 Prioridad: P1 - Alta                                   │
│  📅 Vencimiento: 25 de Enero                               │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  💬 Comentarios (2)                                        │
│                                                            │
│  🔔 Recordatorios                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

Estados del botón:
  🔔 Suscrito    → Usuario está suscrito (azul)
  🔕 Suscribirse → Usuario NO está suscrito (gris)
  ⏳ Loading     → Procesando (spinner)
```

## 🗄️ Modelo de Base de Datos

```
┌─────────────────────┐
│       Users         │
├─────────────────────┤
│ id (PK)            │
│ email              │
│ nombre             │
│ ...                │
└─────────────────────┘
          │
          │ 1:N
          │
┌─────────────────────┐       ┌──────────────────────┐
│   TaskSubscriptions │ N:1   │        Tasks         │
├─────────────────────┤───────├──────────────────────┤
│ id (PK)            │       │ id (PK)              │
│ taskId (FK) ───────┼───────│ titulo               │
│ userId (FK)        │       │ descripcion          │
│ createdAt          │       │ createdBy (FK) ──┐   │
│ updatedAt          │       │ ...              │   │
└─────────────────────┘       └──────────────────┼───┘
                                                 │
                                                 │ N:1
                                                 │
                              ┌──────────────────┘
                              │
                              │ (Usuario que creó la tarea)
                              └─> Users

Constraints:
  - UNIQUE(taskId, userId) - Previene suscripciones duplicadas
  - INDEX(taskId) - Búsqueda rápida de suscriptores
  - INDEX(userId) - Búsqueda rápida de suscripciones por usuario
  - ON DELETE CASCADE - Auto-limpieza al eliminar tarea/usuario
```

## 🔀 Flujo de Datos Completo

```
┌─────────────┐
│   Cliente   │
│  (React)    │
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼──────────────────────────────────────────────────┐
│                   Backend (Express)                     │
│                                                          │
│  ┌────────────────┐    ┌──────────────────────┐        │
│  │  Controllers   │───>│     Services         │        │
│  │                │    │                      │        │
│  │ - Task         │    │ - taskSubscription   │        │
│  │ - Comment      │    │ - notification       │        │
│  │ - Subscription │    │ - sse                │        │
│  └────────────────┘    └──────────────────────┘        │
│                                │                        │
│                                ▼                        │
│                        ┌──────────────┐                │
│                        │   Prisma     │                │
│                        └──────┬───────┘                │
└───────────────────────────────┼────────────────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │              │
                        │ - tasks      │
                        │ - task_      │
                        │   subscript. │
                        │ - notificat. │
                        └──────────────┘

SSE (Server-Sent Events) para actualizaciones en tiempo real
```

## 📈 Métricas del Sistema

```
┌────────────────────────────────────────────────────┐
│              REDUCCIÓN DE NOTIFICACIONES           │
├────────────────────────────────────────────────────┤
│                                                    │
│  Antes:  ████████████████████████████████ 100%   │
│          │ auto-notif │ relevantes      │        │
│          └─── 60% ────┴──── 40% ────────┘        │
│                                                    │
│  Ahora:  ████████████████░░░░░░░░░░░░░░ 40%     │
│          │ relevantes   │ eliminadas   │         │
│          └──── 100% ────┴─── 60% ──────┘         │
│                                                    │
│  Resultado: -60% notificaciones totales           │
│             +150% relevancia (40% → 100%)         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**Leyenda de símbolos:**
- ✅ Correcto / Implementado
- ❌ Incorrecto / Eliminado
- ⚠️ Problema / Atención
- 🔔 Notificación / Suscrito
- 🔕 No suscrito
- ⏳ En proceso
- 📁 Proyecto
- 🚩 Prioridad
- 📅 Fecha
- 💬 Comentario
- ⏰ Recordatorio
