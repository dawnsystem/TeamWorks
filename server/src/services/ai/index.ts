/**
 * AI Services - Refactored Module Structure
 * 
 * This module exports AI-related services in a more organized structure.
 * The refactoring splits the monolithic aiService.ts into focused modules:
 * 
 * - providers.ts: AI provider management (Groq, Gemini)
 * - dateParser.ts: Natural language date parsing
 * - actionParser.ts: Action parsing from AI responses
 * - actionExecutor.ts: Action execution logic
 * - prompts.ts: AI prompt templates
 * - nlpProcessor.ts: Natural language processing
 * - planGenerator.ts: AI plan generation
 * 
 * The main aiService.ts can now import from these focused modules
 * for better maintainability and testability.
 */

// Re-export provider utilities
export {
  type SupportedAIProvider,
  isProviderConfigured,
  getConfiguredProviders,
  getGroqClient,
  getGeminiModel,
  resolveProvider,
  getProviderOrder,
  generateWithProvider,
} from './providers';

// Re-export date parsing utilities
export {
  parseDateString,
  formatDateForDisplay,
  isValidDateString,
} from './dateParser';

// Re-export action parsing utilities
export {
  type AIAction,
  parseActionsFromText,
  createFallbackAction,
  stripCodeFences,
  isValidAction,
  sanitizeActions,
} from './actionParser';

// Re-export action executor
export {
  executeAIActions,
} from './actionExecutor';

// Re-export NLP processor
export {
  type ProcessNaturalLanguageResult,
  processNaturalLanguage,
} from './nlpProcessor';

// Re-export plan generator
export {
  type AIPlanTask,
  type AIPlanPhase,
  type AIPlan,
  type GenerateAIPlanOptions,
  generateAIPlan,
} from './planGenerator';

// Re-export prompts (for customization if needed)
export {
  buildNLPPrompt,
  buildPlannerQuestionsPrompt,
  buildPlannerPlanPrompt,
} from './prompts';
