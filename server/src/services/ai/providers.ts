/**
 * AI Provider Management
 * Handles configuration and initialization of AI providers (Groq, Gemini)
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderKeys, SupportedAIProvider } from './types';

// Re-export types for external use
export type { SupportedAIProvider, AIProviderKeys };

/**
 * Get API key with fallback priority:
 * 1. User-provided key (from client settings)
 * 2. Environment variable (from .env or docker-compose)
 * Filters out placeholder values
 */
const getApiKey = (provider: SupportedAIProvider, userKeys?: AIProviderKeys): string | undefined => {
  let key: string | undefined;
  
  if (provider === 'groq') {
    key = userKeys?.groqApiKey || process.env.GROQ_API_KEY;
  } else if (provider === 'gemini') {
    key = userKeys?.geminiApiKey || process.env.GEMINI_API_KEY;
  }
  
  // Filter out placeholder values
  return (key && key !== 'YOUR_GROQ_API_KEY_HERE' && key !== 'YOUR_GEMINI_API_KEY_HERE') ? key : undefined;
};

/**
 * Check if an AI provider is configured with required credentials
 */
export const isProviderConfigured = (provider: SupportedAIProvider, userKeys?: AIProviderKeys): boolean => {
  const apiKey = getApiKey(provider, userKeys);
  return Boolean(apiKey);
};

/**
 * Get list of all configured providers
 */
export const getConfiguredProviders = (userKeys?: AIProviderKeys): SupportedAIProvider[] =>
  (['groq', 'gemini'] as SupportedAIProvider[]).filter(p => isProviderConfigured(p, userKeys));

/**
 * Get initialized Groq client
 */
export const getGroqClient = (userKeys?: AIProviderKeys): Groq | null => {
  const apiKey = getApiKey('groq', userKeys);
  if (!apiKey) {
    return null;
  }
  return new Groq({
    apiKey,
  });
};

/**
 * Get initialized Gemini model
 */
export const getGeminiModel = (userKeys?: AIProviderKeys) => {
  const apiKey = getApiKey('gemini', userKeys);
  if (!apiKey) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Resolve which provider to use based on configuration
 */
export const resolveProvider = (provider?: string, userKeys?: AIProviderKeys): SupportedAIProvider => {
  const configured = getConfiguredProviders(userKeys);
  if (configured.length === 0) throw new Error('No AI providers configured');
  if (provider && configured.includes(provider as SupportedAIProvider)) {
    return provider as SupportedAIProvider;
  }
  return configured[0];
};

/**
 * Get provider fallback order
 */
export const getProviderOrder = (
  preferred: SupportedAIProvider,
  override?: string,
  userKeys?: AIProviderKeys,
): SupportedAIProvider[] => {
  const providers = getConfiguredProviders(userKeys);
  if (override && providers.includes(override as SupportedAIProvider)) {
    return [override as SupportedAIProvider];
  }
  if (providers.includes(preferred)) {
    return [preferred, ...providers.filter((p) => p !== preferred)];
  }
  return providers;
};

/**
 * Generate text using specified AI provider
 */
export const generateWithProvider = async (
  prompt: string,
  provider: SupportedAIProvider,
  userKeys?: AIProviderKeys,
): Promise<string> => {
  if (provider === 'groq') {
    const client = getGroqClient(userKeys);
    if (!client) throw new Error('Groq not configured');
    
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    return completion.choices[0]?.message?.content || '';
  }
  
  if (provider === 'gemini') {
    const model = getGeminiModel(userKeys);
    if (!model) throw new Error('Gemini not configured');
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
};
