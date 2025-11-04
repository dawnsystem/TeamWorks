import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPPORTED_AI_PROVIDERS = ['groq', 'gemini'] as const;
type SupportedAIProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let groqClient: Groq | null = null;
let geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

const isProviderConfigured = (provider: SupportedAIProvider) => {
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    return Boolean(apiKey && apiKey !== 'YOUR_GROQ_API_KEY_HERE');
  }
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE');
  }
  return false;
};

const getConfiguredProviders = () =>
  SUPPORTED_AI_PROVIDERS.filter((provider) => isProviderConfigured(provider));

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('El proveedor Groq está seleccionado pero GROQ_API_KEY no está configurada. Obtén una en https://console.groq.com');
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('El proveedor Gemini está seleccionado pero GEMINI_API_KEY no está configurada. Genera una en https://makersuite.google.com/app/apikey');
  }
  if (!geminiModel) {
    const client = new GoogleGenerativeAI(apiKey);
    geminiModel = client.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
  }
  return geminiModel;
};

const resolveProvider = (provider?: string): SupportedAIProvider => {
  const selected = (provider || process.env.AI_PROVIDER || 'groq').toLowerCase();
  if (!SUPPORTED_AI_PROVIDERS.includes(selected as SupportedAIProvider)) {
    throw new Error(`Proveedor IA '${selected}' no soportado. Usa uno de: ${SUPPORTED_AI_PROVIDERS.join(', ')}`);
  }
  return selected as SupportedAIProvider;
};

const getProviderOrder = (preferred: SupportedAIProvider, override?: string) => {
  if (override) {
    return [preferred];
  }

  const configured = getConfiguredProviders();
  const ordered = configured.filter((p) => p === preferred);
  for (const provider of configured) {
    if (!ordered.includes(provider)) {
      ordered.push(provider);
    }
  }
  // Always ensure preferred first even if not configured (will throw quickly)
  if (!ordered.includes(preferred)) {
    ordered.unshift(preferred);
  }
  return ordered;
};

const generateWithProvider = async (prompt: string, provider: SupportedAIProvider): Promise<string> => {
  if (provider === 'gemini') {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text() || '';
  }

  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: DEFAULT_GROQ_MODEL,
    temperature: 0.7,
    max_tokens: 1000
  });

  return completion.choices[0]?.message?.content || '';
};

const generateWithFallback = async (
  prompt: string,
  preferred: SupportedAIProvider,
  override?: string,
): Promise<{ text: string; providerUsed: SupportedAIProvider }> => {
  const providersToTry = getProviderOrder(preferred, override);
  const errors: string[] = [];

  for (const provider of providersToTry) {
    try {
      const text = await generateWithProvider(prompt, provider);
      if (!text.trim()) {
        throw new Error('Respuesta vacía');
      }
      return { text, providerUsed: provider };
    } catch (error: any) {
      errors.push(`${provider}: ${error?.message || error}`);
    }
  }

  throw new Error(
    `No se pudo generar respuesta usando los proveedores disponibles. Detalles: ${errors.join(' | ')}`,
  );
};

