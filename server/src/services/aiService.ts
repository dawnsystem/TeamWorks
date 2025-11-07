import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { assertProjectPermission } from './projectShareService';
import { AIProviderKeys, SupportedAIProvider, getApiKey } from './ai/types';
import { assessIntent, IntentAssessment } from './intentShield';
import * as telemetry from './aiTelemetry';
import { 
  parseActionsFromTextWithMetadata, 
  ParseResult
} from './ai/actionParser';

const SUPPORTED_AI_PROVIDERS: readonly SupportedAIProvider[] = ['groq', 'gemini'];

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Cache for clients (only for env-based keys)
let groqClient: Groq | null = null;
let geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

// Re-export types for external use
export type { AIProviderKeys, SupportedAIProvider };

const isProviderConfigured = (provider: SupportedAIProvider, userKeys?: AIProviderKeys) => {
  return Boolean(getApiKey(provider, userKeys));
};

const getConfiguredProviders = (userKeys?: AIProviderKeys) =>
  SUPPORTED_AI_PROVIDERS.filter((provider) => isProviderConfigured(provider, userKeys));

const getGroqClient = (userKeys?: AIProviderKeys) => {
  const apiKey = getApiKey('groq', userKeys);
  if (!apiKey) {
    throw new Error('El proveedor Groq está seleccionado pero GROQ_API_KEY no está configurada. Obtén una en https://console.groq.com');
  }
  // Only use cache if using env key (not user-provided)
  if (!userKeys?.groqApiKey) {
    if (!groqClient) {
      groqClient = new Groq({ apiKey });
    }
    return groqClient;
  }
  // Create new client for user-provided key
  return new Groq({ apiKey });
};

const getGeminiModel = (userKeys?: AIProviderKeys) => {
  const apiKey = getApiKey('gemini', userKeys);
  if (!apiKey) {
    throw new Error('El proveedor Gemini está seleccionado pero GEMINI_API_KEY no está configurada. Genera una en https://makersuite.google.com/app/apikey');
  }
  // Only use cache if using env key (not user-provided)
  if (!userKeys?.geminiApiKey) {
    if (!geminiModel) {
      const client = new GoogleGenerativeAI(apiKey);
      geminiModel = client.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
    }
    return geminiModel;
  }
  // Create new model for user-provided key
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
};

const resolveProvider = (provider?: string, userKeys?: AIProviderKeys): SupportedAIProvider => {
  const selected = (provider || process.env.AI_PROVIDER || 'groq').toLowerCase();
  if (!SUPPORTED_AI_PROVIDERS.includes(selected as SupportedAIProvider)) {
    throw new Error(`Proveedor IA '${selected}' no soportado. Usa uno de: ${SUPPORTED_AI_PROVIDERS.join(', ')}`);
  }
  return selected as SupportedAIProvider;
};

