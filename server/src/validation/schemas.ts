import { z } from 'zod';

// Esquemas de validación para tareas
export const createTaskSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(500, 'El título es demasiado largo'),
  descripcion: z.string().max(5000, 'La descripción es demasiado larga').optional().nullable(),
  prioridad: z.number().int().min(1).max(4).default(4),
  fechaVencimiento: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid('ID de proyecto inválido'),
  sectionId: z.string().uuid('ID de sección inválido').optional().nullable(),
  parentTaskId: z.string().uuid('ID de tarea padre inválido').optional().nullable(),
  orden: z.number().int().min(0).default(0),
});

export const updateTaskSchema = z.object({
  titulo: z.string().min(1).max(500).optional(),
  descripcion: z.string().max(5000).optional().nullable(),
  prioridad: z.number().int().min(1).max(4).optional(),
  fechaVencimiento: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  completada: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const reorderTasksSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    orden: z.number().int().min(0),
  })).min(1, 'Debe proporcionar al menos una actualización'),
});

// Esquemas de validación para proyectos
export const createProjectSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es demasiado largo'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color hex inválido').default('#3b82f6'),
  orden: z.number().int().min(0).default(0),
});

export const updateProjectSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  orden: z.number().int().min(0).optional(),
});

// Esquemas de validación para secciones
export const createSectionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es demasiado largo'),
  orden: z.number().int().min(0).default(0),
});

export const updateSectionSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  orden: z.number().int().min(0).optional(),
});

// Esquemas de validación para etiquetas
export const createLabelSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color hex inválido').default('#3b82f6'),
});

export const updateLabelSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Esquemas de validación para comentarios
export const createCommentSchema = z.object({
  contenido: z.string().min(1, 'El contenido es requerido').max(5000, 'El contenido es demasiado largo'),
});

export const updateCommentSchema = z.object({
  contenido: z.string().min(1).max(5000),
});

// Esquemas de validación para recordatorios
export const createReminderSchema = z.object({
  fechaHora: z.string().datetime('Fecha y hora inválida'),
});

// Esquemas de validación para autenticación
export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es demasiado largo'),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema de validación para IA
export const aiProcessSchema = z.object({
  input: z.string().min(1, 'El comando no puede estar vacío').max(1000, 'El comando es demasiado largo'),
  context: z.any().optional(),
});

export const aiExecuteSchema = z.object({
  actions: z.array(z.object({
    type: z.enum([
      'create', 
      'update', 
      'delete', 
      'query', 
      'complete', 
      'create_bulk', 
      'update_bulk', 
      'create_project', 
      'create_section', 
      'create_label', 
      'add_comment', 
      'create_reminder'
    ]),
    entity: z.enum(['task', 'project', 'label', 'section', 'comment', 'reminder']),
    data: z.any().optional(),
    query: z.string().optional(),
    confidence: z.number().min(0).max(1),
    explanation: z.string(),
  })).min(1, 'Debe proporcionar al menos una acción'),
});

// Tipo de datos inferidos de los esquemas
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AIProcessInput = z.infer<typeof aiProcessSchema>;
export type AIExecuteInput = z.infer<typeof aiExecuteSchema>;