// Función para parsear fechas en lenguaje natural
const parseDateString = (dateInput: string): Date | null => {
  const input = dateInput.toString().toLowerCase().trim();
  const now = new Date();
  
  // Hoy
  if (input.includes('hoy') || input === 'today') {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  // Mañana
  if (input.includes('mañana') || input === 'tomorrow') {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  // Pasado mañana
  if (input.includes('pasado mañana') || input.includes('pasadomañana')) {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  // Esta semana
  if (input.includes('esta semana') || input.includes('this week')) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  // Próximo/este + día de la semana
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado'];
  const diasSemanaEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (let i = 0; i < diasSemana.length; i++) {
    if (input.includes(diasSemana[i]) || input.includes(diasSemanaEn[i])) {
      const targetDay = i;
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      
      // Si es "próximo", añadir una semana más
      if (input.includes('próximo') || input.includes('proximo') || input.includes('next')) {
        daysToAdd += 7;
      }
      
      // Si el día ya pasó esta semana, ir a la próxima
      if (daysToAdd <= 0 && !input.includes('este') && !input.includes('this')) {
        daysToAdd += 7;
      }
      
      const date = new Date();
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(23, 59, 59, 999);
      return date;
    }
  }
  
  // En X días/semanas/meses
  const relativeMatch = input.match(/en (\d+) (día|dias|día|semana|semanas|mes|meses)/);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2];
    const date = new Date();
    
    if (unit.includes('día') || unit.includes('dia')) {
      date.setDate(date.getDate() + amount);
    } else if (unit.includes('semana')) {
      date.setDate(date.getDate() + (amount * 7));
    } else if (unit.includes('mes')) {
      date.setMonth(date.getMonth() + amount);
    }
    
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  // Intentar parsear como fecha ISO o formato estándar
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(23, 59, 59, 999);
    return parsed;
  }
  
  return null;
};

export interface AIAction {
  type: 'create' | 'update' | 'delete' | 'query' | 'complete' | 'create_bulk' | 'update_bulk' | 'create_project' | 'create_section' | 'create_label' | 'add_comment' | 'create_reminder';
  entity: 'task' | 'project' | 'label' | 'section' | 'comment' | 'reminder';
  data?: any;
  query?: string;
  confidence: number;
  explanation: string;
}

// Funciones helper para procesamiento de IA
const parseActionsFromText = (text: string): AIAction[] => {
  let jsonText = text.trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.substring(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.substring(3);
  }

  if (jsonText.endsWith('```')) {
    jsonText = jsonText.substring(0, jsonText.length - 3);
  }

  jsonText = jsonText.trim();

  try {
    const parsed = JSON.parse(jsonText);
    return parsed.actions || [];
  } catch (error) {
    console.error('Error parseando respuesta de IA:', error);
    return [];
  }
};

const createFallbackAction = (input: string): AIAction => ({
  type: 'create',
  entity: 'task',
  data: {
    titulo: input
  },
  confidence: 0.5,
  explanation: 'No se pudo procesar el comando con IA, creando tarea simple'
});

export interface ProcessNaturalLanguageResult {
  actions: AIAction[];
  providerUsed: SupportedAIProvider;
  raw?: string;
  fallback?: boolean;
  errorMessage?: string;
}

export interface AIPlanTask {
  title: string;
  description?: string;
  priority?: number;
  dueInDays?: number;
  dependencies?: string[];
}

export interface AIPlanPhase {
  title: string;
  description?: string;
  duration?: string;
  tasks: AIPlanTask[];
}

export interface AIPlan {
  goal: string;
  summary: string;
  assumptions?: string[];
  timeline?: string[];
  phases: AIPlanPhase[];
}

interface PlannerQuestionsResponse {
  status: 'questions';
  questions: string[];
}

interface PlannerPlanResponse {
  status: 'plan';
  plan: AIPlan;
  notes?: string[];
}

type InternalPlannerResponse = PlannerQuestionsResponse | PlannerPlanResponse;

const stripCodeFences = (text: string) => {
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```[a-zA-Z]*\n?/, '');
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, jsonText.lastIndexOf('```'));
  }
  return jsonText.trim();
};

const parsePlanFromText = (text: string): InternalPlannerResponse => {
  const jsonText = stripCodeFences(text);

  try {
    const parsed = JSON.parse(jsonText);
    if (parsed.status === 'questions' && Array.isArray(parsed.questions)) {
      return {
        status: 'questions',
        questions: parsed.questions.filter((q: unknown) => typeof q === 'string' && q.trim()).map((q: string) => q.trim()),
      };
    }

    if (parsed.status === 'plan' && parsed.plan) {
      const phases = Array.isArray(parsed.plan.phases) ? parsed.plan.phases : [];
      const normalizedPhases: AIPlanPhase[] = phases
        .filter((phase: any) => phase && typeof phase.title === 'string')
        .map((phase: any) => ({
          title: phase.title,
          description: phase.description,
          duration: phase.duration,
          tasks: Array.isArray(phase.tasks)
            ? phase.tasks
                .filter((task: any) => task && typeof task.title === 'string')
                .map((task: any) => ({
                  title: task.title,
                  description: task.description,
                  priority: typeof task.priority === 'number' ? task.priority : undefined,
                  dueInDays: typeof task.dueInDays === 'number' ? task.dueInDays : undefined,
                  dependencies: Array.isArray(task.dependencies)
                    ? task.dependencies.filter((dep: unknown) => typeof dep === 'string')
                    : undefined,
                }))
            : [],
        }));

      const plan: AIPlan = {
        goal: parsed.plan.goal || '',
        summary: parsed.plan.summary || '',
        assumptions: Array.isArray(parsed.plan.assumptions)
          ? parsed.plan.assumptions.filter((item: unknown) => typeof item === 'string')
          : undefined,
        timeline: Array.isArray(parsed.plan.timeline)
          ? parsed.plan.timeline.filter((item: unknown) => typeof item === 'string')
          : undefined,
        phases: normalizedPhases,
      };

      return {
        status: 'plan',
        plan,
        notes: Array.isArray(parsed.notes)
          ? parsed.notes.filter((item: unknown) => typeof item === 'string')
          : undefined,
      };
    }

    throw new Error('Respuesta del planner con formato inesperado');
  } catch (error) {
    console.error('Error parseando respuesta del planner IA:', error, '\nRespuesta original:', text);
    throw new Error('No se pudo interpretar la respuesta del planner IA');
  }
};

