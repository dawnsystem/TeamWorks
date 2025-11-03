import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Función para verificar API Key
const checkApiKey = () => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('GROQ_API_KEY no está configurada. Obtén una gratis en https://console.groq.com');
  }
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

export const processNaturalLanguage = async (input: string, context?: any): Promise<AIAction[]> => {
  try {
    checkApiKey();

    const contextString = context ? JSON.stringify(context, null, 2) : 'No hay contexto disponible';

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant', // Llama 3.1 8B Instant - rápido, gratis y actualizado
      temperature: 0.7,
      max_tokens: 1000
    });

    const text = chatCompletion.choices[0]?.message?.content || '';

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

              // Crear tarea
              const task = await prisma.tasks.create({
                data: {
                  titulo: taskData.titulo,
                  descripcion: taskData.descripcion || null,
                  prioridad: taskData.prioridad || 4,
                  fechaVencimiento,
                  projectId: targetProject?.id,
                  sectionId: null,
                  orden: 0
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
                  label: { connect: { id: label.id } }
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
                ...(labelConnections.length > 0 && {
                  labels: {
                    create: labelConnections
                  }
                })
              },
              include: {
                labels: {
                  include: {
                    label: true
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
              project: { userId }
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
                  project: { userId }
                }
              });
              if (section) where.sectionId = section.id;
            }

            // Filtrar por etiqueta
            if (action.data.filter.labelName) {
              where.labels = {
                some: {
                  label: {
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
                  const existing = await prisma.taskLabel.findFirst({
                    where: {
                      taskId: task.id,
                      labelId: label.id
                    }
                  });

                  if (!existing) {
                    await prisma.taskLabel.create({
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
                project: { userId },
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

            result = await prisma.tasks.findMany({
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
                project: { userId },
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
                project: { userId },
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

