/**
 * Action Parser
 * Parses AI-generated actions from natural language responses
 */

export interface AIAction {
  type: string;
  entity: string;
  data?: any;
  query?: string;
  confidence: number;
  explanation: string;
}

/**
 * Parse actions from AI-generated text
 */
export const parseActionsFromText = (text: string): AIAction[] => {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // Parsing failed, try alternative formats
  }

  return [];
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
 */
export const isValidAction = (action: any): action is AIAction => {
  return (
    action &&
    typeof action === 'object' &&
    typeof action.type === 'string' &&
    typeof action.entity === 'string' &&
    typeof action.confidence === 'number' &&
    typeof action.explanation === 'string'
  );
};

/**
 * Sanitize and validate actions array
 */
export const sanitizeActions = (actions: any[]): AIAction[] => {
  if (!Array.isArray(actions)) return [];
  return actions.filter(isValidAction);
};