const getProviderOrder = (preferred: SupportedAIProvider, override?: string, userKeys?: AIProviderKeys) => {
  if (override) {
    return [preferred];
  }

  const configured = getConfiguredProviders(userKeys);
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

/**
 * Construye un system prompt robusto para el proveedor de IA
 * 
 * @param provider - Proveedor de IA (groq, gemini)
 * @param context - Contexto del usuario (proyectos, tareas recientes, etc.)
 * @param options - Opciones adicionales
 * @returns System prompt estructurado
 */
interface SystemPromptOptions {
  includeExamples?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
}

const buildSystemPrompt = (
  provider: SupportedAIProvider,
  context?: any,
  options: SystemPromptOptions = {}
): string => {
  const { includeExamples = true, conversationHistory = [] } = options;
  
  // Construcción del prompt base
  let systemPrompt = `Eres el Asistente de TeamWorks, una aplicación de gestión de tareas.

TU ROL:
Interpretas comandos en lenguaje natural para crear, editar, eliminar, consultar, completar tareas, proyectos, etiquetas, secciones, comentarios y recordatorios.

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICAMENTE con un array JSON válido. No incluyas texto adicional, explicaciones previas ni bloques de código markdown.

El array debe contener objetos con esta estructura:
[
  {
    "type": "create" | "update" | "delete" | "query" | "complete" | "create_bulk" | "update_bulk" | "delete_bulk" | "move_bulk" | "reorder" | "create_project" | "create_section" | "create_label" | "add_comment" | "create_reminder" | "create_with_subtasks",
    "entity": "task" | "project" | "label" | "section" | "comment" | "reminder",
    "data": { /* datos específicos según la acción */ },
    "query": "texto de consulta si aplica",
    "confidence": 0.0 a 1.0,
    "explanation": "breve explicación de tu interpretación"
  }
]

CAMPOS OBLIGATORIOS:
- type: tipo de acción
- entity: entidad afectada
- confidence: tu nivel de certeza (0.0 = muy incierto, 1.0 = muy seguro)
- explanation: explicación breve en español

CAMPOS OPCIONALES:
- data: para create/update (ej: {"titulo": "Nueva tarea", "prioridad": 3})
- query: para delete/query (criterio de búsqueda)`;

  // Añadir contexto del usuario si está disponible
  if (context) {
    systemPrompt += `\n\nCONTEXTO DEL USUARIO:`;
    
    if (context.projects && Array.isArray(context.projects)) {
      const projectNames = context.projects.slice(0, 5).map((p: any) => p.nombre).join(', ');
      systemPrompt += `\nProyectos disponibles: ${projectNames}`;
    }
    
    if (context.recentTasks && Array.isArray(context.recentTasks)) {
      systemPrompt += `\nTareas recientes: ${context.recentTasks.length} tareas pendientes`;
    }
  }

  // Añadir historial de conversación si existe
  if (conversationHistory.length > 0) {
    systemPrompt += `\n\nHISTORIAL DE CONVERSACIÓN RECIENTE:`;
    conversationHistory.slice(-6).forEach(msg => {
      systemPrompt += `\n${msg.role}: ${msg.content.substring(0, 100)}`;
    });
  }

  // Añadir reglas de comportamiento
  systemPrompt += `\n\nREGLAS DE COMPORTAMIENTO:
1. Si el comando es AMBIGUO o NO ESTÁS SEGURO (confidence < 0.6):
   - Establece confidence bajo (< 0.6)
   - En explanation, menciona qué te falta para estar seguro
   
2. Si el comando es CLARO pero tienes DUDAS MENORES (confidence 0.6-0.85):
   - Establece confidence medio
   - Proporciona la mejor interpretación posible
   
3. Si el comando es COMPLETAMENTE CLARO (confidence >= 0.85):
   - Establece confidence alto
   - Procede con confianza

4. SÉ CONCISO: Tus explanation deben ser breves (máximo 1-2 líneas)

5. PRIORIDADES: Cuando el usuario mencione prioridad, usa:
   - alta/high/urgente → prioridad: 1
   - media/medium → prioridad: 2
   - baja/low → prioridad: 3
   - muy baja → prioridad: 4

6. USA NOMBRES, NUNCA pidas IDs: Siempre usa nombres de proyectos y secciones (projectName, sectionName) en lugar de IDs. Ejemplo: {"projectName": "Trabajo"} NO {"projectId": "123"}`;

  // Añadir ejemplos si se solicita
  if (includeExamples) {
    systemPrompt += `\n\nEJEMPLOS:

Entrada: "crear tarea comprar leche para mañana"
Salida: [{"type":"create","entity":"task","data":{"titulo":"comprar leche","fechaVencimiento":"mañana"},"confidence":0.95,"explanation":"Crear tarea con fecha clara"}]

Entrada: "añadir reunión con equipo en proyecto Trabajo para el lunes con prioridad alta"
Salida: [{"type":"create","entity":"task","data":{"titulo":"reunión con equipo","projectName":"Trabajo","fechaVencimiento":"lunes","prioridad":1},"confidence":0.9,"explanation":"Crear tarea en proyecto con prioridad alta"}]

Entrada: "eliminar las tareas completadas"
Salida: [{"type":"delete_bulk","entity":"task","data":{"filter":{"completada":true}},"confidence":0.85,"explanation":"Eliminar todas las tareas marcadas como completadas"}]

Entrada: "mover todas las tareas del proyecto Personal a Inbox"
Salida: [{"type":"move_bulk","entity":"task","data":{"filter":{"projectName":"Personal"},"targetProjectName":"Inbox"},"confidence":0.9,"explanation":"Mover tareas de Personal a Inbox"}]

Entrada: "hacer algo"
Salida: [{"type":"query","entity":"task","query":"hacer algo","confidence":0.3,"explanation":"Comando muy vago, necesito más detalles sobre qué deseas hacer"}]`;
  }

  systemPrompt += `\n\nRECUERDA: Responde SOLO con el array JSON, sin texto adicional ni bloques de código markdown.`;

  return systemPrompt;
};

const generateWithProvider = async (
  prompt: string,
  provider: SupportedAIProvider,
  userKeys?: AIProviderKeys,
  context?: any,
  systemPromptOptions?: SystemPromptOptions
): Promise<string> => {
  telemetry.recordRequest(provider);
  
  if (provider === 'gemini') {
    const model = getGeminiModel(userKeys);
    const result = await model.generateContent(prompt);
    return result.response.text() || '';
  }

  // Para Groq, usar system prompt estructurado
  const client = getGroqClient(userKeys);
  const systemPrompt = buildSystemPrompt(provider, context, systemPromptOptions);
  
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    model: DEFAULT_GROQ_MODEL,
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || '';
};

const generateWithFallback = async (
  prompt: string,
  preferred: SupportedAIProvider,
  override?: string,
  userKeys?: AIProviderKeys,
  context?: any,
  systemPromptOptions?: SystemPromptOptions
): Promise<{ text: string; providerUsed: SupportedAIProvider }> => {
  const providersToTry = getProviderOrder(preferred, override, userKeys);
  const errors: string[] = [];
  let lastError: any = null;

  for (const provider of providersToTry) {
    try {
      const text = await generateWithProvider(prompt, provider, userKeys, context, systemPromptOptions);
      if (!text.trim()) {
        throw new Error('Respuesta vacía');
      }
      
      // Si usamos un fallback, registrarlo
      if (provider !== preferred) {
        telemetry.recordFallback(preferred, provider, lastError?.message || 'Error en provider preferido');
      }
      
      return { text, providerUsed: provider };
    } catch (error: any) {
      lastError = error;
      errors.push(`${provider}: ${error?.message || error}`);
      telemetry.logAIWarning(`Provider ${provider} falló`, { error: error?.message });
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

// Wrapper para usar el parser mejorado con tipado correcto
interface ExtendedParseResult {
  actions: AIAction[];
  parsingConfidence: number;
  method: string;
  error?: string;
}

const parseActionsWithMetadata = (text: string): ExtendedParseResult => {
  const result = parseActionsFromTextWithMetadata(text);
  // Type assertion safe porque validamos la estructura en el parser
  return {
    ...result,
    actions: result.actions as AIAction[]
  };
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
  intentAssessment?: IntentAssessment;
  parseResult?: ParseResult;
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
  userKeys?: AIProviderKeys,
): Promise<ProcessNaturalLanguageResult> => {
  const preferred = resolveProvider(providerOverride, userKeys);

  try {
    // Generar respuesta usando el system prompt mejorado
    const { text, providerUsed } = await generateWithFallback(
      input, 
      preferred, 
      providerOverride, 
      userKeys,
      context,
      { includeExamples: true }
    );
    
    // Parsear acciones con metadata de confianza
    const parseResult: ExtendedParseResult = parseActionsWithMetadata(text);
    const actions = parseResult.actions;
    
    // Registrar telemetría de parsing
    if (actions.length > 0) {
      telemetry.recordSuccessfulParsing(actions.length, parseResult.parsingConfidence.toString());
      
      // Registrar confidence promedio
      const avgConfidence = actions.reduce((sum, a) => sum + a.confidence, 0) / actions.length;
      telemetry.recordConfidence(avgConfidence);
    } else {
      telemetry.recordParsingFailure(parseResult.error || 'No actions extracted', text);
    }

    // Si no hay acciones, lanzar error para usar fallback
    if (!actions.length) {
      telemetry.logAIWarning('No se extrajeron acciones del texto de respuesta');
      throw new Error('La respuesta de la IA no contenía acciones válidas');
    }
    
    // Evaluar intención con Intent Shield
    // Note: Type compatibility - both AIAction interfaces have same structure
    const intentAssessment: IntentAssessment = assessIntent(
      input,
      actions,
      parseResult.parsingConfidence
    );
    
    // Registrar telemetría basada en la decisión
    if (intentAssessment.decision === 'clarify') {
      telemetry.recordClarificationRequest(
        intentAssessment.reason,
        intentAssessment.averageConfidence
      );
    } else if (intentAssessment.decision === 'suggest') {
      telemetry.recordSuggestion(actions.length, intentAssessment.averageConfidence);
    } else if (intentAssessment.decision === 'execute') {
      telemetry.recordAutoExecution(actions.length, intentAssessment.averageConfidence);
    }

    return {
      actions,
      providerUsed,
      raw: text,
      fallback: providerUsed !== preferred,
      intentAssessment,
      parseResult: parseResult as ParseResult
    };
  } catch (error: any) {
    telemetry.logAIError(error, { input, provider: preferred });
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
  apiKeys?: AIProviderKeys;
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
  const preferred = resolveProvider(options.providerOverride, options.apiKeys);
  const contextString = options.context ? JSON.stringify(options.context, null, 2) : 'Sin contexto adicional';

  const prompt = buildPlannerPrompt(goal, mode, options.answers, contextString);

  const { text, providerUsed } = await generateWithFallback(prompt, preferred, options.providerOverride, options.apiKeys);
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
  userKeys?: AIProviderKeys,
): Promise<AgentResponse> => {
  const preferred = resolveProvider(providerOverride, userKeys);
  const contextString = context ? JSON.stringify(context, null, 2) : 'Sin contexto adicional';
  
  // Build conversation history for the prompt
  const historyString = conversationHistory.length > 0
    ? conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'Agente'}: ${msg.content}`)
        .join('\n')
    : 'Inicio de conversación';

  const prompt = `Eres un agente inteligente de gestión de tareas conversacional. Tu objetivo es entender EXACTAMENTE lo que el usuario quiere lograr y luego ejecutar las acciones necesarias.

Contexto del usuario (proyectos, secciones y tareas disponibles):
${contextString}

Historial de conversación:
${historyString}

Mensaje actual del usuario: "${message}"

Tu rol es:
1. ENTENDER: Hacer preguntas clarificadoras SOLO cuando sea absolutamente necesario
2. EJECUTAR: Cuando tengas suficiente información, generar inmediatamente las acciones necesarias

Debes responder con un JSON en uno de estos formatos:

FORMATO 1 - Cuando necesitas más información:
{
  "status": "conversation",
  "message": "Tu pregunta o comentario al usuario (sé natural y conversacional)",
  "requiresInput": true
}

FORMATO 2 - Cuando tienes suficiente información y estás listo para ejecutar:
{
  "status": "ready",
  "message": "Confirmación breve de lo que vas a hacer",
  "summary": "Resumen muy breve de la acción",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create_project" | "create_section" | "create_with_subtasks" | "create" | "delete_bulk" | "update_bulk" | etc,
      "entity": "project" | "task" | "section" | "label" | "reminder",
      "data": { ... datos necesarios ... },
      "confidence": 0.95,
      "explanation": "Explicación de la acción"
    }
  ]
}

REGLAS CRÍTICAS PARA EVITAR ERRORES:

1. **NUNCA pidas IDs al usuario**: Los proyectos y secciones se identifican por NOMBRE, no por ID
   - ✅ CORRECTO: "¿En qué proyecto?" → Usuario: "Inbox"
   - ❌ INCORRECTO: "¿Cuál es el ID del proyecto?"
   - Los IDs son internos y el sistema los resuelve automáticamente usando los nombres

2. **NO repitas preguntas**: Si el usuario ya te dio información en el historial, úsala
   - Lee el historial completo antes de preguntar
   - Si el usuario dijo "Inbox" y "Seccion de test", NO vuelvas a preguntar por ellos
   - NO pidas confirmación múltiples veces de la misma información

3. **Ejecuta inmediatamente cuando tengas lo necesario**:
   - Si el usuario te dio proyecto y sección → pasa a status "ready"
   - Si confirma tu plan → pasa a status "ready" 
   - NO sigas preguntando después de tener toda la información

4. **Usa los nombres del contexto**: Los proyectos y secciones están en el contexto con sus nombres
   - Busca en el contexto los nombres de proyectos disponibles
   - Busca en el contexto los nombres de secciones disponibles
   - Usa estos nombres EXACTAMENTE como aparecen (case-insensitive)

5. **Para acciones de eliminación**:
   - Tipo de acción: "delete_bulk"
   - En data.filter incluye: projectName, sectionName, completada, prioridad, etc.
   - Ejemplo: eliminar todas las tareas de proyecto "Inbox" sección "Test"

6. **Sé directo y eficiente**:
   - Máximo 1-2 preguntas clarificadoras si es necesario
   - Una vez que tengas la información, ejecuta
   - No des rodeos ni pidas confirmaciones innecesarias

Ejemplos de conversaciones exitosas:

EJEMPLO 1 - Eliminar tareas (el caso del problema):
Usuario: "elimina todas las tareas en Inbox, dentro de la sección 'Seccion de test'"
Agente (mirando el contexto, ve que Inbox y "Seccion de test" existen):
{
  "status": "ready",
  "message": "Perfecto, voy a eliminar todas las tareas que están en el proyecto 'Inbox' dentro de la sección 'Seccion de test'.",
  "summary": "Eliminar tareas en Inbox > Seccion de test",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "delete_bulk",
      "entity": "task",
      "data": {
        "filter": {
          "projectName": "Inbox",
          "sectionName": "Seccion de test"
        }
      },
      "confidence": 0.95,
      "explanation": "Eliminar todas las tareas del proyecto Inbox en la sección 'Seccion de test'"
    }
  ]
}

EJEMPLO 2 - Crear tareas en proyecto existente:
Usuario: "crear tarea 'Revisar código' en proyecto Work"
Agente (ve que Work existe en el contexto):
{
  "status": "ready",
  "message": "Voy a crear la tarea 'Revisar código' en tu proyecto Work.",
  "summary": "Crear tarea en Work",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create",
      "entity": "task",
      "data": {
        "titulo": "Revisar código",
        "projectName": "Work",
        "prioridad": 2
      },
      "confidence": 0.95,
      "explanation": "Crear tarea en proyecto existente Work"
    }
  ]
}

