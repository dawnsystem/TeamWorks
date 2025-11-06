# Guía de Modos de IA en TeamWorks

TeamWorks ofrece tres modos de interacción con la IA, cada uno diseñado para diferentes propósitos:

## 🎯 Los Tres Modos

### 1. Modo ASK (Preguntar) 🤔

**Propósito:** Resolver dudas y obtener información sin ejecutar acciones.

**Cuándo usarlo:**
- Tienes preguntas sobre cómo usar la aplicación
- Quieres consejos sobre productividad
- Necesitas saber qué opciones tienes
- Buscas información sobre gestión de tareas

**Características:**
- ✅ Responde preguntas
- ✅ Da consejos y recomendaciones
- ✅ Explica procesos
- ✅ Sugiere cambiar a otros modos cuando sea apropiado
- ❌ NO ejecuta acciones
- ❌ NO crea ni modifica tareas

**Ejemplos:**
```
Usuario: "¿Cómo puedo organizar mejor mis tareas?"
IA (ASK): "Te recomiendo usar proyectos para agrupar tareas relacionadas, 
secciones para diferentes etapas del trabajo, y etiquetas para categorizar 
por tipo o urgencia. ¿Te gustaría que te ayude a crear esta estructura? 
Si es así, cambiaría a modo AGENT para hacerlo."

Usuario: "¿Qué diferencia hay entre prioridad y fecha de vencimiento?"
IA (ASK): "La prioridad indica qué tan importante es una tarea 
(P1=urgente, P4=baja prioridad), mientras que la fecha de vencimiento 
indica cuándo debe completarse. Puedes tener una tarea P1 sin fecha 
(importante pero no urgente) o una tarea P4 con fecha próxima."
```

### 2. Modo PLAN (Planificar) 📋

**Propósito:** Crear planes estructurados para proyectos complejos.

**Cuándo usarlo:**
- Quieres planificar un proyecto nuevo
- Necesitas estructurar un objetivo grande
- Deseas ver un plan antes de ejecutarlo
- Quieres revisar y aprobar antes de crear tareas

**Características:**
- ✅ Hace preguntas para entender el alcance
- ✅ Crea planes detallados con fases y tareas
- ✅ Proporciona timelines estimados
- ✅ Muestra el plan completo antes de ejecutar
- ✅ Sugiere cambiar a modo AGENT para ejecutar
- ⚠️ NO ejecuta automáticamente (requiere confirmación)

**Ejemplos:**
```
Usuario: "Quiero lanzar una campaña de marketing"
IA (PLAN): "¡Perfecto! Para crear el mejor plan, necesito saber:
¿Cuándo planeas lanzar la campaña? ¿Tienes una fecha específica?"

Usuario: "En 3 meses"
IA (PLAN): "Excelente. ¿Qué tipo de campaña es? (redes sociales, email, 
eventos, combinada...) ¿Y cuál es tu presupuesto aproximado?"

Usuario: "Campaña combinada con presupuesto medio"
IA (PLAN): "Genial. Aquí está el plan que sugiero:

PLAN: Campaña de Marketing (3 meses)

Fase 1: Preparación (Semana 1-2)
- Definir público objetivo
- Crear buyer personas
- Establecer KPIs

Fase 2: Creación de Contenido (Semana 3-6)
- Diseñar creativos
- Escribir copies
- Preparar landing pages

Fase 3: Ejecución (Semana 7-10)
- Lanzar campañas en redes
- Enviar emails
- Monitorear resultados

Fase 4: Análisis (Semana 11-12)
- Analizar métricas
- Optimizar campañas
- Reportar resultados

¿Quieres que cambie a modo AGENT para crear todas estas tareas?"
```

### 3. Modo AGENT (Agente Autónomo) 🤖

**Propósito:** Ejecutar acciones automáticamente tras una conversación.

**Cuándo usarlo:**
- Quieres que la IA ejecute acciones inmediatamente
- Necesitas crear muchas tareas rápidamente
- Confías en que la IA entiende lo que necesitas
- Quieres una asistencia completamente automatizada

**Características:**
- ✅ Conversa para entender exactamente qué quieres
- ✅ Hace preguntas específicas paso a paso
- ✅ Crea proyectos, secciones, tareas, subtareas automáticamente
- ✅ Asigna prioridades y fechas lógicas
- ✅ Añade recordatorios y etiquetas relevantes
- ✅ Ejecuta todas las acciones sin confirmación adicional
- ⚠️ Requiere claridad en las instrucciones

**Ejemplos:**
```
Usuario: "Necesito organizar mi mudanza"
IA (AGENT): "¡Claro! Te ayudo a organizarlo todo. 
¿Cuándo es la mudanza? ¿Tienes fecha confirmada?"

Usuario: "En 1 mes exactamente"
IA (AGENT): "Perfecto. ¿Es una mudanza local o a otra ciudad? 
¿Y aproximadamente cuántas habitaciones?"

Usuario: "Local, apartamento de 2 habitaciones"
IA (AGENT): "Entendido. ¿Tienes ayuda o lo harás solo? 
¿Necesitas contratar mudanza?"

Usuario: "Haré la mayor parte solo pero contrataré empresa para muebles grandes"
IA (AGENT): "¡Listo! He creado tu plan de mudanza completo:

✅ CREADO:
- Proyecto: "Mudanza" (color azul)
- 4 Secciones: Preparación, Empaque, Mudanza, Instalación

- Tarea: "Contratar empresa de mudanza" (P1, fecha: en 2 semanas)
  └─ Subtarea: "Comparar presupuestos" (P1, fecha: en 10 días)
  └─ Subtarea: "Reservar fecha" (P1, fecha: en 12 días)

- Tarea: "Empacar pertenencias" (P2, fecha: en 3 semanas)
  └─ Subtarea: "Empacar cocina" (P2)
  └─ Subtarea: "Empacar dormitorio 1" (P2)
  └─ Subtarea: "Empacar dormitorio 2" (P2)
  └─ Subtarea: "Empacar baño" (P3)

- Tarea: "Notificar cambio de dirección" (P2, fecha: en 2 semanas)
  └─ Subtarea: "Actualizar dirección postal" (P2)
  └─ Subtarea: "Avisar servicios (luz, agua, internet)" (P1)

- Tarea: "Limpieza apartamento anterior" (P3, fecha: día de mudanza)

📌 RECORDATORIO: "Contratar mudanza" - en 10 días
🏷️ ETIQUETAS: mudanza, urgente, hogar

¡Todo listo! ¿Necesitas algo más?"
```

