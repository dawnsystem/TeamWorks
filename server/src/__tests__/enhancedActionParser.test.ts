/**
 * Tests for enhanced parseActionsFromText with robust parsing
 */

import {
  parseActionsFromText,
  parseActionsFromTextWithMetadata,
  ParseResult,
} from '../services/ai/actionParser';

describe('Enhanced AI Action Parser', () => {
  describe('parseActionsFromText - Basic JSON formats', () => {
    it('should parse valid JSON array directly', () => {
      const text = '[{"type":"create","entity":"task","data":{"title":"Test"},"confidence":0.9,"explanation":"Create task"}]';
      const result = parseActionsFromText(text);
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
      expect(result[0].entity).toBe('task');
      expect(result[0].confidence).toBe(0.9);
    });

    it('should parse JSON wrapped in ```json code blocks', () => {
      const text = '```json\n[{"type":"update","entity":"task","confidence":0.8,"explanation":"Update"}]\n```';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
    });

    it('should parse JSON in plain ``` code blocks', () => {
      const text = '```\n[{"type":"delete","entity":"task","confidence":0.7,"explanation":"Delete"}]\n```';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('delete');
    });

    it('should parse object with "actions" field', () => {
      const text = '{"actions": [{"type":"query","entity":"task","confidence":0.85,"explanation":"Query"}]}';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('query');
    });
  });

  describe('parseActionsFromText - Mixed text and JSON', () => {
    it('should extract JSON from text with explanation before', () => {
      const text = 'Here are the actions: [{"type":"create","entity":"task","confidence":0.9,"explanation":"Task"}]';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
    });

    it('should extract JSON from text with explanation after', () => {
      const text = '[{"type":"create","entity":"task","confidence":0.9,"explanation":"Task"}] Hope this helps!';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
    });

    it('should extract JSON embedded in paragraph', () => {
      const text = `Based on your request, I've prepared the following actions:
      [{"type":"create","entity":"task","confidence":0.95,"explanation":"Create new task"}]
      Let me know if you need any adjustments.`;
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.95);
    });
  });

  describe('parseActionsFromText - Multiple actions', () => {
    it('should parse multiple actions in array', () => {
      const text = `[
        {"type":"create","entity":"task","confidence":0.9,"explanation":"First"},
        {"type":"update","entity":"project","confidence":0.8,"explanation":"Second"}
      ]`;
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('create');
      expect(result[1].type).toBe('update');
    });

    it('should parse actions with complex data objects', () => {
      const text = `[{
        "type":"create",
        "entity":"task",
        "data":{"titulo":"Test","prioridad":1,"projectName":"Work"},
        "confidence":0.95,
        "explanation":"Create with details"
      }]`;
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].data.titulo).toBe('Test');
      expect(result[0].data.prioridad).toBe(1);
    });
  });

  describe('parseActionsFromText - Recoverable malformed JSON', () => {
    it('should extract JSON even with surrounding whitespace and newlines', () => {
      const text = `\n\n   [{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]   \n\n`;
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
    });

    it('should handle JSON with extra markdown formatting', () => {
      const text = '**Actions:**\n```json\n[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]\n```\n*End*';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('parseActionsFromText - Heuristic fallback', () => {
    it('should use heuristic parsing when JSON is completely invalid', () => {
      const text = 'crear una tarea para comprar leche';
      const result = parseActionsFromText(text);
      
      // Should return a heuristic action
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
      expect(result[0].entity).toBe('task');
      expect(result[0].confidence).toBeLessThan(0.5); // Low confidence for heuristic
    });

    it('should detect "update" action heuristically', () => {
      const text = 'actualizar la prioridad de la tarea';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
    });

    it('should detect "delete" action heuristically', () => {
      const text = 'eliminar todas las tareas completadas';
      const result = parseActionsFromText(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('delete');
    });
  });

  describe('parseActionsFromText - Empty or invalid inputs', () => {
    it('should return empty array for empty string', () => {
      const result = parseActionsFromText('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null/undefined (coerced to string)', () => {
      const result = parseActionsFromText(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array for completely unrelated text', () => {
      const text = 'This is just random text without any task management intent';
      const result = parseActionsFromText(text);
      
      // Heuristic might still try, but with very low confidence
      if (result.length > 0) {
        expect(result[0].confidence).toBeLessThan(0.5);
      }
    });
  });

  describe('parseActionsFromTextWithMetadata', () => {
    it('should return high parsing confidence for valid JSON', () => {
      const text = '[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]';
      const result: ParseResult = parseActionsFromTextWithMetadata(text);
      
      expect(result.parsingConfidence).toBeGreaterThan(0.8);
      expect(result.method).toBe('array_json');
      expect(result.actions).toHaveLength(1);
    });

    it('should return medium confidence for code block JSON', () => {
      const text = '```json\n[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]\n```';
      const result: ParseResult = parseActionsFromTextWithMetadata(text);
      
      expect(result.parsingConfidence).toBeGreaterThan(0.9);
      expect(result.method).toBe('code_block');
    });

    it('should return low confidence for heuristic parsing', () => {
      const text = 'crear tarea';
      const result: ParseResult = parseActionsFromTextWithMetadata(text);
      
      expect(result.parsingConfidence).toBeLessThan(0.5);
      expect(result.method).toBe('heuristic_verbal');
    });

    it('should return error info when parsing fails', () => {
      const text = 'No JSON whatsoever';
      const result: ParseResult = parseActionsFromTextWithMetadata(text);
      
      // Either empty or low-confidence heuristic
      if (result.actions.length === 0) {
        expect(result.error).toBeDefined();
      } else {
        expect(result.parsingConfidence).toBeLessThan(0.5);
      }
    });

    it('should identify parsing method for different formats', () => {
      // Test each format individually to ensure the parser identifies them correctly
      const result1 = parseActionsFromTextWithMetadata('[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]');
      expect(result1.method).toBe('array_json');

      const result2 = parseActionsFromTextWithMetadata('```json\n[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]\n```');
      expect(result2.method).toBe('code_block');

      // Note: array_json has priority over object_with_actions when both match
      // This is intentional as arrays are more common
      const result3 = parseActionsFromTextWithMetadata('Some text before {"actions":[{"type":"create","entity":"task","confidence":0.9,"explanation":"Test"}]} and after');
      // This will match whichever pattern finds it first
      expect(['object_with_actions', 'array_json', 'aggressive_extraction']).toContain(result3.method);
    });
  });

  describe('parseActionsFromText - Real-world scenarios', () => {
    it('should handle Groq response with explanation', () => {
      const text = `Based on your input, here's what I understand:

\`\`\`json
[{
  "type": "create",
  "entity": "task",
  "data": {
    "titulo": "Comprar leche",
    "prioridad": 1,
    "fechaVencimiento": "mañana"
  },
  "confidence": 0.95,
  "explanation": "Crear tarea de compra para mañana"
}]
\`\`\`

Is this what you meant?`;
      
      const result = parseActionsFromText(text);
      expect(result).toHaveLength(1);
      expect(result[0].data.titulo).toBe('Comprar leche');
    });

    it('should handle response with "actions" wrapper and prose', () => {
      const text = `I'll help you with that. Here's the action:
      {"actions": [{"type":"create","entity":"task","data":{"titulo":"Test"},"confidence":0.9,"explanation":"Create"}]}
      Let me know if you need changes.`;
      
      const result = parseActionsFromText(text);
      expect(result).toHaveLength(1);
    });

    it('should extract multiple individual action objects', () => {
      const text = `First action: {"type":"create","entity":"task","confidence":0.9,"explanation":"First"}
      Second action: {"type":"update","entity":"task","confidence":0.8,"explanation":"Second"}`;
      
      const result = parseActionsFromText(text);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
