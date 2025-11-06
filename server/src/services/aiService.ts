import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { assertProjectPermission } from './projectShareService';

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
    max_tokens: 1000,
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

const projectAccessQuery = (userId: string) => ({
  OR: [
    { userId },
    { shares: { some: { sharedWithId: userId } } },
  ],
});

const taskAccessWhere = (userId: string) => ({
  OR: [
    { projects: { userId } },
    { projects: { shares: { some: { sharedWithId: userId } } } },
  ],
});

export interface AIAction {
  type: 'create' | 'update' | 'delete' | 'query' | 'complete' | 'create_bulk' | 'update_bulk' | 'delete_bulk' | 'move_bulk' | 'reorder' | 'create_project' | 'create_section' | 'create_label' | 'add_comment' | 'create_reminder' | 'create_with_subtasks';
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
    titulo: input,
  },
  confidence: 0.5,
  explanation: 'No se pudo procesar el comando con IA, creando tarea simple',
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

interface TaskDataForCreation {
  titulo: string;
  descripcion?: string;
  prioridad?: number;
  fechaVencimiento?: string;
  labelNames?: string[];
  projectName?: string;
  sectionName?: string;
  orden?: number;
  subtasks?: TaskDataForCreation[];
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
  if (!text) return '';

  // Intentar extraer contenido dentro de un bloque ``` ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  let jsonText = text.trim();

  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```[a-zA-Z]*\n?/, '');
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, jsonText.lastIndexOf('```'));
  }

  jsonText = jsonText.trim();

  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    return jsonText.slice(firstBrace, lastBrace + 1).trim();
  }

  return jsonText;
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
  providerOverride?: string,
): Promise<ProcessNaturalLanguageResult> => {
  const contextString = context ? JSON.stringify(context, null, 2) : 'No hay contexto disponible';
  const preferred = resolveProvider(providerOverride);

  const prompt = `Eres un asistente de IA para una aplicación de gestión de tareas tipo Todoist. 
Tu trabajo es interpretar comandos en lenguaje natural y convertirlos en acciones estructuradas.

Contexto actual del usuario:
${contextString}

Comando del usuario: "${input}"

Analiza el comando y devuelve un JSON con un array de acciones a realizar. Cada acción debe tener:
- type: "create", "update", "update_bulk", "delete", "delete_bulk", "move_bulk", "reorder", "query", "complete", "create_bulk", "create_with_subtasks", "create_project", "create_section", "create_label", "add_comment" o "create_reminder"
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

Creación de tareas con subtareas anidadas:
15. "crear tarea proyecto web con subtareas: diseñar mockups (con subtarea: investigar tendencias), desarrollar backend y desarrollar frontend"
{
  "actions": [{
    "type": "create_with_subtasks",
    "entity": "task",
    "data": {
      "titulo": "Proyecto web",
      "prioridad": 2,
      "subtasks": [
        {
          "titulo": "Diseñar mockups",
          "prioridad": 1,
          "subtasks": [
            {"titulo": "Investigar tendencias", "prioridad": 2}
          ]
        },
        {"titulo": "Desarrollar backend", "prioridad": 2},
        {"titulo": "Desarrollar frontend", "prioridad": 2}
      ]
    },
    "confidence": 0.90,
    "explanation": "Crear tarea 'Proyecto web' con subtareas anidadas en múltiples niveles"
  }]
}

Eliminación en bulk con filtros avanzados:
16. "eliminar todas las tareas completadas del proyecto Personal de la semana pasada"
{
  "actions": [{
    "type": "delete_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "projectName": "Personal",
        "completada": true,
        "dateRange": {
          "type": "lastWeek"
        }
      }
    },
    "confidence": 0.88,
    "explanation": "Eliminar tareas completadas del proyecto Personal de la semana pasada"
  }]
}

Mover tareas en bulk:
17. "mover todas las tareas de alta prioridad al proyecto Urgente"
{
  "actions": [{
    "type": "move_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "prioridad": 1
      },
      "target": {
        "projectName": "Urgente"
      }
    },
    "confidence": 0.90,
    "explanation": "Mover todas las tareas de prioridad alta al proyecto Urgente"
  }]
}

Reorganizar orden de tareas:
18. "mover la tarea comprar leche arriba de sacar basura"
{
  "actions": [{
    "type": "reorder",
    "entity": "task",
    "data": {
      "taskTitle": "comprar leche",
      "position": "before",
      "referenceTaskTitle": "sacar basura"
    },
    "confidence": 0.85,
    "explanation": "Reordenar tarea 'comprar leche' antes de 'sacar basura'"
  }]
}

19. "poner la tarea reunión cliente al final de la lista"
{
  "actions": [{
    "type": "reorder",
    "entity": "task",
    "data": {
      "taskTitle": "reunión cliente",
      "position": "end"
    },
    "confidence": 0.88,
    "explanation": "Mover tarea 'reunión cliente' al final de la lista"
  }]
}

20. "reorganizar tareas: primero comprar pan, luego sacar basura, después lavar ropa"
{
  "actions": [{
    "type": "reorder",
    "entity": "task",
    "data": {
      "tasks": [
        {"taskTitle": "comprar pan", "orden": 0},
        {"taskTitle": "sacar basura", "orden": 1},
        {"taskTitle": "lavar ropa", "orden": 2}
      ]
    },
    "confidence": 0.82,
    "explanation": "Reorganizar múltiples tareas en orden específico"
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
                nombre: 'Inbox',
                ...projectAccessQuery(userId),
              },
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
                    nombre: { equals: taskData.projectName, mode: 'insensitive' },
                    ...projectAccessQuery(userId),
                  },
                });
                if (foundProject) targetProject = foundProject;
              }

              let resolvedProject = targetProject ?? inboxProject;
              if (!resolvedProject) {
                throw new Error('No se encontró un proyecto válido para crear la tarea');
              }

              await assertProjectPermission(prisma, resolvedProject.id, userId, 'write');

              // Buscar sección si se especifica
              let targetSectionId: string | null = null;
              if (taskData.sectionName) {
                const sectionInProject = await prisma.sections.findFirst({
                  where: {
                    projectId: resolvedProject.id,
                    nombre: { equals: taskData.sectionName, mode: 'insensitive' },
                  },
                });
                if (sectionInProject) {
                  targetSectionId = sectionInProject.id;
                }

                if (!targetSectionId) {
                  const anySection = await prisma.sections.findFirst({
                    where: {
                      nombre: { equals: taskData.sectionName, mode: 'insensitive' },
                      projects: projectAccessQuery(userId),
                    },
                    select: {
                      id: true,
                      projectId: true,
                    },
                  });

                  if (anySection) {
                    targetSectionId = anySection.id;
                    if (resolvedProject.id !== anySection.projectId) {
                      const sectionProject = await prisma.projects.findFirst({
                        where: {
                          id: anySection.projectId,
                          ...projectAccessQuery(userId),
                        },
                      });
                      if (sectionProject) {
                        await assertProjectPermission(prisma, sectionProject.id, userId, 'write');
                        resolvedProject = sectionProject;
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
                  projectId: resolvedProject.id,
                  sectionId: targetSectionId,
                  orden: 0,
                  createdBy: userId,
                },
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
                nombre: 'Inbox',
                ...projectAccessQuery(userId),
              },
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
                  nombre: { equals: action.data.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (foundProject) {
                targetProject = foundProject;
              }
            }

            const resolvedProject = targetProject ?? inboxProject;
            if (!resolvedProject) {
              throw new Error('No se encontró un proyecto válido para crear la tarea');
            }

            await assertProjectPermission(prisma, resolvedProject.id, userId, 'write');

            // Buscar sección por nombre si se especifica
            let targetSectionId = action.data.sectionId || null;
            if (action.data?.sectionName) {
              const foundSection = await prisma.sections.findFirst({
                where: {
                  projectId: resolvedProject.id,
                  nombre: { equals: action.data.sectionName, mode: 'insensitive' },
                },
              });
              if (foundSection) {
                targetSectionId = foundSection.id;
              }
            }

            // Procesar etiquetas si se especifican
            let labelConnections: any[] = [];
            if (action.data?.labelNames && Array.isArray(action.data.labelNames)) {
              const labels = await Promise.all(
                action.data.labelNames.map(async (labelName: string) => {
                  let label = await prisma.labels.findFirst({
                    where: {
                      userId,
                      nombre: { equals: labelName, mode: 'insensitive' },
                    },
                  });
                  if (!label) {
                    label = await prisma.labels.create({
                      data: {
                        nombre: labelName,
                        color: '#3b82f6',
                        userId,
                      },
                    });
                  }
                  return label;
                }),
              );

              labelConnections = labels.map((label: any) => ({
                labelId: label.id,
              }));
            }

            const task = await prisma.tasks.create({
              data: {
                titulo: action.data?.titulo || 'Tarea sin título',
                descripcion: action.data?.descripcion || null,
                prioridad: action.data?.prioridad || 4,
                fechaVencimiento,
                projectId: resolvedProject.id,
                sectionId: targetSectionId,
                parentTaskId: action.data?.parentTaskId || null,
                orden: 0,
                createdBy: userId,
                ...(labelConnections.length > 0 && {
                  task_labels: {
                    create: labelConnections,
                  },
                }),
              },
            });

            result = task;
          }
          break;

        case 'update':
          if (action.entity === 'task' && action.data?.search) {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                AND: [
                  taskAccessWhere(userId),
                  { titulo: { contains: action.data.search, mode: 'insensitive' } },
                ],
              },
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
                    nombre: { equals: action.data.projectName, mode: 'insensitive' },
                  },
                });
                if (foundProject) updateData.projectId = foundProject.id;
              }
              
              // Actualizar sección
              if (action.data.sectionName && updateData.projectId) {
                const foundSection = await prisma.sections.findFirst({
                  where: {
                    projectId: updateData.projectId,
                    nombre: { equals: action.data.sectionName, mode: 'insensitive' },
                  },
                });
                if (foundSection) updateData.sectionId = foundSection.id;
              }

              result = await prisma.tasks.update({
                where: { id: task.id },
                data: updateData,
              });
            }
          }
          break;

        case 'update_bulk':
          if (action.entity === 'task' && action.data?.filter && action.data?.updates) {
            // Construir filtro de búsqueda
            const where: any = {
              ...taskAccessWhere(userId),
            };

            // Filtrar por proyecto
            if (action.data.filter.projectName) {
              const project = await prisma.projects.findFirst({
                where: {
                  nombre: { equals: action.data.filter.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (project) where.projectId = project.id;
            }

            // Filtrar por sección
            if (action.data.filter.sectionName) {
              const section = await prisma.sections.findFirst({
                where: {
                  nombre: { equals: action.data.filter.sectionName, mode: 'insensitive' },
                  projects: {
                    ...projectAccessQuery(userId),
                  },
                },
              });
              if (section) where.sectionId = section.id;
            }

            // Filtrar por etiqueta
            if (action.data.filter.labelName) {
              where.task_labels = {
                some: {
                  labels: {
                    nombre: { equals: action.data.filter.labelName, mode: 'insensitive' },
                    userId,
                  },
                },
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
                  lte: endOfDay,
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
                  nombre: { equals: action.data.updates.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
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
                    nombre: { equals: action.data.updates.sectionName, mode: 'insensitive' },
                  },
                });
                if (foundSection) updateData.sectionId = foundSection.id;
              }
            }

            // Para añadir etiquetas, necesitamos actualizar cada tarea individualmente
            if (action.data.updates.addLabelNames && Array.isArray(action.data.updates.addLabelNames)) {
              // Primero buscar todas las tareas que coinciden
              const tasks = await prisma.tasks.findMany({
                where,
                select: { id: true },
              });

              // Para cada tarea, añadir las etiquetas
              for (const task of tasks) {
                for (const labelName of action.data.updates.addLabelNames) {
                  // Buscar o crear etiqueta
                  let label = await prisma.labels.findFirst({
                    where: {
                      userId,
                      nombre: { equals: labelName, mode: 'insensitive' },
                    },
                  });

                  if (!label) {
                    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                    label = await prisma.labels.create({
                      data: {
                        nombre: labelName,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        userId,
                      },
                    });
                  }

                  // Verificar si la tarea ya tiene esta etiqueta
                  const existing = await prisma.task_labels.findFirst({
                    where: {
                      taskId: task.id,
                      labelId: label.id,
                    },
                  });

                  if (!existing) {
                    await prisma.task_labels.create({
                      data: {
                        taskId: task.id,
                        labelId: label.id,
                      },
                    });
                  }
                }
              }

              result = { count: tasks.length, message: `Etiquetas añadidas a ${tasks.length} tareas` };
            } else {
              // Actualización normal sin etiquetas
              result = await prisma.tasks.updateMany({
                where,
                data: updateData,
              });
            }
          }
          break;

        case 'complete':
          if (action.entity === 'task' && action.data?.search) {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                AND: [
                  taskAccessWhere(userId),
                  { titulo: { contains: action.data.search, mode: 'insensitive' } },
                ],
              },
            });

            if (task) {
              result = await prisma.tasks.update({
                where: { id: task.id },
                data: { completada: true },
              });
            }
          }
          break;

        case 'delete':
          if (action.entity === 'task') {
            result = await prisma.tasks.deleteMany({
              where: {
                ...taskAccessWhere(userId),
                ...action.data.filter,
              },
            });
          }
          break;

        case 'query':
          if (action.entity === 'task') {
            const where: any = {
              ...taskAccessWhere(userId),
            };

            if (action.data?.filter === 'week') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextWeek = new Date(today);
              nextWeek.setDate(nextWeek.getDate() + 7);

              where.fechaVencimiento = {
                gte: today,
                lt: nextWeek,
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
                    labels: true,
                  },
                },
              },
              orderBy: { orden: 'asc' },
            });
          }
          break;

        case 'create_project':
          if (action.entity === 'project') {
            // Obtener el último orden
            const lastProject = await prisma.projects.findFirst({
              where: { userId },
              orderBy: { orden: 'desc' },
            });

            const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
            const color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

            result = await prisma.projects.create({
              data: {
                nombre: action.data.nombre,
                color,
                userId,
                orden: (lastProject?.orden || 0) + 1,
              },
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
                  nombre: { equals: action.data.projectName, mode: 'insensitive' },
                },
              });
            }

            if (targetProject) {
              // Obtener el último orden
              const lastSection = await prisma.sections.findFirst({
                where: { projectId: targetProject.id },
                orderBy: { orden: 'desc' },
              });

              result = await prisma.sections.create({
                data: {
                  nombre: action.data.nombre,
                  projectId: targetProject.id,
                  orden: (lastSection?.orden || 0) + 1,
                },
              });
            }
          }
          break;

        case 'create_label':
          if (action.entity === 'label') {
            const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
            const color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

            result = await prisma.labels.create({
              data: {
                nombre: action.data.nombre,
                color,
                userId,
              },
            });
          }
          break;

        case 'add_comment':
          if (action.entity === 'comment') {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                AND: [
                  taskAccessWhere(userId),
                  { titulo: { contains: action.data.taskTitle, mode: 'insensitive' } },
                ],
              },
            });

            if (task) {
              result = await prisma.comments.create({
                data: {
                  contenido: action.data.contenido,
                  taskId: task.id,
                  userId,
                },
              });
            }
          }
          break;

        case 'create_reminder':
          if (action.entity === 'reminder') {
            // Buscar tarea por título
            const task = await prisma.tasks.findFirst({
              where: {
                AND: [
                  taskAccessWhere(userId),
                  { titulo: { contains: action.data.taskTitle, mode: 'insensitive' } },
                ],
              },
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
                  fechaHora: fechaRecordatorio,
                  taskId: task.id,
                },
              });
            }
          }
          break;

        case 'create_with_subtasks':
          if (action.entity === 'task') {
            // Función helper recursiva para crear tareas con subtareas
            const createTaskWithSubtasks = async (
              taskData: TaskDataForCreation,
              parentId: string | null = null,
              projectId?: string,
              sectionId?: string | null,
            ): Promise<any> => {
              // Procesar fecha
              let fechaVencimiento = null;
              if (taskData.fechaVencimiento) {
                fechaVencimiento = parseDateString(taskData.fechaVencimiento);
              }

              // Procesar etiquetas si se especifican
              let labelConnections: any[] = [];
              if (taskData.labelNames && Array.isArray(taskData.labelNames)) {
                const labels = await Promise.all(
                  taskData.labelNames.map(async (labelName: string) => {
                    let label = await prisma.labels.findFirst({
                      where: {
                        userId,
                        nombre: { equals: labelName, mode: 'insensitive' },
                      },
                    });
                    if (!label) {
                      label = await prisma.labels.create({
                        data: {
                          nombre: labelName,
                          color: '#3b82f6',
                          userId,
                        },
                      });
                    }
                    return label;
                  }),
                );

                labelConnections = labels.map((label: any) => ({
                  labelId: label.id,
                }));
              }

              // Crear la tarea
              const task = await prisma.tasks.create({
                data: {
                  titulo: taskData.titulo || 'Tarea sin título',
                  descripcion: taskData.descripcion || null,
                  prioridad: taskData.prioridad || 4,
                  fechaVencimiento,
                  projectId: projectId!,
                  sectionId: sectionId || null,
                  parentTaskId: parentId,
                  orden: taskData.orden || 0,
                  createdBy: userId,
                  ...(labelConnections.length > 0 && {
                    task_labels: {
                      create: labelConnections,
                    },
                  }),
                },
              });

              // Crear subtareas recursivamente si existen
              if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
                for (const subtaskData of taskData.subtasks) {
                  await createTaskWithSubtasks(subtaskData, task.id, projectId, sectionId);
                }
              }

              return task;
            };

            // Buscar el proyecto inbox del usuario
            const inboxProject = await prisma.projects.findFirst({
              where: {
                nombre: 'Inbox',
                ...projectAccessQuery(userId),
              },
            });

            // Buscar proyecto por nombre si se especifica
            let targetProject = inboxProject;
            if (action.data?.projectName) {
              const foundProject = await prisma.projects.findFirst({
                where: {
                  nombre: { equals: action.data.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (foundProject) {
                targetProject = foundProject;
              }
            }

            const resolvedProject = targetProject ?? inboxProject;
            if (!resolvedProject) {
              throw new Error('No se encontró un proyecto válido para crear la tarea');
            }

            await assertProjectPermission(prisma, resolvedProject.id, userId, 'write');

            // Buscar sección por nombre si se especifica
            let targetSectionId = null;
            if (action.data?.sectionName) {
              const foundSection = await prisma.sections.findFirst({
                where: {
                  projectId: resolvedProject.id,
                  nombre: { equals: action.data.sectionName, mode: 'insensitive' },
                },
              });
              if (foundSection) {
                targetSectionId = foundSection.id;
              }
            }

            // Crear la tarea principal con todas sus subtareas anidadas
            result = await createTaskWithSubtasks(
              action.data,
              null,
              resolvedProject.id,
              targetSectionId,
            );
          }
          break;

        case 'delete_bulk':
          if (action.entity === 'task' && action.data?.filter) {
            // Construir filtro de búsqueda
            const where: any = {
              ...taskAccessWhere(userId),
            };

            // Filtrar por proyecto
            if (action.data.filter.projectName) {
              const project = await prisma.projects.findFirst({
                where: {
                  nombre: { equals: action.data.filter.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (project) where.projectId = project.id;
            }

            // Filtrar por sección
            if (action.data.filter.sectionName) {
              const section = await prisma.sections.findFirst({
                where: {
                  nombre: { equals: action.data.filter.sectionName, mode: 'insensitive' },
                  projects: {
                    ...projectAccessQuery(userId),
                  },
                },
              });
              if (section) where.sectionId = section.id;
            }

            // Filtrar por completada
            if (action.data.filter.completada !== undefined) {
              where.completada = action.data.filter.completada;
            }

            // Filtrar por prioridad
            if (action.data.filter.prioridad) {
              where.prioridad = action.data.filter.prioridad;
            }

            // Filtrar por rango de fechas
            if (action.data.filter.dateRange) {
              const now = new Date();
              let startDate: Date;
              let endDate: Date;

              switch (action.data.filter.dateRange.type) {
                case 'lastWeek':
                  // Last week = from 7 days ago until today
                  startDate = new Date(now);
                  startDate.setDate(now.getDate() - 7);
                  startDate.setHours(0, 0, 0, 0);
                  endDate = new Date(now);
                  endDate.setHours(23, 59, 59, 999);
                  where.createdAt = { gte: startDate, lte: endDate };
                  break;
                case 'lastMonth':
                  // Last month = from 30 days ago until today
                  startDate = new Date(now);
                  startDate.setDate(now.getDate() - 30);
                  startDate.setHours(0, 0, 0, 0);
                  endDate = new Date(now);
                  endDate.setHours(23, 59, 59, 999);
                  where.createdAt = { gte: startDate, lte: endDate };
                  break;
                case 'older':
                  if (action.data.filter.dateRange.days) {
                    endDate = new Date(now);
                    endDate.setDate(now.getDate() - action.data.filter.dateRange.days);
                    where.createdAt = { lte: endDate };
                  }
                  break;
              }
            }

            // Filtrar por etiqueta
            if (action.data.filter.labelName) {
              where.task_labels = {
                some: {
                  labels: {
                    nombre: { equals: action.data.filter.labelName, mode: 'insensitive' },
                    userId,
                  },
                },
              };
            }

            result = await prisma.tasks.deleteMany({
              where,
            });
          }
          break;

        case 'move_bulk':
          if (action.entity === 'task' && action.data?.filter && action.data?.target) {
            // Construir filtro de búsqueda (similar a update_bulk)
            const where: any = {
              ...taskAccessWhere(userId),
            };

            // Filtrar por proyecto
            if (action.data.filter.projectName) {
              const project = await prisma.projects.findFirst({
                where: {
                  nombre: { equals: action.data.filter.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (project) where.projectId = project.id;
            }

            // Filtrar por sección
            if (action.data.filter.sectionName) {
              const section = await prisma.sections.findFirst({
                where: {
                  nombre: { equals: action.data.filter.sectionName, mode: 'insensitive' },
                  projects: {
                    ...projectAccessQuery(userId),
                  },
                },
              });
              if (section) where.sectionId = section.id;
            }

            // Filtrar por prioridad
            if (action.data.filter.prioridad) {
              where.prioridad = action.data.filter.prioridad;
            }

            // Filtrar por completada
            if (action.data.filter.completada !== undefined) {
              where.completada = action.data.filter.completada;
            }

            // Filtrar por etiqueta
            if (action.data.filter.labelName) {
              where.task_labels = {
                some: {
                  labels: {
                    nombre: { equals: action.data.filter.labelName, mode: 'insensitive' },
                    userId,
                  },
                },
              };
            }

            // Construir datos de destino
            const updateData: any = {};

            // Mover a nuevo proyecto
            if (action.data.target.projectName) {
              const foundProject = await prisma.projects.findFirst({
                where: {
                  nombre: { equals: action.data.target.projectName, mode: 'insensitive' },
                  ...projectAccessQuery(userId),
                },
              });
              if (foundProject) {
                await assertProjectPermission(prisma, foundProject.id, userId, 'write');
                updateData.projectId = foundProject.id;
              }
            }

            // Mover a nueva sección
            if (action.data.target.sectionName && updateData.projectId) {
              const foundSection = await prisma.sections.findFirst({
                where: {
                  projectId: updateData.projectId,
                  nombre: { equals: action.data.target.sectionName, mode: 'insensitive' },
                },
              });
              if (foundSection) {
                updateData.sectionId = foundSection.id;
              }
            } else if (action.data.target.sectionName === null) {
              updateData.sectionId = null;
            }

            result = await prisma.tasks.updateMany({
              where,
              data: updateData,
            });
          }
          break;

        case 'reorder':
          if (action.entity === 'task') {
            // Caso 1: Reordenar múltiples tareas con orden específico
            if (action.data?.tasks && Array.isArray(action.data.tasks)) {
              const updatePromises = action.data.tasks.map(async (taskInfo: any) => {
                const task = await prisma.tasks.findFirst({
                  where: {
                    AND: [
                      taskAccessWhere(userId),
                      { titulo: { contains: taskInfo.taskTitle, mode: 'insensitive' } },
                    ],
                  },
                });

                if (task) {
                  return prisma.tasks.update({
                    where: { id: task.id },
                    data: { orden: taskInfo.orden },
                  });
                }
                return null;
              });

              const results = await Promise.all(updatePromises);
              result = { count: results.filter(Boolean).length };
            }
            // Caso 2: Reordenar una tarea relativa a otra
            else if (action.data?.taskTitle) {
              const task = await prisma.tasks.findFirst({
                where: {
                  AND: [
                    taskAccessWhere(userId),
                    { titulo: { contains: action.data.taskTitle, mode: 'insensitive' } },
                  ],
                },
              });

              if (task) {
                // Mover al final
                if (action.data.position === 'end') {
                  const maxOrdenTask = await prisma.tasks.findFirst({
                    where: {
                      projectId: task.projectId,
                      sectionId: task.sectionId,
                      parentTaskId: task.parentTaskId,
                    },
                    orderBy: { orden: 'desc' },
                  });
                  const newOrden = (maxOrdenTask?.orden || 0) + 1;
                  result = await prisma.tasks.update({
                    where: { id: task.id },
                    data: { orden: newOrden },
                  });
                }
                // Mover al principio
                else if (action.data.position === 'start') {
                  result = await prisma.tasks.update({
                    where: { id: task.id },
                    data: { orden: -1 },
                  });
                }
                // Mover antes/después de otra tarea
                else if (action.data.referenceTaskTitle) {
                  const referenceTask = await prisma.tasks.findFirst({
                    where: {
                      AND: [
                        taskAccessWhere(userId),
                        { titulo: { contains: action.data.referenceTaskTitle, mode: 'insensitive' } },
                      ],
                    },
                  });

                  if (referenceTask) {
                    // Use larger gaps to avoid precision issues with floating point
                    // This allows for ~1000 reorders between tasks before precision degrades
                    const newOrden =
                      action.data.position === 'before'
                        ? referenceTask.orden - 1000
                        : referenceTask.orden + 1000;
                    result = await prisma.tasks.update({
                      where: { id: task.id },
                      data: { orden: newOrden },
                    });
                  }
                }
              }
            }
          }
          break;
      }

      results.push({
        action,
        result,
        success: true,
      });
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      results.push({
        action,
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      });
    }
  }

  return results;
};

// Conversational Agent Types and Interfaces
export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
}

export interface AgentResponse {
  status: 'conversation' | 'ready' | 'error';
  message: string;
  conversationId?: string;
  requiresInput?: boolean;
  suggestedActions?: AIAction[];
  summary?: string;
  providerUsed: SupportedAIProvider;
}

/**
 * Conversational Agent - Interacts with user to understand requirements
 * and creates comprehensive plans with tasks, subtasks, reminders, etc.
 */
export const conversationalAgent = async (
  message: string,
  conversationHistory: ConversationMessage[] = [],
  context?: any,
  providerOverride?: string,
  conversationId?: string,
): Promise<AgentResponse> => {
  const preferred = resolveProvider(providerOverride);
  const contextString = context ? JSON.stringify(context, null, 2) : 'Sin contexto adicional';
  
  // Build conversation history for the prompt
  const historyString = conversationHistory.length > 0
    ? conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'Agente'}: ${msg.content}`)
        .join('\n')
    : 'Inicio de conversación';

  const prompt = `Eres un agente inteligente de gestión de tareas conversacional. Tu objetivo es entender EXACTAMENTE lo que el usuario quiere lograr y luego crear un plan completo con tareas, subtareas, recordatorios, prioridades, proyectos y secciones necesarias.

Contexto del usuario:
${contextString}

Historial de conversación:
${historyString}

Mensaje actual del usuario: "${message}"

Tu rol es:
1. ENTENDER: Hacer preguntas clarificadoras para entender completamente la intención del usuario
2. PLANIFICAR: Una vez que tengas suficiente información, proponer un plan detallado
3. EJECUTAR: Generar las acciones necesarias para implementar el plan

Debes responder con un JSON en uno de estos formatos:

FORMATO 1 - Cuando necesitas más información:
{
  "status": "conversation",
  "message": "Tu pregunta o comentario al usuario (sé natural y conversacional)",
  "requiresInput": true
}

FORMATO 2 - Cuando tienes suficiente información y estás listo para crear el plan:
{
  "status": "ready",
  "message": "Resumen de lo que entendiste y lo que vas a crear",
  "summary": "Resumen breve del plan completo",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create_project" | "create_section" | "create_with_subtasks" | "create" | etc,
      "entity": "project" | "task" | "section" | "label" | "reminder",
      "data": { ... datos necesarios ... },
      "confidence": 0.95,
      "explanation": "Explicación de la acción"
    }
  ]
}

Directrices importantes:

1. **Sé conversacional**: Habla como un asistente amable, no como un robot
2. **Haz preguntas específicas**: No preguntes todo a la vez, ve paso a paso
3. **Confirma tu entendimiento**: Antes de generar acciones, resume lo que entendiste
4. **Piensa en todo**: No solo tareas, también considera:
   - ¿Necesita un proyecto nuevo o usar uno existente?
   - ¿Qué secciones ayudarían a organizar?
   - ¿Qué subtareas componen cada tarea?
   - ¿Qué prioridades tienen sentido?
   - ¿Qué fechas de vencimiento son apropiadas?
   - ¿Necesita recordatorios?
   - ¿Qué etiquetas facilitarían el seguimiento?

5. **Usa create_with_subtasks**: Para tareas con múltiples niveles de subtareas
6. **Estructura bien**: Organiza en proyectos > secciones > tareas > subtareas
7. **Sé proactivo**: Sugiere mejoras y best practices de organización

Ejemplos de conversaciones exitosas:

Usuario: "Necesito organizar el lanzamiento de mi producto"
Agente: {
  "status": "conversation",
  "message": "¡Excelente! Me encantaría ayudarte a organizar el lanzamiento. Para crear el mejor plan posible, cuéntame: ¿En qué fecha planeas lanzar el producto? ¿O tienes un marco de tiempo aproximado?",
  "requiresInput": true
}

Usuario: "En aproximadamente 2 meses"
Agente: {
  "status": "conversation",
  "message": "Perfecto, 2 meses es un buen plazo. ¿Qué tipo de producto es? (app, servicio, producto físico, etc.) Esto me ayudará a sugerirte las fases más relevantes.",
  "requiresInput": true
}

Usuario: "Es una app móvil"
Agente: {
  "status": "conversation",
  "message": "Entiendo, una app móvil con lanzamiento en 2 meses. Algunas preguntas finales: ¿Ya tienes equipo asignado o trabajas solo? ¿Hay algún aspecto específico que te preocupe más? (desarrollo, marketing, testing, etc.)",
  "requiresInput": true
}

Usuario: "Trabajo solo y me preocupa más el marketing"
Agente: {
  "status": "ready",
  "message": "¡Perfecto! He entendido tu situación. Voy a crear un plan completo para el lanzamiento de tu app móvil en 2 meses, con énfasis especial en marketing. El plan incluirá:\n\n- Proyecto 'Lanzamiento App Móvil' con secciones para Desarrollo, Marketing, Testing y Lanzamiento\n- Tareas prioritarias de marketing con subtareas detalladas\n- Timeline de 2 meses con fechas clave\n- Recordatorios para hitos importantes\n- Etiquetas para seguimiento (urgente, marketing, desarrollo, etc.)\n\n¿Procedo a crear este plan?",
  "summary": "Lanzamiento app móvil en 2 meses, trabajo solo, foco en marketing",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create_project",
      "entity": "project",
      "data": {
        "nombre": "Lanzamiento App Móvil",
        "color": "#3b82f6"
      },
      "confidence": 0.95,
      "explanation": "Proyecto principal para el lanzamiento"
    },
    {
      "type": "create_section",
      "entity": "section",
      "data": {
        "nombre": "Marketing",
        "projectName": "Lanzamiento App Móvil"
      },
      "confidence": 0.95,
      "explanation": "Sección para tareas de marketing (foco principal)"
    },
    {
      "type": "create_with_subtasks",
      "entity": "task",
      "data": {
        "titulo": "Estrategia de marketing pre-lanzamiento",
        "prioridad": 1,
        "fechaVencimiento": "en 2 semanas",
        "projectName": "Lanzamiento App Móvil",
        "sectionName": "Marketing",
        "labelNames": ["urgente", "marketing"],
        "subtasks": [
          {
            "titulo": "Definir público objetivo",
            "prioridad": 1,
            "fechaVencimiento": "en 1 semana"
          },
          {
            "titulo": "Crear landing page",
            "prioridad": 1,
            "subtasks": [
              {
                "titulo": "Diseñar mockup de landing",
                "prioridad": 2
              },
              {
                "titulo": "Implementar landing",
                "prioridad": 2
              }
            ]
          },
          {
            "titulo": "Configurar redes sociales",
            "prioridad": 2,
            "fechaVencimiento": "en 10 días"
          }
        ]
      },
      "confidence": 0.92,
      "explanation": "Tarea principal de marketing con subtareas detalladas"
    }
  ]
}

IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional. Sé natural, amigable y ayuda al usuario a lograr sus objetivos de la mejor manera posible.`;

  try {
    const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride);
    const jsonText = stripCodeFences(text);
    
    try {
      const response = JSON.parse(jsonText);
      
      // Validate response structure
      if (!response.status || !response.message) {
        throw new Error('Respuesta inválida del agente');
      }
      
      // Generate conversation ID if not provided
      const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        ...response,
        conversationId: newConversationId,
        providerUsed,
      };
    } catch (parseError) {
      console.error('Error parseando respuesta del agente:', parseError, '\nRespuesta original:', text);
      
      // Fallback: treat as conversation message
      return {
        status: 'conversation',
        message: text.trim() || 'Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?',
        requiresInput: true,
        conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        providerUsed,
      };
    }
  } catch (error: any) {
    console.error('Error en conversationalAgent:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Error al procesar el mensaje',
      requiresInput: false,
      providerUsed: preferred,
    };
  }
};