## 🔄 Cambio de Modo

La IA puede sugerirte cambiar de modo cuando sea apropiado:

### Desde ASK a PLAN
```
Usuario (ASK): "Quiero organizar mi trabajo de este mes"
IA: "Puedo explicarte cómo hacerlo, pero sería más útil si cambias 
a modo PLAN para que te ayude a crear un plan estructurado. ¿Quieres 
que cambiemos a modo PLAN?"
```

### Desde ASK a AGENT
```
Usuario (ASK): "Crea una tarea para comprar leche"
IA: "En modo ASK solo respondo preguntas. Para crear tareas, 
necesitas cambiar a modo AGENT. ¿Quieres que cambie a modo AGENT 
para crear esa tarea?"
```

### Desde PLAN a AGENT
```
Usuario (PLAN): [después de ver el plan]
IA: "¿Quieres que cambie a modo AGENT para ejecutar este plan 
automáticamente? Crearé todas las tareas, proyectos y recordatorios 
que hemos planificado."
```

## 🎨 API Usage

### Endpoint Unificado
**POST** `/api/ai/unified`

```json
{
  "message": "Tu mensaje",
  "mode": "ASK" | "PLAN" | "AGENT",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "conversationId": "opcional",
  "autoExecute": true/false,
  "provider": "groq|gemini"
}
```

### Respuesta

```json
{
  "mode": "ASK|PLAN|AGENT",
  "message": "Respuesta de la IA",
  "conversationId": "conv_xxx",
  
  // Para modo ASK
  "answer": "Respuesta a tu pregunta",
  "canChangeMode": true,
  "suggestedMode": "PLAN",
  "suggestedModeReason": "Para crear el plan estructurado",
  
  // Para modo PLAN
  "status": "conversation|ready",
  "requiresInput": true/false,
  "plan": { 
    "goal": "...",
    "phases": [...],
    ...
  },
  
  // Para modo AGENT
  "status": "conversation|ready|executing",
  "requiresInput": true/false,
  "suggestedActions": [...],
  "executedActions": [...],
  
  "providerUsed": "groq"
}
```

## 💡 Recomendaciones de Uso

### Usa ASK cuando:
- ❓ Tienes dudas o preguntas
- 📚 Necesitas aprender cómo funciona algo
- 💭 Quieres consejos sin comprometerte a acciones
- 🤷 No estás seguro de qué hacer

### Usa PLAN cuando:
- 📋 Tienes un proyecto complejo
- 🎯 Necesitas estructurar un objetivo grande
- 👀 Quieres ver el plan antes de ejecutarlo
- ✅ Prefieres revisar antes de crear tareas

### Usa AGENT cuando:
- ⚡ Quieres resultados inmediatos
- 🤖 Confías en que la IA entenderá lo que necesitas
- 🚀 Necesitas crear muchas tareas rápidamente
- 🎭 Quieres una experiencia completamente automatizada

## 🔀 Flujo Recomendado

1. **Empieza con ASK** si no estás seguro
2. **La IA te sugerirá** cambiar de modo si es apropiado
3. **Cambia a PLAN** para proyectos complejos
4. **Cambia a AGENT** cuando estés listo para ejecutar

## ⚙️ Configuración

Puedes configurar el modo por defecto en la UI o siempre especificarlo en cada solicitud.

**Modo por defecto:** ASK (más seguro, no ejecuta nada sin tu confirmación)

## 📊 Comparación Rápida

| Característica | ASK | PLAN | AGENT |
|---------------|-----|------|-------|
| Responde preguntas | ✅ | ⚠️ | ⚠️ |
| Crea planes | ❌ | ✅ | ✅ |
| Ejecuta acciones | ❌ | ❌ | ✅ |
| Requiere confirmación | N/A | ✅ | ❌ |
| Conversacional | ✅ | ✅ | ✅ |
| Sugiere cambio de modo | ✅ | ✅ | ❌ |
| Ideal para principiantes | ✅ | ✅ | ⚠️ |
| Velocidad | Rápido | Medio | Rápido |

## 🛡️ Seguridad

- **ASK**: Totalmente seguro, no modifica nada
- **PLAN**: Seguro, solo planifica sin ejecutar
- **AGENT**: Requiere confianza, ejecuta automáticamente

**Recomendación:** Empieza con ASK o PLAN hasta que te sientas cómodo, luego usa AGENT para máxima productividad.

---

**¿Necesitas ayuda?** Usa modo ASK y pregunta: *"¿Qué modo debería usar?"* 😊
