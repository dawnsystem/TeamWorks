import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIAction {
  type: 'create' | 'update' | 'delete' | 'query' | 'complete';
  entity: 'task' | 'project' | 'label';
  data?: any;
  query?: string;
  confidence: number;
  explanation: string;
}

export const processNaturalLanguage = async (input: string, context?: any): Promise<AIAction[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const contextString = context ? JSON.stringify(context, null, 2) : 'No hay contexto disponible';

    const prompt = `Eres un asistente de IA para una aplicación de gestión de tareas tipo Todoist. 
Tu trabajo es interpretar comandos en lenguaje natural y convertirlos en acciones estructuradas.

Contexto actual del usuario:
${contextString}

Comando del usuario: "${input}"

Analiza el comando y devuelve un JSON con un array de acciones a realizar. Cada acción debe tener:
- type: "create", "update", "delete", "query" o "complete"
- entity: "task", "project" o "label"
- data: objeto con los datos necesarios para la acción (título, descripción, prioridad, fecha, etc.)
- query: para consultas, la pregunta a responder
- confidence: número entre 0 y 1 indicando tu confianza en la interpretación
- explanation: explicación breve de qué se va a hacer

Ejemplos de comandos y respuestas:

1. "añadir comprar leche para mañana prioridad alta"
{
  "actions": [{
    "type": "create",
    "entity": "task",
    "data": {
      "titulo": "Comprar leche",
      "prioridad": 1,
      "fechaVencimiento": "TOMORROW_DATE"
    },
    "confidence": 0.95,
    "explanation": "Crear tarea 'Comprar leche' con prioridad alta para mañana"
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

Prioridades:
- P1 o "alta" o "urgente" = 1
- P2 o "media" = 2
- P3 o "baja" = 3
- P4 o sin prioridad = 4

Fechas comunes:
- "hoy" = fecha de hoy
- "mañana" = fecha de mañana
- "esta semana" = próximos 7 días
- Fechas específicas en formato ISO

IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional antes o después. El JSON debe ser válido y parseable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extraer JSON del texto
    let jsonText = text.trim();
    
    // Eliminar markdown code blocks si existen
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
    }
    
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);
    
    return parsed.actions || [];
  } catch (error) {
    console.error('Error en processNaturalLanguage:', error);
    
    // Fallback: intentar parsear el comando de forma básica
    return [{
      type: 'create',
      entity: 'task',
      data: {
        titulo: input
      },
      confidence: 0.5,
      explanation: 'No se pudo procesar el comando con IA, creando tarea simple'
    }];
  }
};

export const executeAIActions = async (actions: AIAction[], userId: string, prisma: any) => {
  const results = [];

  for (const action of actions) {
    try {
      let result;

      switch (action.type) {
        case 'create':
          if (action.entity === 'task') {
            // Buscar el proyecto inbox del usuario
            const inboxProject = await prisma.project.findFirst({
              where: {
                userId,
                nombre: 'Inbox'
              }
            });

            // Procesar fecha
            let fechaVencimiento = null;
            if (action.data?.fechaVencimiento) {
              if (action.data.fechaVencimiento === 'TOMORROW_DATE') {
                fechaVencimiento = new Date();
                fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
                fechaVencimiento.setHours(23, 59, 59, 999);
              } else if (action.data.fechaVencimiento === 'TODAY_DATE') {
                fechaVencimiento = new Date();
                fechaVencimiento.setHours(23, 59, 59, 999);
              } else {
                fechaVencimiento = new Date(action.data.fechaVencimiento);
              }
            }

            result = await prisma.task.create({
              data: {
                titulo: action.data.titulo,
                descripcion: action.data.descripcion || null,
                prioridad: action.data.prioridad || 4,
                fechaVencimiento,
                projectId: inboxProject?.id || action.data.projectId,
                sectionId: action.data.sectionId || null,
                orden: 0
              }
            });
          }
          break;

        case 'complete':
          if (action.entity === 'task' && action.data?.search) {
            // Buscar tarea por título
            const task = await prisma.task.findFirst({
              where: {
                project: { userId },
                titulo: { contains: action.data.search, mode: 'insensitive' }
              }
            });

            if (task) {
              result = await prisma.task.update({
                where: { id: task.id },
                data: { completada: true }
              });
            }
          }
          break;

        case 'delete':
          if (action.entity === 'task') {
            result = await prisma.task.deleteMany({
              where: {
                project: { userId },
                ...action.data.filter
              }
            });
          }
          break;

        case 'query':
          if (action.entity === 'task') {
            const where: any = {
              project: { userId }
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

            result = await prisma.task.findMany({
              where,
              include: {
                labels: {
                  include: {
                    label: true
                  }
                }
              },
              orderBy: { orden: 'asc' }
            });
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

