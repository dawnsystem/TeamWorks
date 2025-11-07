/**
 * Intent Shield
 * 
 * Módulo que analiza la intención del usuario y los resultados del parsing
 * para decidir si ejecutar acciones automáticamente, sugerirlas para confirmación,
 * o pedir clarificación al usuario.
 * 
 * Thresholds configurables via variables de entorno:
 * - AI_INTENT_CONFIDENCE_THRESHOLD_EXECUTE (default: 0.85)
 * - AI_INTENT_CONFIDENCE_THRESHOLD_SUGGEST (default: 0.6)
 */

import { AIAction } from './ai/actionParser';

/**
 * Decisión del Intent Shield
 */
export type IntentDecision = 'execute' | 'suggest' | 'clarify';

/**
 * Resultado del análisis de intención
 */
export interface IntentAssessment {
  decision: IntentDecision;
  reason: string;
  suggestedClarification?: string;
  averageConfidence: number;
  parsingQuality: 'high' | 'medium' | 'low';
}

/**
 * Opciones de configuración para thresholds
 */
export interface IntentShieldOptions {
  executeThreshold?: number;
  suggestThreshold?: number;
  minParsingConfidence?: number;
}

// Valores por defecto de thresholds desde variables de entorno
const DEFAULT_EXECUTE_THRESHOLD = parseFloat(process.env.AI_INTENT_CONFIDENCE_THRESHOLD_EXECUTE || '0.85');
const DEFAULT_SUGGEST_THRESHOLD = parseFloat(process.env.AI_INTENT_CONFIDENCE_THRESHOLD_SUGGEST || '0.6');
const DEFAULT_MIN_PARSING_CONFIDENCE = 0.7;

/**
 * Calcula el promedio de confidence de un conjunto de acciones
 */
const calculateAverageConfidence = (actions: AIAction[]): number => {
  if (!actions || actions.length === 0) return 0;
  
  const sum = actions.reduce((acc, action) => acc + (action.confidence || 0), 0);
  return sum / actions.length;
};

/**
 * Detecta ambigüedad semántica en las acciones
 * Retorna true si detecta señales de ambigüedad
 */
const detectAmbiguity = (actions: AIAction[], rawText: string): boolean => {
  // Palabras clave que indican incertidumbre en las explicaciones
  const uncertaintyKeywords = [
    'posiblemente', 'quizás', 'tal vez', 'probablemente',
    'no estoy seguro', 'podría ser', 'puede que',
    'possibly', 'maybe', 'perhaps', 'probably', 'might be'
  ];
  
  // Verificar si alguna explicación contiene palabras de incertidumbre
  const hasUncertainExplanation = actions.some(action => {
    const explanation = (action.explanation || '').toLowerCase();
    return uncertaintyKeywords.some(keyword => explanation.includes(keyword));
  });
  
  // Verificar si el texto original tiene múltiples interpretaciones posibles
  const hasMultipleInterpretations = rawText.toLowerCase().includes('o') && 
                                      rawText.toLowerCase().includes('?');
  
  // Verificar si hay acciones conflictivas (ej: create y delete para la misma entidad)
  const hasConflictingActions = actions.length > 1 && actions.some((action, i) => {
    return actions.slice(i + 1).some(otherAction => 
      action.entity === otherAction.entity && 
      ((action.type === 'delete' && otherAction.type === 'create') ||
       (action.type === 'create' && otherAction.type === 'delete'))
    );
  });
  
  return hasUncertainExplanation || hasMultipleInterpretations || hasConflictingActions;
};

/**
 * Genera una sugerencia de clarificación basada en el contexto
 */
const generateClarification = (actions: AIAction[], rawText: string, reason: string): string => {
  if (actions.length === 0) {
    return '¿Podrías reformular tu solicitud? No pude entender qué acción deseas realizar.';
  }
  
  // Si hay baja confidence pero sabemos qué intenta hacer
  if (reason.includes('confidence bajo')) {
    const mainAction = actions[0];
    const entityMap: Record<string, string> = {
      task: 'tarea',
      project: 'proyecto',
      label: 'etiqueta',
      section: 'sección',
      comment: 'comentario',
      reminder: 'recordatorio'
    };
    
    const actionMap: Record<string, string> = {
      create: 'crear',
      update: 'actualizar',
      delete: 'eliminar',
      query: 'consultar'
    };
    
    const entity = entityMap[mainAction.entity] || mainAction.entity;
    const action = actionMap[mainAction.type] || mainAction.type;
    
    return `¿Quieres ${action} ${entity === 'tarea' ? 'una' : 'un'} ${entity}? ¿Podrías proporcionar más detalles?`;
  }
  
  // Si hay ambigüedad
  if (reason.includes('ambigüedad') || reason.includes('ambiguity')) {
    return 'Tu solicitud podría interpretarse de varias formas. ¿Podrías ser más específico sobre lo que deseas hacer?';
  }
  
  // Si hay problema de parsing
  if (reason.includes('parsing')) {
    return 'Tuve problemas para entender tu solicitud. ¿Podrías reformularla de manera más clara?';
  }
  
  // Genérico
  return 'Para ayudarte mejor, ¿podrías proporcionar más información sobre lo que deseas hacer?';
};

