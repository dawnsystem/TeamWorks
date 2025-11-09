import {
  parseActionsFromText,
  createFallbackAction,
  stripCodeFences,
  isValidAction,
  sanitizeActions,
  AIAction,
} from '../services/ai/actionParser';

describe('AI Action Parser', () => {
  describe('parseActionsFromText', () => {
    it('should parse valid JSON array from text', () => {
      const text = '[{"type":"create","entity":"task","data":{"title":"Test"},"confidence":0.9,"explanation":"Create task"}]';
      const result = parseActionsFromText(text);
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
      expect(result[0].entity).toBe('task');
    });

    it('should extract JSON from mixed text', () => {
      const text = 'Here are the actions: [{"type":"update","entity":"task","confidence":0.8,"explanation":"Update"}] and more text';
      const result = parseActionsFromText(text);
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
    });

    it('should parse multiple actions', () => {
      const text = `[
        {"type":"create","entity":"task","confidence":0.9,"explanation":"Create"},
        {"type":"update","entity":"project","confidence":0.8,"explanation":"Update"}
      ]`;
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].entity).toBe('task');
      expect(result[1].entity).toBe('project');
    });

    it('should return empty array for invalid JSON', () => {
      const text = 'No JSON here';
      const result = parseActionsFromText(text);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array JSON', () => {
      const text = '{"type":"create"}';
      const result = parseActionsFromText(text);
      
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON gracefully', () => {
      const text = '[{"type":"create",}]'; // Trailing comma
      const result = parseActionsFromText(text);
      
      expect(result).toEqual([]);
    });

    it('should handle empty text', () => {
      const result = parseActionsFromText('');
      expect(result).toEqual([]);
    });
  });

  describe('createFallbackAction', () => {
    it('should create a valid fallback action', () => {
      const input = 'create a task';
      const action = createFallbackAction(input);
      
      expect(action.type).toBe('query');
      expect(action.entity).toBe('task');
      expect(action.query).toBe(input);
      expect(action.confidence).toBe(0.3);
      expect(action.explanation).toContain('No se pudo interpretar');
    });

    it('should handle empty input', () => {
      const action = createFallbackAction('');
      
      expect(action.type).toBe('query');
      expect(action.query).toBe('');
      expect(action.confidence).toBe(0.3);
    });

    it('should handle long input', () => {
      const longInput = 'a'.repeat(1000);
      const action = createFallbackAction(longInput);
      
      expect(action.query).toBe(longInput);
      expect(action.confidence).toBe(0.3);
    });
  });

  describe('stripCodeFences', () => {
    it('should remove ```json fences', () => {
      const text = '```json\n{"key": "value"}\n```';
      const result = stripCodeFences(text);
      
      expect(result).toBe('{"key": "value"}');
    });

    it('should remove ``` fences', () => {
      const text = '```\nsome code\n```';
      const result = stripCodeFences(text);
      
      expect(result).toBe('some code');
    });

    it('should handle multiple fences', () => {
      const text = '```json\nfirst\n```\n```\nsecond\n```';
      const result = stripCodeFences(text);
      
      expect(result).not.toContain('```');
    });

    it('should trim whitespace', () => {
      const text = '  ```json\ncontent\n```  ';
      const result = stripCodeFences(text);
      
      expect(result).toBe('content');
    });

    it('should handle text without fences', () => {
      const text = 'plain text';
      const result = stripCodeFences(text);
      
      expect(result).toBe('plain text');
    });

    it('should be case insensitive for json marker', () => {
      const text1 = '```JSON\ncontent\n```';
      const text2 = '```Json\ncontent\n```';
      
      expect(stripCodeFences(text1)).toBe('content');
      expect(stripCodeFences(text2)).toBe('content');
    });
  });

  describe('isValidAction', () => {
    it('should validate correct action structure', () => {
      const action: AIAction = {
        type: 'create',
        entity: 'task',
        confidence: 0.9,
        explanation: 'Create task',
      };
      
      expect(isValidAction(action)).toBe(true);
    });

    it('should accept action with optional data field', () => {
      const action = {
        type: 'create',
        entity: 'task',
        data: { title: 'Test' },
        confidence: 0.9,
        explanation: 'Create',
      };
      
      expect(isValidAction(action)).toBe(true);
    });

    it('should accept action with optional query field', () => {
      const action = {
        type: 'query',
        entity: 'task',
        query: 'search term',
        confidence: 0.8,
        explanation: 'Query',
      };
      
      expect(isValidAction(action)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidAction(null)).toBeFalsy();
    });

    it('should reject undefined', () => {
      expect(isValidAction(undefined)).toBeFalsy();
    });

    it('should reject non-object', () => {
      expect(isValidAction('not an object')).toBe(false);
      expect(isValidAction(123)).toBe(false);
      expect(isValidAction([])).toBe(false);
    });

    it('should reject action missing type', () => {
      const action = {
        entity: 'task',
        confidence: 0.9,
        explanation: 'Test',
      };
      
      expect(isValidAction(action)).toBe(false);
    });

    it('should reject action missing entity', () => {
      const action = {
        type: 'create',
        confidence: 0.9,
        explanation: 'Test',
      };
      
      expect(isValidAction(action)).toBe(false);
    });

    it('should reject action missing confidence', () => {
      const action = {
        type: 'create',
        entity: 'task',
        explanation: 'Test',
      };
      
      expect(isValidAction(action)).toBe(false);
    });

    it('should reject action missing explanation', () => {
      const action = {
        type: 'create',
        entity: 'task',
        confidence: 0.9,
      };
      
      expect(isValidAction(action)).toBe(false);
    });

    it('should reject action with wrong type for fields', () => {
      const action = {
        type: 123, // Should be string
        entity: 'task',
        confidence: 0.9,
        explanation: 'Test',
      };
      
      expect(isValidAction(action)).toBe(false);
    });
  });

  describe('sanitizeActions', () => {
    it('should filter valid actions', () => {
      const actions = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: 'Valid',
        },
        {
          type: 'update',
          entity: 'project',
          confidence: 0.8,
          explanation: 'Also valid',
        },
      ];
      
      const result = sanitizeActions(actions);
      expect(result).toHaveLength(2);
    });

    it('should remove invalid actions', () => {
      const actions = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: 'Valid',
        },
        {
          type: 'invalid',
          // Missing required fields
        },
        {
          type: 'update',
          entity: 'project',
          confidence: 0.8,
          explanation: 'Valid',
        },
      ];
      
      const result = sanitizeActions(actions);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('create');
      expect(result[1].type).toBe('update');
    });

    it('should return empty array for non-array input', () => {
      expect(sanitizeActions(null as any)).toEqual([]);
      expect(sanitizeActions(undefined as any)).toEqual([]);
      expect(sanitizeActions({} as any)).toEqual([]);
      expect(sanitizeActions('string' as any)).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(sanitizeActions([])).toEqual([]);
    });

    it('should handle all invalid actions', () => {
      const actions = [
        { invalid: 'action1' },
        { invalid: 'action2' },
      ];
      
      const result = sanitizeActions(actions);
      expect(result).toEqual([]);
    });

    it('should preserve action data and query fields', () => {
      const actions = [
        {
          type: 'create',
          entity: 'task',
          data: { title: 'Test' },
          confidence: 0.9,
          explanation: 'Create',
        },
        {
          type: 'query',
          entity: 'task',
          query: 'search',
          confidence: 0.8,
          explanation: 'Query',
        },
      ];
      
      const result = sanitizeActions(actions);
      expect(result).toHaveLength(2);
      expect(result[0].data).toEqual({ title: 'Test' });
      expect(result[1].query).toBe('search');
    });
  });
});
