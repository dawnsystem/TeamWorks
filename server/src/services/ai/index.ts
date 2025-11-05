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
 * 
 * The main aiService.ts still contains the core business logic but now
 * uses these extracted utilities for better maintainability.
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