/**
 * Evalúa la calidad del parsing basándose en varios indicadores
 */
const assessParsingQuality = (
  actions: AIAction[],
  parsingConfidence?: number
): 'high' | 'medium' | 'low' => {
  // Si tenemos un score explícito de parsing confidence, usarlo
  if (parsingConfidence !== undefined) {
    if (parsingConfidence >= 0.85) return 'high';
    if (parsingConfidence >= 0.6) return 'medium';
    return 'low';
  }
  
  // Evaluar basándose en la estructura de las acciones
  if (actions.length === 0) return 'low';
  
  // Verificar que todas las acciones tienen los campos requeridos
  const allActionsValid = actions.every(action => 
    action.type && 
    action.entity && 
    typeof action.confidence === 'number' &&
    action.explanation
  );
  
  if (!allActionsValid) return 'low';
  
  // Verificar que las acciones tienen datos coherentes
  const hasCoherentData = actions.every(action => {
    if (action.type === 'create' || action.type === 'update') {
      return action.data && Object.keys(action.data).length > 0;
    }
    if (action.type === 'query' || action.type === 'delete') {
      return action.query || action.data;
    }
    return true;
  });
  
  return hasCoherentData ? 'high' : 'medium';
};

/**
 * Analiza la intención del usuario y decide cómo proceder
 * 
 * @param rawText - Texto original del usuario
 * @param actions - Acciones extraídas por el parser
 * @param parsingConfidence - Confidence del parsing (opcional, 0-1)
 * @param options - Opciones de configuración de thresholds
 * @returns Resultado del análisis con decisión y razón
 */
export const assessIntent = (
  rawText: string,
  actions: AIAction[],
  parsingConfidence?: number,
  options: IntentShieldOptions = {}
): IntentAssessment => {
  const executeThreshold = options.executeThreshold ?? DEFAULT_EXECUTE_THRESHOLD;
  const suggestThreshold = options.suggestThreshold ?? DEFAULT_SUGGEST_THRESHOLD;
  const minParsingConf = options.minParsingConfidence ?? DEFAULT_MIN_PARSING_CONFIDENCE;
  
  // Evaluar calidad del parsing
  const parsingQuality = assessParsingQuality(actions, parsingConfidence);
  
  // Si el parsing falló completamente
  if (actions.length === 0 || parsingQuality === 'low') {
    return {
      decision: 'clarify',
      reason: 'Calidad de parsing baja o sin acciones extraídas',
      suggestedClarification: generateClarification(actions, rawText, 'parsing'),
      averageConfidence: 0,
      parsingQuality
    };
  }
  
  // Calcular confidence promedio
  const avgConfidence = calculateAverageConfidence(actions);
  
  // Detectar ambigüedad
  const isAmbiguous = detectAmbiguity(actions, rawText);
  
  // Si hay parsingConfidence explícito y es muy bajo, pedir clarificación
  if (parsingConfidence !== undefined && parsingConfidence < minParsingConf) {
    return {
      decision: 'clarify',
      reason: 'Parsing confidence muy bajo, alta probabilidad de malinterpretación',
      suggestedClarification: generateClarification(actions, rawText, 'parsing'),
      averageConfidence: avgConfidence,
      parsingQuality
    };
  }
  
  // Si detectamos ambigüedad semántica, pedir clarificación
  if (isAmbiguous) {
    return {
      decision: 'clarify',
      reason: 'Ambigüedad detectada en la interpretación del comando',
      suggestedClarification: generateClarification(actions, rawText, 'ambiguity'),
      averageConfidence: avgConfidence,
      parsingQuality
    };
  }
  
  // Decidir basándose en confidence promedio
  if (avgConfidence >= executeThreshold) {
    return {
      decision: 'execute',
      reason: `Confidence alto (${avgConfidence.toFixed(2)}), interpretación clara`,
      averageConfidence: avgConfidence,
      parsingQuality
    };
  }
  
  if (avgConfidence >= suggestThreshold) {
    return {
      decision: 'suggest',
      reason: `Confidence medio (${avgConfidence.toFixed(2)}), sugerencia para confirmación`,
      averageConfidence: avgConfidence,
      parsingQuality
    };
  }
  
  // Confidence bajo
  return {
    decision: 'clarify',
    reason: `Confidence bajo (${avgConfidence.toFixed(2)}), se requiere clarificación`,
    suggestedClarification: generateClarification(actions, rawText, 'confidence bajo'),
    averageConfidence: avgConfidence,
    parsingQuality
  };
};

/**
 * Determina si se debe ejecutar automáticamente basándose en la decisión
 */
export const shouldAutoExecute = (assessment: IntentAssessment): boolean => {
  return assessment.decision === 'execute';
};

/**
 * Determina si se debe pedir confirmación
 */
export const shouldRequestConfirmation = (assessment: IntentAssessment): boolean => {
  return assessment.decision === 'suggest';
};

/**
 * Determina si se debe pedir clarificación
 */
export const shouldRequestClarification = (assessment: IntentAssessment): boolean => {
  return assessment.decision === 'clarify';
};
