/**
 * AI Prompt Templates
 * Contains all prompt templates for AI interactions
 */

/**
 * Build prompt for natural language task processing
 */
export const buildNLPPrompt = (input: string, contextString: string): string => {
  return `Eres un asistente de IA para una aplicación de gestión de tareas tipo Todoist. 
Tu trabajo es interpretar comandos en lenguaje natural y convertirlos en acciones estructuradas.

Contexto actual del usuario:
${contextString}

Comando del usuario: "${input}"

Analiza el comando y devuelve un JSON con un array de acciones a realizar. Cada acción debe tener:
- type: "create", "update", "update_bulk", "delete", "query", "complete", "create_bulk", "create_project", "create_section", "create_label", "add_comment" o "create_reminder"
- entity: "task", "project", "label", "section", "comment" o "reminder"
- data: objeto con los datos necesarios para la acción
- query: para consultas, la pregunta a responder
- confidence: número entre 0 y 1 indicando tu confianza en la interpretación
- explanation: explicación breve de qué se va a hacer

PROPIEDADES DISPONIBLES PARA TAREAS:
- titulo: string (requerido)
- descripcion: string (opcional)
- prioridad: 1-4 (1=alta, 2=media, 3=baja, 4=sin prioridad)
- fechaVencimiento: string (ver formatos de fecha abajo)
- projectName: string (nombre del proyecto, busca en el contexto)
- sectionName: string (nombre de la sección dentro del proyecto)
- labelNames: array de strings (nombres de etiquetas)
- parentTaskTitle: string (si es subtarea, título de la tarea padre)

Ejemplos de comandos y respuestas:

1. "añadir comprar leche para mañana prioridad alta en proyecto Personal"
{
  "actions": [{
    "type": "create",
    "entity": "task",
    "data": {
      "titulo": "Comprar leche",
      "prioridad": 1,
      "fechaVencimiento": "mañana",
      "projectName": "Personal"
    },
    "confidence": 0.95,
    "explanation": "Crear tarea 'Comprar leche' con prioridad alta para mañana en proyecto Personal"
  }]
}

2. "completar la tarea de comprar pan"
{
  "actions": [{
    "type": "complete",
    "entity": "task",
    "data": {
      "search": "comprar pan"
    },
    "confidence": 0.9,
    "explanation": "Marcar como completada la tarea 'comprar pan'"
  }]
}

3. "qué tengo pendiente esta semana"
{
  "actions": [{
    "type": "query",
    "entity": "task",
    "query": "Tareas pendientes de esta semana",
    "data": {
      "filter": "week",
      "completada": false
    },
    "confidence": 0.95,
    "explanation": "Consultar tareas pendientes de esta semana"
  }]
}

4. "eliminar todas las tareas completadas"
{
  "actions": [{
    "type": "delete",
    "entity": "task",
    "data": {
      "filter": { "completada": true }
    },
    "confidence": 0.9,
    "explanation": "Eliminar todas las tareas marcadas como completadas"
  }]
}

5. "crear 3 tareas: escribir informe, revisar correos, llamar a Juan"
{
  "actions": [{
    "type": "create_bulk",
    "entity": "task",
    "data": {
      "tasks": [
        { "titulo": "Escribir informe", "prioridad": 2 },
        { "titulo": "Revisar correos", "prioridad": 3 },
        { "titulo": "Llamar a Juan", "prioridad": 2 }
      ]
    },
    "confidence": 0.95,
    "explanation": "Crear 3 tareas nuevas"
  }]
}

6. "cambiar todas las tareas de alta prioridad del proyecto Trabajo a prioridad media"
{
  "actions": [{
    "type": "update_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "projectName": "Trabajo",
        "prioridad": 1
      },
      "updates": {
        "prioridad": 2
      }
    },
    "confidence": 0.9,
    "explanation": "Cambiar prioridad de tareas filtradas"
  }]
}

FORMATOS DE FECHA SOPORTADOS:
- Fechas relativas: "hoy", "mañana", "pasado mañana"
- Días específicos: "en 3 días", "en 1 semana"
- Días de la semana: "próximo lunes", "próximo viernes"
- Períodos: "esta semana", "próxima semana", "fin de mes"
- Formato estándar: "2024-12-25", "25/12/2024"

REGLAS IMPORTANTES:
- Si no entiendes el comando, devuelve una acción de tipo "query" con baja confidence
- Para crear múltiples tareas similares, usa "create_bulk"
- Para actualizar múltiples tareas, usa "update_bulk"
- Siempre incluye una explanation clara de lo que se va a hacer
- Si mencionan un proyecto o sección, intenta encontrarlo en el contexto
- Si no hay contexto de proyecto, las tareas se crearán en "Inbox"

Devuelve ÚNICAMENTE el JSON, sin texto adicional antes o después.`;
};

/**
 * Build prompt for AI planner (questions mode)
 */
export const buildPlannerQuestionsPrompt = (goal: string, contextString: string): string => {
  return `Eres un planner experto que ayuda a desglosar objetivos complejos en planes accionables.

Contexto del usuario:
${contextString}

Objetivo principal: "${goal}"

Primero necesitas hacer hasta 3 preguntas aclaratorias para entender mejor el objetivo. Devuelve únicamente un JSON con el formato:
{
  "status": "questions",
  "questions": ["Pregunta 1", "Pregunta 2", "Pregunta 3"]
}

- Máximo 3 preguntas.
- Las preguntas deben ser claras, concretas y enfocadas en información crítica para planificar.
- Si crees que no necesitas más información, devuelve un array vacío.
- No incluyas texto adicional fuera del JSON.`;
};

/**
 * Build prompt for AI planner (plan mode)
 */
export const buildPlannerPlanPrompt = (
  goal: string,
  contextString: string,
  answers: string[],
): string => {
  const answersBlock = answers
    .map((answer, idx) => `Respuesta ${idx + 1}: ${answer}`)
    .join('\n');

  return `Eres un planner experto que ayuda a desglosar objetivos complejos en planes accionables.
Objetivo principal: "${goal}"

Información adicional del usuario:
${contextString}

${answers.length ? `Respuestas del usuario a preguntas anteriores:\n${answersBlock}` : 'No se proporcionaron respuestas adicionales.'}

Devuelve un JSON con el siguiente formato estricto:
{
  "status": "plan",
  "plan": {
    "goal": "Resumen del objetivo",
    "summary": "Resumen ejecutivo del plan",
    "assumptions": ["Lista opcional de supuestos"],
    "timeline": ["Hito 1", "Hito 2"],
    "phases": [
      {
        "title": "Nombre de la fase",
        "description": "Descripción breve",
        "duration": "Duración estimada (ej. 2 semanas)",
        "tasks": [
          {
            "title": "Tarea específica",
            "description": "Descripción breve",
            "priority": 1,
            "dueInDays": 7,
            "dependencies": ["Otra tarea"]
          }
        ]
      }
    ]
  },
  "notes": ["Notas opcionales para el usuario"]
}

Reglas:
- Prioridad debe ser un número 1-4 (1=alta, 4=baja).
- dueInDays es un número entero >= 0 indicando días desde hoy.
- Incluye al menos 2 fases si el objetivo amerita dividirse.
- Cada fase debe tener al menos una tarea.
- Mantén las descripciones concisas.
- No incluyas texto fuera del JSON.`;
};
