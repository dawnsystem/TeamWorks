/**
 * Tipos para el sistema de IA
 * Define las interfaces y tipos relacionados con el procesamiento de lenguaje natural
 * y las acciones de IA
 */

/**
 * Acción generada por el sistema de IA
 */
export interface AIAction {
  type: string;
  entity: string;
  /**
   * Data contiene información específica de la acción
   * TODO (TSK-005): Refactorizar para usar tipos específicos por action.type
   * Por ejemplo: CreateTaskData, UpdateTaskData, QueryTaskData, etc.
   * Actualmente usa `any` para mantener compatibilidad con código existente.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  query?: string;
  confidence: number;
  explanation: string;
}

/**
 * Payload para crear una acción de IA
 */
export interface AIActionPayload {
  type: string;
  entity: string;
  data?: Record<string, unknown>;
  query?: string;
  confidence?: number;
  explanation?: string;
}

/**
 * Resultado del parsing de acciones con metadata
 */
export interface ParsedAction {
  actions: AIAction[];
  parsingConfidence: number;
  method: string;
  error?: string;
}

/**
 * Contexto del usuario para procesamiento de IA
 */
export interface UserContext {
  projects?: Array<{
    id: string;
    nombre: string;
    color?: string;
  }>;
  recentTasks?: Array<{
    id: string;
    titulo: string;
    prioridad?: number | null;
  }>;
  activeTasks?: Array<{
    id: string;
    titulo: string;
    prioridad?: number | null;
  }>;
  sections?: Array<{
    id: string;
    nombre: string;
    projectId: string;
  }>;
}

/**
 * Claves de API opcionales para proveedores de IA
 */
export interface APIKeys {
  groqApiKey?: string;
  geminiApiKey?: string;
}

/**
 * Opciones para generación de plan con IA
 */
export interface GeneratePlanOptions {
  providerOverride?: string;
  answers?: string[];
  context?: UserContext;
  apiKeys?: APIKeys;
}

/**
 * Respuesta del endpoint de procesamiento de comando
 */
export interface ProcessCommandResponse {
  command: string;
  actions: AIAction[];
  providerUsed: string;
  fallback?: boolean;
  message?: string;
  raw?: string;
  results?: unknown;
  autoExecuted: boolean;
}

/**
 * Respuesta del endpoint de generación de plan
 */
export interface GeneratePlanResponse {
  plan?: unknown;
  error?: string;
}

/**
 * Respuesta del endpoint de agente conversacional
 */
export interface AgentResponse {
  message?: string;
  conversationId?: string;
  error?: string;
}

/**
 * Respuesta del endpoint unificado de IA
 */
export interface UnifiedAIResponse {
  message?: string;
  actions?: AIAction[];
  results?: unknown;
  conversationId?: string;
  providerUsed?: string;
  error?: string;
}

/**
 * Historial de conversación
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type ConversationHistory = ConversationMessage[];