// Unified AI Interaction with Mode Selection
export type AIMode = "ASK" | "PLAN" | "AGENT";

export interface UnifiedAIResponse {
  mode: AIMode;
  message: string;
  conversationId: string;
  canChangeMode?: boolean;
  suggestedMode?: AIMode;
  suggestedModeReason?: string;
  
  // For ASK mode
  answer?: string;
  
  // For PLAN mode
  plan?: AIPlan;
  
  // For AGENT mode
  status?: "conversation" | "ready" | "executing";
  requiresInput?: boolean;
  suggestedActions?: AIAction[];
  executedActions?: any[];
  
  providerUsed: SupportedAIProvider;
}

/**
 * Unified AI Interaction Handler
 * Handles three modes: ASK (questions), PLAN (planning), AGENT (autonomous execution)
 */
export const unifiedAI = async (
  message: string,
  mode: AIMode,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  context?: any,
  autoExecute: boolean = false,
  providerOverride?: string,
  conversationId?: string,
  prisma?: any,
  userId?: string,
): Promise<UnifiedAIResponse> => {
  const preferred = resolveProvider(providerOverride);
  const contextString = context ? JSON.stringify(context, null, 2) : "Sin contexto adicional";
  const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Build conversation history
  const historyString = conversationHistory.length > 0
    ? conversationHistory
        .map((msg) => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
        .join("\n")
    : "Inicio de conversación";

  try {
    // Handle each mode differently
    switch (mode) {
      case "ASK": {
        const prompt = `Eres un asistente experto en gestión de tareas y productividad. Tu único objetivo es responder preguntas y resolver dudas del usuario. NO ejecutas acciones, solo proporcionas información y consejos.

Contexto del usuario:
${contextString}

Historial de conversación:
${historyString}

Pregunta del usuario: "${message}"

Responde en formato JSON con esta estructura:

{
  "answer": "Tu respuesta clara y útil",
  "canChangeMode": true/false,
  "suggestedMode": "PLAN" | "AGENT" | null,
  "suggestedModeReason": "Por qué sugieres cambiar de modo (si aplica)"
}

Directrices:
1. Da respuestas claras, concisas y útiles
2. Si el usuario pregunta cómo hacer algo, explica el proceso
3. Si el usuario pide que hagas algo (crear, mover, eliminar tareas), sugiere cambiar a modo PLAN o AGENT:
   - PLAN: Para planificar proyectos complejos
   - AGENT: Para ejecutar acciones automáticamente
4. Sé amable y profesional
5. Si no estás seguro, di que no lo sabes

IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional.`;

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride);
        const jsonText = stripCodeFences(text);
        
        try {
          const response = JSON.parse(jsonText);
          
          return {
            mode: "ASK",
            message: response.answer || text,
            answer: response.answer || text,
            conversationId: newConversationId,
            canChangeMode: response.canChangeMode || false,
            suggestedMode: response.suggestedMode || undefined,
            suggestedModeReason: response.suggestedModeReason || undefined,
            providerUsed,
          };
        } catch (parseError) {
          // Fallback: treat entire response as answer
          return {
            mode: "ASK",
            message: text,
            answer: text,
            conversationId: newConversationId,
            providerUsed,
          };
        }
      }

      case "PLAN": {
        const prompt = `Eres un planificador experto. Tu objetivo es ayudar al usuario a crear planes estructurados para sus proyectos y objetivos.

Contexto del usuario:
${contextString}

Historial de conversación:
${historyString}

Mensaje del usuario: "${message}"

Responde en formato JSON:

Si necesitas más información:
{
  "status": "conversation",
  "message": "Tu pregunta clarificadora",
  "requiresInput": true
}

Si estás listo para crear el plan:
{
  "status": "ready",
  "message": "Resumen del plan que crearás",
  "plan": {
    "goal": "Objetivo principal",
    "summary": "Resumen ejecutivo",
    "phases": [
      {
        "title": "Fase 1",
        "description": "Descripción",
        "duration": "Duración estimada",
        "tasks": [
          {
            "title": "Tarea",
            "description": "Descripción",
            "priority": 1-4,
            "dueInDays": 7
          }
        ]
      }
    ]
  },
  "canChangeMode": true,
  "suggestedMode": "AGENT",
  "suggestedModeReason": "Para ejecutar este plan automáticamente"
}

Directrices:
1. Haz preguntas específicas para entender el alcance
2. Crea planes detallados con fases y tareas
3. Sugiere cambiar a modo AGENT para ejecutar el plan
4. Incluye timelines realistas

IMPORTANTE: Devuelve SOLO el JSON.`;

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride);
        const jsonText = stripCodeFences(text);
        
        try {
          const response = JSON.parse(jsonText);
          
          return {
            mode: "PLAN",
            message: response.message,
            status: response.status,
            requiresInput: response.requiresInput || false,
            plan: response.plan,
            conversationId: newConversationId,
            canChangeMode: response.canChangeMode,
            suggestedMode: response.suggestedMode,
            suggestedModeReason: response.suggestedModeReason,
            providerUsed,
          };
        } catch (parseError) {
          console.error("Error en modo PLAN:", parseError);
          return {
            mode: "PLAN",
            message: text,
            status: "conversation",
            requiresInput: true,
            conversationId: newConversationId,
            providerUsed,
          };
        }
      }

      case "AGENT": {
        const prompt = `Eres un agente autónomo de gestión de tareas. Tu objetivo es entender lo que el usuario quiere y EJECUTAR las acciones necesarias automáticamente.

Contexto del usuario:
${contextString}

Historial de conversación:
${historyString}

Mensaje del usuario: "${message}"

Responde en formato JSON:

Si necesitas más información:
{
  "status": "conversation",
  "message": "Tu pregunta al usuario",
  "requiresInput": true
}

Si estás listo para ejecutar:
{
  "status": "ready",
  "message": "Explicación de lo que vas a hacer",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create_with_subtasks" | "create_project" | "create_section" | etc,
      "entity": "task" | "project" | "section" | "label" | "reminder",
      "data": { ... },
      "confidence": 0.95,
      "explanation": "Por qué esta acción"
    }
  ]
}

Directrices:
1. Sé conversacional y amigable
2. Haz preguntas específicas paso a paso
3. Cuando tengas suficiente info, genera TODAS las acciones necesarias
4. Usa create_with_subtasks para jerarquías complejas
5. Crea proyectos, secciones, etiquetas según sea necesario
6. Asigna prioridades y fechas lógicas
7. Piensa en recordatorios para hitos importantes

Tipos de acciones disponibles:
- create, create_with_subtasks, create_bulk
- update, update_bulk, delete, delete_bulk
- move_bulk, reorder
- create_project, create_section, create_label
- add_comment, create_reminder

IMPORTANTE: Devuelve SOLO el JSON.`;

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride);
        const jsonText = stripCodeFences(text);
        
        try {
          const response = JSON.parse(jsonText);
          
          // If ready and autoExecute is true, execute actions
          let executedActions;
          if (response.status === "ready" && response.suggestedActions && autoExecute && prisma && userId) {
            try {
              executedActions = await executeAIActions(response.suggestedActions, userId, prisma);
            } catch (execError) {
              console.error("Error ejecutando acciones:", execError);
            }
          }
          
          return {
            mode: "AGENT",
            message: response.message,
            status: response.status,
            requiresInput: response.requiresInput !== false,
            suggestedActions: response.suggestedActions,
            executedActions,
            conversationId: newConversationId,
            providerUsed,
          };
        } catch (parseError) {
          console.error("Error en modo AGENT:", parseError);
          return {
            mode: "AGENT",
            message: text,
            status: "conversation",
            requiresInput: true,
            conversationId: newConversationId,
            providerUsed,
          };
        }
      }

      default:
        throw new Error(`Modo desconocido: ${mode}`);
    }
  } catch (error: any) {
    console.error("Error en unifiedAI:", error);
    return {
      mode,
      message: error instanceof Error ? error.message : "Error al procesar el mensaje",
      status: "conversation",
      requiresInput: false,
      conversationId: newConversationId,
      providerUsed: preferred,
    };
  }
};