export const processNaturalLanguage = async (
  input: string,
  context?: any,
  providerOverride?: string
): Promise<ProcessNaturalLanguageResult> => {
  const contextString = context ? JSON.stringify(context, null, 2) : 'No hay contexto disponible';
  const preferred = resolveProvider(providerOverride);

  const prompt = `Eres un asistente de IA para una aplicación de gestión de tareas tipo Todoist. 
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

5. "crear 3 tareas: comprar pan, sacar basura y lavar ropa todas para hoy"
{
  "actions": [{
    "type": "create_bulk",
    "entity": "task",
    "data": {
      "tasks": [
        {"titulo": "Comprar pan", "fechaVencimiento": "hoy"},
        {"titulo": "Sacar basura", "fechaVencimiento": "hoy"},
        {"titulo": "Lavar ropa", "fechaVencimiento": "hoy"}
      ]
    },
    "confidence": 0.92,
    "explanation": "Crear 3 tareas para hoy"
  }]
}

6. "añadir tarea reunión con cliente en proyecto Trabajo sección Reuniones con etiqueta urgente para el próximo lunes"
{
  "actions": [{
    "type": "create",
    "entity": "task",
    "data": {
      "titulo": "Reunión con cliente",
      "projectName": "Trabajo",
      "sectionName": "Reuniones",
      "labelNames": ["urgente"],
      "fechaVencimiento": "próximo lunes"
    },
    "confidence": 0.93,
    "explanation": "Crear tarea 'Reunión con cliente' en proyecto Trabajo, sección Reuniones, con etiqueta urgente para el próximo lunes"
  }]
}

Prioridades:
- P1 o "alta" o "urgente" o "muy importante" = 1
- P2 o "media" o "normal" = 2
- P3 o "baja" = 3
- P4 o sin prioridad o "opcional" = 4

Fechas (devuelve el texto descriptivo exacto):
- "hoy" = tarea para hoy
- "mañana" = tarea para mañana  
- "pasado mañana" = tarea para pasado mañana
- "esta semana" = próximos 7 días
- "próximo lunes", "próximo martes", etc. = día de la semana siguiente
- "este lunes", "este viernes", etc. = día de esta semana
- "en 3 días", "en 1 semana", "en 2 semanas" = fecha relativa
- Fechas específicas como "25 de diciembre", "15/10/2025" = devolver como están
- Si no hay fecha: no incluir el campo fechaVencimiento

Proyectos y Secciones:
- Si el usuario menciona un proyecto, busca en el contexto su nombre exacto
- Si menciona una sección, incluye también el proyecto
- Si no se especifica proyecto, se usará Inbox por defecto

Etiquetas:
- Puedes incluir múltiples etiquetas en labelNames
- Si no existen, se crearán automáticamente

Bulk actions:
- Si el usuario menciona crear varias tareas (ej: "crear 5 tareas", "añadir X, Y y Z")
- Usa type "create_bulk" con un array de tasks en data.tasks
- Cada tarea en el array debe tener las propiedades necesarias

Subtareas:
- Si el usuario quiere crear una subtarea de otra tarea, usa parentTaskTitle
- La subtarea heredará el proyecto y sección de la tarea padre si no se especifica

Proyectos, Secciones y Etiquetas:
7. "crear proyecto Marketing con color azul"
{
  "actions": [{
    "type": "create_project",
    "entity": "project",
    "data": {
      "nombre": "Marketing",
      "color": "#3b82f6"
    },
    "confidence": 0.95,
    "explanation": "Crear proyecto 'Marketing' con color azul"
  }]
}

8. "añadir sección Backlog en proyecto Desarrollo"
{
  "actions": [{
    "type": "create_section",
    "entity": "section",
    "data": {
      "nombre": "Backlog",
      "projectName": "Desarrollo"
    },
    "confidence": 0.93,
    "explanation": "Crear sección 'Backlog' en proyecto Desarrollo"
  }]
}

9. "crear etiqueta urgente con color rojo"
{
  "actions": [{
    "type": "create_label",
    "entity": "label",
    "data": {
      "nombre": "urgente",
      "color": "#ef4444"
    },
    "confidence": 0.95,
    "explanation": "Crear etiqueta 'urgente' con color rojo"
  }]
}

Comentarios y Recordatorios:
10. "añadir comentario en tarea comprar leche: verificar si queda algo"
{
  "actions": [{
    "type": "add_comment",
    "entity": "comment",
    "data": {
      "taskTitle": "comprar leche",
      "contenido": "verificar si queda algo"
    },
    "confidence": 0.90,
    "explanation": "Añadir comentario en tarea 'comprar leche'"
  }]
}

11. "recordarme mañana a las 9am sobre reunión cliente"
{
  "actions": [{
    "type": "create_reminder",
    "entity": "reminder",
    "data": {
      "taskTitle": "reunión cliente",
      "fecha": "mañana 09:00"
    },
    "confidence": 0.88,
    "explanation": "Crear recordatorio para mañana a las 9am sobre tarea 'reunión cliente'"
  }]
}

Modificaciones en Bulk:
12. "cambiar todas las tareas del proyecto Personal a prioridad alta"
{
  "actions": [{
    "type": "update_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "projectName": "Personal"
      },
      "updates": {
        "prioridad": 1
      }
    },
    "confidence": 0.90,
    "explanation": "Cambiar prioridad a alta de todas las tareas del proyecto Personal"
  }]
}

13. "añadir etiqueta urgente a todas las tareas de hoy"
{
  "actions": [{
    "type": "update_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "fechaVencimiento": "hoy"
      },
      "updates": {
        "addLabelNames": ["urgente"]
      }
    },
    "confidence": 0.88,
    "explanation": "Añadir etiqueta 'urgente' a todas las tareas de hoy"
  }]
}

14. "mover todas las tareas de sección Backlog a En Progreso"
{
  "actions": [{
    "type": "update_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "sectionName": "Backlog"
      },
      "updates": {
        "sectionName": "En Progreso"
      }
    },
    "confidence": 0.85,
    "explanation": "Mover todas las tareas de sección Backlog a En Progreso"
  }]
}

Colores disponibles:
- rojo: #ef4444
- naranja: #f59e0b
- amarillo: #eab308
- verde: #10b981
- azul: #3b82f6
- indigo: #6366f1
- morado: #8b5cf6
- rosa: #ec4899
- gris: #6b7280

IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional antes o después. El JSON debe ser válido y parseable.`;

  try {
    const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride);
    const actions = parseActionsFromText(text);

    if (!actions.length) {
      throw new Error('La respuesta de la IA no contenía acciones válidas');
    }

    return {
      actions,
      providerUsed,
      raw: text,
      fallback: providerUsed !== preferred,
    };
  } catch (error: any) {
    console.error('Error en processNaturalLanguage:', error);
    const fallbackProvider = preferred;
    return {
      actions: [createFallbackAction(input)],
      providerUsed: fallbackProvider,
      fallback: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
};

interface GenerateAIPlanOptions {
  providerOverride?: string;
  answers?: string[];
  context?: any;
}

const buildPlannerPrompt = (
  goal: string,
  mode: 'auto' | 'interactive',
  answers: string[] = [],
  contextString: string,
) => {
  if (mode === 'interactive' && (!answers.length)) {
    return `Eres un planner experto que ayuda a desglosar objetivos complejos en planes ejecutables.
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
  }

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

export const generateAIPlan = async (
  goal: string,
  mode: 'auto' | 'interactive',
  options: GenerateAIPlanOptions = {},
) => {
  const preferred = resolveProvider(options.providerOverride);
  const contextString = options.context ? JSON.stringify(options.context, null, 2) : 'Sin contexto adicional';

  const prompt = buildPlannerPrompt(goal, mode, options.answers, contextString);

  const { text, providerUsed } = await generateWithFallback(prompt, preferred, options.providerOverride);
  const parsed = parsePlanFromText(text);

  return {
    ...parsed,
    providerUsed,
  };
};

export const executeAIActions = async (actions: AIAction[], userId: string, prisma: any) => {
  const results = [];

  for (const action of actions) {
    try {
      let result;

      switch (action.type) {
        case 'create_bulk':
          if (action.entity === 'task' && action.data?.tasks && Array.isArray(action.data.tasks)) {
            // Buscar el proyecto inbox del usuario
            const inboxProject = await prisma.projects.findFirst({
              where: {
                userId,
                nombre: 'Inbox'
              }
            });

            const createdTasks = [];
            for (const taskData of action.data.tasks) {
              // Procesar fecha
              let fechaVencimiento = null;
              if (taskData.fechaVencimiento) {
                fechaVencimiento = parseDateString(taskData.fechaVencimiento);
              }

              // Buscar proyecto si se especifica
              let targetProject = inboxProject;
              if (taskData.projectName) {
                const foundProject = await prisma.projects.findFirst({
                  where: {
                    userId,
                    nombre: { equals: taskData.projectName, mode: 'insensitive' }
                  }
                });
                if (foundProject) targetProject = foundProject;
              }

              // Buscar sección si se especifica
              let targetSectionId: string | null = null;
              if (taskData.sectionName) {
                if (targetProject) {
                  const sectionInProject = await prisma.sections.findFirst({
                    where: {
                      projectId: targetProject.id,
                      nombre: { equals: taskData.sectionName, mode: 'insensitive' }
                    }
                  });
                  if (sectionInProject) {
                    targetSectionId = sectionInProject.id;
                  }
                }

                if (!targetSectionId) {
                  const anySection = await prisma.sections.findFirst({
                    where: {
                      nombre: { equals: taskData.sectionName, mode: 'insensitive' },
                      projects: { userId }
                    },
                    select: {
                      id: true,
                      projectId: true
                    }
                  });

                  if (anySection) {
                    targetSectionId = anySection.id;
                    if (!targetProject || targetProject.id !== anySection.projectId) {
                      const sectionProject = await prisma.projects.findFirst({
                        where: {
                          id: anySection.projectId,
                          userId
                        }
                      });
                      if (sectionProject) {
                        targetProject = sectionProject;
                      }
                    }
                  }
                }
              }

              // Crear tarea
              const task = await prisma.tasks.create({
                data: {
                  titulo: taskData.titulo,
                  descripcion: taskData.descripcion || null,
                  prioridad: taskData.prioridad || 4,
                  fechaVencimiento,
                  projectId: targetProject?.id,
                  sectionId: targetSectionId,
                  orden: 0,
                  createdBy: userId
                }
              });

              createdTasks.push(task);
            }

            result = createdTasks;
          }
          break;

        case 'create':
          if (action.entity === 'task') {
            // Buscar el proyecto inbox del usuario
            const inboxProject = await prisma.projects.findFirst({
              where: {
                userId,
                nombre: 'Inbox'
              }
            });

            // Procesar fecha de forma robusta
            let fechaVencimiento = null;
            if (action.data?.fechaVencimiento) {
              fechaVencimiento = parseDateString(action.data.fechaVencimiento);
            }

            // Buscar proyecto por nombre si se especifica
            let targetProject = inboxProject;
            if (action.data?.projectName) {
              const foundProject = await prisma.projects.findFirst({
                where: {
                  userId,
                  nombre: { equals: action.data.projectName, mode: 'insensitive' }
                }
              });
              if (foundProject) {
                targetProject = foundProject;
              }
            }

            // Buscar sección por nombre si se especifica
            let targetSectionId = action.data.sectionId || null;
            if (action.data?.sectionName && targetProject) {
              const foundSection = await prisma.sections.findFirst({
                where: {
                  projectId: targetProject.id,
                  nombre: { equals: action.data.sectionName, mode: 'insensitive' }
                }
              });
              if (foundSection) {
                targetSectionId = foundSection.id;
              }
            }

            // Procesar etiquetas si se especifican
            let labelConnections: any[] = [];
            if (action.data?.labelNames && Array.isArray(action.data.labelNames)) {
              for (const labelName of action.data.labelNames) {
                // Buscar o crear etiqueta
                let label = await prisma.labels.findFirst({
                  where: {
                    userId,
                    nombre: { equals: labelName, mode: 'insensitive' }
                  }
                });

                if (!label) {
                  // Crear etiqueta con color aleatorio
                  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                  label = await prisma.labels.create({
                    data: {
                      nombre: labelName,
                      color: colors[Math.floor(Math.random() * colors.length)],
                      userId
                    }
                  });
                }

                labelConnections.push({
                  labels: { connect: { id: label.id } }
                });
              }
            }

            // Buscar tarea padre si se especifica (para subtareas)
            let parentTaskId = null;
            if (action.data?.parentTaskTitle) {
              const parentTask = await prisma.tasks.findFirst({
                where: {
                  projects: { userId },
                  titulo: { contains: action.data.parentTaskTitle, mode: 'insensitive' }
                }
              });
              if (parentTask) {
                parentTaskId = parentTask.id;
                // Si hay tarea padre, heredar su proyecto y sección
                if (!action.data.projectName && !targetProject) {
                  targetProject = { id: parentTask.projectId } as any;
                }
                if (!action.data.sectionName && !targetSectionId) {
                  targetSectionId = parentTask.sectionId;
                }
              }
            }

            // Si no se encontró sección y se especificó nombre, buscar en todo el espacio del usuario
            if (!targetSectionId && action.data?.sectionName) {
              const anySection = await prisma.sections.findFirst({
                where: {
                  nombre: { equals: action.data.sectionName, mode: 'insensitive' },
                  projects: { userId }
                },
                select: {
                  id: true,
                  projectId: true
                }
              });

              if (anySection) {
                targetSectionId = anySection.id;
                if (!targetProject || targetProject.id !== anySection.projectId) {
                  const sectionProject = await prisma.projects.findFirst({
                    where: {
                      id: anySection.projectId,
                      userId
                    }
                  });
                  if (sectionProject) {
                    targetProject = sectionProject;
                  }
                }
              }
            }

            result = await prisma.tasks.create({
              data: {
                titulo: action.data.titulo,
                descripcion: action.data.descripcion || null,
                prioridad: action.data.prioridad || 4,
                fechaVencimiento,
                projectId: targetProject?.id || action.data.projectId,
                sectionId: targetSectionId,
                parentTaskId,
                orden: 0,
                createdBy: userId,
                ...(labelConnections.length > 0 && {
                  task_labels: {
                    create: labelConnections
                  }
                })
              },
              include: {
                task_labels: {
                  include: {
                    labels: true
                  }
                }
              }
            });
          }
          break;

        case 'update':
          if (action.entity === 'task' && action.data?.search) {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                projects: { userId },
                titulo: { contains: action.data.search, mode: 'insensitive' }
              }
            });

            if (task) {
              const updateData: any = {};
              
              if (action.data.titulo) updateData.titulo = action.data.titulo;
              if (action.data.descripcion !== undefined) updateData.descripcion = action.data.descripcion;
              if (action.data.prioridad) updateData.prioridad = action.data.prioridad;
              
              if (action.data.fechaVencimiento) {
                updateData.fechaVencimiento = parseDateString(action.data.fechaVencimiento);
              }
              
              // Actualizar proyecto
              if (action.data.projectName) {
                const foundProject = await prisma.projects.findFirst({
                  where: {
                    userId,
                    nombre: { equals: action.data.projectName, mode: 'insensitive' }
                  }
                });
                if (foundProject) updateData.projectId = foundProject.id;
              }
              
              // Actualizar sección
              if (action.data.sectionName && updateData.projectId) {
                const foundSection = await prisma.sections.findFirst({
                  where: {
                    projectId: updateData.projectId,
                    nombre: { equals: action.data.sectionName, mode: 'insensitive' }
                  }
                });
                if (foundSection) updateData.sectionId = foundSection.id;
              }

              result = await prisma.tasks.update({
                where: { id: task.id },
                data: updateData
              });
            }
          }
          break;

        case 'update_bulk':
          if (action.entity === 'task' && action.data?.filter && action.data?.updates) {
            // Construir filtro de búsqueda
            const where: any = {
              projects: { userId }
            };

            // Filtrar por proyecto
            if (action.data.filter.projectName) {
              const project = await prisma.projects.findFirst({
                where: {
                  userId,
                  nombre: { equals: action.data.filter.projectName, mode: 'insensitive' }
                }
              });
              if (project) where.projectId = project.id;
            }

            // Filtrar por sección
            if (action.data.filter.sectionName) {
              const section = await prisma.sections.findFirst({
                where: {
                  nombre: { equals: action.data.filter.sectionName, mode: 'insensitive' },
                  projects: { userId }
                }
              });
              if (section) where.sectionId = section.id;
            }

            // Filtrar por etiqueta
            if (action.data.filter.labelName) {
              where.task_labels = {
                some: {
                  labels: {
                    nombre: { equals: action.data.filter.labelName, mode: 'insensitive' },
                    userId
                  }
                }
              };
            }

            // Filtrar por fecha de vencimiento
            if (action.data.filter.fechaVencimiento) {
              const fecha = parseDateString(action.data.filter.fechaVencimiento);
              if (fecha) {
                const startOfDay = new Date(fecha);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(fecha);
                endOfDay.setHours(23, 59, 59, 999);
                where.fechaVencimiento = {
                  gte: startOfDay,
                  lte: endOfDay
                };
              }
            }

            // Filtrar por prioridad
            if (action.data.filter.prioridad) {
              where.prioridad = action.data.filter.prioridad;
            }

            // Filtrar por completada
            if (action.data.filter.completada !== undefined) {
              where.completada = action.data.filter.completada;
            }

            // Construir datos de actualización
            const updateData: any = {};

            if (action.data.updates.prioridad) {
              updateData.prioridad = action.data.updates.prioridad;
            }

            if (action.data.updates.completada !== undefined) {
              updateData.completada = action.data.updates.completada;
            }

            if (action.data.updates.fechaVencimiento) {
              updateData.fechaVencimiento = parseDateString(action.data.updates.fechaVencimiento);
            }

            // Actualizar proyecto
            if (action.data.updates.projectName) {
              const foundProject = await prisma.projects.findFirst({
                where: {
                  userId,
                  nombre: { equals: action.data.updates.projectName, mode: 'insensitive' }
                }
              });
              if (foundProject) updateData.projectId = foundProject.id;
            }

            // Actualizar sección
            if (action.data.updates.sectionName) {
              // Necesitamos el proyecto para buscar la sección
              const projectId = updateData.projectId || where.projectId;
              if (projectId) {
                const foundSection = await prisma.sections.findFirst({
                  where: {
                    projectId,
                    nombre: { equals: action.data.updates.sectionName, mode: 'insensitive' }
                  }
                });
                if (foundSection) updateData.sectionId = foundSection.id;
              }
            }

            // Para añadir etiquetas, necesitamos actualizar cada tarea individualmente
            if (action.data.updates.addLabelNames && Array.isArray(action.data.updates.addLabelNames)) {
              // Primero buscar todas las tareas que coinciden
              const tasks = await prisma.tasks.findMany({
                where,
                select: { id: true }
              });

              // Para cada tarea, añadir las etiquetas
              for (const task of tasks) {
                for (const labelName of action.data.updates.addLabelNames) {
                  // Buscar o crear etiqueta
                  let label = await prisma.labels.findFirst({
                    where: {
                      userId,
                      nombre: { equals: labelName, mode: 'insensitive' }
                    }
                  });

                  if (!label) {
                    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                    label = await prisma.labels.create({
                      data: {
                        nombre: labelName,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        userId
                      }
                    });
                  }

                  // Verificar si la tarea ya tiene esta etiqueta
                  const existing = await prisma.task_labels.findFirst({
                    where: {
                      taskId: task.id,
                      labelId: label.id
                    }
                  });

                  if (!existing) {
                    await prisma.task_labels.create({
                      data: {
                        taskId: task.id,
                        labelId: label.id
                      }
                    });
                  }
                }
              }

              result = { count: tasks.length, message: `Etiquetas añadidas a ${tasks.length} tareas` };
            } else {
              // Actualización normal sin etiquetas
              result = await prisma.tasks.updateMany({
                where,
                data: updateData
              });
            }
          }
          break;

        case 'complete':
          if (action.entity === 'task' && action.data?.search) {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                projects: { userId },
                titulo: { contains: action.data.search, mode: 'insensitive' }
              }
            });

            if (task) {
              result = await prisma.tasks.update({
                where: { id: task.id },
                data: { completada: true }
              });
            }
          }
          break;

        case 'delete':
          if (action.entity === 'task') {
            result = await prisma.tasks.deleteMany({
              where: {
                projects: { userId },
                ...action.data.filter
              }
            });
          }
          break;

        case 'query':
          if (action.entity === 'task') {
            const where: any = {
              projects: { userId }
            };

            if (action.data?.filter === 'week') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextWeek = new Date(today);
              nextWeek.setDate(nextWeek.getDate() + 7);

              where.fechaVencimiento = {
                gte: today,
                lt: nextWeek
              };
            }

            if (action.data?.completada !== undefined) {
              where.completada = action.data.completada;
            }

            result = await prisma.tasks.findMany({
              where,
              include: {
                task_labels: {
                  include: {
                    labels: true
                  }
                }
              },
              orderBy: { orden: 'asc' }
            });
          }
          break;

        case 'create_project':
          if (action.entity === 'project') {
            // Obtener el último orden
            const lastProject = await prisma.projects.findFirst({
              where: { userId },
              orderBy: { orden: 'desc' }
            });

            const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
            let color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

            result = await prisma.projects.create({
              data: {
                nombre: action.data.nombre,
                color,
                userId,
                orden: (lastProject?.orden || 0) + 1
              }
            });
          }
          break;

        case 'create_section':
          if (action.entity === 'section') {
            // Buscar proyecto por nombre
            let targetProject = null;
            if (action.data?.projectName) {
              targetProject = await prisma.projects.findFirst({
                where: {
                  userId,
                  nombre: { equals: action.data.projectName, mode: 'insensitive' }
                }
              });
            }

            if (targetProject) {
              // Obtener el último orden
              const lastSection = await prisma.sections.findFirst({
                where: { projectId: targetProject.id },
                orderBy: { orden: 'desc' }
              });

              result = await prisma.sections.create({
                data: {
                  nombre: action.data.nombre,
                  projectId: targetProject.id,
                  orden: (lastSection?.orden || 0) + 1
                }
              });
            }
          }
          break;

        case 'create_label':
          if (action.entity === 'label') {
            const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
            let color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

            result = await prisma.labels.create({
              data: {
                nombre: action.data.nombre,
                color,
                userId
              }
            });
          }
          break;

        case 'add_comment':
          if (action.entity === 'comment') {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                projects: { userId },
                titulo: { contains: action.data.taskTitle, mode: 'insensitive' }
              }
            });

            if (task) {
              result = await prisma.comments.create({
                data: {
                  contenido: action.data.contenido,
                  taskId: task.id,
                  userId
                }
              });
            }
          }
          break;

        case 'create_reminder':
          if (action.entity === 'reminder') {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                projects: { userId },
                titulo: { contains: action.data.taskTitle, mode: 'insensitive' }
              }
            });

            if (task) {
              // Parsear fecha del recordatorio
              let fechaRecordatorio = parseDateString(action.data.fecha);
              
              // Si no se pudo parsear, intentar crear fecha a partir de la cadena
              if (!fechaRecordatorio) {
                fechaRecordatorio = new Date(action.data.fecha);
              }

              result = await prisma.reminders.create({
                data: {
                  fecha: fechaRecordatorio,
                  taskId: task.id
                }
              });
            }
          }
          break;
      }

      results.push({
        action,
        result,
        success: true
      });
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      results.push({
        action,
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      });
    }
  }

  return results;
};

