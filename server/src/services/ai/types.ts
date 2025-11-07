/**
 * Shared types and utilities for AI services
 */

export interface AIProviderKeys {
  groqApiKey?: string;
  geminiApiKey?: string;
}

export type SupportedAIProvider = 'groq' | 'gemini';

/**
 * Get API key with fallback priority:
 * 1. User-provided key (from client settings)
 * 2. Environment variable (from .env or docker-compose)
 * Filters out provider-specific placeholder values
 */
export const getApiKey = (provider: SupportedAIProvider, userKeys?: AIProviderKeys): string | undefined => {
  let key: string | undefined;
  let placeholders: string[] = [];
  
  if (provider === 'groq') {
    key = userKeys?.groqApiKey || process.env.GROQ_API_KEY;
    placeholders = ['YOUR_GROQ_API_KEY_HERE'];
  } else if (provider === 'gemini') {
    key = userKeys?.geminiApiKey || process.env.GEMINI_API_KEY;
    placeholders = ['YOUR_GEMINI_API_KEY_HERE'];
  }
  
  // Filter out placeholder values
  return (key && !placeholders.includes(key)) ? key : undefined;
};
