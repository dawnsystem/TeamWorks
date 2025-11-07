/**
 * Shared types for AI services
 */

export interface AIProviderKeys {
  groqApiKey?: string;
  geminiApiKey?: string;
}

export type SupportedAIProvider = 'groq' | 'gemini';
