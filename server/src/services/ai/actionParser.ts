/**
 * Action Parser
 * Parses AI-generated actions from natural language responses
 */

import { AIAction, ParsedAction } from '../../types';

// Re-export AIAction for backward compatibility
export type { AIAction };

/**
 * @deprecated - Use ParsedAction from types instead
 * Mantenido temporalmente para compatibilidad con código existente
 */
export type ParseResult = ParsedAction;

/**
 * Parse actions from AI-generated text with robust fallback strategies
 * 
 * Soporta múltiples formatos:
 * 1. Bloques ```json ... ```
 * 2. JSON inline en texto mixto
 * 3. Arrays JSON al final del texto
 * 4. Objetos con campo "actions"
 * 5. Extracción heurística cuando JSON no es válido
 */
export const parseActionsFromText = (text: string): AIAction[] => {
  const result = parseActionsFromTextWithMetadata(text);
  return result.actions;
};

/**
 * Versión extendida que retorna metadata del parsing
 */
export const parseActionsFromTextWithMetadata = (text: string): ParseResult => {
  if (!text || typeof text !== 'string') {
    return {
      actions: [],
      parsingConfidence: 0,
      method: 'empty_input',
      error: 'Input vacío o inválido'
    };
  }

  const trimmedText = text.trim();
  
  // Strategy 1: JSON en bloques de código
  const codeBlockResult = tryParseCodeBlock(trimmedText);
  if (codeBlockResult.actions.length > 0) {
    return codeBlockResult;
  }
  
  // Strategy 2: Array JSON directo (puede estar envuelto en texto)
  const arrayResult = tryParseArrayJSON(trimmedText);
  if (arrayResult.actions.length > 0) {
    return arrayResult;
  }
  
  // Strategy 3: Buscar JSON con campo "actions"
  const objectResult = tryParseObjectWithActions(trimmedText);
  if (objectResult.actions.length > 0) {
    return objectResult;
  }
  
  // Strategy 4: Extracción agresiva - buscar cualquier estructura JSON válida
  const aggressiveResult = tryAggressiveJSONExtraction(trimmedText);
  if (aggressiveResult.actions.length > 0) {
    return aggressiveResult;
  }
  
  // Strategy 5: Fallback heurístico (verbal parsing)
  const heuristicResult = tryHeuristicParsing(trimmedText);
  if (heuristicResult.actions.length > 0) {
    return heuristicResult;
  }
  
  // Completamente fallido
  return {
    actions: [],
    parsingConfidence: 0,
    method: 'failed',
    error: 'No se pudo extraer acciones del texto'
  };
};

/**
 * Intenta parsear JSON de bloques de código ```json```
 */
const tryParseCodeBlock = (text: string): ParseResult => {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (!codeBlockMatch) {
    return { actions: [], parsingConfidence: 0, method: 'code_block' };
  }
  
  const jsonContent = codeBlockMatch[1].trim();
  return tryParseJSON(jsonContent, 'code_block', 0.95);
};

/**
 * Intenta parsear array JSON directamente del texto
 */
const tryParseArrayJSON = (text: string): ParseResult => {
  // Buscar el primer '[' y el último ']' correspondiente
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  if (firstBracket === -1 || lastBracket === -1 || firstBracket >= lastBracket) {
    return { actions: [], parsingConfidence: 0, method: 'array_json' };
  }
  
  const jsonCandidate = text.substring(firstBracket, lastBracket + 1);
  return tryParseJSON(jsonCandidate, 'array_json', 0.9);
};

/**
 * Intenta parsear objeto JSON que contiene un campo "actions"
 */
const tryParseObjectWithActions = (text: string): ParseResult => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return { actions: [], parsingConfidence: 0, method: 'object_with_actions' };
  }
  
  const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
  
  try {
    const parsed = JSON.parse(jsonCandidate);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.actions)) {
      return {
        actions: sanitizeActions(parsed.actions),
        parsingConfidence: 0.9,
        method: 'object_with_actions'
      };
    }
  } catch (e) {
    // Continuar con otras estrategias
  }
  
  return { actions: [], parsingConfidence: 0, method: 'object_with_actions' };
};

/**
 * Extracción agresiva: intenta limpiar y reparar JSON
 */