EJEMPLO 3 - Mover tareas entre secciones:
Usuario: "mover todas las tareas de 'Backlog' a 'In Progress' en proyecto Development"
Agente:
{
  "status": "ready",
  "message": "Voy a mover todas las tareas de la sección 'Backlog' a 'In Progress' en el proyecto Development.",
  "summary": "Mover tareas Backlog → In Progress",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "update_bulk",
      "entity": "task",
      "data": {
        "filter": {
          "projectName": "Development",
          "sectionName": "Backlog"
        },
        "updates": {
          "sectionName": "In Progress"
        }
      },
      "confidence": 0.9,
      "explanation": "Mover tareas entre secciones del mismo proyecto"
    }
  ]
}

EJEMPLO 4 - Cuando falta información necesaria:
Usuario: "elimina las tareas de testing"
Agente (no está claro de qué proyecto):
{
  "status": "conversation",
  "message": "Quieres eliminar tareas relacionadas con testing. ¿De qué proyecto? Veo que tienes: Inbox, Work, Development",
  "requiresInput": true
}

Usuario: "del proyecto Development"
Agente (YA tiene la información, no pregunta de nuevo):
{
  "status": "ready",
  "message": "Perfecto, voy a eliminar las tareas de testing del proyecto Development.",
  "summary": "Eliminar tareas de testing en Development",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "delete_bulk",
      "entity": "task",
      "data": {
        "filter": {
          "projectName": "Development",
          "search": "testing"
        }
      },
      "confidence": 0.85,
      "explanation": "Eliminar tareas que contienen 'testing' en Development"
    }
  ]
}

