/**
 * Tests for conversational agent UX improvements
 * Validates that the agent:
 * 1. Never asks for IDs
 * 2. Doesn't get stuck in confirmation loops
 * 3. Uses project/section names correctly
 */

import { conversationalAgent, ConversationMessage } from '../services/aiService';
import Groq from 'groq-sdk';

// Mock environment variables for AI providers
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.AI_PROVIDER = 'groq';

// Mock the AI provider to return controlled responses
jest.mock('groq-sdk');
jest.mock('@google/generative-ai');

describe('Conversational Agent UX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prompt validation', () => {
    it('should never mention "ID" or "identificador" when asking for project/section', async () => {
      // Mock context with available projects and sections
      const context = {
        projects: [
          { id: 'proj1', nombre: 'Inbox' },
          { id: 'proj2', nombre: 'Work' },
        ],
        sections: [
          { id: 'sec1', nombre: 'Seccion de test', projectId: 'proj1' },
          { id: 'sec2', nombre: 'Backlog', projectId: 'proj2' },
        ],
      };

      // The prompt should emphasize using names, not IDs
      // We'll check the prompt construction by mocking the generate function
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: 'ready',
                message: 'Voy a eliminar las tareas en Inbox > Seccion de test',
                requiresInput: false,
                suggestedActions: [
                  {
                    type: 'delete_bulk',
                    entity: 'task',
                    data: {
                      filter: {
                        projectName: 'Inbox',
                        sectionName: 'Seccion de test',
                      },
                    },
                    confidence: 0.95,
                    explanation: 'Eliminar tareas',
                  },
                ],
              }),
            },
          },
        ],
      });

      (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      await conversationalAgent(
        'elimina todas las tareas en Inbox, dentro de la sección Seccion de test',
        [],
        context,
        'groq',
      );

      // Check that the prompt passed to the AI doesn't ask for IDs
      expect(mockCreate.mock.calls).toHaveLength(1);
      expect(mockCreate.mock.calls[0]).toBeDefined();
      expect(mockCreate.mock.calls[0][0]).toBeDefined();
      
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages).toBeDefined();
      expect(callArgs.messages[0]).toBeDefined();
      
      const prompt = callArgs.messages[0].content;

      // Prompt should emphasize names over IDs
      expect(prompt).toContain('NUNCA pidas IDs');
      expect(prompt).toContain('nombres de proyectos y secciones');
      expect(prompt).toContain('projectName');
      expect(prompt).toContain('sectionName');

      // Should have examples with names
      expect(prompt).toContain('delete_bulk');
      expect(prompt).toContain('Inbox');
    });

    // These tests verify the behavior, not the prompt directly
    it('should generate actions using names not IDs', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: 'ready',
                message: 'Perfecto',
                requiresInput: false,
                suggestedActions: [
                  {
                    type: 'delete_bulk',
                    entity: 'task',
                    data: {
                      filter: {
                        projectName: 'Work',
                        sectionName: 'Testing',
                      },
                    },
                    confidence: 0.9,
                    explanation: 'Delete',
                  },
                ],
              }),
            },
          },
        ],
      });

      (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      const result = await conversationalAgent(
        'del proyecto Work sección Testing',
        [
          { role: 'user', content: 'elimina tareas de testing' },
          { role: 'agent', content: '¿De qué proyecto?' },
        ],
        {},
        'groq',
      );

      // Result should use names in the actions (not IDs)
      expect(result.status).toBe('ready');
      expect(result.suggestedActions).toBeDefined();
      if (result.suggestedActions && result.suggestedActions.length > 0) {
        const action = result.suggestedActions[0];
        // The important part is that it has projectName and sectionName fields
        // (not projectId or sectionId)
        expect(action.data.filter).toHaveProperty('projectName');
        expect(action.data.filter).toHaveProperty('sectionName');
        // And they should be strings, not IDs
        expect(typeof action.data.filter.projectName).toBe('string');
        expect(typeof action.data.filter.sectionName).toBe('string');
      }
    });

    it('should not ask for confirmation after user provides information', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: 'ready',
                message: 'Ejecutando',
                requiresInput: false,
                suggestedActions: [],
              }),
            },
          },
        ],
      });

      (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      const result = await conversationalAgent('sí, hazlo', [], {}, 'groq');

      // Should be ready to execute, not asking for more info
      expect(result.status).toBe('ready');
      expect(result.requiresInput).toBe(false);
    });
  });

  describe('Action generation', () => {
    it('should generate delete_bulk action with projectName and sectionName', async () => {
      const mockResponse = {
        status: 'ready',
        message: 'Eliminando tareas en Inbox > Seccion de test',
        requiresInput: false,
        suggestedActions: [
          {
            type: 'delete_bulk',
            entity: 'task',
            data: {
              filter: {
                projectName: 'Inbox',
                sectionName: 'Seccion de test',
              },
            },
            confidence: 0.95,
            explanation: 'Eliminar todas las tareas de Inbox > Seccion de test',
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any

      const context = {
        projects: [{ id: 'proj1', nombre: 'Inbox' }],
        sections: [{ id: 'sec1', nombre: 'Seccion de test', projectId: 'proj1' }],
      };

      const result = await conversationalAgent(
        'elimina todas las tareas en Inbox, dentro de la sección Seccion de test',
        [],
        context,
        'groq',
      );

      expect(result.status).toBe('ready');
      expect(result.suggestedActions).toHaveLength(1);
      expect(result.suggestedActions![0].type).toBe('delete_bulk');
      expect(result.suggestedActions![0].data.filter.projectName).toBe('Inbox');
      expect(result.suggestedActions![0].data.filter.sectionName).toBe('Seccion de test');
    });
  });

  describe('Conversation flow', () => {
    it('should not get stuck in confirmation loop', async () => {
      // Simulate the problematic conversation from the issue
      const conversationHistory: ConversationMessage[] = [
        { role: 'user', content: 'elimina todas las tareas en Inbox, dentro de la sección Seccion de test' },
        { role: 'agent', content: '¿Cuál es el proyecto "Inbox"?' },
        { role: 'user', content: 'Inbox' },
        { role: 'agent', content: '¿Puedes proporcionarme el ID del proyecto Inbox?' },
        { role: 'user', content: 'cmhj4mrcv0002lfezycnern4p' },
        { role: 'agent', content: '¿Cuál es la sección Seccion de test?' },
        { role: 'user', content: 'cmhke7ov80001ntklkb2m8ur0' },
        // At this point, agent should NOT ask for confirmation again
      ];

      // Mock to return ready status (not asking for confirmation)
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: 'ready',
                message: 'Eliminando las tareas',
                requiresInput: false,
                suggestedActions: [
                  {
                    type: 'delete_bulk',
                    entity: 'task',
                    data: {
                      filter: {
                        projectName: 'Inbox',
                        sectionName: 'Seccion de test',
                      },
                    },
                    confidence: 0.95,
                    explanation: 'Eliminar tareas',
                  },
                ],
              }),
            },
          },
        ],
      });

      (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      const result = await conversationalAgent('sí, confirmo', conversationHistory, {}, 'groq');

      // Should be ready to execute, not asking for more confirmation
      expect(result.status).toBe('ready');
      expect(result.requiresInput).toBe(false);
      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions!.length).toBeGreaterThan(0);
    });
  });
});
