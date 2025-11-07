/**
 * AI Provider Management
 * Handles configuration and initialization of AI providers (Groq, Gemini)
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type SupportedAIProvider = 'groq' | 'gemini';

/**
 * Check if an AI provider is configured with required credentials
 */
export const isProviderConfigured = (provider: SupportedAIProvider): boolean => {
  if (provider === 'groq') {
    return Boolean(process.env.GROQ_API_KEY);
  }
  if (provider === 'gemini') {
    return Boolean(process.env.GEMINI_API_KEY);
  }
  return false;
};

/**
 * Get list of all configured providers
 */
export const getConfiguredProviders = (): SupportedAIProvider[] =>
  (['groq', 'gemini'] as SupportedAIProvider[]).filter(isProviderConfigured);

/**
 * Get initialized Groq client
 */
export const getGroqClient = (): Groq | null => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

/**
 * Get initialized Gemini model
 */
export const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Resolve which provider to use based on configuration
 */
export const resolveProvider = (provider?: string): SupportedAIProvider => {
  const configured = getConfiguredProviders();
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
): SupportedAIProvider[] => {
  const providers = getConfiguredProviders();
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
): Promise<string> => {
  if (provider === 'groq') {
    const client = getGroqClient();
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
    const model = getGeminiModel();
    if (!model) throw new Error('Gemini not configured');
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
};
