/**
 * Tipos para el dominio de proyectos
 * Define las interfaces y tipos relacionados con proyectos, secciones y compartición
 */

/**
 * Payload para crear un nuevo proyecto
 */
export interface CreateProjectPayload {
  nombre: string;
  descripcion?: string;
  color?: string;
  orden?: number;
}

/**
 * Payload para actualizar un proyecto existente
 */
export interface UpdateProjectPayload {
  nombre?: string;
  descripcion?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * Payload para crear una sección
 */
export interface CreateSectionPayload {
  nombre: string;
  projectId: string;
  orden?: number;
}

/**
 * Payload para actualizar una sección
 */
export interface UpdateSectionPayload {
  nombre?: string;
  orden?: number;
}

/**
 * Payload para compartir un proyecto
 */
export interface ShareProjectPayload {
  projectId: string;
  sharedWithEmail: string;
  role?: 'VIEWER' | 'EDITOR' | 'ADMIN';
}

/**
 * Información de acceso a proyecto
 */
export interface ProjectAccessInfo {
  role: 'OWNER' | 'VIEWER' | 'EDITOR' | 'ADMIN';
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}