RECUERDA: 
- Usa nombres de proyectos y secciones, NUNCA IDs
- No repitas preguntas si ya tienes la respuesta en el historial
- Pasa a "ready" tan pronto como tengas suficiente información
- Para eliminar: usa "delete_bulk" con filter.projectName y filter.sectionName

IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional.`;

  try {
    const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride, userKeys);
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
  userKeys?: AIProviderKeys,
): Promise<UnifiedAIResponse> => {
  const preferred = resolveProvider(providerOverride, userKeys);
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

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride, userKeys);
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

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride, userKeys);
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

Contexto del usuario (proyectos, secciones y tareas disponibles):
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
  "message": "Explicación breve de lo que vas a hacer",
  "requiresInput": false,
  "suggestedActions": [
    {
      "type": "create_with_subtasks" | "create_project" | "create_section" | "delete_bulk" | etc,
      "entity": "task" | "project" | "section" | "label" | "reminder",
      "data": { ... },
      "confidence": 0.95,
      "explanation": "Por qué esta acción"
    }
  ]
}

REGLAS CRÍTICAS:
1. **NUNCA pidas IDs**: Usa nombres de proyectos y secciones, el sistema resuelve los IDs automáticamente
2. **NO repitas preguntas**: Si el usuario ya te dio información en el historial, úsala
3. **Ejecuta inmediatamente**: Cuando tengas suficiente información, pasa a status "ready"
4. **Lee el contexto**: Los proyectos y secciones disponibles están en el contexto con sus nombres
5. **Para eliminación**: Usa "delete_bulk" con filter.projectName y filter.sectionName

Tipos de acciones disponibles:
- create, create_with_subtasks, create_bulk
- update, update_bulk, delete, delete_bulk
- move_bulk, reorder
- create_project, create_section, create_label
- add_comment, create_reminder

Ejemplo de eliminación:
Usuario: "elimina las tareas en Inbox, sección Test"
{
  "status": "ready",
  "message": "Voy a eliminar todas las tareas en Inbox > Test",
  "requiresInput": false,
  "suggestedActions": [{
    "type": "delete_bulk",
    "entity": "task",
    "data": {
      "filter": {
        "projectName": "Inbox",
        "sectionName": "Test"
      }
    },
    "confidence": 0.95,
    "explanation": "Eliminar tareas de Inbox > Test"
  }]
}

IMPORTANTE: Devuelve SOLO el JSON.`;

        const { text, providerUsed } = await generateWithFallback(prompt, preferred, providerOverride, userKeys);
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

