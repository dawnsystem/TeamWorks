/**
 * NLP Processor
 * Processes natural language commands and converts them to structured actions
 */

import { resolveProvider, generateWithProvider, getProviderOrder } from './providers';
import { parseActionsFromText, createFallbackAction, stripCodeFences } from './actionParser';
import type { AIAction } from './actionParser';
import { buildNLPPrompt } from './prompts';

export interface ProcessNaturalLanguageResult {
  actions: AIAction[];
  rawResponse: string;
  providerUsed: string;
  success: boolean;
  error?: string;
}

/**
 * Generate AI with fallback support
 */
const generateWithFallback = async (
  prompt: string,
  preferred: any,
  providerOverride?: string,
): Promise<{ text: string; providerUsed: any }> => {
  const providers = getProviderOrder(preferred, providerOverride);
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const text = await generateWithProvider(prompt, provider);
      return { text, providerUsed: provider };
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All providers failed');
};

/**
 * Process natural language input and convert to structured actions
 * @param input User's natural language command
 * @param context Optional context (projects, tasks, etc.)
 * @param providerOverride Optional AI provider override
 * @returns Structured actions to execute
 */
export const processNaturalLanguage = async (
  input: string,
  context?: any,
  providerOverride?: string,
): Promise<ProcessNaturalLanguageResult> => {
  const contextString = context
    ? JSON.stringify(context, null, 2)
    : 'No hay contexto disponible';
  const preferred = resolveProvider(providerOverride);

  const prompt = buildNLPPrompt(input, contextString);

  try {
    const { text, providerUsed } = await generateWithFallback(
      prompt,
      preferred,
      providerOverride,
    );

    // Try to extract JSON from the response
    let cleanedText = stripCodeFences(text);

    // Try to parse JSON
    let parsedActions: AIAction[] = [];
    try {
      // First try to parse the whole response
      const parsed = JSON.parse(cleanedText);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        parsedActions = parsed.actions;
      } else if (Array.isArray(parsed)) {
        parsedActions = parsed;
      } else {
        // If we got an object but not in the expected format, try wrapping it
        parsedActions = [parsed];
      }
    } catch (e) {
      // If direct parsing fails, try to extract JSON array
      parsedActions = parseActionsFromText(cleanedText);
    }

    // If we still don't have actions, create a fallback
    if (!parsedActions || parsedActions.length === 0) {
      parsedActions = [createFallbackAction(input)];
    }

    return {
      actions: parsedActions,
      rawResponse: text,
      providerUsed,
      success: true,
    };
  } catch (error) {
    console.error('Error processing natural language:', error);

    return {
      actions: [createFallbackAction(input)],
      rawResponse: error instanceof Error ? error.message : 'Unknown error',
      providerUsed: preferred,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
