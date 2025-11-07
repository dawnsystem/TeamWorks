/**
 * Tests for Intent Shield module
 */

import {
  assessIntent,
  shouldAutoExecute,
  shouldRequestConfirmation,
  shouldRequestClarification,
  IntentAssessment,
  IntentDecision,
} from '../services/intentShield';
import { AIAction } from '../services/ai/actionParser';

describe('Intent Shield', () => {
  describe('assessIntent - High confidence scenarios', () => {
    it('should decide to execute for high confidence (>= 0.85)', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          data: { titulo: 'Test task' },
          confidence: 0.95,
          explanation: 'Clear create action'
        }
      ];

      const assessment = assessIntent('create task test', actions);

      expect(assessment.decision).toBe('execute');
      expect(assessment.averageConfidence).toBeGreaterThanOrEqual(0.85);
      expect(assessment.parsingQuality).toBe('high');
    });

    it('should decide to execute for multiple high-confidence actions', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: 'First action'
        },
        {
          type: 'create',
          entity: 'task',
          confidence: 0.88,
          explanation: 'Second action'
        }
      ];

      const assessment = assessIntent('create two tasks', actions);

      expect(assessment.decision).toBe('execute');
      expect(assessment.averageConfidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('assessIntent - Medium confidence scenarios', () => {
    it('should suggest confirmation for medium confidence (0.6-0.85)', () => {
      const actions: AIAction[] = [
        {
          type: 'update',
          entity: 'task',
          data: { prioridad: 1 },
          confidence: 0.75,
          explanation: 'Update with some uncertainty'
        }
      ];

      const assessment = assessIntent('maybe update priority', actions);

      expect(assessment.decision).toBe('suggest');
      expect(assessment.averageConfidence).toBeGreaterThanOrEqual(0.6);
      expect(assessment.averageConfidence).toBeLessThan(0.85);
    });

    it('should suggest for actions near upper threshold', () => {
      const actions: AIAction[] = [
        {
          type: 'delete',
          entity: 'task',
          confidence: 0.84,
          explanation: 'Delete action, almost certain'
        }
      ];

      const assessment = assessIntent('delete task', actions);

      expect(assessment.decision).toBe('suggest');
    });

    it('should suggest for actions near lower threshold', () => {
      const actions: AIAction[] = [
        {
          type: 'query',
          entity: 'task',
          query: 'search tasks',
          confidence: 0.61,
          explanation: 'Query with some doubt'
        }
      ];

      const assessment = assessIntent('find tasks', actions);

      expect(assessment.decision).toBe('suggest');
    });
  });

  describe('assessIntent - Low confidence scenarios', () => {
    it('should request clarification for low confidence (< 0.6)', () => {
      const actions: AIAction[] = [
        {
          type: 'query',
          entity: 'task',
          query: 'unclear intent',
          confidence: 0.45,
          explanation: 'Not sure what user wants'
        }
      ];

      const assessment = assessIntent('do something', actions);

      expect(assessment.decision).toBe('clarify');
      expect(assessment.averageConfidence).toBeLessThan(0.6);
      expect(assessment.suggestedClarification).toBeDefined();
    });

    it('should include helpful clarification message', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.3,
          explanation: 'Very uncertain'
        }
      ];

      const assessment = assessIntent('hacer algo', actions);

      expect(assessment.decision).toBe('clarify');
      expect(assessment.suggestedClarification).toContain('más detalles');
    });
  });

  describe('assessIntent - Parsing quality impact', () => {
    it('should clarify if parsing confidence is very low', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9, // High action confidence
          explanation: 'Create task'
        }
      ];

      const assessment = assessIntent(
        'create task',
        actions,
        0.3 // Low parsing confidence
      );

      expect(assessment.decision).toBe('clarify');
      expect(assessment.reason).toContain('parsing'); // Check for "parsing" in spanish text
    });

    it('should proceed if parsing confidence is acceptable', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: 'Create task'
        }
      ];

      const assessment = assessIntent(
        'create task',
        actions,
        0.85 // Good parsing confidence
      );

      expect(assessment.decision).toBe('execute');
    });
  });

  describe('assessIntent - Ambiguity detection', () => {
    it('should detect ambiguity from uncertain keywords in explanation', () => {
      const actions: AIAction[] = [
        {
          type: 'update',
          entity: 'task',
          confidence: 0.8, // Medium confidence
          explanation: 'Posiblemente actualizar la tarea, no estoy seguro'
        }
      ];

      const assessment = assessIntent('update something', actions);

      expect(assessment.decision).toBe('clarify');
      expect(assessment.reason).toContain('Ambigüedad'); // Capital A
    });

    it('should detect conflicting actions', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.8,
          explanation: 'Create task'
        },
        {
          type: 'delete',
          entity: 'task',
          confidence: 0.8,
          explanation: 'Delete task'
        }
      ];

      const assessment = assessIntent('do something with task', actions);

      expect(assessment.decision).toBe('clarify');
    });
  });

  describe('assessIntent - Empty or invalid actions', () => {
    it('should clarify when no actions are provided', () => {
      const assessment = assessIntent('do something', []);

      expect(assessment.decision).toBe('clarify');
      expect(assessment.averageConfidence).toBe(0);
      expect(assessment.suggestedClarification).toBeDefined();
    });

    it('should handle actions with missing required fields gracefully', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: '' // Empty explanation
        }
      ];

      const assessment = assessIntent('create task', actions);

      // Empty explanation might trigger ambiguity detection
      // Should still decide, just maybe lower quality
      expect(['execute', 'suggest', 'clarify']).toContain(assessment.decision);
    });
  });

  describe('assessIntent - Custom thresholds', () => {
    it('should respect custom execute threshold', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.8,
          explanation: 'Create task'
        }
      ];

      const assessment = assessIntent('create task', actions, undefined, {
        executeThreshold: 0.75, // Lower threshold
        suggestThreshold: 0.5
      });

      expect(assessment.decision).toBe('execute');
    });

    it('should respect custom suggest threshold', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.55,
          explanation: 'Create task'
        }
      ];

      const assessment = assessIntent('create task', actions, undefined, {
        executeThreshold: 0.85,
        suggestThreshold: 0.5 // Lower suggest threshold
      });

      expect(assessment.decision).toBe('suggest');
    });
  });

  describe('Helper functions', () => {
    it('shouldAutoExecute returns true for execute decision', () => {
      const assessment: IntentAssessment = {
        decision: 'execute',
        reason: 'High confidence',
        averageConfidence: 0.9,
        parsingQuality: 'high'
      };

      expect(shouldAutoExecute(assessment)).toBe(true);
    });

    it('shouldAutoExecute returns false for non-execute decisions', () => {
      const assessments: IntentAssessment[] = [
        { decision: 'suggest', reason: '', averageConfidence: 0.7, parsingQuality: 'medium' },
        { decision: 'clarify', reason: '', averageConfidence: 0.3, parsingQuality: 'low' }
      ];

      assessments.forEach(assessment => {
        expect(shouldAutoExecute(assessment)).toBe(false);
      });
    });

    it('shouldRequestConfirmation returns true for suggest decision', () => {
      const assessment: IntentAssessment = {
        decision: 'suggest',
        reason: 'Medium confidence',
        averageConfidence: 0.7,
        parsingQuality: 'medium'
      };

      expect(shouldRequestConfirmation(assessment)).toBe(true);
    });

    it('shouldRequestClarification returns true for clarify decision', () => {
      const assessment: IntentAssessment = {
        decision: 'clarify',
        reason: 'Low confidence',
        averageConfidence: 0.3,
        parsingQuality: 'low',
        suggestedClarification: 'Please provide more details'
      };

      expect(shouldRequestClarification(assessment)).toBe(true);
    });
  });

  describe('assessIntent - Parsing quality assessment', () => {
    it('should mark quality as medium for actions without data field', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          confidence: 0.9,
          explanation: 'Test'
          // Missing data field for create action
        }
      ];

      const assessment = assessIntent('create task without data', actions);

      // Without data field, quality should be medium not high
      expect(assessment.parsingQuality).toBe('medium');
    });

    it('should assess high quality for well-formed actions', () => {
      const actions: AIAction[] = [
        {
          type: 'create',
          entity: 'task',
          data: { titulo: 'Test', prioridad: 1 },
          confidence: 0.9,
          explanation: 'Well-formed create action'
        }
      ];

      const assessment = assessIntent('create task', actions);

      expect(assessment.parsingQuality).toBe('high');
    });
  });

  describe('assessIntent - Real-world scenarios', () => {
    it('should handle bulk create with high confidence', () => {
      const actions: AIAction[] = [
        {
          type: 'create_bulk',
          entity: 'task',
          data: {
            tasks: [
              { titulo: 'Task 1' },
              { titulo: 'Task 2' },
              { titulo: 'Task 3' }
            ]
          },
          confidence: 0.92,
          explanation: 'Create 3 tasks'
        }
      ];

      const assessment = assessIntent('create 3 tasks', actions);

      expect(assessment.decision).toBe('execute');
    });

    it('should clarify vague delete requests', () => {
      const actions: AIAction[] = [
        {
          type: 'delete',
          entity: 'task',
          query: 'some tasks',
          confidence: 0.5,
          explanation: 'Delete unspecified tasks'
        }
      ];

      const assessment = assessIntent('delete some tasks', actions);

      expect(assessment.decision).toBe('clarify');
      expect(assessment.suggestedClarification).toBeDefined();
    });

    it('should suggest confirmation for update with side effects', () => {
      const actions: AIAction[] = [
        {
          type: 'update_bulk',
          entity: 'task',
          data: {
            filter: { projectName: 'Work' },
            updates: { prioridad: 1 }
          },
          confidence: 0.78,
          explanation: 'Update all work tasks to high priority'
        }
      ];

      const assessment = assessIntent('make all work tasks urgent', actions);

      expect(assessment.decision).toBe('suggest');
    });
  });
});
