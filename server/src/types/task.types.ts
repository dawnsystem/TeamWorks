/**
 * Tipos para el dominio de tareas
 * Define las interfaces y tipos relacionados con la creación, actualización y gestión de tareas
 */

/**
 * Payload para crear una nueva tarea
 */
export interface CreateTaskPayload {
  titulo: string;
  descripcion?: string;
  prioridad?: number;
  vencimiento?: Date | string;
  projectId: string;
  sectionId?: string;
  parentId?: string;
  labelIds?: string[];
  assignedTo?: string;
}

/**
 * Payload para actualizar una tarea existente
 */
export interface UpdateTaskPayload {
  titulo?: string;
  descripcion?: string;
  prioridad?: number;
  vencimiento?: Date | string | null;
  completada?: boolean;
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  labelIds?: string[];
  assignedTo?: string | null;
}

/**
 * Filtros para consulta de tareas
 */
export interface TaskFilters {
  projectId?: string;
  sectionId?: string;
  completada?: boolean;
  search?: string;
  labelIds?: string[];
  prioridad?: number;
  assignedTo?: string;
  vencimiento?: {
    from?: Date | string;
    to?: Date | string;
  };
}

/**
 * Opciones de ordenamiento para tareas
 */
export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'vencimiento' | 'prioridad' | 'orden';
  direction: 'asc' | 'desc';
}

/**
 * Actualización de orden de tareas
 */
export interface TaskOrderUpdate {
  id: string;
  orden: number;
}

/**
 * Respuesta de operación de tarea
 */
export interface TaskOperationResponse {
  success: boolean;
  task?: unknown;
  error?: string;
}