const tryAggressiveJSONExtraction = (text: string): ParseResult => {
  // Eliminar caracteres no válidos comunes
  let cleaned = text
    .replace(/```(?:json)?/gi, '')
    .replace(/^\s*(?:actions?:?|result:?|response:?)\s*/i, '')
    .trim();
  
  // Intentar encontrar múltiples JSONs pequeños
  const jsonRegex = /\{[^{}]*\}/g;
  const matches = cleaned.match(jsonRegex);
  
  if (matches && matches.length > 0) {
    const possibleActions: AIAction[] = [];
    
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        if (isValidAction(parsed)) {
          possibleActions.push(parsed);
        }
      } catch (e) {
        // Ignorar objetos inválidos
      }
    }
    
    if (possibleActions.length > 0) {
      return {
        actions: possibleActions,
        parsingConfidence: 0.7,
        method: 'aggressive_extraction'
      };
    }
  }
  
  return { actions: [], parsingConfidence: 0, method: 'aggressive_extraction' };
};

/**
 * Parsing heuristic verbal - último recurso
 * Intenta entender la intención sin JSON válido
 */

// Constantes para heurística de parsing
const HEURISTIC_CREATE_KEYWORDS = ['crear', 'añadir', 'agregar', 'nuevo', 'nueva', 'create', 'add', 'new'];
const HEURISTIC_UPDATE_KEYWORDS = ['actualizar', 'modificar', 'cambiar', 'editar', 'update', 'modify', 'change', 'edit'];
const HEURISTIC_DELETE_KEYWORDS = ['eliminar', 'borrar', 'quitar', 'delete', 'remove'];
const HEURISTIC_QUERY_KEYWORDS = ['buscar', 'encontrar', 'listar', 'mostrar', 'ver', 'search', 'find', 'list', 'show'];

const HEURISTIC_ENTITY_KEYWORDS: Record<string, string[]> = {
  task: ['tarea', 'task'],
  project: ['proyecto', 'project'],
  label: ['etiqueta', 'label'],
  section: ['sección', 'section'],
  comment: ['comentario', 'comment'],
  reminder: ['recordatorio', 'reminder']
};

const tryHeuristicParsing = (text: string): ParseResult => {
  const lowerText = text.toLowerCase();
  
  // Detectar tipo de acción
  let actionType: string = 'query';
  if (HEURISTIC_CREATE_KEYWORDS.some(kw => lowerText.includes(kw))) {
    actionType = 'create';
  } else if (HEURISTIC_UPDATE_KEYWORDS.some(kw => lowerText.includes(kw))) {
    actionType = 'update';
  } else if (HEURISTIC_DELETE_KEYWORDS.some(kw => lowerText.includes(kw))) {
    actionType = 'delete';
  } else if (HEURISTIC_QUERY_KEYWORDS.some(kw => lowerText.includes(kw))) {
    actionType = 'query';
  }
  
  // Detectar entidad
  let entity: string = 'task';
  for (const [ent, keywords] of Object.entries(HEURISTIC_ENTITY_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      entity = ent;
      break;
    }
  }
  
  // Crear acción heurística
  const heuristicAction: AIAction = {
    type: actionType,
    entity: entity,
    query: text,
    confidence: 0.4,
    explanation: 'Interpretación heurística del comando (sin JSON válido)'
  };
  
  return {
    actions: [heuristicAction],
    parsingConfidence: 0.3,
    method: 'heuristic_verbal'
  };
};

/**
 * Helper para intentar parsear un string JSON
 */
const tryParseJSON = (jsonString: string, method: string, confidence: number): ParseResult => {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (Array.isArray(parsed)) {
      return {
        actions: sanitizeActions(parsed),
        parsingConfidence: confidence,
        method
      };
    }
    
    // Si es un objeto con "actions"
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.actions)) {
      return {
        actions: sanitizeActions(parsed.actions),
        parsingConfidence: confidence,
        method
      };
    }
    
    // Si es un solo objeto de acción
    if (isValidAction(parsed)) {
      return {
        actions: [parsed],
        parsingConfidence: confidence * 0.9,
        method
      };
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido al parsear JSON';
    return {
      actions: [],
      parsingConfidence: 0,
      method,
      error: errorMessage
    };
  }
  
  return { actions: [], parsingConfidence: 0, method };
};

/**
 * Create fallback action when parsing fails
 */
export const createFallbackAction = (input: string): AIAction => ({
  type: 'query',
  entity: 'task',
  query: input,
  confidence: 0.3,
  explanation: 'No se pudo interpretar el comando específicamente',
});

/**
 * Strip code fences from text
 */
export const stripCodeFences = (text: string): string => {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
};

/**
 * Validate action structure
 * @param action - Objeto a validar
 * @returns true si el objeto cumple con la estructura de AIAction
 */
export const isValidAction = (action: unknown): action is AIAction => {
  if (!action || typeof action !== 'object') {
    return false;
  }
  
  const obj = action as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.entity === 'string' &&
    typeof obj.confidence === 'number' &&
    typeof obj.explanation === 'string'
  );
};

/**
 * Sanitize and validate actions array
 * @param actions - Valor a validar (debería ser un array)
 * @returns Array de acciones válidas
 */
export const sanitizeActions = (actions: unknown): AIAction[] => {
  if (!Array.isArray(actions)) return [];
  // Una vez verificado que es array, podemos usar filter con type guard
  return (actions as unknown[]).filter(isValidAction);
};
